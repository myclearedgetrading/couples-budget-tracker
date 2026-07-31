import { SettingsFeaturePage } from "@/components/feature-pages";
import { getFinancialData } from "@/lib/data/financial";
export default async function SettingsPage() { return <SettingsFeaturePage data={await getFinancialData()} />; }
