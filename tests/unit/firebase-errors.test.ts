import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FirebaseUnavailableError,
  classifyFirebaseError,
  logFirebaseError,
  sanitizeErrorMessage,
  withTimeout,
} from "@/lib/firebase/errors";

const grpc = (code: number, message: string) => Object.assign(new Error(message), { code });

describe("classifyFirebaseError", () => {
  it.each([
    [grpc(14, "14 UNAVAILABLE: No connection established. Last error: connect ECONNREFUSED 127.0.0.1:8080"), "unavailable"],
    [grpc(4, "4 DEADLINE_EXCEEDED"), "timeout"],
    [grpc(7, "7 PERMISSION_DENIED: Missing or insufficient permissions."), "permission_denied"],
    [grpc(16, "16 UNAUTHENTICATED"), "auth_failed"],
    [grpc(8, "8 RESOURCE_EXHAUSTED: Quota exceeded."), "quota_exceeded"],
    [grpc(5, "5 NOT_FOUND: The database (default) does not exist"), "not_found"],
    [Object.assign(new Error("Failed to parse private key"), { code: "app/invalid-credential" }), "auth_failed"],
    [Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" }), "unavailable"],
    [new Error("invalid_grant: Invalid JWT Signature."), "auth_failed"],
    [new FirebaseUnavailableError("not_configured", "missing"), "not_configured"],
    [new Error("something else"), "unknown"],
  ])("%s → %s", (err, kind) => {
    expect(classifyFirebaseError(err)).toBe(kind);
  });
});

describe("sanitizeErrorMessage", () => {
  it("redacts key material and long tokens", () => {
    const msg = sanitizeErrorMessage(
      new Error("bad -----BEGIN PRIVATE KEY-----\nMIIEvQ\n-----END PRIVATE KEY----- token eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAifQabc"),
    );
    expect(msg).not.toContain("MIIEvQ");
    expect(msg).not.toContain("eyJhbGci");
    expect(msg).toContain("[redacted key]");
  });
});

describe("logFirebaseError", () => {
  afterEach(() => vi.restoreAllMocks());

  it("logs one sanitized line with the kind and code", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(logFirebaseError("packages", grpc(14, "14 UNAVAILABLE: down"))).toBe("unavailable");
    expect(spy).toHaveBeenCalledWith("[packages] firebase unavailable (code 14): 14 UNAVAILABLE: down");
  });

  it("logs each configuration problem only once", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const err = new FirebaseUnavailableError("not_configured", "Firebase is not configured (once-test)");
    logFirebaseError("x", err);
    logFirebaseError("x", err);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("withTimeout", () => {
  it("rejects with a timeout failure when the call hangs", async () => {
    vi.useFakeTimers();
    const pending = withTimeout(new Promise(() => {}), 1000, "Read");
    const check = expect(pending).rejects.toMatchObject({ kind: "timeout" });
    await vi.advanceTimersByTimeAsync(1000);
    await check;
    vi.useRealTimers();
  });

  it("passes results through", async () => {
    await expect(withTimeout(Promise.resolve(7), 1000, "Read")).resolves.toBe(7);
  });
});
