import { describe, expect, it } from "vitest";
import { describeFirebaseConfig, normalizePrivateKey, resolveFirebaseConfig } from "@/lib/firebase/config";

// A syntactically valid PEM shape; not a real key.
const KEY = "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC\\n-----END PRIVATE KEY-----\\n";
const real = {
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "ss-infra-14cf8",
  NEXT_PUBLIC_FIREBASE_API_KEY: "web-key",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:1:web:1",
  FIREBASE_CLIENT_EMAIL: "firebase-adminsdk-abc12@ss-infra-14cf8.iam.gserviceaccount.com",
  FIREBASE_PRIVATE_KEY: KEY,
};
const emulator = {
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-ssinfra",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
};

describe("resolveFirebaseConfig", () => {
  it("reports missing configuration without failing", () => {
    const c = resolveFirebaseConfig({});
    expect(c.status).toBe("not_configured");
    if (c.status === "not_configured") {
      expect(c.missing).toEqual(["NEXT_PUBLIC_FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"]);
    }
  });

  it("treats a project ID without credentials as not configured", () => {
    const c = resolveFirebaseConfig({ NEXT_PUBLIC_FIREBASE_PROJECT_ID: "ss-infra-14cf8", FIREBASE_PRIVATE_KEY: "  " });
    expect(c).toMatchObject({ status: "not_configured", projectId: "ss-infra-14cf8" });
  });

  it("uses the public project ID with a matching service account", () => {
    const c = resolveFirebaseConfig(real);
    expect(c.status).toBe("service_account");
    if (c.status === "service_account") {
      expect(c.projectId).toBe("ss-infra-14cf8");
      expect(c.privateKey).toContain("\n");
      expect(c.privateKey).not.toContain("\\n");
      expect(c.warnings).toEqual([]);
    }
  });

  it("rejects a FIREBASE_PROJECT_ID that conflicts with the canonical one", () => {
    const c = resolveFirebaseConfig({ ...real, FIREBASE_PROJECT_ID: "demo-ssinfra" });
    expect(c.status).toBe("invalid");
    if (c.status === "invalid") expect(c.problems.join()).toMatch(/conflicts with NEXT_PUBLIC_FIREBASE_PROJECT_ID/);
  });

  it("accepts a redundant matching FIREBASE_PROJECT_ID with a warning", () => {
    const c = resolveFirebaseConfig({ ...real, FIREBASE_PROJECT_ID: "ss-infra-14cf8" });
    expect(c.status).toBe("service_account");
    expect(c.warnings.join()).toMatch(/no longer read/);
  });

  it("rejects a service account from another project", () => {
    const c = resolveFirebaseConfig({ ...real, FIREBASE_CLIENT_EMAIL: "firebase-adminsdk-x@other-project.iam.gserviceaccount.com" });
    expect(c.status).toBe("invalid");
    if (c.status === "invalid") expect(c.problems.join()).toMatch(/belongs to project "other-project"/);
  });

  it("rejects a private key that isn't PEM", () => {
    const c = resolveFirebaseConfig({ ...real, FIREBASE_PRIVATE_KEY: "abc123" });
    expect(c.status).toBe("invalid");
  });

  it("rejects demo projects outside the emulators", () => {
    const c = resolveFirebaseConfig({ ...real, NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-ssinfra" });
    expect(c.status).toBe("invalid");
  });

  it("resolves emulator mode when all three hosts are set", () => {
    const c = resolveFirebaseConfig(emulator);
    expect(c).toMatchObject({ status: "emulator", projectId: "demo-ssinfra", firestoreHost: "127.0.0.1:8080" });
  });

  it("rejects partial emulator settings", () => {
    const c = resolveFirebaseConfig({ ...real, FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080" });
    expect(c.status).toBe("invalid");
  });

  it("never allows emulators on Vercel", () => {
    const c = resolveFirebaseConfig({ ...emulator, VERCEL: "1" });
    expect(c.status).toBe("invalid");
    if (c.status === "invalid") expect(c.problems.join()).toMatch(/must not be set on Vercel/);
  });

  it("warns when emulators use a non-demo project", () => {
    const c = resolveFirebaseConfig({ ...emulator, NEXT_PUBLIC_FIREBASE_PROJECT_ID: "ss-infra-14cf8" });
    expect(c.status).toBe("emulator");
    expect(c.warnings.join()).toMatch(/demo-\*/);
  });

  it("never puts the private key or full client email in the log line", () => {
    const line = describeFirebaseConfig(resolveFirebaseConfig(real));
    expect(line).not.toContain("PRIVATE KEY");
    expect(line).not.toContain("firebase-adminsdk");
    expect(line).toContain("ss-infra-14cf8");
  });
});

describe("normalizePrivateKey", () => {
  it("strips wrapping quotes and expands \\n", () => {
    expect(normalizePrivateKey(`"a\\nb"`)).toBe("a\nb");
  });
});
