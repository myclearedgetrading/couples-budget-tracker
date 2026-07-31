import { IncomeFeaturePage } from "@/components/feature-pages";
import { getFinancialData } from "@/lib/data/financial";
import type { MonthSearchParams } from "@/lib/month";

export default async function IncomePage({
  searchParams,
}: {
  searchParams: MonthSearchParams;
}) {
  const { month } = await searchParams;
  return <IncomeFeaturePage data={await getFinancialData({ monthStart: month })} />;
}
