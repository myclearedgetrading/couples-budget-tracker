# Couples Budget Tracker

A responsive shared-finance dashboard for couples. It combines household income, recurring bills, flexible spending, savings goals, calendar events, reports, and partner responsibilities in one approachable app.

## Stack

- Next.js App Router, React, TypeScript, and Tailwind CSS
- Supabase Auth and PostgreSQL with row-level security
- Recharts for responsive financial charts
- React Hook Form/Zod-ready validation and Sonner notifications

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local`.
3. Create a Supabase project and paste its URL and anonymous key into `.env.local`.
4. Run `supabase/migrations/0001_initial_schema.sql` in the Supabase SQL editor.
5. In Supabase Auth settings, add `http://localhost:3000/auth/callback` as a redirect URL.
6. Start the app:
   ```bash
   npm run dev
   ```

Without environment variables, account forms automatically offer the polished demo experience. The public **View live demo** button also opens a labeled sample household.

## Security model

Financial rows carry a `household_id`. Row-level security checks active membership before allowing access, and sensitive membership/invitation operations run through narrowly scoped database functions. The app never requests bank credentials or account numbers.

Use only the public Supabase anonymous key in browser-exposed environment variables. Never expose a service-role key to the client.

## Product areas

- Public landing page and editable Free/Plus/Lifetime pricing
- Login, signup, reset password, and three-step onboarding
- Shared dashboard with month summaries and partner activity
- Monthly budget and recurring bill workflows
- Income and transaction tracking
- Category limits with 75%, 90%, and 100% warnings
- Shared savings goals and contributions
- Budget calendar and exportable reports
- Household preferences, invitations, reminders, and approval rules
- Desktop sidebar and mobile finance-app navigation

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

## Optional integrations

`RESEND_API_KEY` and `RESEND_FROM_EMAIL` are reserved for partner invitation and reminder delivery. Invitation links remain copyable without email configuration. Stripe keys are placeholders for a later checkout implementation; the current MVP is subscription-ready but does not charge users.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
