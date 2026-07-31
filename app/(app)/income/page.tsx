import { IncomeFeaturePage } from "@/components/feature-pages";
import { getFinancialData } from "@/lib/data/financial";
export default async function IncomePage() { return <IncomeFeaturePage data={await getFinancialData()} />; }
