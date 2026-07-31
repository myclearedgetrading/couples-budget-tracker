"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getMutationContext, requireUser } from "@/lib/data/financial";
import { getSql } from "@/lib/db";

export type ActionResult =
  | { ok: true; message: string; token?: string; inviteUrl?: string }
  | { ok: false; message: string };

function hashToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function invitePartnerAction(form: FormData): Promise<ActionResult> {
  try {
    const email = z
      .string()
      .trim()
      .email("Enter a valid email address.")
      .parse(form.get("email"));
    const { sql, userId, householdId } = await getMutationContext();

    const membership = await sql.query(
      `select role from household_members
       where household_id = $1 and user_id = $2 and status = 'active'`,
      [householdId, userId],
    );
    if (!membership[0]) {
      throw new Error("You no longer have access to this household.");
    }

    const activeCount = await sql.query(
      `select count(*)::int as n from household_members
       where household_id = $1 and status = 'active'`,
      [householdId],
    );
    if (Number(activeCount[0]?.n ?? 0) >= 2) {
      throw new Error("This household already has two partners.");
    }

    const normalizedEmail = email.toLowerCase();
    await sql.query(
      `update household_invitations
       set status = 'revoked'
       where household_id = $1 and lower(email) = $2 and status = 'pending'`,
      [householdId, normalizedEmail],
    );

    const token = randomBytes(32).toString("hex");
    await sql.query(
      `insert into household_invitations (
         household_id, email, token_hash, invited_by, expires_at
       ) values ($1, $2, $3, $4, now() + interval '7 days')`,
      [householdId, normalizedEmail, hashToken(token), userId],
    );

    revalidatePath("/settings");
    return {
      ok: true,
      message: "Invitation created. Share the link with your partner.",
      token,
      inviteUrl: `/invite/${token}`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not create the invitation.",
    };
  }
}

export async function acceptInvitationAction(token: string): Promise<ActionResult> {
  try {
    const parsed = z.string().length(64, "Invalid invitation link.").parse(token);
    const user = await requireUser();
    const sql = getSql();

    const invitation = await sql.query(
      `select id, household_id, email, status, expires_at
       from household_invitations
       where token_hash = $1`,
      [hashToken(parsed)],
    );
    const invite = invitation[0];
    if (
      !invite ||
      invite.status !== "pending" ||
      new Date(String(invite.expires_at)) <= new Date() ||
      String(invite.email).toLowerCase() !== String(user.email ?? "").toLowerCase()
    ) {
      throw new Error("That invitation is invalid or expired.");
    }

    const householdId = String(invite.household_id);
    const activeCount = await sql.query(
      `select count(*)::int as n from household_members
       where household_id = $1 and status = 'active'`,
      [householdId],
    );
    if (Number(activeCount[0]?.n ?? 0) >= 2) {
      throw new Error("This household already has two partners.");
    }

    await sql`
      insert into profiles (id, email, full_name)
      values (${user.id}, ${user.email ?? "unknown@example.com"}, ${user.name ?? null})
      on conflict (id) do update
        set email = coalesce(excluded.email, profiles.email),
            updated_at = now()
    `;

    await sql.query(
      `insert into household_members (household_id, user_id, role, status)
       values ($1, $2, 'partner', 'active')
       on conflict (household_id, user_id) do update
         set role = 'partner', status = 'active', left_at = null, joined_at = now()`,
      [householdId, user.id],
    );
    await sql.query(
      `update household_invitations
       set status = 'accepted', accepted_by = $2, accepted_at = now()
       where id = $1`,
      [invite.id, user.id],
    );
    await sql.query(
      `insert into activity_logs (household_id, actor_id, entity_type, entity_id, action)
       values ($1, $2, 'household_invitations', $3, 'accepted')`,
      [householdId, user.id, invite.id],
    );
    await sql.query(
      `insert into user_preferences (user_id, default_household_id)
       values ($1, $2)
       on conflict (user_id) do update set default_household_id = excluded.default_household_id`,
      [user.id, householdId],
    );

    revalidatePath("/dashboard");
    revalidatePath("/onboarding");
    return { ok: true, message: "You joined the household." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not accept that invitation.",
    };
  }
}
