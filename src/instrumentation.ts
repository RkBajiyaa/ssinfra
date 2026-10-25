import { describeFirebaseConfig, resolveFirebaseConfig } from "@/lib/firebase/config";

/**
 * Runs once when a server instance starts: report how Firebase is configured
 * so a misconfiguration shows up in the deployment log straight away, not
 * only when the first enquiry fails. It never stops the server, because the
 * public site must keep working without a database.
 */
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const config = resolveFirebaseConfig({
    ...process.env,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
  const line = `[firebase] ${describeFirebaseConfig(config)}`;
  if (config.status === "invalid" || config.status === "not_configured") console.warn(line);
  else console.info(line);
}
