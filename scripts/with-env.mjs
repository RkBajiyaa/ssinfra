#!/usr/bin/env node
/**
 * Runs a command with an env file applied on top of the current environment:
 *   node scripts/with-env.mjs .env.emulator next dev
 *
 * Why not `node --env-file`: Next.js copies Node flags into NODE_OPTIONS for its
 * worker processes, where --env-file is rejected, so builds and dev workers crash.
 * Values already set in the environment win, matching --env-file and Next.js.
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";

const [file, command, ...args] = process.argv.slice(2);
if (!file || !command) {
  console.error("Usage: node scripts/with-env.mjs <env-file> <command> [args...]");
  process.exit(1);
}

const fromFile = parseEnv(readFileSync(file, "utf8"));
const env = { ...fromFile, ...process.env };
const child = spawn(command, args, { env, stdio: "inherit", shell: process.platform === "win32" });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code, signal) => (signal ? process.kill(process.pid, signal) : process.exit(code ?? 1)));
