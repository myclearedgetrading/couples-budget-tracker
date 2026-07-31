import { BillsFeaturePage } from "@/components/feature-pages";
import { getFinancialData } from "@/lib/data/financial";
import type { MonthSearchParams } from "@/lib/month";

export default async function BillsPage({
  searchParams,
}: {
  searchParams: MonthSearchParams;
}) {
  const { month } = await searchParams;
  return <BillsFeaturePage data={await getFinancialData({ monthStart: month })} />;
}
