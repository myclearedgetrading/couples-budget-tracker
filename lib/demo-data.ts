export type BillStatus = "Paid" | "Scheduled" | "Not paid" | "Late" | "Autopay";

export type Bill = {
  id: string;
  name: string;
  category: string;
  due: string;
  budgeted: number;
  actual: number;
  assigned: "Abel" | "Maya" | "Joint";
  status: BillStatus;
  paidDate?: string;
};

export const bills: Bill[] = [
  { id: "1", name: "Rent", category: "Housing", due: "Aug 1", budgeted: 1950, actual: 1950, assigned: "Joint", status: "Paid", paidDate: "Jul 30" },
  { id: "2", name: "Electricity", category: "Utilities", due: "Aug 4", budgeted: 180, actual: 168, assigned: "Abel", status: "Paid", paidDate: "Aug 2" },
  { id: "3", name: "Water", category: "Utilities", due: "Aug 8", budgeted: 75, actual: 71, assigned: "Maya", status: "Autopay" },
  { id: "4", name: "Internet", category: "Utilities", due: "Aug 10", budgeted: 90, actual: 90, assigned: "Abel", status: "Scheduled" },
  { id: "5", name: "Cell phones", category: "Utilities", due: "Aug 12", budgeted: 160, actual: 160, assigned: "Joint", status: "Scheduled" },
  { id: "6", name: "Car payment", category: "Transportation", due: "Aug 14", budgeted: 520, actual: 520, assigned: "Maya", status: "Not paid" },
  { id: "7", name: "Car insurance", category: "Insurance", due: "Aug 18", budgeted: 240, actual: 240, assigned: "Abel", status: "Autopay" },
  { id: "8", name: "Streaming", category: "Subscriptions", due: "Aug 21", budgeted: 85, actual: 91, assigned: "Joint", status: "Not paid" },
  { id: "9", name: "Credit card", category: "Debt", due: "Jul 28", budgeted: 350, actual: 350, assigned: "Abel", status: "Late" },
];

export const transactions = [
  { id: "1", name: "Whole Foods", date: "Aug 3", category: "Groceries", amount: 142, paidBy: "Maya", method: "Visa •• 2841" },
  { id: "2", name: "Shell", date: "Aug 3", category: "Gas", amount: 64, paidBy: "Abel", method: "Debit •• 1078" },
  { id: "3", name: "Friday dinner", date: "Aug 2", category: "Dining out", amount: 88, paidBy: "Abel", method: "Visa •• 2841" },
  { id: "4", name: "School supplies", date: "Aug 1", category: "Kids", amount: 96, paidBy: "Maya", method: "Mastercard •• 5562" },
  { id: "5", name: "Target", date: "Jul 31", category: "Household", amount: 118, paidBy: "Maya", method: "Debit •• 1078" },
  { id: "6", name: "Movie night", date: "Jul 30", category: "Entertainment", amount: 52, paidBy: "Abel", method: "Visa •• 2841" },
];

export const categorySpending = [
  { category: "Housing", value: 1950, color: "#111827" },
  { category: "Utilities", value: 580, color: "#00C878" },
  { category: "Transport", value: 824, color: "#3B82F6" },
  { category: "Groceries", value: 620, color: "#D4AF37" },
  { category: "Other", value: 486, color: "#A78BFA" },
];

export const budgetComparison = [
  { category: "Housing", budgeted: 1950, actual: 1950 },
  { category: "Utilities", budgeted: 505, actual: 490 },
  { category: "Transport", budgeted: 900, actual: 824 },
  { category: "Groceries", budgeted: 800, actual: 620 },
  { category: "Other", budgeted: 650, actual: 486 },
];

export const income = [
  { id: "1", source: "Abel's paycheck", partner: "Abel", expected: 4200, actual: 4200, date: "Aug 1", frequency: "Twice monthly" },
  { id: "2", source: "Maya's paycheck", partner: "Maya", expected: 3800, actual: 3800, date: "Aug 1", frequency: "Biweekly" },
  { id: "3", source: "Design side work", partner: "Maya", expected: 450, actual: 520, date: "Aug 5", frequency: "Irregular" },
];

export const categoryBudgets = [
  { name: "Groceries", spent: 620, budget: 800, icon: "ShoppingBasket" },
  { name: "Dining out", spent: 340, budget: 400, icon: "Utensils" },
  { name: "Gas", spent: 220, budget: 300, icon: "Fuel" },
  { name: "Entertainment", spent: 185, budget: 200, icon: "Ticket" },
  { name: "Household", spent: 212, budget: 350, icon: "Home" },
];

export const savingsGoals = [
  { id: "1", name: "Emergency fund", target: 15000, saved: 9800, monthly: 600, targetDate: "Dec 2026", priority: "High", emoji: "Shield" },
  { id: "2", name: "Anniversary trip", target: 4500, saved: 2700, monthly: 350, targetDate: "Jun 2027", priority: "Medium", emoji: "Plane" },
  { id: "3", name: "New family car", target: 12000, saved: 3150, monthly: 450, targetDate: "Mar 2028", priority: "Medium", emoji: "Car" },
];

export const activities = [
  { person: "Abel", action: "marked Electricity as paid", time: "18 minutes ago", color: "bg-emerald-500" },
  { person: "Maya", action: "added a grocery transaction", time: "2 hours ago", color: "bg-violet-500" },
  { person: "System", action: "Car insurance is due in 3 days", time: "Yesterday", color: "bg-amber-500" },
  { person: "Maya", action: "added $350 to Anniversary trip", time: "Yesterday", color: "bg-blue-500" },
];

export const dashboardTotals = {
  income: 8520,
  bills: 3640,
  spending: 1682,
  moneyLeft: 3198,
  saved: 600,
  savingsGoal: 1000,
};
