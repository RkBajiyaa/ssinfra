import { beforeEach, describe, expect, it, vi } from "vitest";
import { FirebaseUnavailableError } from "@/lib/firebase/errors";

const mocks = vi.hoisted(() => ({
  createLead: vi.fn(),
  rateLimit: vi.fn(),
  after: vi.fn(),
  updateLead: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { url });
  }),
  setPackageActive: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "203.0.113.9" }) }));
vi.mock("next/server", () => ({ after: mocks.after, connection: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ refresh: vi.fn(), updateTag: mocks.updateTag, cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));
vi.mock("@/lib/leads/repo", () => ({ createLead: mocks.createLead, updateLead: mocks.updateLead }));
vi.mock("@/lib/push/send", () => ({
  notifyNewLead: vi.fn(),
  deleteSubscription: vi.fn(),
  hasSubscription: vi.fn(),
  isPushConfigured: () => false,
  saveSubscription: vi.fn(),
  sendTestNotification: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ requireAdmin: async () => ({ uid: "u1", email: "a@example.test", name: null }) }));
vi.mock("@/lib/packages/repo", () => ({
  PACKAGES_TAG: "service-packages",
  SlugTakenError: class extends Error {},
  deletePackage: vi.fn(),
  savePackage: vi.fn(),
  setPackageActive: mocks.setPackageActive,
}));

const { submitLead } = await import("@/lib/leads/actions");
const { updateLeadStatusAction, togglePackageAction } = await import("@/lib/admin/actions");

function enquiry(extra: Record<string, string> = {}) {
  const fd = new FormData();
  const values: Record<string, string> = {
    fullName: "Asha Verma",
    phone: "98290 12345",
    requestedService: "padel",
    projectCity: "Jaipur",
    projectState: "Rajasthan",
    idempotencyKey: "0b6c6c55-8a4f-4d0e-9a51-5b3e8f0f4b11",
    sourcePage: "/contact",
    elapsedMs: "8000",
    ...extra,
  };
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rateLimit.mockResolvedValue(true);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("submitLead persistence", () => {
  it("reports success only with the lead number Firestore confirmed", async () => {
    mocks.createLead.mockResolvedValue({ id: "x", leadNumber: "SSI-00042", created: true });
    await expect(submitLead(enquiry())).resolves.toEqual({ status: "success", leadNumber: "SSI-00042" });
    expect(mocks.after).toHaveBeenCalledOnce();
  });

  it("reports an honest error with a phone number when the write fails", async () => {
    mocks.createLead.mockRejectedValue(Object.assign(new Error("14 UNAVAILABLE: ECONNREFUSED"), { code: 14 }));
    const result = await submitLead(enquiry());
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.message).toMatch(/wasn't sent/);
      expect(result.message).toContain("096725 67423");
    }
    expect(mocks.after).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("[leads] firebase unavailable"));
  });

  it("says the save couldn't be confirmed when Firestore doesn't answer in time", async () => {
    vi.useFakeTimers();
    mocks.createLead.mockReturnValue(new Promise(() => {}));
    const pending = submitLead(enquiry());
    await vi.advanceTimersByTimeAsync(15_000);
    const result = await pending;
    vi.useRealTimers();
    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.message).toMatch(/couldn't confirm.*won't be duplicated/);
  });

  it("reports an error when Firebase isn't configured", async () => {
    mocks.rateLimit.mockRejectedValue(new FirebaseUnavailableError("not_configured", "Firebase is not configured (lead test)"));
    await expect(submitLead(enquiry())).resolves.toMatchObject({ status: "error" });
    expect(mocks.createLead).not.toHaveBeenCalled();
  });

  it("never claims success for a honeypot hit, and stores nothing", async () => {
    await expect(submitLead(enquiry({ website: "https://spam.example" }))).resolves.toMatchObject({ status: "error" });
    expect(mocks.createLead).not.toHaveBeenCalled();
  });
});

describe("admin writes", () => {
  it("reports a failed status update instead of 'Status saved'", async () => {
    mocks.updateLead.mockRejectedValue(Object.assign(new Error("16 UNAUTHENTICATED"), { code: 16 }));
    const fd = new FormData();
    fd.set("id", "lead-1");
    fd.set("status", "contacted");
    const state = await updateLeadStatusAction(null, fd);
    expect(state).toEqual({ ok: false, message: expect.stringMatching(/rejected the server's service-account credentials/) });
  });

  it("redirects a failed package toggle to an error notice and doesn't revalidate", async () => {
    mocks.setPackageActive.mockRejectedValue(Object.assign(new Error("down"), { code: 14 }));
    const fd = new FormData();
    fd.set("id", "pkg-1");
    fd.set("isActive", "true");
    await expect(togglePackageAction(fd)).rejects.toMatchObject({ url: "/admin/pricing?error=toggle" });
    expect(mocks.updateTag).not.toHaveBeenCalled();
  });
});
