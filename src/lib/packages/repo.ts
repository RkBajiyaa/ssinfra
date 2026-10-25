import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { FieldValue, Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import { connection } from "next/server";
import { COLLECTIONS, db } from "@/lib/firebase/admin";
import { logFirebaseError, withTimeout, type FirebaseFailureKind } from "@/lib/firebase/errors";
import {
  PACKAGE_CATEGORIES,
  PRICE_MODES,
  type PackageCategory,
  type PackageInput,
  type PriceMode,
  type ServicePackage,
} from "./schema";

export const PACKAGES_TAG = "service-packages";

function list(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function toPackage(snap: DocumentSnapshot): ServicePackage {
  const d = snap.data() ?? {};
  const mode = PRICE_MODES.some((m) => m.id === d.priceMode) ? (d.priceMode as PriceMode) : "contact";
  const category = PACKAGE_CATEGORIES.some((c) => c.id === d.serviceCategory)
    ? (d.serviceCategory as PackageCategory)
    : "padel";
  return {
    id: snap.id,
    slug: String(d.slug ?? snap.id),
    name: String(d.name ?? ""),
    serviceCategory: category,
    shortDescription: String(d.shortDescription ?? ""),
    includedFeatures: list(d.includedFeatures),
    exclusions: list(d.exclusions),
    optionalFeatures: list(d.optionalFeatures),
    priceMode: mode,
    priceAmount: typeof d.priceAmount === "number" ? d.priceAmount : null,
    priceCurrency: "INR",
    priceUnit: typeof d.priceUnit === "string" && d.priceUnit ? d.priceUnit : null,
    ctaLabel: String(d.ctaLabel ?? "Request a Quote"),
    displayOrder: typeof d.displayOrder === "number" ? d.displayOrder : 0,
    isActive: d.isActive === true,
    updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate().toISOString() : null,
  };
}

const byOrder = (a: ServicePackage, b: ServicePackage) =>
  a.displayOrder - b.displayOrder || a.name.localeCompare(b.name);

export type PublishedPackages =
  | { status: "ok"; packages: ServicePackage[] }
  | { status: "unavailable"; reason: FirebaseFailureKind };

const PUBLIC_READ_TIMEOUT_MS = 6000;

/**
 * Public read: only active packages. Cached and tagged so an admin save
 * (updateTag) shows on the site immediately without a redeploy.
 *
 * Failures must be caught *inside* the cached scope: an error thrown from a
 * "use cache" function fails the whole render (and `next build`) even when
 * the caller catches it, and production builds replace its message with a
 * digest, so the cause can only be classified here. A failure is remembered
 * for seconds, not hours, so pricing returns soon after the database does.
 */
async function readPublishedPackages(): Promise<PublishedPackages> {
  "use cache";
  cacheTag(PACKAGES_TAG);
  try {
    const query = db().collection(COLLECTIONS.packages).where("isActive", "==", true);
    const snap = await withTimeout(query.get(), PUBLIC_READ_TIMEOUT_MS, "Package read");
    const packages = snap.docs.map(toPackage).sort(byOrder);
    cacheLife("hours");
    return { status: "ok", packages };
  } catch (err) {
    cacheLife("seconds");
    return { status: "unavailable", reason: logFirebaseError("packages", err) };
  }
}

/**
 * Request-time only: `connection()` keeps this out of static prerendering, so
 * `next build` never needs a database and a build can't bake in stale or
 * failed pricing. Callers must sit inside a <Suspense> boundary.
 */
export async function getPublishedPackages(): Promise<PublishedPackages> {
  await connection();
  return readPublishedPackages();
}

/* ---------- admin-only (caller must have passed requireAdmin) ---------- */

export async function getAllPackages(): Promise<ServicePackage[]> {
  const snap = await db().collection(COLLECTIONS.packages).get();
  return snap.docs.map(toPackage).sort(byOrder);
}

export async function getPackage(id: string): Promise<ServicePackage | null> {
  if (!/^[\w-]{1,128}$/.test(id)) return null;
  const snap = await db().collection(COLLECTIONS.packages).doc(id).get();
  return snap.exists ? toPackage(snap) : null;
}

export class SlugTakenError extends Error {}

/** Creates or updates a package. Slugs are unique; the doc id is stable once created. */
export async function savePackage(id: string | null, input: PackageInput): Promise<string> {
  const firestore = db();
  const col = firestore.collection(COLLECTIONS.packages);
  return firestore.runTransaction(async (tx) => {
    const clash = await tx.get(col.where("slug", "==", input.slug).limit(2));
    if (clash.docs.some((d) => d.id !== id)) throw new SlugTakenError(input.slug);

    const ref = id ? col.doc(id) : col.doc();
    const data = { ...input, priceCurrency: "INR", updatedAt: FieldValue.serverTimestamp() };
    if (id) {
      const existing = await tx.get(ref);
      if (!existing.exists) throw new Error("Package not found");
      tx.update(ref, data);
    } else {
      tx.create(ref, { ...data, createdAt: FieldValue.serverTimestamp() });
    }
    return ref.id;
  });
}

export async function setPackageActive(id: string, isActive: boolean) {
  await db().collection(COLLECTIONS.packages).doc(id).update({ isActive, updatedAt: FieldValue.serverTimestamp() });
}

export async function deletePackage(id: string) {
  await db().collection(COLLECTIONS.packages).doc(id).delete();
}
