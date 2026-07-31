"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { budgetComparison, categorySpending } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/utils";

export function SpendingDonut() {
  return (
    <div className="grid items-center sm:grid-cols-[1fr_150px]">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart><Pie data={categorySpending} dataKey="value" nameKey="category" innerRadius={58} outerRadius={85} paddingAngle={3}>{categorySpending.map((item) => <Cell key={item.category} fill={item.color} />)}</Pie><Tooltip formatter={(value) => formatCurrency(Number(value))} /></PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-3">{categorySpending.map((item) => <div key={item.category} className="flex items-center gap-2 text-xs"><span className="size-2 rounded-full" style={{background:item.color}} /><span className="flex-1 text-slate-500">{item.category}</span><b>{Math.round(item.value / 44.6)}%</b></div>)}</div>
    </div>
  );
}

export function BudgetBarChart() {
  return (
    <div className="h-70">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={budgetComparison} barGap={4} margin={{ left: -18, right: 4, top: 12 }}>
          <CartesianGrid stroke="#eef0f2" vertical={false} />
          <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{fontSize:11, fill:"#64748b"}} />
          <YAxis axisLine={false} tickLine={false} tick={{fontSize:11, fill:"#94a3b8"}} tickFormatter={(v)=>`$${v/1000}k`} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} cursor={{fill:"#f8fafc"}} />
          <Bar dataKey="budgeted" fill="#dbe3e0" radius={[5,5,0,0]} />
          <Bar dataKey="actual" fill="#00a866" radius={[5,5,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
