/**
 * TEMPORARY MARK. This is a stand-in drawn for the website build, not the
 * official SS Infratech logo. Replace this component's SVG with the
 * official artwork once the owner supplies it (SVG or high-res PNG).
 */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <rect width="48" height="48" rx="6" fill="#102a50" />
      {/* court outline seen from above */}
      <rect x="7" y="9" width="34" height="30" rx="1" fill="none" stroke="#1f5fd1" strokeWidth="2" />
      <line x1="7" y1="24" x2="41" y2="24" stroke="#b08d57" strokeWidth="1.5" />
      <text
        x="24"
        y="31.5"
        textAnchor="middle"
        fontFamily="var(--font-barlow-condensed), Arial Narrow, sans-serif"
        fontWeight="700"
        fontSize="21"
        fill="#fff"
        letterSpacing="-0.5"
      >
        SS
      </text>
    </svg>
  );
}

export function Logo({ tone = "dark", className = "" }: { tone?: "dark" | "light"; className?: string }) {
  const name = tone === "dark" ? "text-navy" : "text-white";
  const sub = tone === "dark" ? "text-muted" : "text-white/70";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="size-10 shrink-0" />
      <span className="flex flex-col leading-none">
        <span className={`font-display text-[1.45rem] font-bold tracking-tight ${name}`}>SS Infratech</span>
        <span className={`mt-0.5 text-[0.68rem] font-medium tracking-wide ${sub}`}>Padel Court Manufacturer</span>
      </span>
    </span>
  );
}
