import { CalendarFeaturePage } from "@/components/feature-pages";
import { getFinancialData } from "@/lib/data/financial";
export default async function CalendarPage() { return <CalendarFeaturePage data={await getFinancialData()} />; }
