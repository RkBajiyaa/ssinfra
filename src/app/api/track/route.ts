import { z } from "zod";
import { isFirebaseConfigured } from "@/lib/firebase/admin";
import { logFirebaseError, withTimeout } from "@/lib/firebase/errors";
import { clientIp, isSameOrigin } from "@/lib/request";
import { isBot, normalizePath, recordPageview, referrerHost } from "@/lib/analytics/track";

const bodySchema = z.object({
  p: z.string().max(300),
  r: z.string().max(500).optional(),
});

/**
 * Receives page-view beacons from the public site. Always answers 204 so a
 * tracking problem can never surface to visitors; real failures are logged.
 */
export async function POST(request: Request) {
  const noContent = new Response(null, { status: 204 });
  if (!isSameOrigin(request.headers) || !isFirebaseConfigured()) return noContent;

  const ua = request.headers.get("user-agent");
  if (isBot(ua)) return noContent;

  let body: unknown;
  try {
    // sendBeacon posts text/plain; parse it ourselves.
    const text = await request.text();
    if (text.length > 2000) return noContent;
    body = JSON.parse(text);
  } catch {
    return noContent;
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return noContent;

  const path = normalizePath(parsed.data.p);
  if (!path) return noContent;

  try {
    // A beacon is fire-and-forget; don't hold the function open while Firestore retries.
    await withTimeout(
      recordPageview({
        path,
        referrerHost: referrerHost(parsed.data.r, request.headers.get("host")),
        ip: clientIp(request.headers),
        userAgent: ua!,
      }),
      5000,
      "Page view",
    );
  } catch (err) {
    logFirebaseError("analytics", err);
  }
  return noContent;
}
