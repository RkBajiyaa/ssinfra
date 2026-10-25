import { cookies } from "next/headers";
import { z } from "zod";
import { adminAuth, isFirebaseConfigured } from "@/lib/firebase/admin";
import { logFirebaseError, withTimeout } from "@/lib/firebase/errors";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { clientIp, isSameOrigin, privacyHash } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({ idToken: z.string().min(10).max(5000) });
const RECENT_SIGN_IN_SECONDS = 5 * 60;
const UNAVAILABLE = "Sign-in isn't available right now because the server couldn't reach Firebase. Try again in a few minutes.";

function json(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** Exchanges a fresh Firebase ID token for an httpOnly session cookie. Admins only. */
export async function POST(request: Request) {
  if (!isSameOrigin(request.headers)) return json(403, { error: "Forbidden" });
  if (!isFirebaseConfigured()) return json(503, { error: "Sign-in is not configured yet." });

  let allowed: boolean;
  try {
    allowed = await withTimeout(
      rateLimit("login", privacyHash("login", clientIp(request.headers)), [{ limit: 20, windowSeconds: 600 }]),
      8000,
      "Login rate limit",
    );
  } catch (err) {
    logFirebaseError("auth", err);
    return json(503, { error: UNAVAILABLE });
  }
  if (!allowed) return json(429, { error: "Too many sign-in attempts. Wait 10 minutes and try again." });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json(400, { error: "Invalid request" });

  try {
    const decoded = await adminAuth().verifyIdToken(parsed.data.idToken, true);
    // Only mint long-lived cookies from a sign-in that just happened.
    if (Date.now() / 1000 - decoded.auth_time > RECENT_SIGN_IN_SECONDS) {
      return json(401, { error: "Sign in again to continue." });
    }
    if (decoded.admin !== true) {
      return json(403, { error: "This account doesn't have admin access." });
    }
    const sessionCookie = await adminAuth().createSessionCookie(parsed.data.idToken, {
      expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
    });
    (await cookies()).set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return json(200, { ok: true });
  } catch (err) {
    const code = (err as { code?: unknown }).code;
    // A rejected token (auth/* code) is the user's problem; anything else is ours and must not read as a wrong password.
    if (typeof code === "string" && code.startsWith("auth/") && code !== "auth/internal-error") {
      console.warn(`[auth] session creation refused (${code})`);
      return json(401, { error: "Sign-in failed. Try again." });
    }
    logFirebaseError("auth", err);
    return json(503, { error: UNAVAILABLE });
  }
}

/**
 * Signs this device out. Other devices stay signed in; to end every session
 * (e.g. a lost phone) run `node scripts/create-admin.mjs revoke <email>`.
 */
export async function DELETE(request: Request) {
  if (!isSameOrigin(request.headers)) return json(403, { error: "Forbidden" });
  (await cookies()).delete(SESSION_COOKIE);
  return json(200, { ok: true });
}
