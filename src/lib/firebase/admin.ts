import "server-only";
import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { describeFirebaseConfig, resolveFirebaseConfig, type FirebaseConfig } from "./config";
import { FirebaseUnavailableError } from "./errors";

/**
 * Server-only Firebase Admin access. The Admin SDK bypasses Firestore
 * security rules, so every caller of `db()` must do its own authorisation
 * (see lib/auth/session.ts). The rules file denies all client access.
 */

let resolved: FirebaseConfig | undefined;

/**
 * The server's Firebase configuration, resolved once per process.
 * NEXT_PUBLIC_FIREBASE_PROJECT_ID is read as a literal so Next.js inlines the
 * same build-time value the browser received: one project ID for both sides.
 */
export function firebaseConfig(): FirebaseConfig {
  return (resolved ??= resolveFirebaseConfig({
    ...process.env,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  }));
}

export function isFirebaseConfigured(): boolean {
  const { status } = firebaseConfig();
  return status === "emulator" || status === "service_account";
}

function app(): App {
  const config = firebaseConfig();
  if (config.status === "not_configured" || config.status === "invalid") {
    throw new FirebaseUnavailableError(
      config.status === "invalid" ? "invalid_config" : "not_configured",
      `Firebase is ${describeFirebaseConfig(config)}`,
    );
  }
  if (getApps().length) return getApp();
  // In emulator mode the SDK reads FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST itself and needs no credentials.
  if (config.status === "emulator") return initializeApp({ projectId: config.projectId });
  const { projectId, clientEmail, privateKey } = config;
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
}

let firestore: Firestore | undefined;

export function db(): Firestore {
  if (!firestore) {
    firestore = getFirestore(app());
    try {
      // Optional form fields arrive as undefined; drop them instead of throwing.
      firestore.settings({ ignoreUndefinedProperties: true });
    } catch {
      // Already configured by another copy of this module (dev reloads, cache scopes) sharing the instance.
    }
  }
  return firestore;
}

export function adminAuth() {
  return getAuth(app());
}

export const COLLECTIONS = {
  leads: "leads",
  counters: "counters",
  packages: "service_packages",
  adminProfiles: "admin_profiles",
  pushSubscriptions: "push_subscriptions",
  analyticsDaily: "analytics_daily",
  rateLimits: "rate_limits",
} as const;
