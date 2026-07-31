"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3, Bell, CalendarDays, ChevronDown, CircleDollarSign, Goal, Heart,
  LayoutDashboard, LogOut, Menu, Plus, ReceiptText, Settings, ShoppingBag, WalletCards,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/budget", label: "Monthly Budget", icon: WalletCards },
  { href: "/bills", label: "Bills", icon: ReceiptText },
  { href: "/income", label: "Income", icon: CircleDollarSign },
  { href: "/spending", label: "Spending", icon: ShoppingBag },
  { href: "/savings", label: "Savings Goals", icon: Goal },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Household Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  async function logout() {
    await createClient()?.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f5f7f6]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-navy text-white lg:flex">
        <Link href="/" className="flex h-20 items-center gap-2.5 border-b border-white/10 px-6 font-bold"><span className="grid size-9 place-items-center rounded-xl bg-brand text-white"><Heart className="size-5 fill-current" /></span>Couples Budget</Link>
        <div className="mx-4 mt-5 rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Household</p>
          <button className="mt-2 flex w-full items-center justify-between text-left text-sm font-semibold"><span>Abel & Maya</span><ChevronDown className="size-4 text-slate-500" /></button>
        </div>
        <nav className="no-scrollbar mt-5 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return <Link key={href} href={href} className={cn("flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white", active && "bg-emerald-500/15 text-emerald-400")}><Icon className="size-5" />{label}</Link>;
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-emerald-500 font-bold">A</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">Abel Tesfaye</p><p className="truncate text-xs text-slate-500">abel@example.com</p></div><button onClick={logout} aria-label="Log out" className="text-slate-500 hover:text-white"><LogOut className="size-4" /></button></div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-17 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
          <div className="flex items-center gap-3 lg:hidden"><button aria-label="Open menu"><Menu className="size-5" /></button><Heart className="size-6 fill-emerald-500 text-emerald-500" /></div>
          <div className="hidden lg:block"><p className="text-xs font-medium text-slate-500">Good morning, Abel</p><p className="text-sm font-bold">Let&apos;s make this month count.</p></div>
          <div className="flex items-center gap-2"><Link href="/dashboard?demo=true" className="hidden rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 sm:block">Demo household</Link><button className="relative grid size-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600"><Bell className="size-4" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-red-500" /></button><div className="flex -space-x-2 pl-1"><span className="grid size-9 place-items-center rounded-full bg-navy text-xs font-bold text-white ring-2 ring-white">A</span><span className="grid size-9 place-items-center rounded-full bg-violet-500 text-xs font-bold text-white ring-2 ring-white">M</span></div></div>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 pb-28 pt-6 sm:px-7 lg:px-9 lg:pb-12">{children}</main>
      </div>

      <Link href="/spending?add=true" aria-label="Add item" className="fixed bottom-20 right-5 z-40 grid size-14 place-items-center rounded-full bg-brand text-white shadow-xl shadow-emerald-500/30 lg:hidden"><Plus /></Link>
      <nav className="fixed inset-x-0 bottom-0 z-50 grid h-17 grid-cols-5 border-t border-slate-200 bg-white px-2 lg:hidden">
        {nav.slice(0, 5).map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return <Link key={href} href={href} className={cn("flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-slate-400", active && "text-emerald-600")}><Icon className="size-5" />{label === "Monthly Budget" ? "Budget" : label}</Link>;
        })}
      </nav>
    </div>
  );
}
