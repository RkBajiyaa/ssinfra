/**
 * Decides how the server reaches Firebase, from environment variables alone.
 *
 * Kept free of imports and side effects so the app (lib/firebase/admin.ts),
 * next.config.ts, the CLI scripts (scripts/_firebase.mjs, via Node's type
 * stripping) and the unit tests all apply exactly the same rules.
 *
 * Rules:
 * - NEXT_PUBLIC_FIREBASE_PROJECT_ID is the one project ID, for browser and server.
 *   FIREBASE_PROJECT_ID is no longer read; if it's set to anything else the config is invalid.
 * - Emulator mode: all three emulator hosts set. Never allowed on a Vercel deployment.
 * - Real mode: a service account (FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY) from the same project.
 *   Application Default Credentials aren't used: Vercel has no Google metadata server to supply them.
 */

export type FirebaseEnv = Record<string, string | undefined>;

export type FirebaseConfig =
  | { status: "emulator"; projectId: string; firestoreHost: string; authHost: string; warnings: string[] }
  | {
      status: "service_account";
      projectId: string;
      clientEmail: string;
      privateKey: string;
      warnings: string[];
    }
  | { status: "not_configured"; projectId: string | null; missing: string[]; warnings: string[] }
  | { status: "invalid"; projectId: string | null; problems: string[]; warnings: string[] };

export const EMULATOR_VARS = [
  "FIRESTORE_EMULATOR_HOST",
  "FIREBASE_AUTH_EMULATOR_HOST",
  "NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST",
] as const;

// Google Cloud project IDs: 6–30 chars, lowercase letters, digits and hyphens, starting with a letter.
const PROJECT_ID = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/;
const HOST_PORT = /^[\w.-]+:\d{1,5}$/;
const SERVICE_ACCOUNT_EMAIL = /^[^@\s]+@([a-z][a-z0-9-]{4,28}[a-z0-9])\.iam\.gserviceaccount\.com$/;

function read(env: FirebaseEnv, key: string): string | null {
  const v = env[key]?.trim();
  return v ? v : null;
}

/** Hosting dashboards store the multi-line PEM key with literal "\n"; some also keep the wrapping quotes. */
export function normalizePrivateKey(raw: string): string {
  let key = raw.trim();
  if (key.length > 1 && key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);
  return key.replace(/\\n/g, "\n");
}

export function resolveFirebaseConfig(env: FirebaseEnv): FirebaseConfig {
  const projectId = read(env, "NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  const legacyProjectId = read(env, "FIREBASE_PROJECT_ID");
  const problems: string[] = [];
  const warnings: string[] = [];

  if (legacyProjectId && legacyProjectId !== projectId) {
    problems.push(
      `FIREBASE_PROJECT_ID ("${legacyProjectId}") conflicts with NEXT_PUBLIC_FIREBASE_PROJECT_ID ("${projectId ?? ""}"). ` +
        "Remove FIREBASE_PROJECT_ID: NEXT_PUBLIC_FIREBASE_PROJECT_ID is the only project ID.",
    );
  } else if (legacyProjectId) {
    warnings.push("FIREBASE_PROJECT_ID is no longer read and can be removed.");
  }
  if (projectId && !PROJECT_ID.test(projectId)) {
    problems.push(`NEXT_PUBLIC_FIREBASE_PROJECT_ID ("${projectId}") isn't a valid Firebase project ID.`);
  }

  const emulator = Object.fromEntries(EMULATOR_VARS.map((k) => [k, read(env, k)])) as Record<
    (typeof EMULATOR_VARS)[number],
    string | null
  >;
  const emulatorSet = EMULATOR_VARS.filter((k) => emulator[k]);

  if (emulatorSet.length > 0) {
    if (env.VERCEL) {
      problems.push(
        `${emulatorSet.join(", ")} must not be set on Vercel. Emulators exist only on a developer's machine; remove these variables from the Vercel project.`,
      );
    }
    const unset = EMULATOR_VARS.filter((k) => !emulator[k]);
    if (unset.length) {
      problems.push(`Emulator mode needs all three emulator hosts; ${unset.join(", ")} ${unset.length === 1 ? "is" : "are"} missing.`);
    }
    for (const k of emulatorSet) {
      if (!HOST_PORT.test(emulator[k]!)) problems.push(`${k} must look like 127.0.0.1:8080.`);
    }
    if (
      emulator.FIREBASE_AUTH_EMULATOR_HOST &&
      emulator.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST &&
      emulator.FIREBASE_AUTH_EMULATOR_HOST !== emulator.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST
    ) {
      problems.push("FIREBASE_AUTH_EMULATOR_HOST and NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST must be the same host.");
    }
    if (!projectId) problems.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID is required, also with emulators.");
    if (problems.length) return { status: "invalid", projectId, problems, warnings };
    if (!projectId!.startsWith("demo-")) {
      warnings.push(`Emulators are running as "${projectId}". A demo-* project ID guarantees nothing can reach live Firebase.`);
    }
    return {
      status: "emulator",
      projectId: projectId!,
      firestoreHost: emulator.FIRESTORE_EMULATOR_HOST!,
      authHost: emulator.FIREBASE_AUTH_EMULATOR_HOST!,
      warnings,
    };
  }

  // Real Firebase.
  if (projectId?.startsWith("demo-")) {
    problems.push(`"${projectId}" is an emulator-only demo project. Use your real project ID or set the emulator hosts.`);
  }
  const clientEmail = read(env, "FIREBASE_CLIENT_EMAIL");
  const rawKey = read(env, "FIREBASE_PRIVATE_KEY");
  const missing = [
    !projectId && "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    !clientEmail && "FIREBASE_CLIENT_EMAIL",
    !rawKey && "FIREBASE_PRIVATE_KEY",
  ].filter((k): k is string => Boolean(k));

  if (clientEmail) {
    const owner = SERVICE_ACCOUNT_EMAIL.exec(clientEmail)?.[1];
    if (!owner) {
      problems.push("FIREBASE_CLIENT_EMAIL should be a service account address ending in .iam.gserviceaccount.com.");
    } else if (projectId && owner !== projectId) {
      problems.push(`FIREBASE_CLIENT_EMAIL belongs to project "${owner}", not "${projectId}". Download the key from the right project.`);
    }
  }
  const privateKey = rawKey ? normalizePrivateKey(rawKey) : null;
  if (privateKey && !/^-----BEGIN PRIVATE KEY-----\n[\s\S]+\n-----END PRIVATE KEY-----\n?$/.test(privateKey)) {
    problems.push(
      'FIREBASE_PRIVATE_KEY isn\'t a PEM private key. Paste the "private_key" value from the JSON key file, including the BEGIN/END lines and the \\n line breaks.',
    );
  }
  if (problems.length) return { status: "invalid", projectId, problems, warnings };
  if (missing.length) return { status: "not_configured", projectId, missing, warnings };

  if (!read(env, "NEXT_PUBLIC_FIREBASE_API_KEY") || !read(env, "NEXT_PUBLIC_FIREBASE_APP_ID")) {
    warnings.push("NEXT_PUBLIC_FIREBASE_API_KEY / NEXT_PUBLIC_FIREBASE_APP_ID are missing, so admin sign-in won't work.");
  }
  return { status: "service_account", projectId: projectId!, clientEmail: clientEmail!, privateKey: privateKey!, warnings };
}

/** One safe line for logs: never includes the private key or the full service-account address. */
export function describeFirebaseConfig(config: FirebaseConfig): string {
  const project = config.projectId ?? "(none)";
  const warn = config.warnings.length ? ` Warnings: ${config.warnings.join(" ")}` : "";
  switch (config.status) {
    case "emulator":
      return `emulator mode, project ${project} (Firestore ${config.firestoreHost}, Auth ${config.authHost}).${warn}`;
    case "service_account":
      return `project ${project} with a service account.${warn}`;
    case "not_configured":
      return `not configured (missing ${config.missing.join(", ")}). Public pages show fallbacks; enquiries can't be saved.${warn}`;
    case "invalid":
      return `INVALID configuration: ${config.problems.join(" ")} Firebase is disabled until this is fixed.${warn}`;
  }
}
