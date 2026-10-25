import { execFileSync } from "node:child_process";

/** Resets the emulator database and re-creates the test admin + package templates. */
export default async function globalSetup() {
  const project = "demo-ssinfra";
  const fs = process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";
  const auth = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";

  const wipe = await fetch(`http://${fs}/emulator/v1/projects/${project}/databases/(default)/documents`, { method: "DELETE" });
  if (!wipe.ok) throw new Error(`Couldn't reset the Firestore emulator (${wipe.status}). Is it running?`);
  await fetch(`http://${auth}/emulator/v1/projects/${project}/accounts`, { method: "DELETE" });

  const env = { ...process.env, ADMIN_PASSWORD: "TestAdmin#2026" };
  const run = (script: string, ...args: string[]) =>
    execFileSync("node", ["--no-warnings", "--env-file=.env.emulator", `scripts/${script}`, ...args], { env, stdio: "pipe" });
  run("create-admin.mjs", "create", "owner@example.test", "Test Owner");
  run("seed-packages.mjs");
}
