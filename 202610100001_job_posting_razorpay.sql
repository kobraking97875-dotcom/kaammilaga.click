-- KaamMilega job-posting trial + Razorpay payment support
-- Run this migration in the Supabase SQL Editor before deploying the Edge Function.

alter table public.jobs
  add column if not exists expires_at timestamptz,
  add column if not exists posting_paid boolean not null default false,
  add column if not exists posting_payment_id text;

create table if not exists public.job_posting_trials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  used_at timestamptz not null default now(),
  job_id uuid
);

create table if not exists public.job_posting_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id text not null unique,
  payment_id text unique,
  amount_paise integer not null check (amount_paise = 29900),
  currency text not null default 'INR' check (currency = 'INR'),
  status text not null default 'created' check (status in ('created','paid','failed')),
  job_payload jsonb not null,
  job_id uuid,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.job_posting_trials enable row level security;
alter table public.job_posting_payments enable row level security;
-- Existing employers with a job on record have already used their free-post opportunity.
insert into public.job_posting_trials (user_id, used_at, job_id)
select distinct on (employer_id) employer_id, created_at, id
from public.jobs
where employer_id is not null
order by employer_id, created_at asc, id asc
on conflict (user_id) do nothing;
-- No client-side table policies are intentionally added. The Edge Function/service role
-- and the authenticated RPC below are the only intended access paths.

create or replace function public.publish_free_trial_job(p_job jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_job_id uuid;
begin
  if v_user_id is null then
    raise exception 'LOGIN_REQUIRED';
  end if;
  if coalesce(trim(p_job->>'title'), '') = ''
     or coalesce(trim(p_job->>'category'), '') = ''
     or coalesce(trim(p_job->>'city'), '') = '' then
    raise exception 'JOB_FIELDS_REQUIRED';
  end if;

  -- The primary key makes the free trial one-time and race-safe per account.
  insert into public.job_posting_trials(user_id) values (v_user_id);

  perform set_config('app.kaammilega_verified_job_posting', 'true', true);
  insert into public.jobs (
    employer_id, title, category, city, salary, job_type, description,
    contact_phone, status, posting_paid, expires_at
  ) values (
    v_user_id,
    trim(p_job->>'title'),
    trim(p_job->>'category'),
    trim(p_job->>'city'),
    nullif(trim(coalesce(p_job->>'salary','')), ''),
    coalesce(nullif(trim(p_job->>'job_type'), ''), 'Full Time'),
    coalesce(p_job->>'description', ''),
    coalesce(p_job->>'contact_phone', ''),
    'pending_owner', false, null
  ) returning id into v_job_id;

  update public.job_posting_trials set job_id = v_job_id where user_id = v_user_id;
  return jsonb_build_object('success', true, 'trial_used', true, 'job_id', v_job_id,
    'message', 'Your free job post was submitted for owner review. The 30-day period starts when approved.');
exception
  when unique_violation then
    raise exception 'FREE_TRIAL_ALREADY_USED';
end;
$$;

revoke all on function public.publish_free_trial_job(jsonb) from public;
grant execute on function public.publish_free_trial_job(jsonb) to authenticated;

create or replace function public.finalize_paid_job_post(
  p_user_id uuid,
  p_order_id text,
  p_payment_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_payment public.job_posting_payments%rowtype;
  v_job_id uuid;
begin
  select * into v_payment
  from public.job_posting_payments
  where order_id = p_order_id and user_id = p_user_id
  for update;

  if not found then raise exception 'PAYMENT_ORDER_NOT_FOUND'; end if;
  if v_payment.amount_paise <> 29900 or v_payment.currency <> 'INR' then
    raise exception 'PAYMENT_AMOUNT_INVALID';
  end if;

  if v_payment.status = 'paid' and v_payment.job_id is not null then
    return jsonb_build_object('success', true, 'job_id', v_payment.job_id, 'already_processed', true);
  end if;
  if v_payment.status <> 'created' then raise exception 'PAYMENT_NOT_PENDING'; end if;

  perform set_config('app.kaammilega_verified_job_posting', 'true', true);
  insert into public.jobs (
    employer_id, title, category, city, salary, job_type, description,
    contact_phone, status, posting_paid, posting_payment_id, expires_at
  ) values (
    p_user_id,
    trim(v_payment.job_payload->>'title'),
    trim(v_payment.job_payload->>'category'),
    trim(v_payment.job_payload->>'city'),
    nullif(trim(coalesce(v_payment.job_payload->>'salary','')), ''),
    coalesce(nullif(trim(v_payment.job_payload->>'job_type'), ''), 'Full Time'),
    coalesce(v_payment.job_payload->>'description', ''),
    coalesce(v_payment.job_payload->>'contact_phone', ''),
    'pending_owner', true, p_payment_id, null
  ) returning id into v_job_id;

  update public.job_posting_payments
    set status = 'paid', payment_id = p_payment_id, job_id = v_job_id, paid_at = now()
    where id = v_payment.id;

  return jsonb_build_object('success', true, 'job_id', v_job_id,
    'message', 'Payment verified. Your paid job post was submitted for owner review. The 30-day period starts when approved.');
end;
$$;

revoke all on function public.finalize_paid_job_post(uuid,text,text) from public, anon, authenticated;
grant execute on function public.finalize_paid_job_post(uuid,text,text) to service_role;

-- Start the 30-day listing window when the owner approves the listing.
create or replace function public.set_job_post_expiry_on_activation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'active' and (old.status is distinct from 'active') then
    if new.expires_at is null or new.expires_at <= now() then
      new.expires_at := now() + interval '30 days';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists jobs_set_expiry_on_activation on public.jobs;
create trigger jobs_set_expiry_on_activation
before update of status on public.jobs
for each row execute function public.set_job_post_expiry_on_activation();

create index if not exists jobs_expires_at_idx on public.jobs(expires_at);
create index if not exists job_posting_payments_user_created_idx on public.job_posting_payments(user_id, created_at desc);

-- Optional scheduled expiry: enable pg_cron in Supabase if available, then schedule:
-- select cron.schedule('expire-kaammilega-jobs-daily', '*/15 * * * *',
--   $$update public.jobs set status = 'completed' where status = 'active' and expires_at is not null and expires_at <= now()$$);


-- Prevent direct REST inserts from bypassing the free-trial/payment flow.
create or replace function public.guard_job_posting_checkout()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(current_setting('app.kaammilega_verified_job_posting', true), '') <> 'true' then
    raise exception 'JOB_POSTING_CHECKOUT_REQUIRED';
  end if;
  return new;
end;
$$;

drop trigger if exists jobs_require_verified_posting on public.jobs;
create trigger jobs_require_verified_posting
before insert on public.jobs
for each row execute function public.guard_job_posting_checkout();
