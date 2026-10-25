import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { COLLECTIONS, db } from "@/lib/firebase/admin";

type Rule = { limit: number; windowSeconds: number };

/**
 * Fixed-window counters stored in Firestore. Returns true when the request
 * is allowed. `expireAt` lets a Firestore TTL policy clean old windows up.
 */
export async function rateLimit(scope: string, key: string, rules: Rule[]): Promise<boolean> {
  const now = Date.now();
  const firestore = db();
  return firestore.runTransaction(async (tx) => {
    const refs = rules.map((r) => {
      const window = Math.floor(now / (r.windowSeconds * 1000));
      return firestore.collection(COLLECTIONS.rateLimits).doc(`${scope}_${key}_${r.windowSeconds}_${window}`);
    });
    const snaps = await Promise.all(refs.map((ref) => tx.get(ref)));
    const blocked = snaps.some((s, i) => ((s.get("count") as number | undefined) ?? 0) >= rules[i]!.limit);
    if (blocked) return false;
    snaps.forEach((s, i) => {
      const count = ((s.get("count") as number | undefined) ?? 0) + 1;
      const expireAt = Timestamp.fromMillis(now + rules[i]!.windowSeconds * 1000 * 2);
      tx.set(refs[i]!, { count, expireAt });
    });
    return true;
  });
}
