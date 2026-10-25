import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center bg-navy text-white">
      <div className="container-site py-20">
        <LogoMark className="size-12" />
        <h1 className="mt-8 text-h1 uppercase">Page not found</h1>
        <p className="mt-4 max-w-lg text-lg text-white/75">
          That address doesn&rsquo;t match a page on this site. It may have moved, or the link may be mistyped.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className={buttonClass("light", "lg")}>
            Go to the home page
          </Link>
          <Link href="/contact" className={buttonClass("outline-light", "lg")}>
            Contact us
          </Link>
        </div>
      </div>
    </main>
  );
}
