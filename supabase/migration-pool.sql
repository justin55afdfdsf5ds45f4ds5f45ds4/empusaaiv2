-- ============================================================
-- EmpusaAI Pool Trading Migration
-- Run this in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- ============ POOL TRADES ============
-- Master record of each bot trade (one row per position, not per user)
create table if not exists public.pool_trades (
  id uuid default gen_random_uuid() primary key,
  condition_id text not null,
  token_id text not null,
  market_name text not null,
  asset text not null,
  timeframe text not null,
  side text not null check (side in ('UP', 'DOWN')),
  entry_price decimal not null,
  exit_price decimal,
  total_size decimal not null,
  total_cost decimal not null,
  total_pnl decimal,
  pool_balance_at_entry decimal not null,
  entry_reason text,
  exit_reason text,
  bot_position_data jsonb,
  status text default 'active' not null check (status in ('active', 'closed', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  closed_at timestamp with time zone
);


-- ============ BOT LOGS ============
-- Real-time log entries from the bot (dashboard terminal reads these)
create table if not exists public.bot_logs (
  id bigint generated always as identity primary key,
  ts bigint not null,
  type text not null,
  message text not null,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.bot_logs enable row level security;

create policy "bot_logs_select_authenticated"
  on public.bot_logs for select
  using (auth.role() = 'authenticated');

create index if not exists idx_bot_logs_created on public.bot_logs (created_at desc);


-- ============ BOT STATE ============
-- Singleton row (id=1) for bot operational state + crash recovery
create table if not exists public.bot_state (
  id int primary key default 1 check (id = 1),
  status text default 'idle',
  positions jsonb default '[]'::jsonb,
  history jsonb default '[]'::jsonb,
  total_pnl decimal default 0,
  total_bets int default 0,
  wins int default 0,
  losses int default 0,
  bankroll decimal default 0,
  starting_bankroll decimal default 0,
  daily_pnl decimal default 0,
  daily_reset_date text,
  tick_count int default 0,
  probe_results jsonb default '{}'::jsonb,
  execution_stats jsonb default '{}'::jsonb,
  last_heartbeat timestamp with time zone,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert singleton row
insert into public.bot_state (id) values (1) on conflict do nothing;


-- ============ SCHEMA MODIFICATIONS ============

-- Add locked_in_trade to profiles
alter table public.profiles
  add column if not exists locked_in_trade decimal default 0 not null;

-- Add check constraint (only if it doesn't exist)
do $$
begin
  if not exists (
    select 1 from information_schema.check_constraints
    where constraint_name = 'profiles_locked_in_trade_check'
  ) then
    alter table public.profiles
      add constraint profiles_locked_in_trade_check check (locked_in_trade >= 0);
  end if;
end $$;

-- Add pool_trade_id FK to agent_actions
alter table public.agent_actions
  add column if not exists pool_trade_id uuid references public.pool_trades(id);


-- ============ STORED PROCEDURES ============

-- Get total available pool balance (what the bot can trade with)
create or replace function public.get_pool_balance()
returns decimal as $$
  select coalesce(sum(balance), 0) from public.profiles;
$$ language sql security definer;


-- Atomically lock proportional balances for all users when bot enters a trade
create or replace function public.lock_balances_for_trade(
  p_pool_trade_id uuid,
  p_total_cost decimal,
  p_market_name text,
  p_side text,
  p_entry_price decimal
)
returns void as $$
declare
  v_total_pool decimal;
  v_user record;
  v_user_share decimal;
  v_user_amount decimal;
  v_action_side text;
begin
  -- Map UP/DOWN to YES/NO for agent_actions
  v_action_side := case when p_side = 'UP' then 'YES' else 'NO' end;

  -- Get total available balance across all users (this IS the pool)
  select coalesce(sum(balance), 0) into v_total_pool
  from public.profiles
  where balance > 0
  for update;

  if v_total_pool <= 0 then
    raise exception 'No available pool balance';
  end if;

  if p_total_cost > v_total_pool then
    raise exception 'Trade cost % exceeds pool balance %', p_total_cost, v_total_pool;
  end if;

  -- For each user with a positive balance, lock their proportional share
  for v_user in
    select id, balance from public.profiles where balance > 0
  loop
    v_user_share := v_user.balance / v_total_pool;
    v_user_amount := round((p_total_cost * v_user_share)::numeric, 6);

    -- Skip dust amounts
    if v_user_amount < 0.001 then continue; end if;

    -- Lock the funds: balance -> locked_in_trade
    update public.profiles
    set balance = balance - v_user_amount,
        locked_in_trade = locked_in_trade + v_user_amount
    where id = v_user.id;

    -- Create agent_action for this user
    insert into public.agent_actions (
      user_id, pool_trade_id, market_name, side,
      entry_price, amount, status
    ) values (
      v_user.id, p_pool_trade_id, p_market_name,
      v_action_side, p_entry_price, v_user_amount, 'active'
    );
  end loop;
end;
$$ language plpgsql security definer;


-- Atomically unlock balances and distribute P&L when bot exits a trade
create or replace function public.distribute_trade_pnl(
  p_pool_trade_id uuid,
  p_exit_price decimal,
  p_total_pnl decimal,
  p_exit_reason text
)
returns void as $$
declare
  v_trade record;
  v_action record;
  v_user_pnl decimal;
begin
  -- Lock the pool trade row
  select * into v_trade
  from public.pool_trades
  where id = p_pool_trade_id and status = 'active'
  for update;

  if not found then
    raise exception 'Pool trade not found or already closed: %', p_pool_trade_id;
  end if;

  -- Close the master trade record
  update public.pool_trades
  set status = 'closed',
      exit_price = p_exit_price,
      total_pnl = p_total_pnl,
      exit_reason = p_exit_reason,
      closed_at = now()
  where id = p_pool_trade_id;

  -- For each user's agent_action in this trade, distribute P&L
  for v_action in
    select * from public.agent_actions
    where pool_trade_id = p_pool_trade_id and status = 'active'
    for update
  loop
    -- P&L proportional to their contribution
    if v_trade.total_cost > 0 then
      v_user_pnl := p_total_pnl * (v_action.amount / v_trade.total_cost);
    else
      v_user_pnl := 0;
    end if;

    -- Unlock funds: locked_in_trade -> balance + P&L
    update public.profiles
    set locked_in_trade = greatest(0, locked_in_trade - v_action.amount),
        balance = greatest(0, balance + v_action.amount + v_user_pnl)
    where id = v_action.user_id;

    -- Close the agent_action with results
    update public.agent_actions
    set status = 'closed',
        exit_price = p_exit_price,
        profit_loss = v_user_pnl,
        current_price = p_exit_price,
        closed_at = now()
    where id = v_action.id;
  end loop;
end;
$$ language plpgsql security definer;


-- ============ ENABLE REALTIME ============
-- Dashboard subscribes to these for live updates
alter publication supabase_realtime add table bot_logs;
alter publication supabase_realtime add table agent_actions;
