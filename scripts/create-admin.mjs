#!/usr/bin/env node
/**
 * Admin account management. There is no public sign-up: admins exist only
 * because this script granted them the `admin` custom claim.
 *
 *   node --env-file=.env.local scripts/create-admin.mjs create <email> "<Display name>"
 *        creates the user (prompts for a password) and grants admin
 *   node --env-file=.env.local scripts/create-admin.mjs grant <email>
 *        grants admin to an existing Firebase Auth user
 *   node --env-file=.env.local scripts/create-admin.mjs revoke <email>
 *        removes admin and signs the user out of every device
 *   node --env-file=.env.local scripts/create-admin.mjs list
 */
import { createInterface } from "node:readline/promises";
import { FieldValue } from "firebase-admin/firestore";
import { auth, db, target } from "./_firebase.mjs";

const [command, email, displayName] = process.argv.slice(2);

async function askPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD; // non-interactive use (tests)
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const pw = await rl.question("Password (min 10 characters): ");
  rl.close();
  return pw;
}

async function grant(user, name) {
  await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), admin: true });
  await db.collection("admin_profiles").doc(user.uid).set(
    {
      authUserId: user.uid,
      email: user.email,
      displayName: name ?? user.displayName ?? null,
      role: "admin",
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  console.log(`Granted admin to ${user.email} (${target}).`);
}

try {
  switch (command) {
    case "create": {
      if (!email) throw new Error("Usage: create <email> [display name]");
      const password = await askPassword();
      if (password.length < 10) throw new Error("Use a password of at least 10 characters.");
      const user = await auth.createUser({ email, password, displayName, emailVerified: true });
      await grant(user, displayName);
      break;
    }
    case "grant": {
      if (!email) throw new Error("Usage: grant <email>");
      await grant(await auth.getUserByEmail(email), displayName);
      break;
    }
    case "revoke": {
      if (!email) throw new Error("Usage: revoke <email>");
      const user = await auth.getUserByEmail(email);
      const claims = { ...(user.customClaims ?? {}) };
      delete claims.admin;
      await auth.setCustomUserClaims(user.uid, claims);
      await auth.revokeRefreshTokens(user.uid); // invalidates existing session cookies
      await db.collection("admin_profiles").doc(user.uid).delete();
      console.log(`Revoked admin from ${email} and signed them out everywhere (${target}).`);
      break;
    }
    case "list": {
      const snap = await db.collection("admin_profiles").get();
      if (snap.empty) console.log("No admins.");
      snap.forEach((d) => console.log(`${d.get("email")}  ${d.get("displayName") ?? ""}`));
      break;
    }
    default:
      console.log("Commands: create <email> [name] | grant <email> | revoke <email> | list");
      process.exitCode = 1;
  }
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
}
