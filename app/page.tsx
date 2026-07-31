import Link from "next/link";
import {
  ArrowRight, BarChart3, BellRing, Check, ChevronDown, Heart, LockKeyhole,
  PiggyBank, ReceiptText, ShieldCheck, Sparkles, Target, UsersRound, WalletCards,
} from "lucide-react";
import { LandingMenu } from "@/components/landing-menu";
import { ThemeToggle } from "@/components/theme-toggle";

const benefits = [
  ["Never miss another bill", "Smart reminders keep both of you one step ahead.", BellRing],
  ["Know where money goes", "See every dollar in a simple, shared monthly view.", BarChart3],
  ["Divide expenses fairly", "Assign bills clearly to you, your partner, or both.", UsersRound],
  ["Build goals together", "Turn shared plans into visible savings progress.", Target],
  ["Talk about money calmly", "One source of truth means fewer awkward surprises.", Heart],
  ["Stay ready each month", "Recurring budgets make next month effortless.", WalletCards],
] as const;

const features = ["Shared monthly dashboard", "Bill reminders", "Partner assignments", "Spending categories", "Savings goals", "Financial reports", "Mobile-friendly access", "Secure household accounts"];

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-white text-slate-900 dark:bg-[#0b1220] dark:text-slate-100">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="relative mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
            <span className="flex size-9 items-center justify-center rounded-xl bg-navy text-brand-bright"><Heart className="size-5 fill-current" /></span>
            <span>Couples Budget</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
            <a href="#benefits" className="hover:text-slate-950 dark:hover:text-white">Benefits</a>
            <a href="#how" className="hover:text-slate-950 dark:hover:text-white">How it works</a>
            <a href="#pricing" className="hover:text-slate-950 dark:hover:text-white">Pricing</a>
            <a href="#faq" className="hover:text-slate-950 dark:hover:text-white">FAQ</a>
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            <ThemeToggle compact />
            <Link href="/login" className="px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200">Log in</Link>
            <Link href="/signup" className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10">Start free</Link>
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <ThemeToggle compact />
            <LandingMenu />
          </div>
        </div>
      </header>

      <main>
        <section className="dot-grid relative overflow-hidden bg-[#f8faf9] px-5 pb-24 pt-36 dark:bg-[#0b1220] lg:pb-32 lg:pt-44">
          <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10" />
          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-slate-900 dark:text-emerald-300">
                <Sparkles className="size-4" /> Money feels better when you manage it together
              </div>
              <h1 className="text-balance text-5xl font-bold leading-[1.08] tracking-[-0.045em] text-navy dark:text-white sm:text-6xl lg:text-7xl">
                Manage money together, <span className="text-brand">without the confusion.</span>
              </h1>
              <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300 sm:text-xl">
                Track bills, spending, income, and savings in one shared dashboard built specifically for couples.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/signup" className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-brand px-7 font-bold text-white shadow-xl shadow-emerald-500/20">
                  Start your budget <ArrowRight className="size-4" />
                </Link>
                <Link href="/login" className="inline-flex h-14 items-center justify-center rounded-full border border-slate-300 bg-white px-7 font-bold text-slate-800 shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                  Log in to your account
                </Link>
              </div>
              <p className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <ShieldCheck className="size-4 text-brand" /> Free to start · No bank connection required
              </p>
            </div>

            <div className="relative mx-auto mt-16 max-w-5xl rounded-[28px] border border-white/70 bg-navy p-2 shadow-2xl shadow-slate-900/25 dark:border-slate-700 sm:p-3">
              <div className="overflow-hidden rounded-[20px] bg-[#f5f7f6] dark:bg-slate-950">
                <div className="flex h-12 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
                  <div className="flex items-center gap-2 font-bold">
                    <Heart className="size-4 fill-emerald-500 text-emerald-500" /> Our Budget
                  </div>
                  <div className="flex -space-x-2">
                    <span className="grid size-7 place-items-center rounded-full bg-navy text-[10px] text-white ring-2 ring-white dark:ring-slate-900">A</span>
                    <span className="grid size-7 place-items-center rounded-full bg-violet-500 text-[10px] text-white ring-2 ring-white dark:ring-slate-900">M</span>
                  </div>
                </div>
                <div className="grid gap-4 p-4 sm:grid-cols-4 sm:p-6">
                  {[["Income", "$8,520", "+4.2%"], ["Bills", "$3,640", "7 of 9 paid"], ["Spending", "$1,682", "On track"], ["Money left", "$3,198", "Looking good"]].map(([label, value, note], index) => (
                    <div key={label} className={`rounded-2xl p-4 text-left shadow-sm ${index === 3 ? "bg-navy text-white" : "bg-white dark:bg-slate-900"}`}>
                      <p className={`text-xs font-semibold ${index === 3 ? "text-slate-400" : "text-slate-500 dark:text-slate-400"}`}>{label}</p>
                      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
                      <p className={`mt-1 text-xs ${index === 3 ? "text-emerald-400" : "text-emerald-600 dark:text-emerald-400"}`}>{note}</p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 px-4 pb-5 sm:grid-cols-[1.5fr_1fr] sm:px-6 sm:pb-6">
                  <div className="rounded-2xl bg-white p-5 text-left shadow-sm dark:bg-slate-900">
                    <div className="mb-5 flex items-center justify-between">
                      <b>Monthly cash flow</b>
                      <span className="text-xs text-slate-500">August 2026</span>
                    </div>
                    <div className="flex h-32 items-end gap-3">
                      {[45,66,52,78,58,88,72,94,68,82,63,90].map((h,i)=>(
                        <div key={i} className="flex-1 rounded-t-md bg-emerald-100 dark:bg-emerald-950" style={{height:`${h}%`}}>
                          <div className="h-2/3 rounded-t-md bg-brand" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white p-5 text-left shadow-sm dark:bg-slate-900">
                    <b>Savings goal</b>
                    <div className="mt-5 flex items-center gap-4">
                      <div className="grid size-20 place-items-center rounded-full border-[9px] border-emerald-400 text-lg font-bold">65%</div>
                      <div>
                        <p className="text-sm text-slate-500">Emergency fund</p>
                        <p className="mt-1 text-xl font-bold">$9,800</p>
                        <p className="text-xs text-slate-500">of $15,000</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="benefits" className="px-5 py-24 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-widest text-brand">Built for your household</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Less money stress. More shared progress.</h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {benefits.map(([title,text,Icon])=>(
                <div key={title} className="rounded-3xl border border-slate-200 bg-white p-7 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-black/40">
                  <span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-brand dark:bg-emerald-950/60"><Icon /></span>
                  <h3 className="mt-5 text-lg font-bold">{title}</h3>
                  <p className="mt-2 leading-7 text-slate-600 dark:text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="bg-navy px-5 py-24 text-white">
          <div className="mx-auto max-w-6xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Simple by design</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight">Your budget, working in three steps.</h2>
            <div className="mt-14 grid gap-8 text-left md:grid-cols-3">
              {[
                ["01","Create your household","Set up your shared space and invite your partner when you’re ready."],
                ["02","Add the real numbers","Enter income, bills, and everyday spending in a few taps."],
                ["03","Make progress together","Stay ahead of bills and see what’s left for the goals you share."],
              ].map(([n,title,text])=>(
                <div key={n} className="rounded-3xl border border-white/10 bg-white/5 p-7">
                  <span className="text-4xl font-black text-emerald-400">{n}</span>
                  <h3 className="mt-7 text-xl font-bold">{title}</h3>
                  <p className="mt-3 leading-7 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-brand">Everything in one place</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight">A clear view for both of you.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-400">From payday to bill day, every number stays organized, current, and easy to understand.</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {features.map(feature=>(
                  <div key={feature} className="flex items-center gap-3 font-medium">
                    <span className="grid size-6 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <Check className="size-3.5"/>
                    </span>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[32px] bg-emerald-50 p-6 dark:bg-emerald-950/30 sm:p-10">
              <div className="rounded-3xl bg-white p-6 shadow-xl shadow-emerald-900/10 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Money left this month</p>
                    <p className="mt-1 text-4xl font-bold">$3,198</p>
                  </div>
                  <PiggyBank className="size-10 text-brand"/>
                </div>
                <div className="mt-8 space-y-5">
                  {[["Bills paid","7 of 9",78],["Savings goal","$600 of $1,000",60],["Grocery budget","$620 of $800",77]].map(([label,amount,width])=>(
                    <div key={String(label)}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="font-medium">{label}</span>
                        <span className="text-slate-500">{amount}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-brand" style={{width:`${width}%`}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-slate-50 px-5 py-24 dark:bg-slate-950/60">
          <div className="mx-auto max-w-6xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-brand">Fair, simple pricing</p>
            <h2 className="mt-3 text-4xl font-bold">Start organizing your money today.</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">No hidden fees. Upgrade when your household needs more.</p>
            <div className="mt-12 grid gap-6 text-left lg:grid-cols-3">
              {[
                {name:"Free",price:"$0",note:"For getting started",list:["One household","Up to 15 bills","Monthly budget tracking","Basic spending tracker"]},
                {name:"Couples Plus",price:"$7.99",note:"per month",popular:true,list:["Unlimited bills & spending","Shared savings goals","Smart bill reminders","Advanced reports & exports"]},
                {name:"Lifetime",price:"$79",note:"one-time",list:["Every Couples Plus feature","Lifetime product updates","No monthly subscription","Priority support"]},
              ].map(tier=>(
                <div key={tier.name} className={`relative rounded-3xl border bg-white p-7 dark:bg-slate-900 ${tier.popular?"border-emerald-500 shadow-xl shadow-emerald-900/10":"border-slate-200 dark:border-slate-800"}`}>
                  {tier.popular&&<span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">Most popular</span>}
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                  <div className="mt-5 flex items-end gap-2">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="pb-1 text-sm text-slate-500">{tier.note}</span>
                  </div>
                  <ul className="my-7 space-y-3">
                    {tier.list.map(item=><li key={item} className="flex gap-3 text-sm"><Check className="size-4 text-brand"/>{item}</li>)}
                  </ul>
                  <Link href="/signup" className={`block rounded-xl px-5 py-3 text-center text-sm font-bold ${tier.popular?"bg-brand text-white":"bg-slate-100 dark:bg-slate-800"}`}>
                    Choose {tier.name}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="px-5 py-24">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-brand">Questions, answered</p>
              <h2 className="mt-3 text-4xl font-bold">Frequently asked questions</h2>
            </div>
            <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {[
                ["Can both partners use separate logins?","Yes. Each partner has a private login while sharing one household budget."],
                ["Is our financial information secure?","Your data is encrypted in transit and protected by household-level access rules."],
                ["Can I use it without inviting my partner?","Absolutely. Start solo and invite your partner whenever you are ready."],
                ["Can I track irregular income?","Yes. Add recurring, one-time, or irregular income for either partner."],
                ["Can I export my budget?","Couples Plus includes CSV and printable PDF-friendly reports."],
                ["Does the app connect to bank accounts?","Not yet. The first version uses manual tracking and never asks for bank credentials."],
              ].map(([q,a])=>(
                <details key={q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-bold">
                    {q}<ChevronDown className="size-5 transition-transform group-open:rotate-180"/>
                  </summary>
                  <p className="mt-3 pr-8 leading-7 text-slate-600 dark:text-slate-400">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-24">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-navy px-6 py-16 text-center text-white sm:px-16">
            <LockKeyhole className="mx-auto size-10 text-emerald-400"/>
            <h2 className="mt-5 text-4xl font-bold">Ready to feel better about money?</h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">Build your first shared budget in minutes. No spreadsheets, no confusing finance jargon.</p>
            <Link href="/signup" className="mt-8 inline-flex h-13 items-center gap-2 rounded-full bg-brand px-7 font-bold">
              Start your budget <ArrowRight className="size-4"/>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 px-5 py-10 dark:border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-sm text-slate-500 sm:flex-row">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
            <ReceiptText className="size-5 text-brand"/>Couples Budget Tracker
          </div>
          <p>© 2026 Couples Budget. Built for better money conversations.</p>
        </div>
      </footer>
    </div>
  );
}
