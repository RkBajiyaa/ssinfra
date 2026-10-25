import type { Metadata } from "next";
import { LogoMark } from "@/components/brand/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3">
          <LogoMark className="size-11" />
          <div>
            <h1 className="font-display text-[1.9rem] leading-none font-bold text-navy">Admin SS Infra</h1>
            <p className="mt-1 text-sm text-muted">Leads, pricing and visitor statistics</p>
          </div>
        </div>
        <div className="mt-8 border border-line bg-white p-6">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          Access is limited to authorised SS Infratech staff. Accounts are created by the site administrator.
        </p>
      </div>
    </main>
  );
}
