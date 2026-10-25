"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  inMemoryPersistence,
  setPersistence,
  type Auth,
} from "firebase/auth";

/**
 * Browser Firebase is used for one thing only: exchanging the admin's
 * email/password for an ID token, which the server turns into an httpOnly
 * session cookie. No Firestore access happens from the browser.
 */
let auth: Auth | undefined;

export async function clientAuth(): Promise<Auth> {
  if (auth) return auth;
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  if (!config.apiKey || !config.projectId) {
    throw new Error("Firebase web config is missing. Set NEXT_PUBLIC_FIREBASE_* variables.");
  }
  const app = getApps().length ? getApp() : initializeApp(config);
  auth = getAuth(app);
  const emulator = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
  if (emulator) connectAuthEmulator(auth, `http://${emulator}`, { disableWarnings: true });
  // The session lives in our cookie; don't keep a second copy in IndexedDB.
  await setPersistence(auth, inMemoryPersistence);
  return auth;
}
