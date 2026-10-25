import "server-only";
import webpush, { WebPushError, type PushSubscription } from "web-push";
import { FieldValue } from "firebase-admin/firestore";
import { createHash } from "node:crypto";
import { COLLECTIONS, db } from "@/lib/firebase/admin";

let configured: boolean | undefined;

export function isPushConfigured(): boolean {
  if (configured !== undefined) return configured;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  configured = Boolean(publicKey && privateKey && subject);
  if (configured) webpush.setVapidDetails(subject!, publicKey!, privateKey!);
  return configured;
}

/** Subscriptions are keyed by a hash of their endpoint so re-subscribing is idempotent. */
export function subscriptionId(endpoint: string): string {
  return createHash("sha256").update(endpoint).digest("hex").slice(0, 40);
}

export async function saveSubscription(uid: string, sub: PushSubscription, userAgent: string | null) {
  const ref = db().collection(COLLECTIONS.pushSubscriptions).doc(subscriptionId(sub.endpoint));
  const snap = await ref.get();
  await ref.set(
    {
      uid,
      endpoint: sub.endpoint,
      keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      userAgent: userAgent?.slice(0, 200) ?? null,
      updatedAt: FieldValue.serverTimestamp(),
      ...(snap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true },
  );
}

export async function deleteSubscription(uid: string, endpoint: string) {
  const ref = db().collection(COLLECTIONS.pushSubscriptions).doc(subscriptionId(endpoint));
  const snap = await ref.get();
  // Only the admin who registered a device can remove it.
  if (snap.exists && snap.get("uid") === uid) await ref.delete();
}

export async function hasSubscription(endpoint: string): Promise<boolean> {
  const snap = await db().collection(COLLECTIONS.pushSubscriptions).doc(subscriptionId(endpoint)).get();
  return snap.exists;
}

export type PushResult = { sent: number; removed: number; failed: number };

type Payload = { title: string; body: string; url: string; tag: string };

/**
 * Sends to every registered admin device. Lock-screen text deliberately
 * contains no customer details.
 */
export function notifyNewLead(leadId: string): Promise<PushResult> {
  return sendToAll({
    title: "New SS Infratech Enquiry",
    body: "A new project enquiry has been received. Open Admin SS Infra to review the details.",
    url: `/admin/leads/${encodeURIComponent(leadId)}`,
    tag: `lead-${leadId}`,
  });
}

export function sendTestNotification(): Promise<PushResult> {
  return sendToAll({
    title: "Admin SS Infra",
    body: "Test notification: new-lead alerts are working on this device.",
    url: "/admin",
    tag: "test",
  });
}

async function sendToAll(message: Payload): Promise<PushResult> {
  const result: PushResult = { sent: 0, removed: 0, failed: 0 };
  if (!isPushConfigured()) return result;
  const payload = JSON.stringify(message);

  const snaps = await db().collection(COLLECTIONS.pushSubscriptions).get();
  await Promise.all(
    snaps.docs.map(async (doc) => {
      const sub = { endpoint: doc.get("endpoint") as string, keys: doc.get("keys") as PushSubscription["keys"] };
      try {
        await webpush.sendNotification(sub, payload, { TTL: 60 * 60 * 24, urgency: "high" });
        result.sent++;
        await doc.ref.update({ lastUsedAt: FieldValue.serverTimestamp() });
      } catch (err) {
        if (err instanceof WebPushError && (err.statusCode === 404 || err.statusCode === 410)) {
          // The browser revoked this subscription; stop sending to it.
          await doc.ref.delete();
          result.removed++;
        } else {
          result.failed++;
          console.error("[push] delivery failed", doc.id, err instanceof WebPushError ? err.statusCode : err);
        }
      }
    }),
  );
  return result;
}
