import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "Admin SS Infra", template: "%s | Admin SS Infra" },
  applicationName: "Admin SS Infra",
  manifest: "/admin.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "SS Admin", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#102a50",
  viewportFit: "cover",
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="min-h-dvh bg-paper">{children}</div>;
}
