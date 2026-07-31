"use client";

import { useTheme, type Theme } from "@/components/theme-provider";

export function ThemeSelect({ name = "theme" }: { name?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <label className="text-xs font-bold">
      Theme
      <select
        name={name}
        value={theme}
        onChange={(event) => setTheme(event.target.value as Theme)}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal dark:border-slate-700 dark:bg-slate-950"
      >
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </select>
    </label>
  );
}
