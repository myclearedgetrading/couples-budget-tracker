"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  completeOnboardingAction,
  skipOnboardingAction,
} from "@/app/actions/onboarding";
import { ThemeToggle } from "@/components/theme-toggle";

const suggestedBills = [
  "Rent or mortgage",
  "Electricity",
  "Water",
  "Internet",
  "Cell phones",
  "Car payment",
  "Car insurance",
  "Groceries",
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState([
    "Rent or mortgage",
    "Electricity",
    "Internet",
    "Groceries",
  ]);
  const [form, setForm] = useState({
    yourName: "",
    partnerName: "",
    householdName: "",
    currencyCode: "USD" as "USD" | "CAD" | "GBP" | "EUR",
    monthlySavingsGoal: "1000",
    incomeSource: "Primary paycheck",
    incomeAmount: "4000",
    incomeDate: new Date().toISOString().slice(0, 10),
    incomeRecurring: true,
  });
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function finish(skip = false) {
    startTransition(async () => {
      try {
        if (skip) {
          const result = await skipOnboardingAction();
          if (!result?.ok) {
            toast.error(result?.message ?? "Could not skip setup.");
            return;
          }
          toast.success("Household created. You can finish setup anytime.");
          router.replace("/dashboard");
          router.refresh();
          return;
        }

        if (!form.yourName.trim() || !form.householdName.trim()) {
          toast.error("Enter your name and household name.");
          setStep(1);
          return;
        }
        if (!form.incomeSource.trim() || !Number(form.incomeAmount)) {
          toast.error("Add at least one income source.");
          setStep(2);
          return;
        }

        const result = await completeOnboardingAction({
          yourName: form.yourName,
          partnerName: form.partnerName,
          householdName: form.householdName,
          currencyCode: form.currencyCode,
          monthlySavingsGoal: Number(form.monthlySavingsGoal || 0),
          incomeSource: form.incomeSource,
          incomeAmount: Number(form.incomeAmount),
          incomeDate: form.incomeDate,
          incomeRecurring: form.incomeRecurring,
          selectedBills: selected,
        });

        if (!result?.ok) {
          toast.error(result?.message ?? "We could not finish setup.");
          return;
        }

        toast.success("Your household is ready", {
          description: "Welcome to Couples Budget.",
        });
        router.replace("/dashboard");
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "We could not finish setup. Please try again.",
        );
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#f6f8f7] px-4 py-7 dark:bg-[#0b1220] sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <span className="grid size-9 place-items-center rounded-xl bg-navy text-emerald-400">
              <Heart className="size-5 fill-current" />
            </span>
            Couples Budget
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle compact />
            <button
              disabled={pending}
              onClick={() => finish(true)}
              className="text-xs font-bold text-slate-500 disabled:opacity-50 dark:text-slate-400"
            >
              Skip for now
            </button>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-1 items-center gap-2">
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  i <= step
                    ? "bg-brand text-white"
                    : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {i < step ? <Check className="size-3.5" /> : i}
              </span>
              <div
                className={`h-1 flex-1 rounded-full ${
                  i <= step ? "bg-brand" : "bg-slate-200 dark:bg-slate-800"
                } ${i === 3 ? "hidden" : ""}`}
              />
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 sm:p-10">
          {step === 1 && (
            <div>
              <span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-brand dark:bg-emerald-950/50">
                <Heart />
              </span>
              <h1 className="mt-5 text-3xl font-bold">Set up your household</h1>
              <p className="mt-2 text-slate-500">
                A few basics so your shared budget feels like yours.
              </p>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <Field
                  label="Your name"
                  value={form.yourName}
                  onChange={(value) => update("yourName", value)}
                  required
                />
                <Field
                  label="Partner's name"
                  value={form.partnerName}
                  onChange={(value) => update("partnerName", value)}
                />
                <Field
                  label="Household name"
                  value={form.householdName}
                  onChange={(value) => update("householdName", value)}
                  required
                  placeholder="Alex & Jordan Household"
                />
                <label className="text-xs font-bold">
                  Preferred currency
                  <select
                    value={form.currencyCode}
                    onChange={(event) =>
                      update(
                        "currencyCode",
                        event.target.value as typeof form.currencyCode,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal"
                  >
                    <option value="USD">USD — US Dollar</option>
                    <option value="CAD">CAD — Canadian Dollar</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="EUR">EUR — Euro</option>
                  </select>
                </label>
                <Field
                  label="Monthly savings goal"
                  type="number"
                  value={form.monthlySavingsGoal}
                  onChange={(value) => update("monthlySavingsGoal", value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <span className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                <Sparkles />
              </span>
              <h1 className="mt-5 text-3xl font-bold">Add monthly income</h1>
              <p className="mt-2 text-slate-500">
                Start with one source. You can add more anytime.
              </p>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <Field
                  label="Income source"
                  value={form.incomeSource}
                  onChange={(value) => update("incomeSource", value)}
                  required
                />
                <Field
                  label="Expected monthly amount"
                  type="number"
                  value={form.incomeAmount}
                  onChange={(value) => update("incomeAmount", value)}
                  required
                />
                <Field
                  label="Expected pay date"
                  type="date"
                  value={form.incomeDate}
                  onChange={(value) => update("incomeDate", value)}
                  required
                />
                <label className="flex items-center gap-3 self-end rounded-xl bg-slate-50 p-4 text-xs font-bold dark:bg-slate-950">
                  <input
                    type="checkbox"
                    checked={form.incomeRecurring}
                    onChange={(event) =>
                      update("incomeRecurring", event.target.checked)
                    }
                    className="size-4 accent-emerald-600"
                  />
                  This income repeats
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <span className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300">
                <Check />
              </span>
              <h1 className="mt-5 text-3xl font-bold">Choose your common bills</h1>
              <p className="mt-2 text-slate-500">
                We&apos;ll create editable starter items for this month.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {suggestedBills.map((bill) => (
                  <button
                    type="button"
                    onClick={() =>
                      setSelected(
                        selected.includes(bill)
                          ? selected.filter((item) => item !== bill)
                          : [...selected, bill],
                      )
                    }
                    key={bill}
                    className={`flex items-center justify-between rounded-xl border p-4 text-left text-sm font-semibold ${
                      selected.includes(bill)
                        ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {bill}
                    <span
                      className={`grid size-5 place-items-center rounded-full ${
                        selected.includes(bill)
                          ? "bg-brand text-white"
                          : "border border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {selected.includes(bill) && <Check className="size-3" />}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-400">
                No sensitive account numbers are ever required.
              </p>
            </div>
          )}

          <div className="mt-10 flex justify-between border-t border-slate-100 pt-6 dark:border-slate-800">
            <button
              type="button"
              disabled={step === 1 || pending}
              onClick={() => setStep(step - 1)}
              className="flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-slate-600 disabled:opacity-0 dark:text-slate-300"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => (step === 3 ? finish(false) : setStep(step + 1))}
              className="flex h-11 items-center gap-2 rounded-xl bg-navy px-6 text-sm font-bold text-white disabled:opacity-60"
            >
              {pending ? "Saving…" : step === 3 ? "Finish setup" : "Continue"}
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="text-xs font-bold">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
        className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-emerald-400 dark:border-slate-700"
      />
    </label>
  );
}
