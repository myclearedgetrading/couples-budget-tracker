# Couples Budget Tracker

A shared household budgeting app for couples, built with Next.js, Neon Postgres, and Neon Managed Better Auth.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- Neon Postgres with household-scoped access checks
- Neon Managed Better Auth (email/password)
- Recharts, Zod, Sonner

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in your Neon values.
3. Apply the schema:
   ```bash
   node scripts/apply-migration.mjs
   ```
   (`DATABASE_URL` must be set in the environment.)
4. In Neon Auth, allow localhost and add your production origin as a trusted origin.
5. Start the app:
   ```bash
   npm run dev
   ```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Server-only Neon Postgres connection string |
| `NEON_AUTH_BASE_URL` | Managed Better Auth URL |
| `NEON_AUTH_COOKIE_SECRET` | 32+ character cookie signing secret |
| `NEXT_PUBLIC_NEON_AUTH_URL` | Public auth URL |
| `NEXT_PUBLIC_NEON_DATA_API_URL` | Public Data API URL |

Never commit `.env.local` or service secrets.

## Product areas

- Public landing page
- Signup, login, password reset
- Household onboarding
- Dashboard, bills, budget, income, spending, savings, calendar, reports
- Partner invitation links
- Household settings

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```
