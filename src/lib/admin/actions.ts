"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { LEAD_STATUS_IDS } from "@/lib/domain";
import { adminFailureMessage, logFirebaseError } from "@/lib/firebase/errors";
import { updateLead } from "@/lib/leads/repo";
import {
  PACKAGES_TAG,
  SlugTakenError,
  deletePackage,
  savePackage,
  setPackageActive,
} from "@/lib/packages/repo";
import { packageInputSchema } from "@/lib/packages/schema";
import {
  deleteSubscription,
  hasSubscription,
  isPushConfigured,
  saveSubscription,
  sendTestNotification,
} from "@/lib/push/send";

/*
 * Every action starts with requireAdmin(): Server Actions are public HTTP
 * endpoints, so hiding a button is never the access control.
 */

export type ActionState = { ok: boolean; message: string; fieldErrors?: Record<string, string | undefined> } | null;

const idSchema = z.string().regex(/^[\w-]{1,128}$/);

export async function updateLeadStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({ id: idSchema, status: z.enum(LEAD_STATUS_IDS) })
    .safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return { ok: false, message: "Choose a valid status." };
  let found: boolean;
  try {
    found = await updateLead(parsed.data.id, { status: parsed.data.status });
  } catch (err) {
    return { ok: false, message: adminFailureMessage(logFirebaseError("admin lead status", err)) };
  }
  if (!found) return { ok: false, message: "This lead no longer exists." };
  refresh();
  return { ok: true, message: "Status saved." };
}

export async function updateLeadNotesAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({ id: idSchema, notes: z.string().max(5000, { error: "Notes are limited to 5,000 characters." }) })
    .safeParse({ id: formData.get("id"), notes: String(formData.get("notes") ?? "") });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Couldn't save notes." };
  const notes = parsed.data.notes.trim();
  let found: boolean;
  try {
    found = await updateLead(parsed.data.id, { internalNotes: notes || null });
  } catch (err) {
    return { ok: false, message: adminFailureMessage(logFirebaseError("admin lead notes", err)) };
  }
  if (!found) return { ok: false, message: "This lead no longer exists." };
  refresh();
  return { ok: true, message: "Notes saved." };
}

export async function savePackageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = formData.get("id");
  const raw = Object.fromEntries(
    [
      "name", "slug", "serviceCategory", "shortDescription", "includedFeatures", "exclusions",
      "optionalFeatures", "priceMode", "priceAmount", "priceUnit", "ctaLabel", "displayOrder",
    ].map((k) => [k, formData.get(k) ?? undefined]),
  );
  const parsed = packageInputSchema.safeParse({ ...raw, isActive: formData.get("isActive") ?? "false" });
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error).fieldErrors as Record<string, string[] | undefined>;
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0]])),
    };
  }
  let savedId: string;
  try {
    savedId = await savePackage(typeof id === "string" && id ? id : null, parsed.data);
  } catch (err) {
    if (err instanceof SlugTakenError) {
      return { ok: false, message: "Check the highlighted fields.", fieldErrors: { slug: "Another package already uses this URL name." } };
    }
    return { ok: false, message: adminFailureMessage(logFirebaseError("admin package save", err)) };
  }
  // Public pages show the change on their next request; no redeploy needed.
  updateTag(PACKAGES_TAG);
  if (!id) redirect(`/admin/pricing/${savedId}?saved=1`);
  refresh();
  return { ok: true, message: "Package saved. The website now shows this version." };
}

export async function togglePackageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = idSchema.parse(formData.get("id"));
  try {
    await setPackageActive(id, formData.get("isActive") === "true");
  } catch (err) {
    logFirebaseError("admin package toggle", err);
    // redirect() works by throwing, so it stays outside the try.
    redirect("/admin/pricing?error=toggle");
  }
  updateTag(PACKAGES_TAG);
  refresh();
}

export async function deletePackageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = idSchema.parse(formData.get("id"));
  let failed = false;
  try {
    await deletePackage(id);
  } catch (err) {
    logFirebaseError("admin package delete", err);
    failed = true;
  }
  if (failed) redirect(`/admin/pricing/${id}?error=delete`);
  updateTag(PACKAGES_TAG);
  redirect("/admin/pricing?deleted=1");
}

/* ---------- push notifications ---------- */

const subscriptionSchema = z.object({
  endpoint: z.url().max(2000).refine((u) => u.startsWith("https://"), "Push endpoints must use HTTPS"),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(10).max(100) }),
});

export async function savePushSubscriptionAction(sub: unknown): Promise<{ ok: boolean; message: string }> {
  const admin = await requireAdmin();
  if (!isPushConfigured()) return { ok: false, message: "Push notifications aren't configured on the server yet." };
  const parsed = subscriptionSchema.safeParse(sub);
  if (!parsed.success) return { ok: false, message: "This browser returned an invalid subscription." };
  await saveSubscription(admin.uid, parsed.data, (await headers()).get("user-agent"));
  return { ok: true, message: "Notifications are on for this device." };
}

export async function removePushSubscriptionAction(endpoint: string): Promise<{ ok: boolean }> {
  const admin = await requireAdmin();
  if (typeof endpoint === "string" && endpoint.length < 2000) await deleteSubscription(admin.uid, endpoint);
  return { ok: true };
}

export async function checkPushSubscriptionAction(endpoint: string): Promise<boolean> {
  await requireAdmin();
  return typeof endpoint === "string" && endpoint.length < 2000 ? hasSubscription(endpoint) : false;
}

export async function sendTestPushAction(): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  if (!isPushConfigured()) return { ok: false, message: "Push notifications aren't configured on the server yet." };
  const r = await sendTestNotification();
  if (r.sent === 0) return { ok: false, message: "No device received it. Turn notifications on for this device first." };
  return { ok: true, message: `Test sent to ${r.sent} device${r.sent === 1 ? "" : "s"}.` };
}
