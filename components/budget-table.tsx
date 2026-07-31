"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBillAction, deleteFinancialRecordAction, markBillPaidAction } from "@/app/actions/financial";
import type { BillView, CategoryOption } from "@/lib/data/financial";
import { cn, formatCurrency } from "@/lib/utils";

const statusStyle: Record<BillView["status"], string> = {
  paid: "bg-emerald-100 text-emerald-700",
  planned: "bg-amber-100 text-amber-700",
  skipped: "bg-slate-100 text-slate-600",
};

export function BudgetTable({ bills, categories, monthLabel }: { bills: BillView[]; categories: CategoryOption[]; monthLabel: string }) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const filtered = useMemo(() => bills.filter((b) => `${b.name} ${b.category} ${b.assigned ?? ""}`.toLowerCase().includes(search.toLowerCase())), [bills, search]);
  const total = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const remaining = bills.filter((bill) => bill.status === "planned").reduce((sum, bill) => sum + bill.amount, 0);

  function run(action: () => Promise<{ ok: boolean; message: string }>, close = false) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      if (result.ok) {
        if (close) setShowForm(false);
        router.refresh();
      }
    });
  }
  function addBill(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run(() => createBillAction(new FormData(event.currentTarget)), true);
  }

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Monthly budget</h1><p className="mt-1 text-sm text-slate-500">Plan and track household expenses for {monthLabel}.</p></div><button onClick={()=>setShowForm(true)} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-navy px-4 text-xs font-bold text-white"><Plus className="size-4"/>Add bill</button></div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">{[["Total bills",total,""],["Paid",total-remaining,"text-emerald-600"],["Remaining to pay",remaining,"text-amber-600"]].map(([label,value,color])=><div key={String(label)} className="surface rounded-2xl p-4"><p className="text-xs font-medium text-slate-500">{label}</p><p className={cn("mt-1 text-2xl font-bold",color)}>{formatCurrency(Number(value))}</p></div>)}</div>

      <section className="surface mt-4 overflow-hidden rounded-2xl">
        <div className="border-b border-slate-100 p-4"><div className="relative max-w-md"><Search className="absolute left-3 top-2.5 size-4 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search bills or categories..." className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-emerald-400"/></div></div>
        {!filtered.length ? <Empty text={bills.length ? "No bills match your search." : "No bills yet. Add the first bill for this month."}/> : <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500"><tr>{["Bill / expense","Category","Due date","Amount","Status",""].map(h=><th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(bill=><tr key={bill.id}><td className="px-4 py-3.5 font-semibold">{bill.name}</td><td className="px-4 py-3.5 text-slate-500">{bill.category}</td><td className="px-4 py-3.5">{formatDate(bill.dueDate)}</td><td className="px-4 py-3.5 font-semibold">{formatCurrency(bill.amount)}</td><td className="px-4 py-3.5"><button disabled={pending || bill.status !== "planned"} onClick={()=>run(()=>markBillPaidAction(bill.id))} className={cn("rounded-full px-2.5 py-1 font-bold capitalize",statusStyle[bill.status])}>{bill.status}</button></td><td className="px-4 py-3.5"><button aria-label={`Delete ${bill.name}`} onClick={()=>confirm("Delete this bill permanently?")&&run(()=>deleteFinancialRecordAction("bill",bill.id))}><Trash2 className="size-4 text-slate-400 hover:text-red-500"/></button></td></tr>)}</tbody></table></div>}
        {!!filtered.length && <div className="divide-y divide-slate-100 md:hidden">{filtered.map(bill=><div key={bill.id} className="p-4"><div className="flex justify-between"><div><p className="font-bold">{bill.name}</p><p className="mt-1 text-xs text-slate-500">{bill.category} · Due {formatDate(bill.dueDate)}</p></div><b>{formatCurrency(bill.amount)}</b></div><div className="mt-3 flex items-center justify-between"><button disabled={pending || bill.status !== "planned"} onClick={()=>run(()=>markBillPaidAction(bill.id))} className={cn("rounded-full px-3 py-1 text-[10px] font-bold capitalize",statusStyle[bill.status])}>{bill.status}</button><button aria-label={`Delete ${bill.name}`} onClick={()=>confirm("Delete this bill permanently?")&&run(()=>deleteFinancialRecordAction("bill",bill.id))}><Trash2 className="size-4 text-slate-400"/></button></div></div>)}</div>}
      </section>

      {showForm && <div className="fixed inset-0 z-[70] grid place-items-end bg-slate-950/40 backdrop-blur-sm sm:place-items-center sm:p-5" onMouseDown={()=>setShowForm(false)}><form onSubmit={addBill} onMouseDown={e=>e.stopPropagation()} className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"><div className="flex justify-between"><div><h2 className="text-xl font-bold">Add a monthly bill</h2><p className="mt-1 text-sm text-slate-500">It will be added to the current month.</p></div><button type="button" onClick={()=>setShowForm(false)}>×</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Bill name" name="name" placeholder="Electricity" /><Field label="Amount" name="amount" type="number" placeholder="180" />{categories.some(c=>c.kind==="expense")?<label className="text-xs font-bold">Category<select required name="categoryId" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal">{categories.filter(c=>c.kind==="expense").map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>:<Field label="Category" name="categoryName" placeholder="Bills"/>}<Field label="Due date" name="dueDate" type="date" placeholder="" /><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" name="recurring"/>Recurring bill</label></div><button disabled={pending} className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand font-bold text-white disabled:opacity-60"><Check className="size-4"/>{pending?"Saving…":"Add bill"}</button></form></div>}
    </>
  );
}

function Field({label,name,type="text",placeholder}:{label:string;name:string;type?:string;placeholder:string}) {
  return <label className="text-xs font-bold">{label}<input required name={name} type={type} min={type==="number"?"0.01":undefined} step={type==="number"?"0.01":undefined} placeholder={placeholder} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-emerald-400"/></label>;
}

function Empty({ text }: { text: string }) { return <div className="p-12 text-center text-sm text-slate-500">{text}</div>; }
function formatDate(date: string) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${date.slice(0,10)}T00:00:00Z`)); }
