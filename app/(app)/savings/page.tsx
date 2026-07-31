import { SavingsFeaturePage } from "@/components/feature-pages";
import { getFinancialData } from "@/lib/data/financial";
export default async function SavingsPage() { return <SavingsFeaturePage data={await getFinancialData()} />; }
