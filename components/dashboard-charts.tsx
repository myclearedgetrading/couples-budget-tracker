"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BudgetView } from "@/lib/data/financial";
import { formatCurrency } from "@/lib/utils";

export function SpendingDonut({ data }: { data: BudgetView[] }) {
  const total = data.reduce((sum, item) => sum + item.spent, 0);
  if (!data.length || total === 0) return <ChartEmpty message="Add transactions to see category spending." />;
  return (
    <div className="grid items-center sm:grid-cols-[1fr_150px]">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart><Pie data={data} dataKey="spent" nameKey="category" innerRadius={58} outerRadius={85} paddingAngle={3}>{data.map((item) => <Cell key={item.id} fill={item.color} />)}</Pie><Tooltip formatter={(value) => formatCurrency(Number(value))} /></PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-3">{data.map((item) => <div key={item.id} className="flex items-center gap-2 text-xs"><span className="size-2 rounded-full" style={{background:item.color}} /><span className="flex-1 text-slate-500">{item.category}</span><b>{Math.round(item.spent / total * 100)}%</b></div>)}</div>
    </div>
  );
}

export function BudgetBarChart({ data }: { data: BudgetView[] }) {
  if (!data.length) return <ChartEmpty message="Set category budgets to compare planned and actual spending." />;
  return (
    <div className="h-70">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4} margin={{ left: -18, right: 4, top: 12 }}>
          <CartesianGrid stroke="#eef0f2" vertical={false} />
          <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{fontSize:11, fill:"#64748b"}} />
          <YAxis axisLine={false} tickLine={false} tick={{fontSize:11, fill:"#94a3b8"}} tickFormatter={(v)=>`$${v/1000}k`} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} cursor={{fill:"#f8fafc"}} />
          <Bar dataKey="amount" name="Budgeted" fill="#dbe3e0" radius={[5,5,0,0]} />
          <Bar dataKey="spent" name="Actual" fill="#00a866" radius={[5,5,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return <div className="grid h-56 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">{message}</div>;
}
