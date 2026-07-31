"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getMutationContext } from "@/lib/data/financial";

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

const id = z.string().uuid("That record is not valid.");
const text = z.string().trim().min(1, "Please enter a name.").max(120, "Keep the name under 120 characters.");
const amount = z.coerce.number().positive("Enter an amount greater than zero.").max(100_000_000, "That amount is too large.");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.");

function value(form: FormData, key: string) {
  return form.get(key);
}

function refreshFinancialPages() {
  for (const path of ["/dashboard", "/budget", "/bills", "/income", "/spending", "/savings", "/calendar", "/reports", "/settings"]) {
    revalidatePath(path);
  }
}

function friendlyError(error: unknown) {
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? "Please check the form and try again.";
  if (error instanceof Error && !/insert|select|update|delete|relation|column|constraint/i.test(error.message)) return error.message;
  return "We could not save that change. Please try again.";
}

async function currentMonth(sql: Awaited<ReturnType<typeof getMutationContext>>["sql"], householdId: string, userId: string) {
  const rows = await sql.query(
    `with access as (
       select hm.household_id from household_members hm
       where hm.household_id = $1 and hm.user_id = $2 and hm.status = 'active'
     ), inserted as (
       insert into budget_months (household_id, month_start, created_by)
       select access.household_id, date_trunc('month', current_date)::date, $2 from access
       on conflict (household_id, month_start) do nothing
       returning id
     )
     select id from inserted
     union all
     select bm.id from budget_months bm join access on access.household_id = bm.household_id
     where bm.month_start = date_trunc('month', current_date)::date
     limit 1`,
    [householdId, userId],
  );
  if (!rows[0]?.id) throw new Error("We could not open this month's budget.");
  return String(rows[0].id);
}

export async function createBillAction(form: FormData): Promise<ActionResult> {
  try {
    const input = z.object({ name: text, amount, dueDate: date, categoryId: z.string().optional(), categoryName: z.string().trim().max(80).optional(), recurring: z.boolean() }).parse({
      name: value(form, "name"), amount: value(form, "amount"), dueDate: value(form, "dueDate"),
      categoryId: String(value(form, "categoryId") ?? "") || undefined,
      categoryName: String(value(form, "categoryName") ?? "") || undefined,
      recurring: value(form, "recurring") === "on",
    });
    const { sql, userId, householdId } = await getMutationContext();
    const monthId = await currentMonth(sql, householdId, userId);
    const rows = await sql.query(
      `with access as (
         select hm.household_id from household_members hm
         where hm.household_id = $1 and hm.user_id = $2 and hm.status = 'active'
       ), valid_category as (
         select c.id, c.household_id from categories c join access on access.household_id = c.household_id
         where c.id = nullif($3, '')::uuid and c.kind = 'expense' and not c.is_archived
       ), inserted_category as (
         insert into categories (household_id, name, kind)
         select access.household_id, coalesce(nullif($4, ''), 'Bills'), 'expense' from access
         where nullif($3, '') is null
         on conflict (household_id, name, kind) do update set is_archived = false
         returning id, household_id
       ), chosen_category as (
         select id, household_id from valid_category
         union all select id, household_id from inserted_category
         limit 1
       )
       insert into bills (household_id, budget_month_id, category_id, name, amount, due_date, is_recurring, created_by)
       select chosen_category.household_id, $5, chosen_category.id, $6, $7, $8, $9, $2 from chosen_category
       returning id`,
      [householdId, userId, input.categoryId ?? "", input.categoryName ?? "", monthId, input.name, input.amount, input.dueDate, input.recurring],
    );
    if (!rows[0]) throw new Error("Choose an active expense category.");
    refreshFinancialPages();
    return { ok: true, message: "Bill added." };
  } catch (error) { return { ok: false, message: friendlyError(error) }; }
}

export async function createIncomeAction(form: FormData): Promise<ActionResult> {
  try {
    const input = z.object({ description: text, amount, receivedOn: date, categoryId: z.string().optional(), recurring: z.boolean() }).parse({
      description: value(form, "description"), amount: value(form, "amount"), receivedOn: value(form, "receivedOn"),
      categoryId: String(value(form, "categoryId") ?? "") || undefined, recurring: value(form, "recurring") === "on",
    });
    const { sql, userId, householdId } = await getMutationContext();
    const monthId = await currentMonth(sql, householdId, userId);
    const rows = await sql.query(
      `with access as (
         select hm.household_id from household_members hm
         where hm.household_id = $1 and hm.user_id = $2 and hm.status = 'active'
       ), valid_category as (
         select c.id from categories c join access on access.household_id = c.household_id
         where c.id = nullif($3, '')::uuid and c.kind = 'income' and not c.is_archived
       )
       insert into income (household_id, budget_month_id, category_id, received_by, description, amount, received_on, is_recurring, created_by)
       select access.household_id, $4, (select id from valid_category), $2, $5, $6, $7, $8, $2 from access
       returning id`,
      [householdId, userId, input.categoryId ?? "", monthId, input.description, input.amount, input.receivedOn, input.recurring],
    );
    if (!rows[0]) throw new Error("You no longer have access to this household.");
    refreshFinancialPages();
    return { ok: true, message: "Income recorded." };
  } catch (error) { return { ok: false, message: friendlyError(error) }; }
}

export async function createTransactionAction(form: FormData): Promise<ActionResult> {
  try {
    const input = z.object({ description: text, amount, transactionDate: date, categoryId: z.string().optional(), kind: z.enum(["expense", "refund", "transfer"]) }).parse({
      description: value(form, "description"), amount: value(form, "amount"), transactionDate: value(form, "transactionDate"),
      categoryId: String(value(form, "categoryId") ?? "") || undefined, kind: value(form, "kind") ?? "expense",
    });
    const { sql, userId, householdId } = await getMutationContext();
    const monthId = await currentMonth(sql, householdId, userId);
    const rows = await sql.query(
      `with access as (
         select hm.household_id from household_members hm
         where hm.household_id = $1 and hm.user_id = $2 and hm.status = 'active'
       ), valid_category as (
         select c.id from categories c join access on access.household_id = c.household_id
         where c.id = nullif($3, '')::uuid and c.kind = 'expense' and not c.is_archived
       )
       insert into transactions (household_id, budget_month_id, category_id, kind, description, amount, transaction_date, paid_by, created_by)
       select access.household_id, $4, (select id from valid_category), $5, $6, $7, $8, $2, $2 from access
       returning id`,
      [householdId, userId, input.categoryId ?? "", monthId, input.kind, input.description, input.amount, input.transactionDate],
    );
    if (!rows[0]) throw new Error("You no longer have access to this household.");
    refreshFinancialPages();
    return { ok: true, message: "Transaction added." };
  } catch (error) { return { ok: false, message: friendlyError(error) }; }
}

export async function createSavingsGoalAction(form: FormData): Promise<ActionResult> {
  try {
    const input = z.object({ name: text, targetAmount: amount, targetDate: z.union([date, z.literal("")]) }).parse({
      name: value(form, "name"), targetAmount: value(form, "targetAmount"), targetDate: value(form, "targetDate") ?? "",
    });
    const { sql, userId, householdId } = await getMutationContext();
    const rows = await sql.query(
      `with access as (
         select hm.household_id from household_members hm
         where hm.household_id = $1 and hm.user_id = $2 and hm.status = 'active'
       )
       insert into savings_goals (household_id, name, target_amount, target_date, created_by)
       select access.household_id, $3, $4, nullif($5, '')::date, $2 from access returning id`,
      [householdId, userId, input.name, input.targetAmount, input.targetDate],
    );
    if (!rows[0]) throw new Error("You no longer have access to this household.");
    refreshFinancialPages();
    return { ok: true, message: "Savings goal created." };
  } catch (error) { return { ok: false, message: friendlyError(error) }; }
}

export async function createSavingsContributionAction(form: FormData): Promise<ActionResult> {
  try {
    const input = z.object({ goalId: id, amount, contributedOn: date, note: z.string().trim().max(240).optional() }).parse({
      goalId: value(form, "goalId"), amount: value(form, "amount"), contributedOn: value(form, "contributedOn"),
      note: String(value(form, "note") ?? "") || undefined,
    });
    const { sql, userId, householdId } = await getMutationContext();
    const rows = await sql.query(
      `with access as (
         select hm.household_id from household_members hm
         where hm.household_id = $1 and hm.user_id = $2 and hm.status = 'active'
       ), goal as (
         select g.id, g.household_id from savings_goals g join access on access.household_id = g.household_id
         where g.id = $3
       )
       insert into savings_contributions (household_id, savings_goal_id, amount, contributed_on, contributed_by, note)
       select goal.household_id, goal.id, $4, $5, $2, nullif($6, '') from goal returning id`,
      [householdId, userId, input.goalId, input.amount, input.contributedOn, input.note ?? ""],
    );
    if (!rows[0]) throw new Error("That savings goal is no longer available.");
    refreshFinancialPages();
    return { ok: true, message: "Contribution recorded." };
  } catch (error) { return { ok: false, message: friendlyError(error) }; }
}

export async function markBillPaidAction(recordId: string): Promise<ActionResult> {
  try {
    const billId = id.parse(recordId);
    const { sql, userId, householdId } = await getMutationContext();
    const rows = await sql.query(
      `with access as (
         select hm.household_id from household_members hm
         where hm.household_id = $1 and hm.user_id = $2 and hm.status = 'active'
       )
       update bills b set status = 'paid', paid_at = now(), paid_by = $2
       from access where b.id = $3 and b.household_id = access.household_id returning b.id`,
      [householdId, userId, billId],
    );
    if (!rows[0]) throw new Error("That bill is no longer available.");
    refreshFinancialPages();
    return { ok: true, message: "Bill marked as paid." };
  } catch (error) { return { ok: false, message: friendlyError(error) }; }
}

export async function deleteFinancialRecordAction(entity: "bill" | "income" | "transaction" | "goal" | "contribution", recordId: string): Promise<ActionResult> {
  try {
    const parsedId = id.parse(recordId);
    const { sql, userId, householdId } = await getMutationContext();
    const tables = { bill: "bills", income: "income", transaction: "transactions", goal: "savings_goals", contribution: "savings_contributions" } as const;
    const table = tables[entity];
    if (!table) throw new Error("That record type cannot be deleted.");
    const rows = await sql.query(
      `with access as (
         select hm.household_id from household_members hm
         where hm.household_id = $1 and hm.user_id = $2 and hm.status = 'active'
       )
       delete from ${table} item using access
       where item.id = $3 and item.household_id = access.household_id returning item.id`,
      [householdId, userId, parsedId],
    );
    if (!rows[0]) throw new Error("That record is no longer available.");
    refreshFinancialPages();
    return { ok: true, message: "Record deleted." };
  } catch (error) { return { ok: false, message: friendlyError(error) }; }
}

export async function updateSettingsAction(form: FormData): Promise<ActionResult> {
  try {
    const input = z.object({
      householdName: text, locale: z.string().trim().min(2).max(20),
      theme: z.enum(["light", "dark", "system"]), emailNotifications: z.boolean(), pushNotifications: z.boolean(),
    }).parse({
      householdName: value(form, "householdName"), locale: value(form, "locale"), theme: value(form, "theme"),
      emailNotifications: value(form, "emailNotifications") === "on", pushNotifications: value(form, "pushNotifications") === "on",
    });
    const { sql, userId, householdId } = await getMutationContext();
    await sql.query(
      `with owner_access as (
         select household_id from household_members
         where household_id = $1 and user_id = $2 and status = 'active' and role = 'owner'
       )
       update households h set name = $3
       from owner_access where h.id = owner_access.household_id`,
      [householdId, userId, input.householdName],
    );
    await sql.query(
      `update user_preferences up
       set locale = $3, theme = $4, email_notifications = $5, push_notifications = $6
       from household_members hm
       where hm.household_id = $1 and hm.user_id = $2 and hm.status = 'active'
         and up.user_id = hm.user_id`,
      [householdId, userId, input.locale, input.theme, input.emailNotifications, input.pushNotifications],
    );
    refreshFinancialPages();
    return { ok: true, message: "Settings saved." };
  } catch (error) { return { ok: false, message: friendlyError(error) }; }
}
