import { SpendingFeaturePage } from "@/components/feature-pages";
import { getFinancialData } from "@/lib/data/financial";
import type { MonthSearchParams } from "@/lib/month";

export default async function SpendingPage({
  searchParams,
}: {
  searchParams: MonthSearchParams;
}) {
  const { month } = await searchParams;
  return (
    <SpendingFeaturePage data={await getFinancialData({ monthStart: month })} />
  );
}
