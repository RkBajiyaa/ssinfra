"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { clientAuth } from "@/lib/firebase/client";
import { buttonClass } from "@/components/ui/button";

function messageFor(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
      case "auth/invalid-email":
        return "That email and password don't match an admin account.";
      case "auth/too-many-requests":
        return "Too many attempts. Wait a few minutes and try again.";
      case "auth/network-request-failed":
        return "No connection. Check your internet and try again.";
      case "auth/user-disabled":
        return "This account has been disabled.";
    }
  }
  if (err instanceof Error && err.message.includes("Firebase web config")) {
    return "Sign-in isn't configured yet. Add the Firebase settings to the environment.";
  }
  return "Sign-in failed. Try again.";
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const auth = await clientAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      // The browser copy of the session isn't needed once the server cookie exists.
      await signOut(auth);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Sign-in failed. Try again.");
        setPending(false);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(messageFor(err));
      setPending(false);
    }
  }

  const input =
    "mt-1.5 block min-h-12 w-full rounded-[3px] border border-line bg-white px-3.5 text-base focus:outline-2 focus:outline-offset-0 focus:outline-turf";

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <div>
        <label htmlFor="email" className="text-[0.95rem] font-semibold text-navy">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className={input} />
      </div>
      <div>
        <label htmlFor="password" className="text-[0.95rem] font-semibold text-navy">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={input} />
      </div>
      {error && (
        <p role="alert" className="border-l-2 border-danger bg-danger/[0.06] px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className={buttonClass("dark", "lg", "w-full")}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
