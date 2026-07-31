-- Month rollover.
--
-- Bills, income and transactions are scoped to a budget_months row. Before this
-- migration nothing created the next month or carried anything into it, so on
-- the first of the month a household's bill list silently emptied itself.
--
-- ensure_budget_month() materializes a month on demand and copies the recurring
-- bills, recurring income and category budgets from the previous month that had
-- data. The app calls it on both the read and the write path, so the month is
-- populated before anyone can see it missing.

begin;

-- Keeps a due date inside the target month: a bill due on the 31st lands on the
-- 28th/29th/30th rather than failing to insert.
create or replace function public.clamp_day_to_month(
  p_month_start date,
  p_source date
)
returns date
language sql
immutable
set search_path = ''
as $$
  select p_month_start + (
    least(
      pg_catalog.date_part('day', p_source)::int,
      pg_catalog.date_part(
        'day',
        p_month_start + interval '1 month' - interval '1 day'
      )::int
    ) - 1
  );
$$;

create or replace function public.ensure_budget_month(
  p_household_id uuid,
  p_month_start date,
  p_actor_id uuid
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  target_id uuid;
  source_id uuid;
  source_month date;
begin
  if p_month_start <> pg_catalog.date_trunc('month', p_month_start)::date then
    raise exception 'month_start must be the first day of a month'
      using errcode = '22023';
  end if;

  -- The app authorizes before calling, but this connection bypasses RLS, so the
  -- membership check is repeated here rather than assumed.
  if not exists (
    select 1
      from public.household_members hm
     where hm.household_id = p_household_id
       and hm.user_id = p_actor_id
       and hm.status = 'active'
  ) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  -- Both partners opening the app on the 1st would otherwise race to create and
  -- populate the same month.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_household_id::text || ':' || p_month_start::text, 0)
  );

  insert into public.budget_months (household_id, month_start, created_by)
  values (p_household_id, p_month_start, p_actor_id)
  on conflict (household_id, month_start) do nothing;

  select bm.id
    into target_id
    from public.budget_months bm
   where bm.household_id = p_household_id
     and bm.month_start = p_month_start;

  -- Bills and income have no natural unique key to conflict on, so the log row
  -- is what makes copying once-per-month instead of once-per-request.
  if exists (
    select 1
      from public.activity_logs al
     where al.household_id = p_household_id
       and al.entity_type = 'budget_months'
       and al.entity_id = target_id
       and al.action = 'rolled_over'
  ) then
    return target_id;
  end if;

  -- The most recent earlier month, not p_month_start - 1: a household that skips
  -- a month should still carry its bills forward.
  select bm.id, bm.month_start
    into source_id, source_month
    from public.budget_months bm
   where bm.household_id = p_household_id
     and bm.month_start < p_month_start
   order by bm.month_start desc
   limit 1;

  if source_id is null then
    return target_id;
  end if;

  insert into public.bills (
    household_id, budget_month_id, category_id, name, amount, due_date,
    status, is_recurring, created_by
  )
  select b.household_id,
         target_id,
         b.category_id,
         b.name,
         b.amount,
         public.clamp_day_to_month(p_month_start, b.due_date),
         'planned',
         true,
         b.created_by
    from public.bills b
   where b.household_id = p_household_id
     and b.budget_month_id = source_id
     and b.is_recurring;

  insert into public.income (
    household_id, budget_month_id, category_id, received_by, description,
    amount, received_on, is_recurring, created_by
  )
  select i.household_id,
         target_id,
         i.category_id,
         i.received_by,
         i.description,
         i.amount,
         public.clamp_day_to_month(p_month_start, i.received_on),
         true,
         i.created_by
    from public.income i
   where i.household_id = p_household_id
     and i.budget_month_id = source_id
     and i.is_recurring;

  insert into public.category_budgets (
    household_id, budget_month_id, category_id, amount
  )
  select cb.household_id, target_id, cb.category_id, cb.amount
    from public.category_budgets cb
   where cb.household_id = p_household_id
     and cb.budget_month_id = source_id
  on conflict (budget_month_id, category_id) do nothing;

  insert into public.activity_logs (
    household_id, actor_id, entity_type, entity_id, action, metadata
  ) values (
    p_household_id,
    p_actor_id,
    'budget_months',
    target_id,
    'rolled_over',
    pg_catalog.jsonb_build_object(
      'source_month', source_month,
      'target_month', p_month_start
    )
  );

  return target_id;
end;
$$;

-- Only the application role should call this; it takes the actor as a parameter
-- rather than reading auth.user_id().
revoke all on function public.ensure_budget_month(uuid, date, uuid) from public;

-- Backfill 1: treat every month that already exists as already rolled over, so
-- the first run cannot retroactively copy an old month's bills into a month the
-- household has already been using.
insert into public.activity_logs (
  household_id, actor_id, entity_type, entity_id, action, metadata
)
select bm.household_id,
       bm.created_by,
       'budget_months',
       bm.id,
       'rolled_over',
       jsonb_build_object('backfill', true, 'target_month', bm.month_start)
  from public.budget_months bm
 where not exists (
   select 1
     from public.activity_logs al
    where al.household_id = bm.household_id
      and al.entity_type = 'budget_months'
      and al.entity_id = bm.id
      and al.action = 'rolled_over'
 );

-- Backfill 2: the "Recurring" checkbox used to default to off, so bills entered
-- through the form are flagged one-time and would not survive the rollover. The
-- form calls them monthly bills and now defaults to on; align existing rows in
-- the current month with that. Income is left alone because onboarding already
-- asks about it explicitly.
update public.bills b
   set is_recurring = true,
       updated_at = now()
  from public.budget_months bm
 where bm.id = b.budget_month_id
   and bm.household_id = b.household_id
   and bm.month_start = date_trunc('month', current_date)::date
   and not b.is_recurring;

commit;
