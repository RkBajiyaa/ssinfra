/**
 * Top-down padel court plan drawn to scale (1 unit = 0.1 m):
 * 20 m × 10 m playing area, net at mid-length, service lines 6.95 m
 * from the net, centre service line between them. The dimensions shown
 * are the International Padel Federation's published court size.
 */
export function CourtPlan({
  className = "",
  animate = false,
  tone = "light",
  title = "Padel court plan: 20 metres by 10 metres",
}: {
  className?: string;
  animate?: boolean;
  tone?: "light" | "dark";
  title?: string;
}) {
  const line = tone === "light" ? "#ffffff" : "#102a50";
  const accent = tone === "light" ? "#d9c39a" : "#1f5fd1";
  const dim = tone === "light" ? "rgba(255,255,255,0.6)" : "rgba(16,42,80,0.55)";
  const label = tone === "light" ? "rgba(255,255,255,0.85)" : "#102a50";

  // court origin
  const x0 = 34;
  const y0 = 30;
  const L = 200;
  const W = 100;
  const net = x0 + L / 2;
  const s1 = net - 69.5;
  const s2 = net + 69.5;

  const d = (len: number, delay: number) =>
    animate ? ({ "--len": len, "--delay": `${delay}s` } as React.CSSProperties) : undefined;

  return (
    <svg
      viewBox="0 0 268 158"
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
      className={`${animate ? "plan-draw" : ""} ${className}`}
      fill="none"
    >
      {/* playing area */}
      <rect x={x0} y={y0} width={L} height={W} stroke={line} strokeWidth="1.5" style={d(600, 0)} />
      {/* net */}
      <line x1={net} y1={y0 - 4} x2={net} y2={y0 + W + 4} stroke={accent} strokeWidth="2" style={d(110, 0.35)} />
      {/* service lines */}
      <line x1={s1} y1={y0} x2={s1} y2={y0 + W} stroke={line} strokeWidth="1" style={d(100, 0.5)} />
      <line x1={s2} y1={y0} x2={s2} y2={y0 + W} stroke={line} strokeWidth="1" style={d(100, 0.5)} />
      {/* centre service line */}
      <line x1={s1} y1={y0 + W / 2} x2={s2} y2={y0 + W / 2} stroke={line} strokeWidth="1" style={d(140, 0.65)} />

      {/* length dimension */}
      <g stroke={dim} strokeWidth="0.75">
        <line x1={x0} y1={14} x2={x0 + L} y2={14} style={d(200, 0.9)} />
        <line x1={x0} y1={9} x2={x0} y2={19} />
        <line x1={x0 + L} y1={9} x2={x0 + L} y2={19} />
      </g>
      <text x={net} y={10.5} textAnchor="middle" fill={label} fontSize="9" fontFamily="var(--font-instrument-sans), sans-serif" className={animate ? "hero-rise" : ""} style={animate ? ({ "--delay": "1.1s" } as React.CSSProperties) : undefined}>
        20 m
      </text>

      {/* width dimension */}
      <g stroke={dim} strokeWidth="0.75">
        <line x1={16} y1={y0} x2={16} y2={y0 + W} style={d(100, 0.9)} />
        <line x1={11} y1={y0} x2={21} y2={y0} />
        <line x1={11} y1={y0 + W} x2={21} y2={y0 + W} />
      </g>
      <text x={11} y={y0 + W / 2} textAnchor="middle" fill={label} fontSize="9" fontFamily="var(--font-instrument-sans), sans-serif" transform={`rotate(-90 11 ${y0 + W / 2})`} className={animate ? "hero-rise" : ""} style={animate ? ({ "--delay": "1.1s" } as React.CSSProperties) : undefined}>
        10 m
      </text>

      {/* service distance */}
      <g stroke={dim} strokeWidth="0.75">
        <line x1={s2} y1={y0 + W + 14} x2={net} y2={y0 + W + 14} style={d(70, 1.05)} />
        <line x1={s2} y1={y0 + W + 10} x2={s2} y2={y0 + W + 18} />
        <line x1={net} y1={y0 + W + 10} x2={net} y2={y0 + W + 18} />
      </g>
      <text x={(net + s2) / 2} y={y0 + W + 25} textAnchor="middle" fill={label} fontSize="8" fontFamily="var(--font-instrument-sans), sans-serif" className={animate ? "hero-rise" : ""} style={animate ? ({ "--delay": "1.2s" } as React.CSSProperties) : undefined}>
        6.95 m
      </text>
    </svg>
  );
}
