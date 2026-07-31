"use client";

import { use, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { acceptInvitationAction } from "@/app/actions/invitations";

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function accept() {
    startTransition(async () => {
      const result = await acceptInvitationAction(token);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#f6f8f7] px-5 dark:bg-[#0b1220]">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30">
        <div className="flex items-center gap-2 font-bold">
          <span className="grid size-10 place-items-center rounded-xl bg-navy text-brand-bright">
            <Heart className="size-5 fill-current" />
          </span>
          Couples Budget
        </div>
        <h1 className="mt-8 text-3xl font-bold tracking-tight">
          Join your household
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Sign in with the invited email address, then accept to share the same
          budget with your partner.
        </p>
        <button
          disabled={pending}
          onClick={accept}
          className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy font-bold text-white disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          Accept invitation
        </button>
        <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
          Need an account first?{" "}
          <Link
            href={`/signup?next=/invite/${token}`}
            className="font-bold text-emerald-700 dark:text-emerald-400"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
