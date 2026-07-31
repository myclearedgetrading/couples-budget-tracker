/**
 * Practical Supabase types for 0001_initial_schema.sql.
 * Regenerate with `supabase gen types typescript` once a linked project exists.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type HouseholdRole = "owner" | "partner";
export type MemberStatus = "active" | "left";
export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";
export type BudgetMonthStatus = "open" | "closed";
export type CategoryKind = "income" | "expense" | "savings";
export type TransactionKind = "expense" | "refund" | "transfer";
export type BillStatus = "planned" | "paid" | "skipped";
export type NotificationKind =
  | "invitation"
  | "bill_due"
  | "budget_alert"
  | "goal"
  | "system";

type TableDefinition<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}
export type ProfileInsert = Pick<Profile, "id" | "email"> &
  Partial<Pick<Profile, "full_name" | "avatar_url" | "created_at" | "updated_at">>;

export interface Household {
  id: string;
  name: string;
  owner_id: string;
  currency_code: string;
  timezone: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}
export type HouseholdInsert = Pick<Household, "name" | "owner_id"> &
  Partial<
    Pick<
      Household,
      "id" | "currency_code" | "timezone" | "is_demo" | "created_at" | "updated_at"
    >
  >;

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: HouseholdRole;
  status: MemberStatus;
  joined_at: string;
  left_at: string | null;
  created_at: string;
  updated_at: string;
}
export type HouseholdMemberInsert = Pick<
  HouseholdMember,
  "household_id" | "user_id" | "role"
> &
  Partial<
    Pick<
      HouseholdMember,
      "id" | "status" | "joined_at" | "left_at" | "created_at" | "updated_at"
    >
  >;

export interface HouseholdInvitation {
  id: string;
  household_id: string;
  email: string;
  token_hash: string;
  invited_by: string;
  status: InvitationStatus;
  expires_at: string;
  accepted_by: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}
export type HouseholdInvitationInsert = Pick<
  HouseholdInvitation,
  "household_id" | "email" | "token_hash" | "invited_by" | "expires_at"
> &
  Partial<
    Pick<
      HouseholdInvitation,
      "id" | "status" | "accepted_by" | "accepted_at" | "created_at" | "updated_at"
    >
  >;

export interface BudgetMonth {
  id: string;
  household_id: string;
  month_start: string;
  status: BudgetMonthStatus;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}
export type BudgetMonthInsert = Pick<
  BudgetMonth,
  "household_id" | "month_start" | "created_by"
> &
  Partial<Pick<BudgetMonth, "id" | "status" | "notes" | "created_at" | "updated_at">>;

export interface Category {
  id: string;
  household_id: string;
  name: string;
  kind: CategoryKind;
  color: string | null;
  icon: string | null;
  is_archived: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
export type CategoryInsert = Pick<Category, "household_id" | "name" | "kind"> &
  Partial<
    Pick<
      Category,
      "id" | "color" | "icon" | "is_archived" | "sort_order" | "created_at" | "updated_at"
    >
  >;

export interface Income {
  id: string;
  household_id: string;
  budget_month_id: string;
  category_id: string | null;
  received_by: string | null;
  description: string;
  amount: number;
  received_on: string;
  is_recurring: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}
export type IncomeInsert = Pick<
  Income,
  "household_id" | "budget_month_id" | "description" | "amount" | "received_on" | "created_by"
> &
  Partial<
    Pick<
      Income,
      | "id"
      | "category_id"
      | "received_by"
      | "is_recurring"
      | "created_at"
      | "updated_at"
    >
  >;

export interface Bill {
  id: string;
  household_id: string;
  budget_month_id: string;
  category_id: string;
  name: string;
  amount: number;
  due_date: string;
  status: BillStatus;
  is_recurring: boolean;
  paid_at: string | null;
  paid_by: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}
export type BillInsert = Pick<
  Bill,
  | "household_id"
  | "budget_month_id"
  | "category_id"
  | "name"
  | "amount"
  | "due_date"
  | "created_by"
> &
  Partial<
    Pick<
      Bill,
      "id" | "status" | "is_recurring" | "paid_at" | "paid_by" | "created_at" | "updated_at"
    >
  >;

export interface Transaction {
  id: string;
  household_id: string;
  budget_month_id: string;
  category_id: string | null;
  bill_id: string | null;
  kind: TransactionKind;
  description: string;
  amount: number;
  transaction_date: string;
  paid_by: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}
export type TransactionInsert = Pick<
  Transaction,
  | "household_id"
  | "budget_month_id"
  | "description"
  | "amount"
  | "transaction_date"
  | "created_by"
> &
  Partial<
    Pick<
      Transaction,
      | "id"
      | "category_id"
      | "bill_id"
      | "kind"
      | "paid_by"
      | "created_at"
      | "updated_at"
    >
  >;

export interface CategoryBudget {
  id: string;
  household_id: string;
  budget_month_id: string;
  category_id: string;
  amount: number;
  created_at: string;
  updated_at: string;
}
export type CategoryBudgetInsert = Pick<
  CategoryBudget,
  "household_id" | "budget_month_id" | "category_id" | "amount"
> &
  Partial<Pick<CategoryBudget, "id" | "created_at" | "updated_at">>;

export interface SavingsGoal {
  id: string;
  household_id: string;
  name: string;
  target_amount: number;
  target_date: string | null;
  is_completed: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}
export type SavingsGoalInsert = Pick<
  SavingsGoal,
  "household_id" | "name" | "target_amount" | "created_by"
> &
  Partial<
    Pick<
      SavingsGoal,
      "id" | "target_date" | "is_completed" | "created_at" | "updated_at"
    >
  >;

export interface SavingsContribution {
  id: string;
  household_id: string;
  savings_goal_id: string;
  amount: number;
  contributed_on: string;
  contributed_by: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}
export type SavingsContributionInsert = Pick<
  SavingsContribution,
  "household_id" | "savings_goal_id" | "amount" | "contributed_on"
> &
  Partial<
    Pick<
      SavingsContribution,
      "id" | "contributed_by" | "note" | "created_at" | "updated_at"
    >
  >;

export interface Notification {
  id: string;
  household_id: string;
  user_id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  data: Json;
  read_at: string | null;
  created_at: string;
}
export type NotificationInsert = Pick<
  Notification,
  "household_id" | "user_id" | "kind" | "title"
> &
  Partial<Pick<Notification, "id" | "body" | "data" | "read_at" | "created_at">>;

export interface ActivityLog {
  id: number;
  household_id: string;
  actor_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  metadata: Json;
  created_at: string;
}
export type ActivityLogInsert = Pick<ActivityLog, "household_id" | "entity_type" | "action"> &
  Partial<
    Pick<ActivityLog, "id" | "actor_id" | "entity_id" | "metadata" | "created_at">
  >;

export interface UserPreference {
  user_id: string;
  default_household_id: string | null;
  locale: string;
  theme: "light" | "dark" | "system";
  email_notifications: boolean;
  push_notifications: boolean;
  created_at: string;
  updated_at: string;
}
export type UserPreferenceInsert = Pick<UserPreference, "user_id"> &
  Partial<Omit<UserPreference, "user_id">>;

export type Database = {
  public: {
    Tables: {
      profiles: TableDefinition<Profile, ProfileInsert>;
      households: TableDefinition<Household, HouseholdInsert>;
      household_members: TableDefinition<HouseholdMember, HouseholdMemberInsert>;
      household_invitations: TableDefinition<
        HouseholdInvitation,
        HouseholdInvitationInsert
      >;
      budget_months: TableDefinition<BudgetMonth, BudgetMonthInsert>;
      categories: TableDefinition<Category, CategoryInsert>;
      income: TableDefinition<Income, IncomeInsert>;
      bills: TableDefinition<Bill, BillInsert>;
      transactions: TableDefinition<Transaction, TransactionInsert>;
      category_budgets: TableDefinition<CategoryBudget, CategoryBudgetInsert>;
      savings_goals: TableDefinition<SavingsGoal, SavingsGoalInsert>;
      savings_contributions: TableDefinition<
        SavingsContribution,
        SavingsContributionInsert
      >;
      notifications: TableDefinition<Notification, NotificationInsert>;
      activity_logs: TableDefinition<ActivityLog, ActivityLogInsert>;
      user_preferences: TableDefinition<UserPreference, UserPreferenceInsert>;
    };
    Views: Record<never, never>;
    Functions: {
      accept_household_invitation: {
        Args: { p_token: string };
        Returns: string;
      };
      create_demo_data: { Args: Record<PropertyKey, never>; Returns: string };
      create_household_invitation: {
        Args: {
          p_household_id: string;
          p_email: string;
          p_expires_at?: string;
        };
        Returns: string;
      };
      is_household_member: {
        Args: { p_household_id: string };
        Returns: boolean;
      };
      is_household_owner: {
        Args: { p_household_id: string };
        Returns: boolean;
      };
      remove_demo_data: {
        Args: { p_household_id: string };
        Returns: undefined;
      };
      rollover_budget_month: {
        Args: {
          p_household_id: string;
          p_source_month: string;
          p_target_month: string;
        };
        Returns: string;
      };
      shares_household_with: {
        Args: { p_other_user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      household_role: HouseholdRole;
      member_status: MemberStatus;
      invitation_status: InvitationStatus;
      budget_month_status: BudgetMonthStatus;
      category_kind: CategoryKind;
      transaction_kind: TransactionKind;
      bill_status: BillStatus;
      notification_kind: NotificationKind;
    };
    CompositeTypes: Record<never, never>;
  };
};

export type Tables<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Row"];

export type TablesInsert<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Insert"];

export type TablesUpdate<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Update"];
