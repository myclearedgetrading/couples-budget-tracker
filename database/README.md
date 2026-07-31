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
