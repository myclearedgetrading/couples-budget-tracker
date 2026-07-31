import { BudgetTable } from "@/components/budget-table";
import { getFinancialData } from "@/lib/data/financial";
import { formatMonthLabel } from "@/lib/utils";
import type { MonthSearchParams } from "@/lib/month";

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: MonthSearchParams;
}) {
  const { month } = await searchParams;
  const data = await getFinancialData({ monthStart: month });
  const label = data.month
    ? formatMonthLabel(data.month.monthStart)
    : "the current month";
  return (
    <BudgetTable
      bills={data.bills}
      categories={data.categories}
      monthLabel={label}
      monthStart={data.month?.monthStart ?? null}
      availableMonths={data.availableMonths}
      isCurrentMonth={data.isCurrentMonth}
    />
  );
}
