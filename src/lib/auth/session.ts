import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { adminAuth, isFirebaseConfigured } from "@/lib/firebase/admin";
import { logFirebaseError } from "@/lib/firebase/errors";

export const SESSION_COOKIE = "__session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5; // 5 days

export type AdminUser = {
  uid: string;
  email: string | null;
  name: string | null;
};

/**
 * The Data Access Layer's single authorisation check. A request is an admin
 * only if it carries a valid, unrevoked Firebase session cookie whose user
 * has the `admin` custom claim (granted by scripts/create-admin.mjs).
 * Wrapped in React `cache` so multiple callers in one render verify once.
 */
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !isFirebaseConfigured()) return null;
  // Verification compares expiry against the clock, so it must run per request, never in a prerender.
  await connection();
  try {
    const decoded = await adminAuth().verifySessionCookie(token, true);
    if (decoded.admin !== true) return null;
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: (decoded.name as string | undefined) ?? null,
    };
  } catch (err) {
    // Expired, revoked or tampered cookies (auth/* codes) are simply "not signed in";
    // anything else (Firebase unreachable, bad credentials) is logged before treating it the same way.
    const code = (err as { code?: unknown }).code;
    if (typeof code !== "string" || !code.startsWith("auth/")) logFirebaseError("auth", err);
    return null;
  }
});

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
