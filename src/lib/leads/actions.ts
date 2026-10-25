"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { z } from "zod";
import { clientIp, privacyHash } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";
import { notifyNewLead } from "@/lib/push/send";
import { site } from "@/config/site";
import { classifyFirebaseError, logFirebaseError, withTimeout } from "@/lib/firebase/errors";
import { createLead } from "./repo";
import { LEAD_FIELD_NAMES, LEAD_META_NAMES, leadFieldsSchema, leadMetaSchema } from "./schema";

export type SubmitLeadResult =
  | { status: "success"; leadNumber: string }
  | { status: "invalid"; fieldErrors: Partial<Record<string, string>> }
  | { status: "error"; message: string };

const MIN_FILL_MS = 2500;
// Firestore retries unreachable transactions for a minute or more; a visitor shouldn't wait that long.
const RATE_LIMIT_TIMEOUT_MS = 8000;
const SAVE_TIMEOUT_MS = 15_000;

function pick(formData: FormData, names: readonly string[]) {
  const out: Record<string, string> = {};
  for (const name of names) {
    const v = formData.get(name);
    if (typeof v === "string") out[name] = v;
  }
  return out;
}

export async function submitLead(formData: FormData): Promise<SubmitLeadResult> {
  const meta = leadMetaSchema.safeParse(pick(formData, LEAD_META_NAMES));
  if (!meta.success) {
    return { status: "error", message: "The form session expired. Reload the page and submit again." };
  }

  // Honeypot filled in: almost certainly a bot. Nothing is stored, so never claim success: a person whose
  // browser autofilled the hidden field still sees that the enquiry wasn't sent and how to reach us.
  if (meta.data.website) {
    return { status: "error", message: `This enquiry couldn't be sent. Please call us on ${site.phone.display}.` };
  }

  if (meta.data.elapsedMs !== undefined && meta.data.elapsedMs < MIN_FILL_MS) {
    return { status: "error", message: "That was quicker than expected. Check your details and submit again." };
  }

  const fields = leadFieldsSchema.safeParse(pick(formData, LEAD_FIELD_NAMES));
  if (!fields.success) {
    const flat = z.flattenError(fields.error).fieldErrors as Record<string, string[] | undefined>;
    const fieldErrors = Object.fromEntries(
      Object.entries(flat).map(([k, v]) => [k, v?.[0]]),
    );
    return { status: "invalid", fieldErrors };
  }

  try {
    const h = await headers();
    const ipKey = privacyHash("lead", clientIp(h));
    const allowed = await withTimeout(
      rateLimit("lead", ipKey, [
        { limit: 5, windowSeconds: 600 },
        { limit: 20, windowSeconds: 86_400 },
      ]),
      RATE_LIMIT_TIMEOUT_MS,
      "Enquiry rate limit",
    );
    if (!allowed) {
      return {
        status: "error",
        message: `We've received several enquiries from this connection already. Please call us on ${site.phone.display} instead.`,
      };
    }

    let lead: Awaited<ReturnType<typeof createLead>>;
    try {
      lead = await withTimeout(createLead(fields.data, meta.data), SAVE_TIMEOUT_MS, "Enquiry save");
    } catch (err) {
      if (classifyFirebaseError(err) !== "timeout") throw err;
      // The write may still commit after we stop waiting, so don't say it failed. Resubmitting is safe:
      // the form keeps the same idempotency key, so a retry returns the same lead instead of a duplicate.
      logFirebaseError("leads", err);
      return {
        status: "error",
        message: `We couldn't confirm that your enquiry was saved. Submit again (it won't be duplicated), or call us on ${site.phone.display}.`,
      };
    }
    if (lead.created) {
      // Runs after the response is sent; a push failure never affects the visitor.
      after(async () => {
        try {
          await notifyNewLead(lead.id);
        } catch (err) {
          logFirebaseError("push", err);
        }
      });
    }
    return { status: "success", leadNumber: lead.leadNumber };
  } catch (err) {
    // Only a committed Firestore transaction counts as sent; anything else is reported, never swallowed.
    logFirebaseError("leads", err);
    return {
      status: "error",
      message: `Your enquiry wasn't sent because we couldn't save it just now. Your details are still in the form: try again in a few minutes, or call us on ${site.phone.display}.`,
    };
  }
}
