import { useId } from "react";

/* Glossy cardboard parcel, three-quarter view — matches VehicleArt. */
export default function ParcelArt({ size = 56 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={Math.round(size * 0.62)} viewBox="0 0 100 62" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-sh`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#0f1729" stopOpacity="0.28" />
          <stop offset="1" stopColor="#0f1729" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f3cf98" /><stop offset="1" stopColor="#e0ac66" /></linearGradient>
        <linearGradient id={`${id}-l`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d99a52" /><stop offset="1" stopColor="#bf7f3a" /></linearGradient>
        <linearGradient id={`${id}-r`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c98840" /><stop offset="1" stopColor="#a86a2c" /></linearGradient>
      </defs>
      <ellipse cx="50" cy="54" rx="38" ry="5.5" fill={`url(#${id}-sh)`} />
      <path d="M50 18 L80 10 L80 44 L50 54z" fill={`url(#${id}-r)`} />
      <path d="M50 18 L20 10 L20 44 L50 54z" fill={`url(#${id}-l)`} />
      <path d="M20 10 L50 2 L80 10 L50 18z" fill={`url(#${id}-top)`} />
      {/* tape */}
      <path d="M33 6.5 L63 14.5 L63 18 L33 10z" style={{ fill: "var(--blue)" }} opacity="0.9" />
      <path d="M63 14.5 L63 50 L59 51.3 L59 15.6z" style={{ fill: "var(--blue)" }} opacity="0.75" />
      {/* label */}
      <path d="M26 26 L42 30.3 L42 40 L26 35.7z" fill="#ffffff" opacity="0.92" />
      <path d="M28.5 29.6 L39.5 32.5 M28.5 32.6 L36 34.6" stroke="#9aa4b5" strokeWidth="1" />
    </svg>
  );
}
