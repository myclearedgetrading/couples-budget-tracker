import { CalendarFeaturePage } from "@/components/feature-pages";
import { getFinancialData } from "@/lib/data/financial";
import type { MonthSearchParams } from "@/lib/month";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: MonthSearchParams;
}) {
  const { month } = await searchParams;
  return (
    <CalendarFeaturePage data={await getFinancialData({ monthStart: month })} />
  );
}
