"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" | "forgot" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "");
    const supabase = createClient();
    if (!supabase) {
      toast.info("Demo mode", { description: "Connect Supabase in .env.local to enable secure accounts." });
      router.push("/dashboard?demo=true");
      return;
    }
    setLoading(true);
    const redirectTo = `${window.location.origin}/auth/callback`;
    const result = isForgot
      ? await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${redirectTo}?next=/settings` })
      : isSignup
        ? await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: redirectTo } })
        : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (result.error) return toast.error(result.error.message);
    if (isForgot) return toast.success("Check your inbox for a reset link.");
    if (isSignup) {
      toast.success("Account created. Check your email to confirm it.");
      router.push("/onboarding");
    } else {
      toast.success("Welcome back.");
      router.push("/dashboard");
    }
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f6f8f7] px-5 py-8 sm:grid sm:place-items-center">
      <div className="w-full max-w-md">
        <Link href="/" className="mx-auto mb-9 flex w-fit items-center gap-2.5 font-bold"><span className="grid size-10 place-items-center rounded-xl bg-navy text-brand-bright"><Heart className="size-5 fill-current" /></span>Couples Budget</Link>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-9">
          <h1 className="text-3xl font-bold tracking-tight">{isSignup ? "Create your account" : isForgot ? "Reset your password" : "Welcome back"}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{isSignup ? "Start building a calmer financial life together." : isForgot ? "We’ll email you a secure reset link." : "Sign in to your shared household budget."}</p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            {isSignup && <label className="block text-sm font-semibold">Your name<input name="name" required autoComplete="name" placeholder="Alex Morgan" className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 font-normal outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" /></label>}
            <label className="block text-sm font-semibold">Email address<input name="email" required type="email" autoComplete="email" placeholder="you@example.com" className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 font-normal outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" /></label>
            {!isForgot && <label className="block text-sm font-semibold">Password<div className="relative mt-2"><input name="password" required minLength={8} type={showPassword ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} placeholder="At least 8 characters" className="h-12 w-full rounded-xl border border-slate-300 px-4 pr-12 font-normal outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400" aria-label="Toggle password">{showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button></div></label>}
            {!isForgot && !isSignup && <div className="text-right"><Link href="/forgot-password" className="text-sm font-semibold text-emerald-700">Forgot password?</Link></div>}
            <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy font-bold text-white hover:bg-slate-700 disabled:opacity-60">{loading && <Loader2 className="size-4 animate-spin" />}{isSignup ? "Create account" : isForgot ? "Send reset link" : "Log in"}</button>
          </form>
          {!isForgot && <p className="mt-6 text-center text-sm text-slate-500">{isSignup ? "Already have an account?" : "New to Couples Budget?"} <Link href={isSignup ? "/login" : "/signup"} className="font-bold text-emerald-700">{isSignup ? "Log in" : "Create an account"}</Link></p>}
          {isForgot && <Link href="/login" className="mt-6 block text-center text-sm font-bold text-emerald-700">Back to login</Link>}
        </div>
        <p className="mt-5 text-center text-xs leading-5 text-slate-400">By continuing, you agree to our Terms and Privacy Policy.</p>
      </div>
    </div>
  );
}
