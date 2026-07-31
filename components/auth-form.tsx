"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "@/lib/auth/client";

type AuthMode = "login" | "signup" | "forgot" | "reset";

export function AuthForm({
  mode,
  nextPath,
  resetToken,
}: {
  mode: AuthMode;
  nextPath?: string;
  resetToken?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";
  const isReset = mode === "reset";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (isReset && !resetToken) {
      toast.error("This password reset link is missing or invalid.");
      return;
    }

    if (isReset && password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (isForgot) {
        const result = await authClient.requestPasswordReset({
          email,
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (result.error) throw new Error(result.error.message);
        toast.success("Check your inbox for a secure reset link.");
        return;
      }

      if (isReset) {
        const result = await authClient.resetPassword({
          newPassword: password,
          token: resetToken,
        });
        if (result.error) throw new Error(result.error.message);
        toast.success("Your password has been updated.");
        router.replace("/login");
        return;
      }

      if (isSignup) {
        const result = await authClient.signUp.email({
          email,
          password,
          name: name.trim(),
          callbackURL: "/onboarding",
        });
        if (result.error) throw new Error(result.error.message);
        if (result.data?.token) {
          toast.success("Account created. Let’s set up your household.");
          router.push("/onboarding");
        } else {
          toast.success("Account created. Check your email to continue.");
          router.push("/login");
        }
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
          callbackURL: nextPath ?? "/dashboard",
        });
        if (result.error) throw new Error(result.error.message);
        toast.success("Welcome back.");
        router.push(nextPath ?? "/dashboard");
      }
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Authentication failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 font-normal outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:focus:ring-emerald-500/20";

  return (
    <div className="min-h-screen bg-[#f6f8f7] px-5 py-8 dark:bg-[#0b1220] sm:grid sm:place-items-center">
      <div className="w-full max-w-md">
        <div className="mb-9 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold">
            <span className="grid size-10 place-items-center rounded-xl bg-navy text-brand-bright">
              <Heart className="size-5 fill-current" />
            </span>
            Couples Budget
          </Link>
          <ThemeToggle compact />
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 sm:p-9">
          <h1 className="text-3xl font-bold tracking-tight">
            {isSignup
              ? "Create your account"
              : isForgot
                ? "Reset your password"
                : isReset
                  ? "Choose a new password"
                  : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {isSignup
              ? "Start building a calmer financial life together."
              : isForgot
                ? "We’ll email you a secure reset link."
                : isReset
                  ? "Use a strong password you haven’t used before."
                  : "Sign in to your shared household budget."}
          </p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            {isSignup && (
              <label className="block text-sm font-semibold">
                Your name
                <input
                  name="name"
                  required
                  autoComplete="name"
                  placeholder="Alex Morgan"
                  className={inputClass}
                />
              </label>
            )}
            {!isReset && (
              <label className="block text-sm font-semibold">
                Email address
                <input
                  name="email"
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </label>
            )}
            {!isForgot && (
              <label className="block text-sm font-semibold">
                {isReset ? "New password" : "Password"}
                <div className="relative mt-2">
                  <input
                    name="password"
                    required
                    minLength={8}
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      isSignup || isReset ? "new-password" : "current-password"
                    }
                    placeholder="At least 8 characters"
                    className="h-12 w-full rounded-xl border border-slate-300 px-4 pr-12 font-normal outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400"
                    aria-label="Toggle password"
                  >
                    {showPassword ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>
              </label>
            )}
            {isReset && (
              <label className="block text-sm font-semibold">
                Confirm new password
                <input
                  name="confirmPassword"
                  required
                  minLength={8}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat your new password"
                  className={inputClass}
                />
              </label>
            )}
            {!isForgot && !isSignup && !isReset && (
              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-emerald-700 dark:text-emerald-400"
                >
                  Forgot password?
                </Link>
              </div>
            )}
            <button
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy font-bold text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {isSignup
                ? "Create account"
                : isForgot
                  ? "Send reset link"
                  : isReset
                    ? "Update password"
                    : "Log in"}
            </button>
          </form>
          {!isForgot && !isReset && (
            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              {isSignup ? "Already have an account?" : "New to Couples Budget?"}{" "}
              <Link
                href={isSignup ? "/login" : "/signup"}
                className="font-bold text-emerald-700 dark:text-emerald-400"
              >
                {isSignup ? "Log in" : "Create an account"}
              </Link>
            </p>
          )}
          {isForgot && (
            <Link
              href="/login"
              className="mt-6 block text-center text-sm font-bold text-emerald-700 dark:text-emerald-400"
            >
              Back to login
            </Link>
          )}
          {isReset && (
            <Link
              href="/login"
              className="mt-6 block text-center text-sm font-bold text-emerald-700 dark:text-emerald-400"
            >
              Back to login
            </Link>
          )}
        </div>
        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
