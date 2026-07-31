import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Server Actions are addressed by build-specific ids. A tab loaded before a
 * redeploy posts an id the live deployment no longer serves, and the client
 * surfaces the failure as an opaque transport error. Vercel's Skew Protection
 * covers this on Pro; on Hobby the tab has to reload to re-sync.
 */
export function isStaleDeploymentError(error: unknown): boolean {
  const message = (
    error instanceof Error ? error.message : String(error ?? "")
  ).toLowerCase();

  return (
    message.includes("an unexpected response was received from the server") ||
    message.includes("failed to find server action")
  );
}

/** Parse `YYYY-MM` or `YYYY-MM-01` into a first-of-month date string. */
export function parseMonthParam(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const match = String(raw).trim().match(/^(\d{4})-(\d{2})(?:-01)?$/);
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return `${match[1]}-${match[2]}-01`;
}

/** Shift a `YYYY-MM-01` value by `delta` calendar months (UTC). */
export function shiftMonth(monthStart: string, delta: number): string {
  const [y, m] = monthStart.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function formatMonthLabel(monthStart: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${monthStart.slice(0, 10)}T00:00:00Z`));
}

/** Normalize Neon/JS date values to YYYY-MM-DD for Postgres date columns. */
export function toDateOnly(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const raw = String(value ?? "");
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return toDateOnly(parsed);
  }

  throw new Error(`Invalid date value: ${raw}`);
}
