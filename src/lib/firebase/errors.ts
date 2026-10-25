/**
 * Turns Firestore / Firebase Admin failures into a small set of kinds, so
 * callers can show an honest message and logs say what actually went wrong
 * without leaking credentials.
 */

export type FirebaseFailureKind =
  | "not_configured" // required variables missing
  | "invalid_config" // variables present but wrong (see lib/firebase/config.ts)
  | "unavailable" // network / emulator down / Firestore unreachable
  | "timeout" // no answer in time
  | "auth_failed" // the server's credentials were rejected
  | "permission_denied" // credentials valid, but not allowed (IAM / API disabled)
  | "quota_exceeded"
  | "not_found" // e.g. the Firestore database hasn't been created
  | "unknown";

export class FirebaseUnavailableError extends Error {
  readonly kind: FirebaseFailureKind;
  constructor(kind: FirebaseFailureKind, message: string) {
    super(message);
    this.name = "FirebaseUnavailableError";
    this.kind = kind;
  }
}

// gRPC status codes used by the Firestore client.
const GRPC: Record<number, FirebaseFailureKind> = {
  4: "timeout", // DEADLINE_EXCEEDED
  5: "not_found",
  7: "permission_denied",
  8: "quota_exceeded", // RESOURCE_EXHAUSTED
  14: "unavailable",
  16: "auth_failed", // UNAUTHENTICATED
};

const NETWORK_CODES = new Set(["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "ECONNRESET", "ETIMEDOUT", "EHOSTUNREACH", "ENETUNREACH"]);

function codeOf(err: unknown): string | number | null {
  if (typeof err !== "object" || err === null) return null;
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" || typeof code === "number" ? code : null;
}

export function classifyFirebaseError(err: unknown): FirebaseFailureKind {
  if (err instanceof FirebaseUnavailableError) return err.kind;
  const code = codeOf(err);
  if (typeof code === "number" && GRPC[code]) return GRPC[code];
  if (typeof code === "string") {
    if (NETWORK_CODES.has(code)) return "unavailable";
    if (code === "app/invalid-credential") return "auth_failed";
    if (code === "auth/insufficient-permission") return "permission_denied";
    if (code === "auth/quota-exceeded") return "quota_exceeded";
    if (code === "auth/internal-error" || code === "app/network-error" || code === "auth/network-request-failed") return "unavailable";
  }
  const message = err instanceof Error ? err.message : String(err);
  if (/ECONNREFUSED|ENOTFOUND|EAI_AGAIN|No connection established|socket hang up/i.test(message)) return "unavailable";
  if (/invalid_grant|invalid jwt|failed to fetch a valid google oauth2 access token|unauthenticated/i.test(message)) return "auth_failed";
  if (/PERMISSION_DENIED|has not been used in project|is disabled/i.test(message)) return "permission_denied";
  if (/RESOURCE_EXHAUSTED|quota/i.test(message)) return "quota_exceeded";
  if (/DEADLINE_EXCEEDED|timed out/i.test(message)) return "timeout";
  return "unknown";
}

/** Strips anything key-like and keeps log lines short. */
export function sanitizeErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return message
    .replace(/-----BEGIN [A-Z ]+-----[\s\S]*?(-----END [A-Z ]+-----|$)/g, "[redacted key]")
    .replace(/[A-Za-z0-9+/_=-]{40,}/g, "[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

const loggedConfigProblems = new Set<string>();

/**
 * Logs one sanitized line and returns the failure kind. Configuration
 * problems repeat on every request, so each distinct one is logged once.
 */
export function logFirebaseError(scope: string, err: unknown): FirebaseFailureKind {
  const kind = classifyFirebaseError(err);
  const code = codeOf(err);
  const line = `[${scope}] firebase ${kind}${code !== null ? ` (code ${code})` : ""}: ${sanitizeErrorMessage(err)}`;
  if (kind === "not_configured" || kind === "invalid_config") {
    if (loggedConfigProblems.has(line)) return kind;
    loggedConfigProblems.add(line);
    console.warn(line);
  } else {
    console.error(line);
  }
  return kind;
}

/** Rejects with a `timeout` failure if the promise hasn't settled in time. The underlying call isn't cancelled. */
export function withTimeout<T>(promise: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new FirebaseUnavailableError("timeout", `${what} took longer than ${ms} ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Plain-language reason for the admin, who can act on it. */
export function adminFailureMessage(kind: FirebaseFailureKind): string {
  switch (kind) {
    case "not_configured":
    case "invalid_config":
      return "Not saved: Firebase isn't configured correctly on the server. Check the server logs and environment variables.";
    case "auth_failed":
      return "Not saved: Firebase rejected the server's service-account credentials.";
    case "permission_denied":
      return "Not saved: the service account isn't allowed to write to Firestore.";
    case "quota_exceeded":
      return "Not saved: the Firebase usage quota is exhausted for now. Try again later.";
    case "not_found":
      return "Not saved: the record or the Firestore database wasn't found.";
    default:
      return "Not saved: the database didn't respond. Try again in a moment.";
  }
}
