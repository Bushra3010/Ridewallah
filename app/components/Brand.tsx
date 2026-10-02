/* Ridewallah brand pieces — drawn inline so they stay crisp at any size (full logo: public/ridewallah-logo.svg). */

/** The map-pin "R" symbol on its own. `light` gives a white pin with a blue R, for dark backgrounds. */
export function BrandMark({ size = 36, light }: { size?: number; light?: boolean }) {
  const pin = light ? "white" : "url(#rw-pin)";
  const ink = light ? "var(--blue)" : "white";
  return (
    <svg width={size} height={Math.round(size * 1.15)} viewBox="0 0 40 46" role="img" aria-label="Ridewallah" style={{ display: "block" }}>
      <defs>
        <linearGradient id="rw-pin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--gold)" }} />
          <stop offset="1" style={{ stopColor: "var(--blue-dark)" }} />
        </linearGradient>
      </defs>
      <path d="M20 1C9.5 1 1 9.3 1 19.6 1 33 20 45 20 45s19-12 19-25.4C39 9.3 30.5 1 20 1z" fill={pin} />
      <path d="M14 30V10h7.4c4.3 0 7 2.3 7 6 0 2.7-1.5 4.6-4 5.4L29 30h-4.7l-4.2-8H18v8z M18 18.6h3.2c1.8 0 2.9-.9 2.9-2.5s-1.1-2.5-2.9-2.5H18z" fill={ink} />
    </svg>
  );
}

/** "Ridewallah" with "wallah" in brand blue. `light` for dark backgrounds. */
export function Wordmark({ sub = "RIDE · REACH · RELAX", light, size = 20 }: { sub?: string; light?: boolean; size?: number }) {
  return (
    <div style={{ lineHeight: 1.05 }}>
      <p style={{ margin: 0, fontSize: size, fontWeight: 800, letterSpacing: "-0.01em", color: light ? "white" : "var(--ink)" }}>
        Ride<span style={light ? { color: "var(--accent-light)" } : {
          background: "linear-gradient(90deg,var(--gold) 0%,var(--blue) 100%)",
          WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
        }}>wallah</span>
      </p>
      {sub && <p style={{ margin: "2px 0 0", fontSize: 8.5, fontWeight: 600, letterSpacing: "0.14em", color: light ? "rgba(255,255,255,0.6)" : "var(--ink-soft)" }}>{sub}</p>}
    </div>
  );
}
