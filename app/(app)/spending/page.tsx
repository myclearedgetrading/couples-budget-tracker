import { SpendingFeaturePage } from "@/components/feature-pages";
import { getFinancialData } from "@/lib/data/financial";
export default async function SpendingPage() { return <SpendingFeaturePage data={await getFinancialData()} />; }
