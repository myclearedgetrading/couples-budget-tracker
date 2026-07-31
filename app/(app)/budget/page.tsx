import { BudgetTable } from "@/components/budget-table";
import { getFinancialData } from "@/lib/data/financial";

export default async function BudgetPage() {
  const data = await getFinancialData();
  const label = data.month ? new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${data.month.monthStart.slice(0,10)}T00:00:00Z`)) : "the current month";
  return <BudgetTable bills={data.bills} categories={data.categories} monthLabel={label} />;
}
