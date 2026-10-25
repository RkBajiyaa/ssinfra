"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { mainNav, site } from "@/config/site";
import { buttonClass } from "@/components/ui/button";
import { CloseIcon, MenuIcon, PhoneIcon } from "@/components/ui/icons";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {mainNav.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative inline-flex min-h-11 items-center px-3 text-[0.95rem] font-medium transition-colors ${
                  active ? "text-navy" : "text-muted hover:text-navy"
                }`}
              >
                {item.label}
                {active && <span className="absolute inset-x-3 bottom-1.5 h-0.5 bg-turf" aria-hidden="true" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileNav({ whatsapp }: { whatsapp?: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close when the route changes (adjusting state during render, per React docs).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    const button = buttonRef.current;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        button?.focus();
      }
      // Keep Tab inside the open menu.
      if (e.key === "Tab" && panelRef.current) {
        const focusables = [button, ...panelRef.current.querySelectorAll<HTMLElement>("a,button")].filter(
          Boolean,
        ) as HTMLElement[];
        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="-mr-2 inline-flex size-11 items-center justify-center text-navy"
      >
        {open ? <CloseIcon className="size-6" /> : <MenuIcon className="size-6" />}
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      </button>

      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t border-line bg-white"
      >
        <nav aria-label="Main" className="container-site flex min-h-full flex-col py-4">
          <ul className="divide-y divide-line-soft">
            {mainNav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-14 items-center justify-between font-display text-[1.75rem] font-semibold ${
                      active ? "text-turf" : "text-navy"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-auto grid gap-3 pt-8 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Link href="/contact#quote" className={buttonClass("primary", "lg")}>
              Request a Quote
            </Link>
            <a href={`tel:${site.phone.e164}`} className={buttonClass("outline", "lg")}>
              <PhoneIcon className="size-5" />
              Call {site.phone.display}
            </a>
            {whatsapp}
          </div>
        </nav>
      </div>
    </div>
  );
}
