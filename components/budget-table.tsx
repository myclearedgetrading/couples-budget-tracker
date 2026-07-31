"use client";

import { useMemo, useState } from "react";
import { Check, Copy, MoreHorizontal, Plus, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { bills as initialBills, type Bill, type BillStatus } from "@/lib/demo-data";
import { cn, formatCurrency } from "@/lib/utils";

const statusStyle: Record<BillStatus, string> = {
  Paid: "bg-emerald-100 text-emerald-700", Scheduled: "bg-amber-100 text-amber-700",
  "Not paid": "bg-slate-100 text-slate-600", Late: "bg-red-100 text-red-700", Autopay: "bg-blue-100 text-blue-700",
};

export function BudgetTable() {
  const [items, setItems] = useState(initialBills);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const filtered = useMemo(() => items.filter((b) => `${b.name} ${b.category} ${b.assigned}`.toLowerCase().includes(search.toLowerCase())), [items, search]);
  const totals = items.reduce((a,b)=>({budgeted:a.budgeted+b.budgeted,actual:a.actual+b.actual}),{budgeted:0,actual:0});

  function markPaid(id: string) {
    setItems(items.map(item => item.id === id ? {...item,status:"Paid",paidDate:"Today"} : item));
    toast.success("Bill marked as paid", { description: "Your partner will see this update." });
  }
  function addBill(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const amount = Number(data.get("amount"));
    setItems([...items,{id:crypto.randomUUID(),name:String(data.get("name")),category:String(data.get("category")),due:String(data.get("due")),budgeted:amount,actual:amount,assigned:String(data.get("assigned")) as Bill["assigned"],status:"Not paid"}]);
    setShowForm(false);
    toast.success("Bill added to August");
  }

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Monthly budget</h1><p className="mt-1 text-sm text-slate-500">Plan, track, and close out every household expense.</p></div><div className="flex gap-2"><button onClick={()=>toast.success("Recurring bills are ready to copy")} className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold"><Copy className="size-4"/>Copy to next month</button><button onClick={()=>setShowForm(true)} className="flex h-10 items-center gap-2 rounded-xl bg-navy px-4 text-xs font-bold text-white"><Plus className="size-4"/>Add bill</button></div></div>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">{[["Total budgeted",totals.budgeted,""],["Total actual",totals.actual,""],["Remaining to pay",items.filter(i=>i.status!=="Paid").reduce((s,i)=>s+i.actual,0),"text-amber-600"],["Overall variance",totals.budgeted-totals.actual,totals.budgeted-totals.actual>=0?"text-emerald-600":"text-red-600"]].map(([label,value,color])=><div key={String(label)} className="surface rounded-2xl p-4"><p className="text-xs font-medium text-slate-500">{label}</p><p className={cn("mt-1 text-2xl font-bold",color)}>{formatCurrency(Number(value))}</p></div>)}</div>

      <section className="surface mt-4 overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative max-w-md flex-1"><Search className="absolute left-3 top-2.5 size-4 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search bills, categories, or partner..." className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-emerald-400"/></div><button className="flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold"><SlidersHorizontal className="size-4"/>Filter & sort</button></div>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[980px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500"><tr>{["Bill / expense","Category","Due date","Budgeted","Actual","Assigned","Status","Difference",""].map(h=><th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(bill=><tr key={bill.id} className="hover:bg-slate-50/60"><td className="px-4 py-3.5 font-semibold">{bill.name}</td><td className="px-4 py-3.5 text-slate-500">{bill.category}</td><td className="px-4 py-3.5">{bill.due}</td><td className="px-4 py-3.5">{formatCurrency(bill.budgeted)}</td><td className="px-4 py-3.5 font-semibold">{formatCurrency(bill.actual)}</td><td className="px-4 py-3.5">{bill.assigned}</td><td className="px-4 py-3.5"><button onClick={()=>bill.status!=="Paid"&&markPaid(bill.id)} className={cn("rounded-full px-2.5 py-1 font-bold",statusStyle[bill.status])}>{bill.status}</button></td><td className={cn("px-4 py-3.5 font-bold",bill.budgeted-bill.actual>=0?"text-emerald-600":"text-red-600")}>{formatCurrency(bill.budgeted-bill.actual)}</td><td className="px-4 py-3.5"><MoreHorizontal className="size-4 text-slate-400"/></td></tr>)}</tbody></table></div>
        <div className="divide-y divide-slate-100 md:hidden">{filtered.map(bill=><div key={bill.id} className="p-4"><div className="flex justify-between"><div><p className="font-bold">{bill.name}</p><p className="mt-1 text-xs text-slate-500">{bill.category} · Due {bill.due}</p></div><b>{formatCurrency(bill.actual)}</b></div><div className="mt-3 flex items-center justify-between"><span className="text-xs text-slate-500">{bill.assigned}</span><button onClick={()=>bill.status!=="Paid"&&markPaid(bill.id)} className={cn("rounded-full px-3 py-1 text-[10px] font-bold",statusStyle[bill.status])}>{bill.status}</button></div></div>)}</div>
      </section>

      {showForm && <div className="fixed inset-0 z-[70] grid place-items-end bg-slate-950/40 p-0 backdrop-blur-sm sm:place-items-center sm:p-5" onMouseDown={()=>setShowForm(false)}><form onSubmit={addBill} onMouseDown={e=>e.stopPropagation()} className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"><div className="flex justify-between"><div><h2 className="text-xl font-bold">Add a monthly bill</h2><p className="mt-1 text-sm text-slate-500">Add it once. Make it recurring anytime.</p></div><button type="button" onClick={()=>setShowForm(false)} className="text-slate-400">×</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Bill name" name="name" placeholder="Electricity" /><Field label="Amount" name="amount" type="number" placeholder="180" /><Field label="Category" name="category" placeholder="Utilities" /><Field label="Due date" name="due" placeholder="Aug 15" /><label className="text-xs font-bold">Assigned to<select name="assigned" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal"><option>Joint</option><option>Abel</option><option>Maya</option></select></label></div><button className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand font-bold text-white"><Check className="size-4"/>Add bill</button></form></div>}
    </>
  );
}

function Field({label,name,type="text",placeholder}:{label:string;name:string;type?:string;placeholder:string}) {
  return <label className="text-xs font-bold">{label}<input required name={name} type={type} placeholder={placeholder} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-emerald-400"/></label>;
}
