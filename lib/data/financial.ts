import "server-only";

import { auth } from "@/lib/auth/server";
import { getSql } from "@/lib/db";

export type MemberOption = { id: string; name: string };
export type CategoryOption = {
  id: string;
  name: string;
  kind: "income" | "expense" | "savings";
  color: string;
};
export type BillView = {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: "planned" | "paid" | "skipped";
  recurring: boolean;
  category: string;
  categoryId: string;
  assigned: string | null;
};
export type IncomeView = {
  id: string;
  description: string;
  amount: number;
  receivedOn: string;
  recurring: boolean;
  category: string | null;
  receivedBy: string | null;
};
export type TransactionView = {
  id: string;
  description: string;
  amount: number;
  date: string;
  kind: "expense" | "refund" | "transfer";
  category: string | null;
  categoryId: string | null;
  paidBy: string | null;
};
export type BudgetView = {
  id: string;
  category: string;
  color: string;
  amount: number;
  spent: number;
};
export type GoalView = {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: string | null;
  completed: boolean;
  saved: number;
};
export type ContributionView = {
  id: string;
  goalId: string;
  goalName: string;
  amount: number;
  date: string;
  note: string | null;
};
export type ReportRow = {
  month: string;
  income: number;
  expenses: number;
  saved: number;
};
export type ActivityView = {
  id: number;
  entityType: string;
  action: string;
  createdAt: string;
  actor: string | null;
};

export type FinancialData = {
  household: {
    id: string;
    name: string;
    currencyCode: string;
    timezone: string;
  } | null;
  month: { id: string; monthStart: string; status: "open" | "closed" } | null;
  members: MemberOption[];
  categories: CategoryOption[];
  bills: BillView[];
  income: IncomeView[];
  transactions: TransactionView[];
  budgets: BudgetView[];
  goals: GoalView[];
  contributions: ContributionView[];
  reports: ReportRow[];
  activity: ActivityView[];
  preferences: {
    locale: string;
    theme: "light" | "dark" | "system";
    emailNotifications: boolean;
    pushNotifications: boolean;
  } | null;
};

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export async function requireUser(): Promise<SessionUser> {
  const session = await auth.getSession();
  if (!session?.user?.id) throw new Error("Please sign in to continue.");
  return session.user;
}

const chosenHouseholdSql = `
  select h.id, h.name, h.currency_code, h.timezone
  from households h
  join household_members hm on hm.household_id = h.id
    and hm.user_id = $1 and hm.status = 'active'
  left join user_preferences up on up.user_id = $1
  order by (h.id = up.default_household_id) desc, hm.joined_at asc
  limit 1
`;

export async function getFinancialData(): Promise<FinancialData> {
  const user = await requireUser();
  const sql = getSql();
  const households = (await sql.query(chosenHouseholdSql, [
    user.id,
  ])) as Record<string, unknown>[];
  const householdRow = households[0];
  if (!householdRow) {
    return {
      household: null,
      month: null,
      members: [],
      categories: [],
      bills: [],
      income: [],
      transactions: [],
      budgets: [],
      goals: [],
      contributions: [],
      reports: [],
      activity: [],
      preferences: null,
    };
  }

  const householdId = String(householdRow.id);
  const memberGuard = `exists (
    select 1 from household_members access
    where access.household_id = $1 and access.user_id = $2 and access.status = 'active'
  )`;

  const [
    months,
    memberRows,
    categoryRows,
    billRows,
    incomeRows,
    transactionRows,
    budgetRows,
    goalRows,
    contributionRows,
    reportRows,
    activityRows,
    preferenceRows,
  ] = await Promise.all([
    sql.query(
      `select bm.id, bm.month_start, bm.status from budget_months bm where bm.household_id = $1 and ${memberGuard} order by (bm.month_start = date_trunc('month', current_date)::date) desc, bm.month_start desc limit 1`,
      [householdId, user.id],
    ),
    sql.query(
      `select hm.user_id as id, coalesce(p.full_name, p.email, 'Household member') as name from household_members hm join profiles p on p.id = hm.user_id where hm.household_id = $1 and hm.status = 'active' and ${memberGuard} order by hm.role, hm.joined_at`,
      [householdId, user.id],
    ),
    sql.query(
      `select c.id, c.name, c.kind, coalesce(c.color, '#64748B') as color from categories c where c.household_id = $1 and not c.is_archived and ${memberGuard} order by c.sort_order, c.name`,
      [householdId, user.id],
    ),
    sql.query(
      `select b.id, b.name, b.amount, b.due_date, b.status, b.is_recurring, b.category_id, c.name as category, coalesce(p.full_name, p.email) as assigned from bills b join categories c on c.id = b.category_id and c.household_id = b.household_id left join profiles p on p.id = coalesce(b.paid_by, b.created_by) where b.household_id = $1 and b.budget_month_id = (select id from budget_months where household_id = $1 order by (month_start = date_trunc('month', current_date)::date) desc, month_start desc limit 1) and ${memberGuard} order by b.due_date, b.created_at`,
      [householdId, user.id],
    ),
    sql.query(
      `select i.id, i.description, i.amount, i.received_on, i.is_recurring, c.name as category, coalesce(p.full_name, p.email) as received_by from income i left join categories c on c.id = i.category_id and c.household_id = i.household_id left join profiles p on p.id = i.received_by where i.household_id = $1 and i.budget_month_id = (select id from budget_months where household_id = $1 order by (month_start = date_trunc('month', current_date)::date) desc, month_start desc limit 1) and ${memberGuard} order by i.received_on desc, i.created_at desc`,
      [householdId, user.id],
    ),
    sql.query(
      `select t.id, t.description, t.amount, t.transaction_date, t.kind, t.category_id, c.name as category, coalesce(p.full_name, p.email) as paid_by from transactions t left join categories c on c.id = t.category_id and c.household_id = t.household_id left join profiles p on p.id = t.paid_by where t.household_id = $1 and t.budget_month_id = (select id from budget_months where household_id = $1 order by (month_start = date_trunc('month', current_date)::date) desc, month_start desc limit 1) and ${memberGuard} order by t.transaction_date desc, t.created_at desc`,
      [householdId, user.id],
    ),
    sql.query(
      `select cb.id, c.name as category, coalesce(c.color, '#64748B') as color, cb.amount, coalesce(sum(case when t.kind = 'expense' then t.amount when t.kind = 'refund' then -t.amount else 0 end), 0) as spent from category_budgets cb join categories c on c.id = cb.category_id and c.household_id = cb.household_id left join transactions t on t.household_id = cb.household_id and t.budget_month_id = cb.budget_month_id and t.category_id = cb.category_id where cb.household_id = $1 and cb.budget_month_id = (select id from budget_months where household_id = $1 order by (month_start = date_trunc('month', current_date)::date) desc, month_start desc limit 1) and ${memberGuard} group by cb.id, c.name, c.color, cb.amount order by c.name`,
      [householdId, user.id],
    ),
    sql.query(
      `select g.id, g.name, g.target_amount, g.target_date, g.is_completed, coalesce(sum(sc.amount), 0) as saved from savings_goals g left join savings_contributions sc on sc.savings_goal_id = g.id and sc.household_id = g.household_id where g.household_id = $1 and ${memberGuard} group by g.id order by g.is_completed, g.created_at`,
      [householdId, user.id],
    ),
    sql.query(
      `select sc.id, sc.savings_goal_id as goal_id, g.name as goal_name, sc.amount, sc.contributed_on, sc.note from savings_contributions sc join savings_goals g on g.id = sc.savings_goal_id and g.household_id = sc.household_id where sc.household_id = $1 and ${memberGuard} order by sc.contributed_on desc, sc.created_at desc`,
      [householdId, user.id],
    ),
    sql.query(
      `select bm.month_start as month, coalesce((select sum(i.amount) from income i where i.household_id = bm.household_id and i.budget_month_id = bm.id), 0) as income, coalesce((select sum(case when t.kind = 'expense' then t.amount when t.kind = 'refund' then -t.amount else 0 end) from transactions t where t.household_id = bm.household_id and t.budget_month_id = bm.id), 0) + coalesce((select sum(b.amount) from bills b where b.household_id = bm.household_id and b.budget_month_id = bm.id), 0) as expenses, coalesce((select sum(sc.amount) from savings_contributions sc where sc.household_id = bm.household_id and date_trunc('month', sc.contributed_on) = bm.month_start), 0) as saved from budget_months bm where bm.household_id = $1 and ${memberGuard} order by bm.month_start desc limit 12`,
      [householdId, user.id],
    ),
    sql.query(
      `select al.id, al.entity_type, al.action, al.created_at, coalesce(p.full_name, p.email) as actor from activity_logs al left join profiles p on p.id = al.actor_id where al.household_id = $1 and ${memberGuard} order by al.created_at desc limit 8`,
      [householdId, user.id],
    ),
    sql.query(
      `select up.locale, up.theme, up.email_notifications, up.push_notifications from user_preferences up join household_members hm on hm.user_id = up.user_id and hm.household_id = $1 and hm.status = 'active' where up.user_id = $2`,
      [householdId, user.id],
    ),
  ]);

  const n = (value: unknown) => Number(value ?? 0);
  const s = (value: unknown) => (value == null ? null : String(value));
  const monthRow = months[0] as Record<string, unknown> | undefined;
  const preference = preferenceRows[0] as Record<string, unknown> | undefined;

  return {
    household: {
      id: householdId,
      name: String(householdRow.name),
      currencyCode: String(householdRow.currency_code),
      timezone: String(householdRow.timezone),
    },
    month: monthRow
      ? {
          id: String(monthRow.id),
          monthStart: String(monthRow.month_start),
          status: monthRow.status as "open" | "closed",
        }
      : null,
    members: memberRows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
    })),
    categories: categoryRows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      kind: r.kind as CategoryOption["kind"],
      color: String(r.color),
    })),
    bills: billRows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      amount: n(r.amount),
      dueDate: String(r.due_date),
      status: r.status as BillView["status"],
      recurring: Boolean(r.is_recurring),
      category: String(r.category),
      categoryId: String(r.category_id),
      assigned: s(r.assigned),
    })),
    income: incomeRows.map((r) => ({
      id: String(r.id),
      description: String(r.description),
      amount: n(r.amount),
      receivedOn: String(r.received_on),
      recurring: Boolean(r.is_recurring),
      category: s(r.category),
      receivedBy: s(r.received_by),
    })),
    transactions: transactionRows.map((r) => ({
      id: String(r.id),
      description: String(r.description),
      amount: n(r.amount),
      date: String(r.transaction_date),
      kind: r.kind as TransactionView["kind"],
      category: s(r.category),
      categoryId: s(r.category_id),
      paidBy: s(r.paid_by),
    })),
    budgets: budgetRows.map((r) => ({
      id: String(r.id),
      category: String(r.category),
      color: String(r.color),
      amount: n(r.amount),
      spent: n(r.spent),
    })),
    goals: goalRows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      targetAmount: n(r.target_amount),
      targetDate: s(r.target_date),
      completed: Boolean(r.is_completed),
      saved: n(r.saved),
    })),
    contributions: contributionRows.map((r) => ({
      id: String(r.id),
      goalId: String(r.goal_id),
      goalName: String(r.goal_name),
      amount: n(r.amount),
      date: String(r.contributed_on),
      note: s(r.note),
    })),
    reports: reportRows
      .map((r) => ({
        month: String(r.month),
        income: n(r.income),
        expenses: n(r.expenses),
        saved: n(r.saved),
      }))
      .reverse(),
    activity: activityRows.map((r) => ({
      id: n(r.id),
      entityType: String(r.entity_type),
      action: String(r.action),
      createdAt: String(r.created_at),
      actor: s(r.actor),
    })),
    preferences: preference
      ? {
          locale: String(preference.locale),
          theme: preference.theme as "light" | "dark" | "system",
          emailNotifications: Boolean(preference.email_notifications),
          pushNotifications: Boolean(preference.push_notifications),
        }
      : null,
  };
}

export async function getMutationContext() {
  const user = await requireUser();
  const sql = getSql();
  const rows = await sql.query(chosenHouseholdSql, [user.id]);
  const household = rows[0];
  if (!household) {
    throw new Error("Create or join a household before adding financial records.");
  }
  return { sql, userId: user.id, householdId: String(household.id) };
}
