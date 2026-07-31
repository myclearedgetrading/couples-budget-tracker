# Database migrations

`migrations/0001_initial_schema.sql` targets a fresh Neon database where Managed
Better Auth and the Neon Data API have already been provisioned.

Assumptions:

- `neon_auth."user".id` is `uuid`; profiles are synchronized from its
  `email`, `name`, `image`, and `"emailVerified"` columns.
- The Data API provides `auth.user_id()` and the `authenticated` and
  `anonymous` database roles.
- Run the migration as the Neon database owner so it can create the
  `extensions` schema, install `pgcrypto`, reference `neon_auth."user"`, and
  add the profile synchronization trigger.
- Apply this migration once to an empty application schema. It is not an
  in-place conversion of the legacy Supabase migration.

RLS compares UUID columns to the text identity returned by `auth.user_id()`.
Invitation tokens are returned once and only their SHA-256 hashes are stored.

## `migrations/0002_month_rollover.sql`

Adds `ensure_budget_month(household, month_start, actor)`, which opens a budget
month and carries the previous month's recurring bills, recurring income, and
category budgets into it. Bills and income have no natural unique key, so an
`activity_logs` row with `action = 'rolled_over'` is the idempotency key and an
advisory lock serializes both partners arriving at once.

Unlike `rollover_budget_month`, it takes the actor as an argument instead of
reading `auth.user_id()`, so it works over the owner connection the app uses.
Execute is revoked from `public` for that reason.

The migration also backfills: existing months are marked as already rolled over
so the first run cannot duplicate bills into a month already in use, and bills
in the current month are flagged recurring to match the form's new default.

## Applying a migration

```bash
npm run db:migrate -- database/migrations/0002_month_rollover.sql
```

Reads `DATABASE_URL` from `.env.local` and runs the file in one transaction. For
production, point `DATABASE_URL` at the production branch before running.

`npm run db:verify-rollover` exercises the rollover against the configured
database — date clamping, copy behaviour, idempotency, concurrency, and the
membership check — using a far-future probe month it deletes afterwards.
