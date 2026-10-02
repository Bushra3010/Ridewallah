import { useId } from "react";
import type { VehicleKind } from "../lib/data";

/* Glossy three-quarter vehicle illustrations (front-left view, soft ground shadow), in the style of
 * ride-hailing fare lists. Real-world colours: black & yellow auto, white cab, blue hatchback, grey SUV. */

type Car = { body: [string, string]; front: string; trim: string };

function Wheel({ cx, cy, rx, ry, id }: { cx: number; cy: number; rx: number; ry: number; id: string }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#1a1e26" />
      <ellipse cx={cx + rx * 0.08} cy={cy} rx={rx * 0.62} ry={ry * 0.62} fill={`url(#${id}-rim)`} />
      <ellipse cx={cx + rx * 0.08} cy={cy} rx={rx * 0.22} ry={ry * 0.22} fill="#5b6475" />
    </g>
  );
}

export default function VehicleArt({ kind, size = 56 }: { kind: VehicleKind; size?: number }) {
  const id = useId().replace(/:/g, "");
  const h = Math.round(size * 0.62);

  const car: Record<"mini" | "sedan" | "suv", Car> = {
    mini: { body: ["var(--gold)", "var(--blue-dark)"], front: "var(--blue-dark)", trim: "#ffffff" },
    sedan: { body: ["#ffffff", "#d3dae6"], front: "#c3ccdb", trim: "var(--blue)" },
    suv: { body: ["#7b8597", "#3a4252"], front: "#323947", trim: "#cfd6e2" },
  };

  return (
    <svg width={size} height={h} viewBox="0 0 100 62" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-shadow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#0f1729" stopOpacity="0.28" />
          <stop offset="1" stopColor="#0f1729" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2f5fa" />
          <stop offset="1" stopColor="#9aa4b5" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5a6b86" />
          <stop offset="0.55" stopColor="#1f2a3d" />
          <stop offset="1" stopColor="#111827" />
        </linearGradient>
        {(kind === "mini" || kind === "sedan" || kind === "suv") && (
          <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: car[kind].body[0] }} />
            <stop offset="1" style={{ stopColor: car[kind].body[1] }} />
          </linearGradient>
        )}
        <linearGradient id={`${id}-yellow`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffdc4a" />
          <stop offset="1" stopColor="#f0a800" />
        </linearGradient>
        <linearGradient id={`${id}-tank`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--gold)" }} />
          <stop offset="1" style={{ stopColor: "var(--blue-dark)" }} />
        </linearGradient>
      </defs>

      <ellipse cx="51" cy="54" rx="46" ry="6" fill={`url(#${id}-shadow)`} />

      {kind === "bike" && (
        <>
          {/* rear swing arm + exhaust */}
          <path d="M56 37 L78 46" stroke="#2a303c" strokeWidth="3.2" strokeLinecap="round" />
          <Wheel cx={78} cy={46} rx={9} ry={10.5} id={id} />
          <path d="M52 39 L84 34.5 Q87 34.5 87 37 L86.5 38.5 L54 42.5z" fill="#c9d0db" />
          <path d="M52 39 L84 34.5" stroke="#ffffff" strokeWidth="0.8" opacity="0.8" />
          {/* engine */}
          <path d="M40 29 L57 29 L59 38 Q56 42 47 42 L42 40z" fill="#4a5262" />
          <path d="M44 31 V39 M48 31 V40 M52 31 V40" stroke="#6f7889" strokeWidth="1.2" />
          {/* front fork + wheel */}
          <path d="M31 17 L21 46" stroke="#8b94a5" strokeWidth="3" strokeLinecap="round" />
          <Wheel cx={21} cy={46} rx={9} ry={10.5} id={id} />
          <path d="M11 40 Q14 33.5 22 33.5 Q28.5 34 30.5 38.5" stroke={`url(#${id}-tank)`} strokeWidth="2.6" strokeLinecap="round" fill="none" />
          {/* tank, seat, tail */}
          <path d="M34 25 Q40 16 54 17 L62 21 Q61 28 52 29.5 L38 30z" fill={`url(#${id}-tank)`} />
          <path d="M40 20 Q46 17.5 53 18" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
          <path d="M56 20.5 Q67 17 78 20 L78.5 23.5 L58 25z" fill="#1f2430" />
          <path d="M74 20.5 L88 21.5 Q91 23.5 87.5 26.5 L72 27z" fill={`url(#${id}-tank)`} />
          <rect x="85" y="22.5" width="4" height="2.2" rx="1" fill="#ff4d4f" />
          {/* handlebar + headlight */}
          <path d="M26 15.5 L38 12.5" stroke="#1f2430" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M25 18 Q24 24 30 25 L35 23 L34 17z" fill={`url(#${id}-tank)`} />
          <ellipse cx="26.5" cy="21" rx="2.6" ry="3.2" fill="#eaf6ff" stroke="#c9d0db" strokeWidth="0.8" />
        </>
      )}

      {kind === "auto" && (
        <>
          <Wheel cx={84} cy={46.5} rx={5} ry={7} id={id} />
          {/* rear tub — black lower body, rounded tail */}
          <path d="M34 28.5 L87 27 Q93 27.5 92.5 34 L90.5 43 Q89.5 46.5 85 46.5 L34 46.5z" fill="#1c2230" />
          <path d="M34 40.5 L91 39.5 L90.6 42 L34 43z" fill={`url(#${id}-yellow)`} />
          {/* open passenger side with bench seat */}
          <path d="M45 28.6 L84.5 27.4 Q87 27.6 86.6 30.5 L85.6 37.6 L45 38.4z" fill="#0b0f16" />
          <path d="M60 31.5 Q60 30 62 30 L82.5 29.6 Q84.6 29.8 84.4 32 L84 37.6 L60 38z" fill="#3a4256" />
          <path d="M61 31 L83 30.6" stroke="#5b6680" strokeWidth="0.8" />
          {/* driver cab: windscreen + rounded nose */}
          <path d="M17.5 26 L36 28.4 L36 34.2 L14.5 35.2 Q14.5 29.5 17.5 26z" fill={`url(#${id}-glass)`} />
          <path d="M19 27 L24 27.6 L18.5 34.6 L15.6 34.8z" fill="#ffffff" opacity="0.22" />
          <path d="M12 46.5 Q10 40 14 35.2 L36.5 34.2 L36.5 46.5z" fill="#1c2230" />
          <path d="M12.3 39.6 L36.5 38.8 L36.5 41.2 L12.6 42z" fill={`url(#${id}-yellow)`} />
          <ellipse cx="15.2" cy="37.2" rx="2.2" ry="1.8" fill="#eaf6ff" stroke="#9aa4b5" strokeWidth="0.6" />
          <path d="M36.5 28.4 L36.5 46.5" stroke="#0b0f16" strokeWidth="1" />
          {/* domed canvas canopy */}
          <path d="M15.5 26.5 Q16.5 9 40 7.2 L76 6.8 Q90.5 7.2 91.5 21 L91.5 27.2 L36 28.6z" fill={`url(#${id}-yellow)`} />
          <path d="M15.5 26.5 L36 28.6 L91.5 27.2 L91.5 28.8 L36 30.2 L15.5 28z" fill="#1c2230" />
          <path d="M24 13.5 Q30 9.6 40 9 L76 8.6" stroke="#fff3b0" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <Wheel cx={22} cy={48} rx={5.6} ry={7.2} id={id} />
          <Wheel cx={70} cy={48} rx={6.6} ry={8} id={id} />
        </>
      )}

      {(kind === "mini" || kind === "sedan" || kind === "suv") && (() => {
        const c = car[kind];
        const P = {
          mini: {
            far: { cx: 13, cy: 46 }, near: [30, 73] as const, r: [7, 8.2] as const,
            front: "M6 41 L6 33 Q6 29 11 28 L19 27 L19 46 L8 46 Q6 46 6 44z",
            side: "M19 27 L33 25 L43 14 Q45.5 12 50 12 L71 12 Q76 12 78.5 16.5 L84 26 Q87 28 87 33 L87 42 Q87 46 83 46 L19 46z",
            shield: "M19 27 L33 25 L43 14 L38 14.5 Q34 15.5 31 18.5 L22 26z",
            win: ["M35 25 L44 15 Q46 14 49 14 L57 14 L57 25z", "M60 14 L70 14 Q74 14 76 17 L80.5 25 L60 25z"],
            door: 58.5, lamp: "M7.5 30.5 L16.5 29.5 L16.5 32.5 L7.5 33.5z", grille: "M7.5 36 L17 35.6 L17 39.5 L7.5 40z",
            tail: "M84.5 28 L87 28.5 L87 32 L84.5 31.5z", stripe: false,
          },
          sedan: {
            far: { cx: 12, cy: 46 }, near: [30, 79] as const, r: [7, 8.2] as const,
            front: "M5 41 L5 33 Q5 29 10 28 L18 27 L18 46 L7 46 Q5 46 5 44z",
            side: "M18 27 L35 25 L45 15 Q47.5 13 52 13 L71 13 Q75.5 13 78.5 16 L85 24 Q93 25 95 29.5 L95 42 Q95 46 91 46 L18 46z",
            shield: "M18 27 L35 25 L45 15 L40 15.5 Q36 16.5 33 19.5 L21 26z",
            win: ["M37 25 L46 16 Q48 15 51 15 L59 15 L59 25z", "M62 15 L70.5 15 Q74 15 76 17.5 L81.5 24.6 L62 25z"],
            door: 60.5, lamp: "M6.5 30.5 L15.5 29.5 L15.5 32.5 L6.5 33.5z", grille: "M6.5 36 L16 35.6 L16 39.5 L6.5 40z",
            tail: "M92 29 L95 30 L95 33 L92.5 32.5z", stripe: true,
          },
          suv: {
            far: { cx: 11, cy: 46 }, near: [29, 81] as const, r: [7.6, 8.8] as const,
            front: "M4 42 L4 30 Q4 26.5 8.5 25.5 L18 24.5 L18 46 L6 46 Q4 46 4 44z",
            side: "M18 24.5 L32 23 L39.5 11 Q41 9 45 9 L85 9 Q88.5 9 89.5 12.5 L93 23.5 Q95.5 25 95.5 29.5 L95.5 42 Q95.5 46 91.5 46 L18 46z",
            shield: "M18 24.5 L32 23 L39.5 11 L35 11.5 Q32 12.5 30 15.5 L21 23.6z",
            win: ["M34.5 23 L41.5 12 L56 12 L56 23z", "M59 12 L72 12 L72 23 L59 23z", "M75 12 L85 12 Q87.3 12 88 14.2 L91 22.6 L75 23z"],
            door: 57.5, lamp: "M5.5 28.5 L15.5 27.5 L15.5 31 L5.5 32z", grille: "M5.5 34 L16 33.4 L16 39 L5.5 39.6z",
            tail: "M93 25.5 L95.5 26.5 L95.5 31 L93.5 30.5z", stripe: false,
          },
        }[kind];
        return (
          <>
            <ellipse cx={P.far.cx} cy={P.far.cy} rx={4} ry={6.5} fill="#1a1e26" />
            {kind === "suv" && <path d="M44 7.5 L86 7.5" stroke="#2a303c" strokeWidth="1.6" strokeLinecap="round" />}
            <path d={P.front} fill={c.front} />
            <path d={P.side} fill={`url(#${id}-body)`} />
            <path d={P.shield} fill={`url(#${id}-glass)`} />
            {P.win.map((d) => <path key={d} d={d} fill={`url(#${id}-glass)`} />)}
            <path d={`M${P.door} 26 L${P.door} 44`} stroke="#0f1729" strokeOpacity="0.18" strokeWidth="0.8" />
            <rect x={P.door - 7} y="29" width="4" height="1.2" rx="0.6" fill="#0f1729" opacity="0.35" />
            <rect x={P.door + 3} y="29" width="4" height="1.2" rx="0.6" fill="#0f1729" opacity="0.35" />
            {/* shoulder highlight + accent stripe */}
            <path d={`M20 30.5 L${P.near[1] + 12} 30`} stroke="#ffffff" strokeWidth="1" opacity="0.55" />
            {P.stripe && <path d={`M19 36 L94 35.5 L94 37.5 L19 38z`} style={{ fill: c.trim }} />}
            <path d={P.lamp} fill="#eaf6ff" stroke="#9aa4b5" strokeWidth="0.6" />
            <path d={P.grille} fill="#1a1e26" />
            <path d={P.tail} fill="#ff4d4f" />
            {/* sills + wheel arches */}
            <path d={`M18 44 L${P.near[1] + 13} 43.6 L${P.near[1] + 13} 46 L18 46z`} fill="#1a1e26" opacity="0.55" />
            <ellipse cx={P.near[0]} cy={44} rx={P.r[0] + 1.6} ry={P.r[1] + 1.4} fill="#0f1729" opacity="0.85" />
            <ellipse cx={P.near[1]} cy={44} rx={P.r[0] + 1.6} ry={P.r[1] + 1.4} fill="#0f1729" opacity="0.85" />
            <Wheel cx={P.near[0]} cy={47} rx={P.r[0]} ry={P.r[1]} id={id} />
            <Wheel cx={P.near[1]} cy={47} rx={P.r[0]} ry={P.r[1]} id={id} />
          </>
        );
      })()}
    </svg>
  );
}
