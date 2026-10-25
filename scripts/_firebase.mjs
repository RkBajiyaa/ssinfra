// Shared Admin SDK setup for the CLI scripts. Same variables and the same validation as the app
// (src/lib/firebase/config.ts, loaded through Node's built-in TypeScript type stripping).
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { describeFirebaseConfig, resolveFirebaseConfig } from "../src/lib/firebase/config.ts";

const config = resolveFirebaseConfig(process.env);
if (config.status !== "emulator" && config.status !== "service_account") {
  console.error(`Firebase is ${describeFirebaseConfig(config)}`);
  console.error("Run with: node --env-file=.env.local scripts/<name>.mjs   (or --env-file=.env.emulator for the emulators)");
  process.exit(1);
}

const app =
  config.status === "emulator"
    ? initializeApp({ projectId: config.projectId })
    : initializeApp({
        projectId: config.projectId,
        credential: cert({ projectId: config.projectId, clientEmail: config.clientEmail, privateKey: config.privateKey }),
      });

export const auth = getAuth(app);
export const db = getFirestore(app);
db.settings({ ignoreUndefinedProperties: true });
export const target = config.status === "emulator" ? `emulator, project ${config.projectId}` : `project ${config.projectId}`;
