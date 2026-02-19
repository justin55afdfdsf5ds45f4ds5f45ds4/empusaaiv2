-- ============================================================
-- EmpusaAI Database Schema (SECURE)
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ============ PROFILES ============
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  balance decimal default 0 not null check (balance >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

-- Users can ONLY read their own profile. NO update, NO insert from client.
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, balance)
  values (new.id, 0);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============ DEPOSITS ============
create table if not exists public.deposits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  amount decimal not null check (amount > 0),
  sender_address text,
  tx_hash text,
  status text default 'pending' not null check (status in ('pending', 'confirmed', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  confirmed_at timestamp with time zone
);

alter table public.deposits enable row level security;

-- Users can only read their own deposits
create policy "deposits_select_own"
  on public.deposits for select
  using (auth.uid() = user_id);

-- Users can insert deposits but ONLY as 'pending' and only for themselves
create policy "deposits_insert_own_pending"
  on public.deposits for insert
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and sender_address is not null
  );

-- Secure function: confirm a deposit and credit balance (called by backend/admin only)
create or replace function public.confirm_deposit(p_deposit_id uuid)
returns void as $$
declare
  v_deposit record;
begin
  -- Lock the deposit row
  select * into v_deposit
  from public.deposits
  where id = p_deposit_id and status = 'pending'
  for update;

  if not found then
    raise exception 'Deposit not found or already confirmed';
  end if;

  -- Mark deposit confirmed
  update public.deposits
  set status = 'confirmed', confirmed_at = now()
  where id = p_deposit_id;

  -- Credit balance atomically
  update public.profiles
  set balance = balance + v_deposit.amount
  where id = v_deposit.user_id;
end;
$$ language plpgsql security definer;


-- ============ WITHDRAWALS ============
create table if not exists public.withdrawals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  amount decimal not null check (amount > 0),
  wallet_address text not null check (length(wallet_address) >= 10),
  status text default 'pending' not null check (status in ('pending', 'processing', 'completed', 'failed')),
  tx_hash text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

alter table public.withdrawals enable row level security;

-- Users can only read their own withdrawals
create policy "withdrawals_select_own"
  on public.withdrawals for select
  using (auth.uid() = user_id);

-- NO direct insert from client. Withdrawals go through the secure function below.

-- Secure function: request a withdrawal (checks balance, deducts atomically)
create or replace function public.request_withdrawal(
  p_amount decimal,
  p_wallet_address text
)
returns uuid as $$
declare
  v_user_id uuid;
  v_balance decimal;
  v_withdrawal_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;

  if length(p_wallet_address) < 10 then
    raise exception 'Invalid wallet address';
  end if;

  -- Lock profile row and check balance
  select balance into v_balance
  from public.profiles
  where id = v_user_id
  for update;

  if v_balance < p_amount then
    raise exception 'Insufficient balance';
  end if;

  -- Deduct balance first (prevents double-spend)
  update public.profiles
  set balance = balance - p_amount
  where id = v_user_id;

  -- Create withdrawal record
  insert into public.withdrawals (user_id, amount, wallet_address, status)
  values (v_user_id, p_amount, p_wallet_address, 'pending')
  returning id into v_withdrawal_id;

  return v_withdrawal_id;
end;
$$ language plpgsql security definer;


-- ============ AGENT ACTIONS ============
create table if not exists public.agent_actions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  market_name text not null,
  side text not null check (side in ('YES', 'NO')),
  entry_price decimal not null,
  current_price decimal,
  exit_price decimal,
  amount decimal not null,
  profit_loss decimal,
  status text default 'pending' not null check (status in ('active', 'closed', 'pending')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  closed_at timestamp with time zone
);

alter table public.agent_actions enable row level security;

-- Users can only read their own actions. NO insert/update from client.
create policy "agent_actions_select_own"
  on public.agent_actions for select
  using (auth.uid() = user_id);
