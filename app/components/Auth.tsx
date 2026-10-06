"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, BackIcon, BellIcon, PinIcon, CheckIcon } from "./icons";
import { OtpInput, PrimaryButton, card, field, iconBtn, label } from "./ui";

/** Brand splash — royal blue with the white Ridewallah logo. */
export function SplashScreen({ tagline, cta = "Get Started", onStart, footer }: {
  tagline: string; cta?: string; onStart: () => void; footer?: React.ReactNode;
}) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 200,
      background: "var(--hero)",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", right: -80, top: -90, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.22), transparent 70%)" }} />
      <div style={{ position: "absolute", left: -70, bottom: 120, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(120,190,255,0.25), transparent 70%)" }} />
      {/* A road winding off into the distance */}
      <svg viewBox="0 0 400 200" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: 220 }} aria-hidden="true">
        <path d="M120 200 C 160 140, 250 120, 400 70 L 400 110 C 290 140, 230 160, 230 200z" fill="rgba(255,255,255,0.07)" />
        <path d="M175 200 C 210 150, 290 125, 400 90" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeDasharray="10 12" fill="none" />
      </svg>

      <div className="fade-up" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ridewallah-logo.svg" alt="Ridewallah" style={{ width: 240, maxWidth: "66%", height: "auto", display: "block" }} />
        <p style={{ margin: "20px 0 0", fontSize: 15, color: "rgba(255,255,255,0.75)", letterSpacing: "0.04em" }}>{tagline}</p>
      </div>

      <div style={{ padding: "0 20px calc(22px + env(safe-area-inset-bottom))", position: "relative", zIndex: 1 }}>
        <PrimaryButton tone="gold" onClick={onStart}>{cta} <ArrowRight s={18} c="var(--blue-dark)" /></PrimaryButton>
        {footer}
      </div>
    </div>
  );
}

const Shell = ({ children, onBack }: { children: React.ReactNode; onBack?: () => void }) => (
  <div className="fade-up" style={{ position: "absolute", inset: 0, zIndex: 190, background: "var(--app-bg)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
    <div style={{ padding: "18px 16px 0", minHeight: 42 }}>
      {onBack && <button onClick={onBack} aria-label="Back" className="press" style={iconBtn}><BackIcon c="var(--ink)" /></button>}
    </div>
    {children}
  </div>
);

const H = ({ title, accent, body }: { title: string; accent?: string; body: string }) => (
  <div style={{ padding: "8px 24px 0" }}>
    <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--ink)", lineHeight: 1.2 }}>
      {title}{accent && <><br /><span style={{ color: "var(--blue)" }}>{accent}</span></>}
    </h1>
    <p style={{ margin: "10px 0 0", fontSize: 14.5, color: "var(--ink-soft)", lineHeight: 1.55 }}>{body}</p>
  </div>
);

/** Mobile number → SMS one-time password (Supabase phone auth). `onSend` returns an error message or null. */
export function PhoneLogin({ title, accent, onSend }: { title: string; accent: string; onSend: (phone: string) => Promise<string | null> }) {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const ok = phone.length === 10;
  const submit = async () => {
    setBusy(true); setErr("");
    const e = await onSend(phone);
    if (e) { setErr(e); setBusy(false); }
  };
  return (
    <Shell>
      <H title={title} accent={accent} body="Enter your mobile number. We'll send you a one-time password." />
      <form onSubmit={(e) => { e.preventDefault(); if (ok && !busy) submit(); }} style={{ padding: "28px 24px 24px", display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
        <div>
          <label style={label} htmlFor="phone">Mobile Number</label>
          <div style={{ ...field, display: "flex", alignItems: "center", gap: 10, padding: "4px 14px" }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", borderRight: "1.5px solid var(--line)", paddingRight: 10 }}>🇮🇳 +91</span>
            <input id="phone" value={phone} inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210"
              onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setErr(""); }}
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 16, padding: "10px 0", color: "var(--ink)", letterSpacing: "0.04em" }} />
          </div>
          {err && <p role="alert" style={{ margin: "8px 0 0", fontSize: 12.5, color: "var(--red)" }}>{err}</p>}
        </div>
        <PrimaryButton type="submit" disabled={!ok || busy}>{busy ? "Sending…" : "Get OTP"}</PrimaryButton>
        <p style={{ marginTop: "auto", fontSize: 11.5, color: "var(--ink-mute)", textAlign: "center", lineHeight: 1.5 }}>
          By continuing you agree to Ridewallah&apos;s Terms of Service and Privacy Policy.
        </p>
      </form>
    </Shell>
  );
}

const OTP_LENGTH = 6;

/** `onVerify` / `onResend` return an error message or null. */
export function OtpStep({ phone, onBack, onVerify, onResend }: {
  phone: string; onBack: () => void; onVerify: (code: string) => Promise<string | null>; onResend: () => Promise<string | null>;
}) {
  const [otp, setOtp] = useState("");
  const [left, setLeft] = useState(30);
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState("");
  // Latest callback without re-running the verify effect when the parent re-renders.
  const verify = useRef(onVerify);
  useEffect(() => { verify.current = onVerify; }, [onVerify]);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  useEffect(() => {
    if (otp.length !== OTP_LENGTH) return;
    let live = true;
    setChecking(true); setErr("");
    verify.current(otp).then((e) => {
      if (!live || !e) return;
      setErr(e); setOtp(""); setChecking(false);
    });
    return () => { live = false; };
  }, [otp]);
  const resend = async () => {
    setErr("");
    const e = await onResend();
    if (e) setErr(e); else setLeft(30);
  };
  return (
    <Shell onBack={onBack}>
      <H title="Verify your number" body={`Enter the ${OTP_LENGTH}-digit code sent to +91 ${phone.slice(0, 5)} ${phone.slice(5)}`} />
      <div style={{ padding: "32px 24px 0" }}>
        <OtpInput value={otp} onChange={(v) => { setOtp(v); setErr(""); }} length={OTP_LENGTH} />
        {err && <p role="alert" style={{ textAlign: "center", margin: "14px 0 0", fontSize: 12.5, color: "var(--red)" }}>{err}</p>}
        <p style={{ textAlign: "center", margin: "22px 0 0", fontSize: 13.5, color: "var(--ink-soft)" }}>
          {checking ? "Verifying…" : left > 0 ? <>Resend code in <b style={{ color: "var(--ink)" }}>0:{String(left).padStart(2, "0")}</b></> : (
            <button onClick={resend} style={{ background: "none", border: "none", color: "var(--blue)", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>Resend OTP</button>
          )}
        </p>
      </div>
    </Shell>
  );
}

/** Name, email and optional referral — shown once, after the first OTP. */
export function ProfileSetup({ onDone }: { onDone: (p: { name: string; email: string }) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [ref, setRef] = useState("");
  return (
    <Shell>
      <H title="Almost there!" accent="Tell us about you" body="This helps drivers greet you and receipts reach your inbox." />
      <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) onDone({ name: name.trim(), email: email.trim() }); }}
        style={{ padding: "24px 24px", display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
        <div><label style={label} htmlFor="n">Full Name</label><input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Amit Sharma" style={field} autoComplete="name" /></div>
        <div><label style={label} htmlFor="e">Email <span style={{ fontWeight: 400, color: "var(--ink-mute)" }}>(optional)</span></label><input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={field} autoComplete="email" /></div>
        <div><label style={label} htmlFor="r">Referral Code <span style={{ fontWeight: 400, color: "var(--ink-mute)" }}>(optional)</span></label><input id="r" value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} placeholder="e.g. RIDE100" style={field} /></div>
        <div style={{ marginTop: "auto" }}><PrimaryButton type="submit" disabled={!name.trim()}>Continue</PrimaryButton></div>
      </form>
    </Shell>
  );
}

/** Location + notification permission ask, one screen. */
export function PermissionStep({ onDone }: { onDone: () => void }) {
  const [loc, setLoc] = useState(false);
  const [bell, setBell] = useState(false);
  const rows = [
    { on: loc, set: setLoc, Icon: PinIcon, t: "Location", b: "To find drivers near you and set your pickup point." },
    { on: bell, set: setBell, Icon: BellIcon, t: "Notifications", b: "Driver arriving, trip updates and receipts." },
  ];
  return (
    <Shell>
      <H title="Allow access" accent="for a smooth ride" body="You can change these any time from your phone settings." />
      <div style={{ padding: "24px 24px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        {rows.map(({ on, set, Icon, t, b }) => (
          <div key={t} style={{ ...card, padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: "var(--blue-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon s={22} c="var(--blue)" /></div>
            <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: 14.5, fontWeight: 600 }}>{t}</p><p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.45 }}>{b}</p></div>
            <button onClick={() => set(true)} disabled={on} className="press" style={{
              border: "none", borderRadius: 10, padding: "8px 12px", fontSize: 12.5, fontWeight: 700, cursor: on ? "default" : "pointer",
              background: on ? "var(--success)" : "var(--blue)", color: on ? "var(--success-text)" : "white", display: "flex", alignItems: "center", gap: 4,
            }}>{on ? <><CheckIcon s={13} c="var(--success-text)" /> Allowed</> : "Allow"}</button>
          </div>
        ))}
        <div style={{ marginTop: "auto" }}><PrimaryButton onClick={onDone}>{loc && bell ? "Let's ride" : "Continue"} <ArrowRight s={18} c="white" /></PrimaryButton></div>
      </div>
    </Shell>
  );
}
