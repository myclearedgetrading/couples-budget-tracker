-- Couples Budget Tracker schema for Neon Postgres.
-- Requires provisioned Neon Managed Better Auth (neon_auth) and Neon Data API
-- (auth.user_id(), authenticated, and anonymous).

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create type public.household_role as enum ('owner', 'partner');
create type public.member_status as enum ('active', 'left');
create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');
create type public.budget_month_status as enum ('open', 'closed');
create type public.category_kind as enum ('income', 'expense', 'savings');
create type public.transaction_kind as enum ('expense', 'refund', 'transfer');
create type public.bill_status as enum ('planned', 'paid', 'skipped');
create type public.notification_kind as enum ('invitation', 'bill_due', 'budget_alert', 'goal', 'system');

create table public.profiles (
  id uuid primary key references neon_auth."user"(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_not_blank check (btrim(email) <> '')
);

create unique index profiles_email_lower_idx on public.profiles (lower(email));

create table public.households (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  currency_code text not null default 'USD',
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint households_name_not_blank check (btrim(name) <> ''),
  constraint households_currency_code_format check (currency_code ~ '^[A-Z]{3}$')
);

create table public.household_members (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.household_role not null,
  status public.member_status not null default 'active',
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint household_members_household_user_key unique (household_id, user_id),
  constraint household_members_status_dates check (
    (status = 'active' and left_at is null)
    or (status = 'left' and left_at is not null)
  )
);

create unique index household_members_one_active_owner_idx
  on public.household_members (household_id)
  where role = 'owner' and status = 'active';
create index household_members_user_active_idx
  on public.household_members (user_id, household_id)
  where status = 'active';

create table public.household_invitations (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  email text not null,
  token_hash text not null,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint household_invitations_email_not_blank check (btrim(email) <> ''),
  constraint household_invitations_token_hash_format check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint household_invitations_acceptance_fields check (
    (status = 'accepted' and accepted_by is not null and accepted_at is not null)
    or (status <> 'accepted' and accepted_by is null and accepted_at is null)
  )
);

create unique index household_invitations_token_hash_idx
  on public.household_invitations (token_hash);
create unique index household_invitations_one_pending_email_idx
  on public.household_invitations (household_id, lower(email))
  where status = 'pending';
create index household_invitations_household_status_idx
  on public.household_invitations (household_id, status, expires_at);

create table public.budget_months (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  month_start date not null,
  status public.budget_month_status not null default 'open',
  notes text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_months_id_household_key unique (id, household_id),
  constraint budget_months_household_month_key unique (household_id, month_start),
  constraint budget_months_first_day check (month_start = date_trunc('month', month_start)::date)
);

create table public.categories (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  kind public.category_kind not null,
  color text,
  icon text,
  is_archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_id_household_key unique (id, household_id),
  constraint categories_household_name_kind_key unique (household_id, name, kind),
  constraint categories_name_not_blank check (btrim(name) <> ''),
  constraint categories_color_format check (color is null or color ~ '^#[0-9A-Fa-f]{6}$')
);

create table public.income (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  budget_month_id uuid not null,
  category_id uuid,
  received_by uuid references public.profiles(id) on delete set null,
  description text not null,
  amount numeric(14,2) not null,
  received_on date not null,
  is_recurring boolean not null default false,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint income_amount_positive check (amount > 0),
  constraint income_description_not_blank check (btrim(description) <> ''),
  constraint income_budget_month_fk foreign key (budget_month_id, household_id)
    references public.budget_months(id, household_id) on delete cascade,
  constraint income_category_fk foreign key (category_id, household_id)
    references public.categories(id, household_id) on delete restrict
);

create table public.bills (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  budget_month_id uuid not null,
  category_id uuid not null,
  name text not null,
  amount numeric(14,2) not null,
  due_date date not null,
  status public.bill_status not null default 'planned',
  is_recurring boolean not null default false,
  paid_at timestamptz,
  paid_by uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bills_id_household_key unique (id, household_id),
  constraint bills_amount_nonnegative check (amount >= 0),
  constraint bills_name_not_blank check (btrim(name) <> ''),
  constraint bills_paid_fields check (
    (status = 'paid' and paid_at is not null)
    or (status <> 'paid' and paid_at is null and paid_by is null)
  ),
  constraint bills_budget_month_fk foreign key (budget_month_id, household_id)
    references public.budget_months(id, household_id) on delete cascade,
  constraint bills_category_fk foreign key (category_id, household_id)
    references public.categories(id, household_id) on delete restrict
);

create table public.transactions (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  budget_month_id uuid not null,
  category_id uuid,
  bill_id uuid,
  kind public.transaction_kind not null default 'expense',
  description text not null,
  amount numeric(14,2) not null,
  transaction_date date not null,
  paid_by uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_amount_positive check (amount > 0),
  constraint transactions_description_not_blank check (btrim(description) <> ''),
  constraint transactions_budget_month_fk foreign key (budget_month_id, household_id)
    references public.budget_months(id, household_id) on delete cascade,
  constraint transactions_category_fk foreign key (category_id, household_id)
    references public.categories(id, household_id) on delete restrict,
  constraint transactions_bill_fk foreign key (bill_id, household_id)
    references public.bills(id, household_id) on delete restrict
);

create table public.category_budgets (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  budget_month_id uuid not null,
  category_id uuid not null,
  amount numeric(14,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint category_budgets_amount_nonnegative check (amount >= 0),
  constraint category_budgets_month_category_key unique (budget_month_id, category_id),
  constraint category_budgets_budget_month_fk foreign key (budget_month_id, household_id)
    references public.budget_months(id, household_id) on delete cascade,
  constraint category_budgets_category_fk foreign key (category_id, household_id)
    references public.categories(id, household_id) on delete restrict
);

create table public.savings_goals (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  target_amount numeric(14,2) not null,
  target_date date,
  is_completed boolean not null default false,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint savings_goals_id_household_key unique (id, household_id),
  constraint savings_goals_name_not_blank check (btrim(name) <> ''),
  constraint savings_goals_target_positive check (target_amount > 0)
);

create table public.savings_contributions (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  savings_goal_id uuid not null,
  amount numeric(14,2) not null,
  contributed_on date not null,
  contributed_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint savings_contributions_amount_positive check (amount > 0),
  constraint savings_contributions_goal_fk foreign key (savings_goal_id, household_id)
    references public.savings_goals(id, household_id) on delete cascade
);

create table public.notifications (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind public.notification_kind not null,
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_title_not_blank check (btrim(title) <> ''),
  constraint notifications_data_object check (jsonb_typeof(data) = 'object')
);

create table public.activity_logs (
  id bigint generated always as identity primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint activity_logs_action_check
    check (action in ('created', 'updated', 'deleted', 'accepted', 'rolled_over')),
  constraint activity_logs_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  default_household_id uuid references public.households(id) on delete set null,
  locale text not null default 'en-US',
  theme text not null default 'system',
  email_notifications boolean not null default true,
  push_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_preferences_theme_check check (theme in ('light', 'dark', 'system')),
  constraint user_preferences_locale_not_blank check (btrim(locale) <> '')
);

create index budget_months_household_month_idx
  on public.budget_months (household_id, month_start desc);
create index categories_household_active_idx
  on public.categories (household_id, sort_order) where not is_archived;
create index income_household_month_idx
  on public.income (household_id, budget_month_id, received_on);
create index bills_household_month_due_idx
  on public.bills (household_id, budget_month_id, due_date);
create index transactions_household_month_date_idx
  on public.transactions (household_id, budget_month_id, transaction_date desc);
create index transactions_category_idx
  on public.transactions (household_id, category_id, transaction_date desc);
create index category_budgets_household_month_idx
  on public.category_budgets (household_id, budget_month_id);
create index savings_goals_household_idx
  on public.savings_goals (household_id, is_completed);
create index savings_contributions_goal_date_idx
  on public.savings_contributions (household_id, savings_goal_id, contributed_on);
create index notifications_user_unread_idx
  on public.notifications (user_id, created_at desc) where read_at is null;
create index activity_logs_household_created_idx
  on public.activity_logs (household_id, created_at desc);

-- SECURITY DEFINER helpers bypass household_members RLS to avoid recursion.
-- The Data API identity is text; Managed Better Auth IDs are UUIDs.
create function public.is_household_member(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.user_id() is not null and exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = auth.user_id()::uuid
      and hm.status = 'active'
  );
$$;

create function public.is_household_owner(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.user_id() is not null and exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = auth.user_id()::uuid
      and hm.role = 'owner'
      and hm.status = 'active'
  );
$$;

create function public.shares_household_with(p_other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.user_id() is not null and exists (
    select 1
    from public.household_members mine
    join public.household_members theirs
      on theirs.household_id = mine.household_id
     and theirs.status = 'active'
    where mine.user_id = auth.user_id()::uuid
      and mine.status = 'active'
      and theirs.user_id = p_other_user_id
  );
$$;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create function public.enforce_household_member_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_count integer;
begin
  if new.status <> 'active' then
    return new;
  end if;
  if tg_op = 'UPDATE'
     and old.status = 'active'
     and old.household_id = new.household_id then
    return new;
  end if;

  perform 1 from public.households h where h.id = new.household_id for update;
  select count(*)
    into active_count
    from public.household_members hm
   where hm.household_id = new.household_id
     and hm.status = 'active'
     and hm.id <> new.id;

  if active_count >= 2 then
    raise exception 'A household may have at most two active members'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create function public.create_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.household_members (household_id, user_id, role, status)
  values (new.id, new.owner_id, 'owner', 'active');
  return new;
end;
$$;

create function public.handle_neon_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    nullif(pg_catalog.btrim(new.name), ''),
    nullif(new.image, '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
        updated_at = pg_catalog.now();

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create function public.log_financial_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_data jsonb;
  row_id uuid;
  row_household_id uuid;
  verb text;
  caller_id uuid;
begin
  caller_id := auth.user_id()::uuid;
  row_data := case when tg_op = 'DELETE' then pg_catalog.to_jsonb(old) else pg_catalog.to_jsonb(new) end;
  row_id := (row_data ->> 'id')::uuid;
  row_household_id := (row_data ->> 'household_id')::uuid;
  verb := case tg_op when 'INSERT' then 'created' when 'UPDATE' then 'updated' else 'deleted' end;

  if not exists (select 1 from public.households h where h.id = row_household_id) then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  insert into public.activity_logs (household_id, actor_id, entity_type, entity_id, action)
  values (row_household_id, caller_id, tg_table_name, row_id, verb);
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

create function public.validate_household_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  attributed_user_id uuid;
begin
  attributed_user_id := nullif(pg_catalog.to_jsonb(new) ->> tg_argv[0], '')::uuid;
  if attributed_user_id is not null and not exists (
    select 1
      from public.household_members hm
     where hm.household_id = new.household_id
       and hm.user_id = attributed_user_id
       and hm.status = 'active'
  ) then
    raise exception '% must be an active household member', tg_argv[0]
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger households_set_updated_at before update on public.households
for each row execute function public.set_updated_at();
create trigger household_members_set_updated_at before update on public.household_members
for each row execute function public.set_updated_at();
create trigger household_invitations_set_updated_at before update on public.household_invitations
for each row execute function public.set_updated_at();
create trigger budget_months_set_updated_at before update on public.budget_months
for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();
create trigger income_set_updated_at before update on public.income
for each row execute function public.set_updated_at();
create trigger bills_set_updated_at before update on public.bills
for each row execute function public.set_updated_at();
create trigger transactions_set_updated_at before update on public.transactions
for each row execute function public.set_updated_at();
create trigger category_budgets_set_updated_at before update on public.category_budgets
for each row execute function public.set_updated_at();
create trigger savings_goals_set_updated_at before update on public.savings_goals
for each row execute function public.set_updated_at();
create trigger savings_contributions_set_updated_at before update on public.savings_contributions
for each row execute function public.set_updated_at();
create trigger user_preferences_set_updated_at before update on public.user_preferences
for each row execute function public.set_updated_at();

create trigger budget_months_validate_created_by
before insert or update of created_by, household_id on public.budget_months
for each row execute function public.validate_household_user('created_by');
create trigger income_validate_created_by before insert or update of created_by, household_id
on public.income for each row execute function public.validate_household_user('created_by');
create trigger income_validate_received_by before insert or update of received_by, household_id
on public.income for each row execute function public.validate_household_user('received_by');
create trigger bills_validate_created_by before insert or update of created_by, household_id
on public.bills for each row execute function public.validate_household_user('created_by');
create trigger bills_validate_paid_by before insert or update of paid_by, household_id
on public.bills for each row execute function public.validate_household_user('paid_by');
create trigger transactions_validate_created_by before insert or update of created_by, household_id
on public.transactions for each row execute function public.validate_household_user('created_by');
create trigger transactions_validate_paid_by before insert or update of paid_by, household_id
on public.transactions for each row execute function public.validate_household_user('paid_by');
create trigger savings_goals_validate_created_by
before insert or update of created_by, household_id on public.savings_goals
for each row execute function public.validate_household_user('created_by');
create trigger savings_contributions_validate_contributed_by
before insert or update of contributed_by, household_id on public.savings_contributions
for each row execute function public.validate_household_user('contributed_by');
create trigger notifications_validate_user before insert or update of user_id, household_id
on public.notifications for each row execute function public.validate_household_user('user_id');

create trigger household_members_limit before insert or update of household_id, status
on public.household_members for each row execute function public.enforce_household_member_limit();
create trigger households_create_owner after insert on public.households
for each row execute function public.create_owner_membership();
create trigger on_neon_auth_user_created
after insert or update of email, name, image on neon_auth."user"
for each row execute function public.handle_neon_auth_user();

-- Bootstrap auth users created before this application schema.
insert into public.profiles (id, email, full_name, avatar_url)
select
  u.id,
  u.email,
  nullif(btrim(u.name), ''),
  nullif(u.image, '')
from neon_auth."user" u
on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
      updated_at = now();

insert into public.user_preferences (user_id)
select p.id from public.profiles p
on conflict (user_id) do nothing;

create trigger income_activity after insert or update or delete on public.income
for each row execute function public.log_financial_activity();
create trigger bills_activity after insert or update or delete on public.bills
for each row execute function public.log_financial_activity();
create trigger transactions_activity after insert or update or delete on public.transactions
for each row execute function public.log_financial_activity();
create trigger category_budgets_activity after insert or update or delete on public.category_budgets
for each row execute function public.log_financial_activity();
create trigger savings_goals_activity after insert or update or delete on public.savings_goals
for each row execute function public.log_financial_activity();
create trigger savings_contributions_activity
after insert or update or delete on public.savings_contributions
for each row execute function public.log_financial_activity();

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invitations enable row level security;
alter table public.budget_months enable row level security;
alter table public.categories enable row level security;
alter table public.income enable row level security;
alter table public.bills enable row level security;
alter table public.transactions enable row level security;
alter table public.category_budgets enable row level security;
alter table public.savings_goals enable row level security;
alter table public.savings_contributions enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;
alter table public.user_preferences enable row level security;

create policy profiles_select on public.profiles for select to authenticated
using (id::text = auth.user_id() or public.shares_household_with(id));
create policy profiles_update on public.profiles for update to authenticated
using (id::text = auth.user_id()) with check (id::text = auth.user_id());

create policy households_select on public.households for select to authenticated
using (public.is_household_member(id));
create policy households_insert on public.households for insert to authenticated
with check (owner_id::text = auth.user_id());
create policy households_update on public.households for update to authenticated
using (public.is_household_owner(id))
with check (public.is_household_owner(id) and owner_id::text = auth.user_id());
create policy households_delete on public.households for delete to authenticated
using (public.is_household_owner(id));

create policy household_members_select on public.household_members for select to authenticated
using (public.is_household_member(household_id));
create policy household_members_delete_partner on public.household_members for delete to authenticated
using (public.is_household_owner(household_id) and role = 'partner');

create policy household_invitations_select on public.household_invitations for select to authenticated
using (public.is_household_member(household_id));
create policy household_invitations_delete on public.household_invitations for delete to authenticated
using (public.is_household_owner(household_id) or invited_by::text = auth.user_id());

create policy budget_months_member_all on public.budget_months for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id) and created_by::text = auth.user_id());
create policy categories_member_all on public.categories for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));
create policy income_member_all on public.income for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id) and created_by::text = auth.user_id());
create policy bills_member_all on public.bills for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id) and created_by::text = auth.user_id());
create policy transactions_member_all on public.transactions for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id) and created_by::text = auth.user_id());
create policy category_budgets_member_all on public.category_budgets for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));
create policy savings_goals_member_all on public.savings_goals for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id) and created_by::text = auth.user_id());
create policy savings_contributions_member_all
on public.savings_contributions for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy notifications_select_own on public.notifications for select to authenticated
using (user_id::text = auth.user_id() and public.is_household_member(household_id));
create policy notifications_update_own on public.notifications for update to authenticated
using (user_id::text = auth.user_id() and public.is_household_member(household_id))
with check (user_id::text = auth.user_id() and public.is_household_member(household_id));
create policy activity_logs_select on public.activity_logs for select to authenticated
using (public.is_household_member(household_id));
create policy user_preferences_select on public.user_preferences for select to authenticated
using (user_id::text = auth.user_id());
create policy user_preferences_update on public.user_preferences for update to authenticated
using (user_id::text = auth.user_id()) with check (
  user_id::text = auth.user_id()
  and (default_household_id is null or public.is_household_member(default_household_id))
);

-- Creates an invitation and returns the raw token exactly once.
create function public.create_household_invitation(
  p_household_id uuid,
  p_email text,
  p_expires_at timestamptz default (pg_catalog.now() + interval '7 days')
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_token text;
  normalized_email text;
  caller_id uuid;
begin
  caller_id := auth.user_id()::uuid;
  if caller_id is null or not public.is_household_member(p_household_id) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if p_expires_at <= pg_catalog.now()
     or p_expires_at > pg_catalog.now() + interval '30 days' then
    raise exception 'Invitation expiry must be within 30 days' using errcode = '22023';
  end if;

  normalized_email := pg_catalog.lower(pg_catalog.btrim(p_email));
  if normalized_email = '' then
    raise exception 'Email is required' using errcode = '22023';
  end if;

  perform 1 from public.households h where h.id = p_household_id for update;
  if (select count(*) from public.household_members hm
      where hm.household_id = p_household_id and hm.status = 'active') >= 2 then
    raise exception 'Household already has two active members'
      using errcode = 'check_violation';
  end if;

  update public.household_invitations
     set status = 'revoked'
   where household_id = p_household_id
     and pg_catalog.lower(email) = normalized_email
     and status = 'pending';

  raw_token := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.household_invitations (
    household_id, email, token_hash, invited_by, expires_at
  ) values (
    p_household_id,
    normalized_email,
    pg_catalog.encode(
      extensions.digest(pg_catalog.convert_to(raw_token, 'UTF8'), 'sha256'),
      'hex'
    ),
    caller_id,
    p_expires_at
  );
  return raw_token;
end;
$$;

create function public.accept_household_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.household_invitations%rowtype;
  caller_email text;
  caller_id uuid;
begin
  caller_id := auth.user_id()::uuid;
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_token is null or pg_catalog.length(p_token) <> 64 then
    raise exception 'Invalid invitation' using errcode = '22023';
  end if;

  select pg_catalog.lower(u.email)
    into caller_email
    from neon_auth."user" u
   where u.id = caller_id
     and u."emailVerified";

  if caller_email is null then
    raise exception 'Invalid or expired invitation' using errcode = '22023';
  end if;

  select *
    into invitation
    from public.household_invitations i
   where i.token_hash = pg_catalog.encode(
     extensions.digest(pg_catalog.convert_to(p_token, 'UTF8'), 'sha256'),
     'hex'
   )
   for update;

  if invitation.id is null
     or invitation.status <> 'pending'
     or invitation.expires_at <= pg_catalog.now()
     or pg_catalog.lower(invitation.email) <> caller_email then
    raise exception 'Invalid or expired invitation' using errcode = '22023';
  end if;

  perform 1 from public.households h where h.id = invitation.household_id for update;
  if (select count(*) from public.household_members hm
      where hm.household_id = invitation.household_id and hm.status = 'active') >= 2 then
    raise exception 'Household already has two active members'
      using errcode = 'check_violation';
  end if;

  insert into public.household_members (household_id, user_id, role, status)
  values (invitation.household_id, caller_id, 'partner', 'active')
  on conflict (household_id, user_id) do update
    set role = 'partner', status = 'active', left_at = null, joined_at = pg_catalog.now();

  update public.household_invitations
     set status = 'accepted', accepted_by = caller_id, accepted_at = pg_catalog.now()
   where id = invitation.id;

  insert into public.activity_logs (household_id, actor_id, entity_type, entity_id, action)
  values (invitation.household_id, caller_id, 'household_invitations', invitation.id, 'accepted');
  return invitation.household_id;
end;
$$;

-- Creates the target month and copies budgets once without overwriting retries.
create function public.rollover_budget_month(
  p_household_id uuid,
  p_source_month date,
  p_target_month date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_id uuid;
  target_id uuid;
  caller_id uuid;
begin
  caller_id := auth.user_id()::uuid;
  if caller_id is null or not public.is_household_member(p_household_id) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if p_source_month <> pg_catalog.date_trunc('month', p_source_month)::date
     or p_target_month <> pg_catalog.date_trunc('month', p_target_month)::date
     or p_target_month <= p_source_month then
    raise exception 'Months must be first-of-month dates in increasing order'
      using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_household_id::text || ':' || p_target_month::text, 0)
  );

  select bm.id into source_id
    from public.budget_months bm
   where bm.household_id = p_household_id and bm.month_start = p_source_month;
  if source_id is null then
    raise exception 'Source month not found' using errcode = 'P0002';
  end if;

  insert into public.budget_months (household_id, month_start, created_by)
  values (p_household_id, p_target_month, caller_id)
  on conflict (household_id, month_start) do nothing;

  select bm.id into target_id
    from public.budget_months bm
   where bm.household_id = p_household_id and bm.month_start = p_target_month;

  insert into public.category_budgets (household_id, budget_month_id, category_id, amount)
  select cb.household_id, target_id, cb.category_id, cb.amount
    from public.category_budgets cb
   where cb.household_id = p_household_id and cb.budget_month_id = source_id
  on conflict (budget_month_id, category_id) do nothing;

  if not exists (
    select 1 from public.activity_logs al
     where al.household_id = p_household_id
       and al.entity_type = 'budget_months'
       and al.entity_id = target_id
       and al.action = 'rolled_over'
  ) then
    insert into public.activity_logs (
      household_id, actor_id, entity_type, entity_id, action, metadata
    ) values (
      p_household_id,
      caller_id,
      'budget_months',
      target_id,
      'rolled_over',
      pg_catalog.jsonb_build_object(
        'source_month', p_source_month,
        'target_month', p_target_month
      )
    );
  end if;
  return target_id;
end;
$$;

-- Lock down function execution before exposing the intended RPC surface.
revoke all on function public.is_household_member(uuid) from public, anonymous, authenticated;
revoke all on function public.is_household_owner(uuid) from public, anonymous, authenticated;
revoke all on function public.shares_household_with(uuid) from public, anonymous, authenticated;
revoke all on function public.set_updated_at() from public, anonymous, authenticated;
revoke all on function public.enforce_household_member_limit() from public, anonymous, authenticated;
revoke all on function public.create_owner_membership() from public, anonymous, authenticated;
revoke all on function public.handle_neon_auth_user() from public, anonymous, authenticated;
revoke all on function public.log_financial_activity() from public, anonymous, authenticated;
revoke all on function public.validate_household_user() from public, anonymous, authenticated;
revoke all on function public.create_household_invitation(uuid, text, timestamptz)
  from public, anonymous, authenticated;
revoke all on function public.accept_household_invitation(text)
  from public, anonymous, authenticated;
revoke all on function public.rollover_budget_month(uuid, date, date)
  from public, anonymous, authenticated;

grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.is_household_owner(uuid) to authenticated;
grant execute on function public.shares_household_with(uuid) to authenticated;
grant execute on function public.create_household_invitation(uuid, text, timestamptz)
  to authenticated;
grant execute on function public.accept_household_invitation(text) to authenticated;
grant execute on function public.rollover_budget_month(uuid, date, date) to authenticated;

-- Data API table privileges. RLS supplies the row-level restrictions.
revoke all on table
  public.profiles,
  public.households,
  public.household_members,
  public.household_invitations,
  public.budget_months,
  public.categories,
  public.income,
  public.bills,
  public.transactions,
  public.category_budgets,
  public.savings_goals,
  public.savings_contributions,
  public.notifications,
  public.activity_logs,
  public.user_preferences
from anonymous, authenticated;
revoke all on sequence public.activity_logs_id_seq from anonymous, authenticated;

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;
grant select, insert, update, delete on public.households to authenticated;
grant select, delete on public.household_members to authenticated;
grant select, delete on public.household_invitations to authenticated;
grant select, insert, update, delete on public.budget_months to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.income to authenticated;
grant select, insert, update, delete on public.bills to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.category_budgets to authenticated;
grant select, insert, update, delete on public.savings_goals to authenticated;
grant select, insert, update, delete on public.savings_contributions to authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant select on public.activity_logs to authenticated;
grant select on public.user_preferences to authenticated;
grant update (
  default_household_id,
  locale,
  theme,
  email_notifications,
  push_notifications
) on public.user_preferences to authenticated;
