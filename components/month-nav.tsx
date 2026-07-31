"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, formatMonthLabel, shiftMonth } from "@/lib/utils";

export function MonthNav({
  monthStart,
  availableMonths,
  isCurrentMonth,
  className,
}: {
  monthStart: string;
  availableMonths: string[];
  isCurrentMonth: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const set = new Set(availableMonths);
  const prev = shiftMonth(monthStart, -1);
  const next = shiftMonth(monthStart, 1);
  const canPrev = set.has(prev);
  const canNext = !isCurrentMonth && set.has(next);

  function hrefFor(target: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (isCurrentMonth && target === monthStart) {
      params.delete("month");
    } else {
      const newest = availableMonths[0];
      if (newest && target >= newest) params.delete("month");
      else params.set("month", target.slice(0, 7));
    }
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Link
        href={canPrev ? hrefFor(prev) : "#"}
        aria-disabled={!canPrev}
        tabIndex={canPrev ? 0 : -1}
        className={cn(
          "grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
          !canPrev && "pointer-events-none opacity-40",
        )}
        aria-label="Previous month"
      >
        <ChevronLeft className="size-4" />
      </Link>
      <p className="min-w-36 text-center text-sm font-bold tabular-nums">
        {formatMonthLabel(monthStart)}
      </p>
      <Link
        href={canNext ? hrefFor(next) : "#"}
        aria-disabled={!canNext}
        tabIndex={canNext ? 0 : -1}
        className={cn(
          "grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
          !canNext && "pointer-events-none opacity-40",
        )}
        aria-label="Next month"
      >
        <ChevronRight className="size-4" />
      </Link>
      {!isCurrentMonth && (
        <Link
          href={hrefFor(availableMonths[0] ?? monthStart)}
          className="ml-1 text-xs font-bold text-emerald-700 dark:text-emerald-400"
        >
          Today
        </Link>
      )}
    </div>
  );
}
