import { ReportsFeaturePage } from "@/components/feature-pages";
import { getFinancialData } from "@/lib/data/financial";
export default async function ReportsPage() { return <ReportsFeaturePage data={await getFinancialData()} />; }
