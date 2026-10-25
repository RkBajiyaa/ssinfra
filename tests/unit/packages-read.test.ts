import { beforeEach, describe, expect, it, vi } from "vitest";
import { FirebaseUnavailableError } from "@/lib/firebase/errors";

const mocks = vi.hoisted(() => ({
  db: vi.fn(),
  cacheLife: vi.fn(),
  connection: vi.fn(async () => {}),
}));

vi.mock("next/cache", () => ({ cacheLife: mocks.cacheLife, cacheTag: vi.fn() }));
vi.mock("next/server", () => ({ connection: mocks.connection }));
vi.mock("@/lib/firebase/admin", () => ({
  db: mocks.db,
  COLLECTIONS: { packages: "service_packages" },
}));

const { getPublishedPackages } = await import("@/lib/packages/repo");

function firestoreReturning(get: () => Promise<unknown>) {
  return { collection: () => ({ where: () => ({ get }) }) };
}
const doc = (id: string, data: Record<string, unknown>) => ({ id, data: () => data });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("getPublishedPackages", () => {
  it("returns active packages in display order and caches them for hours", async () => {
    mocks.db.mockReturnValue(
      firestoreReturning(async () => ({
        docs: [
          doc("b", { name: "Second", slug: "second", displayOrder: 2, isActive: true, priceMode: "fixed", priceAmount: 5 }),
          doc("a", { name: "First", slug: "first", displayOrder: 1, isActive: true }),
        ],
      })),
    );
    const result = await getPublishedPackages();
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.packages.map((p) => p.slug)).toEqual(["first", "second"]);
      expect(result.packages[1]).toMatchObject({ priceMode: "fixed", priceAmount: 5 });
    }
    expect(mocks.cacheLife).toHaveBeenCalledExactlyOnceWith("hours");
    expect(mocks.connection).toHaveBeenCalled(); // request-time only, never during the build
  });

  it("falls back when Firestore is unreachable and only caches that for seconds", async () => {
    mocks.db.mockReturnValue(
      firestoreReturning(async () => {
        throw Object.assign(new Error("14 UNAVAILABLE: connect ECONNREFUSED 127.0.0.1:8080"), { code: 14 });
      }),
    );
    await expect(getPublishedPackages()).resolves.toEqual({ status: "unavailable", reason: "unavailable" });
    expect(mocks.cacheLife).toHaveBeenCalledExactlyOnceWith("seconds");
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("[packages] firebase unavailable (code 14)"));
  });

  it("falls back when Firebase isn't configured", async () => {
    mocks.db.mockImplementation(() => {
      throw new FirebaseUnavailableError("not_configured", "Firebase is not configured (packages test)");
    });
    await expect(getPublishedPackages()).resolves.toEqual({ status: "unavailable", reason: "not_configured" });
  });

  it("distinguishes permission and quota failures", async () => {
    mocks.db.mockReturnValue(firestoreReturning(async () => Promise.reject(Object.assign(new Error("denied"), { code: 7 }))));
    await expect(getPublishedPackages()).resolves.toMatchObject({ reason: "permission_denied" });
    mocks.db.mockReturnValue(firestoreReturning(async () => Promise.reject(Object.assign(new Error("quota"), { code: 8 }))));
    await expect(getPublishedPackages()).resolves.toMatchObject({ reason: "quota_exceeded" });
  });

  it("gives up on a hanging read instead of holding the page", async () => {
    vi.useFakeTimers();
    mocks.db.mockReturnValue(firestoreReturning(() => new Promise(() => {})));
    const pending = getPublishedPackages();
    await vi.advanceTimersByTimeAsync(6000);
    await expect(pending).resolves.toEqual({ status: "unavailable", reason: "timeout" });
    vi.useRealTimers();
  });
});
