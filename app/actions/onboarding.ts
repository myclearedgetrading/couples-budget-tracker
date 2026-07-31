"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/data/financial";
import { getSql } from "@/lib/db";

const onboardingSchema = z.object({
  yourName: z.string().trim().min(1, "Enter your name.").max(80),
  partnerName: z.string().trim().max(80).optional().default(""),
  householdName: z.string().trim().min(1, "Enter a household name.").max(120),
  currencyCode: z.enum(["USD", "CAD", "GBP", "EUR"]),
  monthlySavingsGoal: z.coerce.number().min(0).max(10_000_000),
  incomeSource: z.string().trim().min(1).max(120),
  incomeAmount: z.coerce.number().positive().max(10_000_000),
  incomeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  incomeRecurring: z.boolean(),
  selectedBills: z.array(z.string().trim().min(1)).max(20),
});

const billTemplates: Record<string, { category: string; amount: number; dueDay: number }> = {
  "Rent or mortgage": { category: "Housing", amount: 1950, dueDay: 1 },
  Electricity: { category: "Utilities", amount: 180, dueDay: 4 },
  Water: { category: "Utilities", amount: 75, dueDay: 8 },
  Internet: { category: "Utilities", amount: 90, dueDay: 10 },
  "Cell phones": { category: "Utilities", amount: 160, dueDay: 12 },
  "Car payment": { category: "Transportation", amount: 520, dueDay: 14 },
  "Car insurance": { category: "Insurance", amount: 240, dueDay: 18 },
  Groceries: { category: "Groceries", amount: 800, dueDay: 3 },
};

const defaultCategories = [
  ["Housing", "expense", "#111827", 10],
  ["Utilities", "expense", "#00C878", 20],
  ["Transportation", "expense", "#3B82F6", 30],
  ["Insurance", "expense", "#6366F1", 40],
  ["Groceries", "expense", "#D4AF37", 50],
  ["Subscriptions", "expense", "#A78BFA", 60],
  ["Dining out", "expense", "#F59E0B", 70],
  ["Entertainment", "expense", "#EC4899", 80],
  ["Other", "expense", "#64748B", 90],
  ["Paycheck", "income", "#10B981", 100],
  ["Side income", "income", "#14B8A6", 110],
  ["Emergency Fund", "savings", "#D4AF37", 120],
] as const;

export type OnboardingResult =
  | { ok: true }
  | { ok: false; message: string };

export async function completeOnboardingAction(
  input: z.infer<typeof onboardingSchema>,
): Promise<OnboardingResult> {
  try {
    const data = onboardingSchema.parse(input);
    const user = await requireUser();
    const sql = getSql();

    const existing = await sql`
      select household_id
      from household_members
      where user_id = ${user.id} and status = 'active'
      limit 1
    `;
    if (existing[0]) {
      redirect("/dashboard");
    }

    await sql`
      insert into profiles (id, email, full_name)
      values (${user.id}, ${user.email ?? "unknown@example.com"}, ${data.yourName})
      on conflict (id) do update
        set full_name = excluded.full_name,
            email = coalesce(excluded.email, profiles.email),
            updated_at = now()
    `;

    await sql`
      insert into user_preferences (user_id)
      values (${user.id})
      on conflict (user_id) do nothing
    `;

    const householdName = data.householdName.trim();
    const households = await sql`
      insert into households (name, owner_id, currency_code)
      values (${householdName}, ${user.id}, ${data.currencyCode})
      returning id
    `;
    const householdId = String(households[0].id);

    await sql`
      update user_preferences
      set default_household_id = ${householdId}
      where user_id = ${user.id}
    `;

    for (const [name, kind, color, sortOrder] of defaultCategories) {
      await sql`
        insert into categories (household_id, name, kind, color, sort_order)
        values (${householdId}, ${name}, ${kind}, ${color}, ${sortOrder})
        on conflict (household_id, name, kind) do nothing
      `;
    }

    const months = await sql`
      insert into budget_months (household_id, month_start, created_by)
      values (${householdId}, date_trunc('month', current_date)::date, ${user.id})
      on conflict (household_id, month_start) do update
        set updated_at = now()
      returning id, month_start
    `;
    const monthId = String(months[0].id);
    const monthStart = String(months[0].month_start).slice(0, 10);

    const incomeCategory = await sql`
      select id from categories
      where household_id = ${householdId} and name = 'Paycheck' and kind = 'income'
      limit 1
    `;

    await sql`
      insert into income (
        household_id, budget_month_id, category_id, received_by,
        description, amount, received_on, is_recurring, created_by
      )
      values (
        ${householdId}, ${monthId}, ${incomeCategory[0]?.id ?? null}, ${user.id},
        ${data.incomeSource}, ${data.incomeAmount}, ${data.incomeDate},
        ${data.incomeRecurring}, ${user.id}
      )
    `;

    if (data.monthlySavingsGoal > 0) {
      await sql`
        insert into savings_goals (
          household_id, name, target_amount, target_date, created_by
        )
        values (
          ${householdId},
          'Monthly savings target',
          ${data.monthlySavingsGoal * 12},
          (current_date + interval '12 months')::date,
          ${user.id}
        )
      `;
    }

    for (const billName of data.selectedBills) {
      const template = billTemplates[billName] ?? {
        category: "Other",
        amount: 100,
        dueDay: 15,
      };
      const category = await sql`
        select id from categories
        where household_id = ${householdId}
          and name = ${template.category}
          and kind = 'expense'
        limit 1
      `;
      if (!category[0]) continue;

      const dueDay = Math.min(template.dueDay, 28);
      const dueDate = `${monthStart.slice(0, 8)}${String(dueDay).padStart(2, "0")}`;

      await sql`
        insert into bills (
          household_id, budget_month_id, category_id, name, amount,
          due_date, is_recurring, created_by
        )
        values (
          ${householdId}, ${monthId}, ${category[0].id}, ${billName},
          ${template.amount}, ${dueDate}, true, ${user.id}
        )
      `;
    }

    if (data.partnerName.trim()) {
      // Partner invitation is optional during onboarding; settings handles invites.
    }

    revalidatePath("/dashboard");
    revalidatePath("/onboarding");
    return { ok: true };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not finish setup. Please try again.",
    };
  }
}

export async function skipOnboardingAction(): Promise<OnboardingResult> {
  try {
    const user = await requireUser();
    const sql = getSql();
    const existing = await sql`
      select household_id
      from household_members
      where user_id = ${user.id} and status = 'active'
      limit 1
    `;
    if (existing[0]) return { ok: true };

    await sql`
      insert into profiles (id, email, full_name)
      values (${user.id}, ${user.email ?? "unknown@example.com"}, ${user.name ?? "Household owner"})
      on conflict (id) do update
        set full_name = coalesce(profiles.full_name, excluded.full_name),
            updated_at = now()
    `;

    const households = await sql`
      insert into households (name, owner_id, currency_code)
      values (${`${user.name?.split(" ")[0] ?? "My"} Household`}, ${user.id}, 'USD')
      returning id
    `;
    const householdId = String(households[0].id);

    await sql`
      insert into user_preferences (user_id, default_household_id)
      values (${user.id}, ${householdId})
      on conflict (user_id) do update
        set default_household_id = excluded.default_household_id
    `;

    for (const [name, kind, color, sortOrder] of defaultCategories) {
      await sql`
        insert into categories (household_id, name, kind, color, sort_order)
        values (${householdId}, ${name}, ${kind}, ${color}, ${sortOrder})
        on conflict (household_id, name, kind) do nothing
      `;
    }

    await sql`
      insert into budget_months (household_id, month_start, created_by)
      values (${householdId}, date_trunc('month', current_date)::date, ${user.id})
      on conflict (household_id, month_start) do nothing
    `;

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not create your household.",
    };
  }
}
