import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { auth } from "@/lib/auth/server";
import { getHouseholdName } from "@/lib/data/financial";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  let householdName: string | null = null;
  try {
    householdName = await getHouseholdName();
  } catch {
    householdName = null;
  }

  return (
    <AppShell user={session.user} householdName={householdName}>
      {children}
    </AppShell>
  );
}
