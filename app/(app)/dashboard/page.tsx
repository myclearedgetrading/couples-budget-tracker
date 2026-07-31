import Link from "next/link";
import {
  ArrowDownRight, ArrowUpRight, CalendarDays, Check, ChevronDown, ChevronLeft,
  ChevronRight, CircleDollarSign, Clock3, MoreHorizontal, PiggyBank, Plus, ReceiptText,
  ShoppingBag, Sparkles, TriangleAlert, WalletCards,
} from "lucide-react";
import { BudgetBarChart, SpendingDonut } from "@/components/dashboard-charts";
import { activities, bills, dashboardTotals } from "@/lib/demo-data";
import { cn, formatCurrency } from "@/lib/utils";

const cards = [
  { label: "Total income", value: dashboardTotals.income, note: "4.2% from last month", icon: CircleDollarSign, up: true },
  { label: "Total bills", value: dashboardTotals.bills, note: "7 of 9 bills paid", icon: ReceiptText },
  { label: "Variable spending", value: dashboardTotals.spending, note: "8.4% under budget", icon: ShoppingBag, up: true },
  { label: "Money left", value: dashboardTotals.moneyLeft, note: "37.5% of your income", icon: WalletCards, featured: true },
];

export default function DashboardPage() {
  const paid = bills.filter((bill) => bill.status === "Paid").length;
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Monthly overview</h1><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Demo data</span></div><p className="mt-1 text-sm text-slate-500">Here&apos;s how your household is doing this month.</p></div>
        <div className="flex items-center gap-2"><button className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white"><ChevronLeft className="size-4" /></button><button className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold sm:flex-none"><CalendarDays className="size-4 text-emerald-600" />August 2026<ChevronDown className="size-4 text-slate-400" /></button><button className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white"><ChevronRight className="size-4" /></button></div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({label,value,note,icon:Icon,up,featured})=><div key={label} className={cn("surface rounded-2xl p-5", featured && "border-navy bg-navy text-white shadow-xl shadow-slate-900/15")}><div className="flex items-start justify-between"><span className={cn("grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600", featured && "bg-white/10 text-emerald-400")}><Icon className="size-5"/></span><MoreHorizontal className={cn("size-5 text-slate-300",featured&&"text-slate-600")}/></div><p className={cn("mt-5 text-xs font-semibold text-slate-500",featured&&"text-slate-400")}>{label}</p><p className="mt-1 text-3xl font-bold tracking-tight">{formatCurrency(value)}</p><p className={cn("mt-2 flex items-center gap-1 text-xs text-slate-500",featured&&"text-emerald-400",up&&"text-emerald-600")}>{up&&<ArrowDownRight className="size-3"/>}{featured&&<ArrowUpRight className="size-3"/>}{note}</p></div>)}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
        <section className="surface rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><h2 className="font-bold">Bill payment progress</h2><p className="mt-1 text-xs text-slate-500">You&apos;re almost there. Keep it going.</p></div><Link href="/bills" className="text-xs font-bold text-emerald-700">View bills</Link></div>
          <div className="mt-6 grid items-center gap-6 sm:grid-cols-[140px_1fr]">
            <div className="relative mx-auto grid size-32 place-items-center rounded-full" style={{background:`conic-gradient(#00c878 ${paid/bills.length*100}%, #ecf0ee 0)`}}><div className="grid size-24 place-items-center rounded-full bg-white text-center"><div><p className="text-2xl font-bold">{Math.round(paid/bills.length*100)}%</p><p className="text-[10px] text-slate-500">complete</p></div></div></div>
            <div><div className="grid grid-cols-3 gap-3">{[["Total bills",bills.length,"text-slate-900"],["Paid",paid,"text-emerald-600"],["Remaining",bills.length-paid,"text-amber-600"]].map(([label,value,color])=><div key={String(label)} className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-medium text-slate-500">{label}</p><p className={cn("mt-1 text-xl font-bold",color)}>{value}</p></div>)}</div><div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-800"><Sparkles className="mr-2 inline size-4"/>Pay 2 more bills to stay ahead of schedule.</div></div>
          </div>
        </section>

        <section className="surface overflow-hidden rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><h2 className="font-bold">Savings snapshot</h2><p className="mt-1 text-xs text-slate-500">August contribution goal</p></div><span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-600"><PiggyBank className="size-5"/></span></div>
          <div className="mt-7 flex items-end justify-between"><div><span className="text-3xl font-bold">{formatCurrency(600)}</span><span className="text-sm text-slate-400"> / $1,000</span></div><b className="text-sm text-emerald-600">60%</b></div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-3/5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300"/></div>
          <div className="mt-7 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-500">Available to save</p><p className="mt-1 font-bold">$3,198</p></div><div className="rounded-xl bg-amber-50 p-3"><p className="text-[10px] text-amber-700">Still to goal</p><p className="mt-1 font-bold text-amber-800">$400</p></div></div>
          <Link href="/savings" className="mt-5 block w-full rounded-xl border border-slate-200 py-2.5 text-center text-xs font-bold">View savings goals</Link>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="surface rounded-2xl p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-bold">Upcoming bills</h2><p className="mt-1 text-xs text-slate-500">Next payments due this month</p></div><button className="grid size-9 place-items-center rounded-lg bg-navy text-white"><Plus className="size-4"/></button></div><div className="mt-4 divide-y divide-slate-100">{bills.filter(b=>b.status!=="Paid"&&b.status!=="Late").slice(0,5).map(bill=><div key={bill.id} className="flex items-center gap-3 py-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-bold">{bill.name[0]}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{bill.name}</p><p className="text-xs text-slate-500">{bill.due} · {bill.assigned}</p></div><div className="text-right"><p className="text-sm font-bold">{formatCurrency(bill.actual)}</p><StatusBadge status={bill.status}/></div></div>)}</div></section>
        <section className="surface rounded-2xl border-red-100 p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="flex items-center gap-2 font-bold"><TriangleAlert className="size-5 text-red-500"/>Needs attention</h2><p className="mt-1 text-xs text-slate-500">Overdue and unreviewed items</p></div></div><div className="mt-5 rounded-2xl border border-red-100 bg-red-50/60 p-4"><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-100 text-red-600"><ReceiptText className="size-5"/></span><div className="flex-1"><div className="flex items-start justify-between"><div><p className="text-sm font-bold">Credit card payment</p><p className="mt-1 text-xs text-red-600">Was due July 28 · Assigned to Abel</p></div><b>$350</b></div><button className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white">Mark as paid</button></div></div></div><div className="mt-3 flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800"><Clock3 className="size-4"/>Dining out has reached 85% of its budget.</div></section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="surface rounded-2xl p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-bold">Spending by category</h2><p className="mt-1 text-xs text-slate-500">$4,460 tracked this month</p></div></div><SpendingDonut/></section>
        <section className="surface rounded-2xl p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-bold">Budgeted vs. actual</h2><p className="mt-1 text-xs text-slate-500">You are $271 under budget overall</p></div><div className="flex gap-3 text-[10px]"><span><i className="mr-1 inline-block size-2 rounded-full bg-slate-300"/>Budgeted</span><span><i className="mr-1 inline-block size-2 rounded-full bg-emerald-500"/>Actual</span></div></div><BudgetBarChart/></section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <section className="surface rounded-2xl p-5 sm:p-6"><h2 className="font-bold">Partner responsibility</h2><p className="mt-1 text-xs text-slate-500">How this month&apos;s bills are shared</p><div className="mt-6 grid gap-4 sm:grid-cols-3">{[["Abel","$1,245","$478","bg-navy"],["Maya","$1,116","$520","bg-violet-500"],["Joint","$1,279","$336","bg-emerald-500"]].map(([name,total,remaining,color])=><div key={name} className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center gap-2"><span className={cn("grid size-8 place-items-center rounded-full text-xs font-bold text-white",color)}>{name[0]}</span><b className="text-sm">{name}</b></div><p className="mt-5 text-xs text-slate-500">Total responsibility</p><p className="mt-1 text-xl font-bold">{total}</p><p className="mt-2 text-xs"><span className="font-bold text-amber-600">{remaining}</span> still due</p></div>)}</div></section>
        <section className="surface rounded-2xl p-5 sm:p-6"><div className="flex items-center justify-between"><h2 className="font-bold">Recent activity</h2><button className="text-xs font-bold text-emerald-700">View all</button></div><div className="mt-5 space-y-5">{activities.map((item,i)=><div key={i} className="flex gap-3"><span className={cn("mt-1 size-2.5 shrink-0 rounded-full ring-4 ring-slate-100",item.color)}/><div><p className="text-xs leading-5"><b>{item.person}</b> {item.action}</p><p className="text-[10px] text-slate-400">{item.time}</p></div></div>)}</div></section>
      </div>
    </div>
  );
}

function StatusBadge({status}:{status:string}) {
  return <span className={cn("mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold",status==="Scheduled"?"bg-amber-100 text-amber-700":"bg-blue-100 text-blue-700")}><Check className="mr-1 size-2.5"/>{status}</span>;
}
