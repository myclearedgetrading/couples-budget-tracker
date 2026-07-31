import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleDollarSign, PiggyBank, ReceiptText, ShoppingBag, WalletCards } from "lucide-react";
import { BudgetBarChart, SpendingDonut } from "@/components/dashboard-charts";
import { getFinancialData } from "@/lib/data/financial";
import { cn, formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const data = await getFinancialData();
  if (!data.household) redirect("/onboarding");
  const income=data.income.reduce((s,i)=>s+i.amount,0);
  const bills=data.bills.reduce((s,b)=>s+b.amount,0);
  const spending=data.transactions.reduce((s,t)=>s+(t.kind==="expense"?t.amount:t.kind==="refund"?-t.amount:0),0);
  const saved=data.contributions.filter(c=>data.month&&c.date.startsWith(data.month.monthStart.slice(0,7))).reduce((s,c)=>s+c.amount,0);
  const paid=data.bills.filter(b=>b.status==="paid").length;
  const moneyLeft=income-bills-spending-saved;
  const cards=[
    ["Total income",income,CircleDollarSign,""],
    ["Total bills",bills,ReceiptText,""],
    ["Variable spending",spending,ShoppingBag,""],
    ["Money left",moneyLeft,WalletCards,moneyLeft>=0?"featured":"negative"],
  ] as const;
  const monthLabel=data.month?new Intl.DateTimeFormat("en-US",{month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(`${data.month.monthStart.slice(0,10)}T00:00:00Z`)):"Current month";
  return <div>
    <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Monthly overview</h1><p className="mt-1 text-sm text-slate-500">{data.household.name} · {monthLabel}</p></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label,value,Icon,state])=><div key={label} className={cn("surface rounded-2xl p-5",state==="featured"&&"border-navy bg-navy text-white",state==="negative"&&"border-red-200 dark:border-red-900")}><span className={cn("grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",state==="featured"&&"bg-white/10 text-emerald-400")}><Icon className="size-5"/></span><p className={cn("mt-5 text-xs font-semibold text-slate-500",state==="featured"&&"text-slate-400")}>{label}</p><p className={cn("mt-1 text-3xl font-bold",state==="negative"&&"text-red-600")}>{formatCurrency(value)}</p></div>)}</div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_.65fr]"><section className="surface rounded-2xl p-5 sm:p-6"><div className="flex justify-between"><div><h2 className="font-bold">Bill payment progress</h2><p className="mt-1 text-xs text-slate-500">{paid} of {data.bills.length} bills paid</p></div><Link href="/bills" className="text-xs font-bold text-emerald-700 dark:text-emerald-400">View bills</Link></div>{!data.bills.length?<Empty title="No bills yet" body="Add a bill to see monthly payment progress."/>:<div className="mt-7"><div className="flex items-end justify-between"><b className="text-3xl">{Math.round(paid/data.bills.length*100)}%</b><span className="text-sm text-slate-500">{formatCurrency(data.bills.filter(b=>b.status==="planned").reduce((s,b)=>s+b.amount,0))} remaining</span></div><div className="mt-3 h-3 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-brand" style={{width:`${paid/data.bills.length*100}%`}}/></div></div>}</section>
    <section className="surface rounded-2xl p-5 sm:p-6"><div className="flex justify-between"><div><h2 className="font-bold">Savings snapshot</h2><p className="mt-1 text-xs text-slate-500">All active goals</p></div><PiggyBank className="text-amber-600"/></div><p className="mt-7 text-3xl font-bold">{formatCurrency(data.goals.reduce((s,g)=>s+g.saved,0))}</p><p className="mt-2 text-xs text-slate-500">of {formatCurrency(data.goals.reduce((s,g)=>s+g.targetAmount,0))} in targets</p><Link href="/savings" className="mt-5 block rounded-xl border border-slate-200 py-2.5 text-center text-xs font-bold dark:border-slate-700">View savings goals</Link></section></div>
    <div className="mt-4 grid gap-4 xl:grid-cols-2"><section className="surface rounded-2xl p-5 sm:p-6"><h2 className="font-bold">Upcoming bills</h2>{!data.bills.some(b=>b.status==="planned")?<p className="mt-6 text-sm text-slate-500">No upcoming bills.</p>:<div className="mt-3 divide-y">{data.bills.filter(b=>b.status==="planned").slice(0,5).map(b=><div key={b.id} className="flex justify-between py-3 text-sm"><div><b>{b.name}</b><p className="text-xs text-slate-500">{b.category} · {b.dueDate}</p></div><b>{formatCurrency(b.amount)}</b></div>)}</div>}</section><section className="surface rounded-2xl p-5 sm:p-6"><h2 className="font-bold">Recent activity</h2>{!data.activity.length?<p className="mt-6 text-sm text-slate-500">No financial activity yet.</p>:<div className="mt-4 space-y-4">{data.activity.map(a=><div key={a.id} className="flex gap-3 text-xs"><span className="mt-1 size-2 rounded-full bg-emerald-500"/><p><b>{a.actor??"A household member"}</b> {a.action} a {a.entityType.replaceAll("_"," ")}<span className="block text-[10px] text-slate-400">{new Date(a.createdAt).toLocaleString()}</span></p></div>)}</div>}</section></div>
    <div className="mt-4 grid gap-4 xl:grid-cols-2"><section className="surface rounded-2xl p-5 sm:p-6"><h2 className="font-bold">Spending by category</h2><div className="mt-4"><SpendingDonut data={data.budgets}/></div></section><section className="surface rounded-2xl p-5 sm:p-6"><h2 className="font-bold">Budgeted vs. actual</h2><div className="mt-4"><BudgetBarChart data={data.budgets}/></div></section></div>
  </div>;
}

function Empty({title,body}:{title:string;body:string}) { return <div className="grid min-h-44 place-items-center p-8 text-center"><div><p className="font-bold">{title}</p><p className="mt-1 text-sm text-slate-500">{body}</p></div></div>; }
