import { useId } from "react";
import VehicleArt from "./VehicleArt";

/* Pictures for the home screen's service tiles that have no photo: XL (white SUV), Book Any and Rental. */

const WHITE = ["#ffffff", "#f1f3f7", "#cdd3dd"] as const;
const YELLOW = ["#ffe066", "#f7c600", "#d9a400"] as const;

function Stops({ c }: { c: readonly [string, string, string] }) {
  return <><stop offset="0" stopColor={c[0]} /><stop offset="0.55" stopColor={c[1]} /><stop offset="1" stopColor={c[2]} /></>;
}

function Wheel({ id, x, y, r }: { id: string; x: number; y: number; r: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx={r * 0.82} ry={r} fill="#161b26" />
      <ellipse cx={x + 0.4} cy={y} rx={r * 0.48} ry={r * 0.6} fill={`url(#${id}r)`} />
      <ellipse cx={x + 0.4} cy={y} rx={r * 0.16} ry={r * 0.2} fill="#4b5563" />
    </g>
  );
}

/** XL — white SUV with a roof rail, three-quarter view facing right. */
export function XlArt({ size = 56 }: { size?: number }) {
  const id = "x" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const R = 6, C = 8, Y = 8, B = 37.8, wr = 6.2;
  const side = `M${R} 35.6 Q${R - 1} 27.4 ${R + 6} 25.6 L56 23.2 Q62.6 23.2 63 28 V${B} H${R + 3} Q${R} ${B} ${R} 35.6 Z`;
  const face = `M63 28 Q63 23.4 58 23.2 L66 23.6 Q73 25 74 30 V35.6 Q74 ${B} 71.4 ${B} H63 Z`;
  const mid = (R + 56) / 2 - 2;
  return (
    <svg width={size} height={Math.round(size * 0.62)} viewBox="0 0 80 50" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1"><Stops c={WHITE} /></linearGradient>
        <linearGradient id={`${id}a`} x1="0" y1="0" x2="0" y2="1"><Stops c={YELLOW} /></linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stopColor="#3a4658" /><stop offset="1" stopColor="#111827" /></linearGradient>
        <radialGradient id={`${id}r`} cx="0.4" cy="0.35" r="0.7"><stop offset="0" stopColor="#f4f6fa" /><stop offset="1" stopColor="#8a94a6" /></radialGradient>
      </defs>
      <ellipse cx="41" cy="45" rx="34" ry="3.2" fill="rgba(15,23,41,0.13)" />
      <ellipse cx="71" cy={B - 0.6} rx="2.6" ry="4" fill="#161b26" />
      {/* cabin, windows, windscreen */}
      <path d={`M${C} 25.4 Q${C + 2} ${Y + 1.4} ${C + 14} ${Y} L45 ${Y - 0.2} Q51.5 ${Y} 56 ${Y + 4.6} L63 23.4 L${C} 25.4 Z`} fill={`url(#${id}b)`} />
      <path d={`M${C + 4} 24.6 Q${C + 5.4} ${Y + 3.2} ${C + 14} ${Y + 2.4} L44 ${Y + 2.1} Q48 ${Y + 2.1} 50.4 ${Y + 4.8} L54.4 23.3 Z`} fill={`url(#${id}g)`} />
      <path d={`M${(C + 58) / 2} ${Y + 2.3} L${(C + 58) / 2 + 0.8} 24`} stroke={WHITE[1]} strokeWidth="1.8" />
      <path d={`M51.6 ${Y + 2} Q55 ${Y + 1.6} 58 ${Y + 5} L64.6 23.4 L57.6 23.2 Z`} fill={`url(#${id}g)`} />
      <path d={`M56 ${Y + 3} L60.6 21`} stroke="white" strokeOpacity="0.3" strokeWidth="1.1" strokeLinecap="round" />
      <path d={`M${C + 8} ${Y + 0.8} Q${C + 12} ${Y - 0.1} ${C + 16} ${Y} L44 ${Y - 0.1}`} stroke="white" strokeWidth="1.1" strokeLinecap="round" fill="none" />
      {/* body, yellow rear quarter, roof rail */}
      <path d={side} fill={`url(#${id}b)`} />
      <path d={`M${R} 35.6 Q${R - 1} 27.4 ${R + 6} 25.6 L${mid} 24.4 L${mid - 2.4} ${B} H${R + 3} Q${R} ${B} ${R} 35.6 Z`} fill={`url(#${id}a)`} />
      <path d={`M${C + 7} ${Y - 1} L44 ${Y - 1.3}`} stroke="#1f2937" strokeWidth="1.3" strokeLinecap="round" />
      <path d={`M${R + 5} 27.2 L62 25.6`} stroke="white" strokeOpacity="0.8" strokeWidth="0.9" strokeLinecap="round" />
      <path d={`M${(C + 58) / 2 + 0.8} 24.2 V${B - 1.6}`} stroke="#0f1729" strokeOpacity="0.16" strokeWidth="0.7" />
      <rect x={(C + 58) / 2 + 2.4} y="27.2" width="3.2" height="0.9" rx="0.45" fill="#0f1729" opacity="0.3" />
      <path d={`M${R + 0.6} 28.2 V31`} stroke="#e23d3d" strokeWidth="1.5" strokeLinecap="round" />
      {/* front face */}
      <path d={face} fill={`url(#${id}b)`} />
      <path d={face} fill="#0f1729" opacity="0.07" />
      <ellipse cx="65.6" cy="28" rx="1.7" ry="1.25" fill="#fff7d6" stroke="#9aa3b2" strokeWidth="0.4" />
      <ellipse cx="72.4" cy="29.4" rx="1.2" ry="1.15" fill="#fff7d6" stroke="#9aa3b2" strokeWidth="0.4" />
      <rect x="66.4" y="31.6" width="6" height="2.2" rx="1" fill="#1f2937" />
      <path d={`M${R + 1} ${B - 3} L74 ${B - 3.4} V35.6 Q74 ${B} 71.4 ${B} H${R + 3} Q${R} ${B} ${R} 35.6 Z`} fill="#0f1729" opacity="0.12" />
      {/* wheels */}
      <ellipse cx={R + 12} cy={B - 0.6} rx={wr * 1.04} ry={wr * 1.14} fill="#0f1729" opacity="0.5" />
      <ellipse cx="55" cy={B - 0.6} rx={wr * 1.04} ry={wr * 1.14} fill="#0f1729" opacity="0.5" />
      <Wheel id={id} x={R + 12} y={B} r={wr} />
      <Wheel id={id} x={55} y={B} r={wr} />
    </svg>
  );
}

/** "Book Any" — two cars, one behind the other. */
export function AnyArt({ size = 56 }: { size?: number }) {
  return (
    <span style={{ position: "relative", display: "inline-block", width: size, height: Math.round(size * 0.62) }}>
      <span style={{ position: "absolute", left: size * 0.24, top: -size * 0.07, opacity: 0.9 }}><VehicleArt kind="sedan" size={size * 0.8} /></span>
      <span style={{ position: "absolute", left: 0, top: size * 0.08 }}><VehicleArt kind="mini" size={size * 0.8} /></span>
    </span>
  );
}

/** Hourly rental — car with a clock badge. */
export function RentalArt({ size = 56 }: { size?: number }) {
  const b = size * 0.36;
  return (
    <span style={{ position: "relative", display: "inline-block", width: size, height: Math.round(size * 0.62) }}>
      <VehicleArt kind="mini" size={size} />
      <svg width={b} height={b} viewBox="0 0 24 24" style={{ position: "absolute", left: -2, top: -4 }} aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="var(--green)" />
        <circle cx="12" cy="12" r="7.5" fill="white" />
        <path d="M12 8v4.5l2.8 1.8" stroke="#0f1729" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </svg>
    </span>
  );
}
