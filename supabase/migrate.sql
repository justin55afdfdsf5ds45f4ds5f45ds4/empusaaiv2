-- ============================================================
-- EmpusaAI Migration: Run this FIRST if tables already exist
-- This drops old insecure policies before schema.sql re-creates them
-- Run in Supabase SQL Editor BEFORE running schema.sql
-- ============================================================

-- Drop old insecure policies
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can view own deposits" on public.deposits;
drop policy if exists "Users can insert own deposits" on public.deposits;
drop policy if exists "Users can view own withdrawals" on public.withdrawals;
drop policy if exists "Users can insert own withdrawals" on public.withdrawals;
drop policy if exists "Users can view own agent actions" on public.agent_actions;

-- Drop new policies too (in case re-running)
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "deposits_select_own" on public.deposits;
drop policy if exists "deposits_insert_own_pending" on public.deposits;
drop policy if exists "withdrawals_select_own" on public.withdrawals;
drop policy if exists "agent_actions_select_own" on public.agent_actions;

-- Drop old functions
drop function if exists public.confirm_deposit(uuid);
drop function if exists public.request_withdrawal(decimal, text);

-- Add missing columns if tables already exist
do $$
begin
  -- deposits.sender_address
  if not exists (select 1 from information_schema.columns where table_name = 'deposits' and column_name = 'sender_address') then
    alter table public.deposits add column sender_address text;
  end if;
  -- deposits.tx_hash
  if not exists (select 1 from information_schema.columns where table_name = 'deposits' and column_name = 'tx_hash') then
    alter table public.deposits add column tx_hash text;
  end if;
  -- deposits.confirmed_at
  if not exists (select 1 from information_schema.columns where table_name = 'deposits' and column_name = 'confirmed_at') then
    alter table public.deposits add column confirmed_at timestamp with time zone;
  end if;
  -- withdrawals.tx_hash
  if not exists (select 1 from information_schema.columns where table_name = 'withdrawals' and column_name = 'tx_hash') then
    alter table public.withdrawals add column tx_hash text;
  end if;
  -- withdrawals.completed_at
  if not exists (select 1 from information_schema.columns where table_name = 'withdrawals' and column_name = 'completed_at') then
    alter table public.withdrawals add column completed_at timestamp with time zone;
  end if;
  -- Add balance >= 0 check if not exists
  if not exists (select 1 from information_schema.constraint_column_usage where table_name = 'profiles' and constraint_name = 'profiles_balance_check') then
    begin
      alter table public.profiles add constraint profiles_balance_check check (balance >= 0);
    exception when others then null;
    end;
  end if;
end $$;

-- Add 'failed' to deposits status if not already
-- Add 'processing' to withdrawals status if not already
-- (These are handled by the check constraints in schema.sql,
--  but if tables exist with old constraints, update them)
do $$
begin
  alter table public.deposits drop constraint if exists deposits_status_check;
  alter table public.deposits add constraint deposits_status_check
    check (status in ('pending', 'confirmed', 'failed'));
exception when others then null;
end $$;

do $$
begin
  alter table public.withdrawals drop constraint if exists withdrawals_status_check;
  alter table public.withdrawals add constraint withdrawals_status_check
    check (status in ('pending', 'processing', 'completed', 'failed'));
exception when others then null;
end $$;
