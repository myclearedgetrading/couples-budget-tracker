import { BillsFeaturePage } from "@/components/feature-pages";
import { getFinancialData } from "@/lib/data/financial";
export default async function BillsPage() { return <BillsFeaturePage data={await getFinancialData()} />; }
