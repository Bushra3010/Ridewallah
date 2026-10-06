"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BottomNav, { HomeGlyph, OffersGlyph, ProfileGlyph, RidesGlyph, WalletGlyph } from "../components/BottomNav";
import { OtpStep, PhoneLogin, SplashLink, SplashScreen } from "../components/Auth";
import { KycFlow, PendingApproval } from "../components/rider/Kyc";
import {
  AlertsScreen, EarningsScreen, RequestPopup, RiderAccount, RiderHome, TripPage, TripsScreen,
  type AccountKey, type QuickKey, type RideRequest, type RiderAlert, type TripPhase,
} from "../components/rider/RiderScreens";
import {
  BankPage, CancelTripSheet, DocumentsPage, HotspotsPage, IncentivesScreen, PerformancePage, PreferencesPage, ReferPage,
  SosSheet, TripDetailPage, VehiclePage, WalletPage, type RiderPrefs,
} from "../components/rider/RiderPages";
import { ChatScreen, type ChatMessage } from "../components/customer/AccountScreens";
import { DemoButton, Toast } from "../components/ui";
import { inr, nowTime, type Driver, type Ride, type WalletTxn } from "../lib/data";
import { useCatalog } from "../lib/CatalogProvider";
import { hasSession, loadRider, loadRiderActivity, registerRider, sendOtp, setRiderOnline, signOut, verifyOtp } from "../lib/account";
import type { Feedback } from "../lib/mappers";

const SHELL_MAX_W = 430;
/** How often the "verification in progress" screen re-checks for admin approval. */
const APPROVAL_POLL_MS = 8000;

type Tab = "home" | "earnings" | "trips" | "incentives" | "account";
type Stage = "splash" | "phone" | "otp" | "kyc" | "pending" | "app";
type Detail =
  | { k: "alerts" } | { k: "support" } | { k: "trip"; id: string }
  | { k: "wallet" } | { k: "performance" } | { k: "hotspots" }
  | { k: Exclude<AccountKey, "help" | "performance"> };

const REQUESTS: Omit<RideRequest, "id">[] = [
  { customer: "Amit Sharma", initials: "AS", rating: 4.9, from: "Sector 12, Noida", to: "DLF Mall of India", pickupKm: 1.2, pickupMin: 3, km: 4.2, min: 16, fare: 160, pay: "UPI" },
  { customer: "Priya Mehta", initials: "PM", rating: 4.7, from: "Botanical Garden Metro", to: "Sector 62, Noida", pickupKm: 0.8, pickupMin: 2, km: 6.8, min: 22, fare: 182, pay: "Cash" },
  { customer: "Rahul Verma", initials: "RV", rating: 4.5, from: "Sector 29, Gurugram", to: "Cyber City, Gurugram", pickupKm: 0.9, pickupMin: 3, km: 4.8, min: 15, fare: 62, pay: "UPI",
    service: "parcel", parcel: { type: "Documents", weight: "Up to 1 kg", receiver: "Sneha Verma", receiverPhone: "+91 98100 77881", note: "Hand to reception" } },
  { customer: "Kavya Iyer", initials: "KI", rating: 5.0, from: "Great India Place", to: "Akshardham Temple", pickupKm: 1.6, pickupMin: 4, km: 9.1, min: 28, fare: 246, pay: "UPI" },
];

/** Placeholder until the signed-in rider's profile loads. */
const NO_RIDER: Driver = { id: "", name: "", initials: "", phone: "", rating: 0, trips: 0, vehicle: "bike", model: "", plate: "", city: "", kyc: "Pending", online: false, joined: "", earnings: 0 };

const SUSPENDED = "Your rider account is suspended. Please contact rider support.";

let seq = 1300;
let txSeq = 400;
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

export default function RiderApp() {
  const { incentives, vehicleById, commission, announcementsFor } = useCatalog();
  const [stage, setStage] = useState<Stage>("splash");
  const [phone, setPhone] = useState("");
  /** Login and sign-up share the phone → OTP flow; this only changes the wording and the welcome message. */
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [rider, setRider] = useState<Driver>(NO_RIDER);
  const [tab, setTab] = useState<Tab>("home");
  const [stack, setStack] = useState<Detail[]>([]);
  const [online, setOnline] = useState(false);
  const [request, setRequest] = useState<RideRequest | null>(null);
  const [trip, setTrip] = useState<{ req: RideRequest; phase: TripPhase; progress: number } | null>(null);
  const [sheet, setSheet] = useState<"cancel" | "sos" | null>(null);
  const [today, setToday] = useState({ earnings: 1240, trips: 3, minutes: 5 * 60 + 40 });
  const [week, setWeek] = useState(52);
  const [peak, setPeak] = useState(1);
  const [stats, setStats] = useState({ accepted: 48, declined: 2, cancelled: 1 });
  const [wallet, setWallet] = useState({ balance: 1840, dues: 36 });
  const [txns, setTxns] = useState<WalletTxn[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [prefs, setPrefs] = useState<RiderPrefs>({ autoAccept: false, goHome: null, cash: true, sound: true, nav: "Google Maps", parcels: true, ac: true });
  const [trips, setTrips] = useState<Ride[]>([]);
  // Broadcasts from Admin → Notifications, then alerts raised during this session.
  const [alerts, setAlerts] = useState<RiderAlert[]>(() => announcementsFor("rider").map((a) => [a.title, a.body, a.at, "policy"]));
  const [unread, setUnread] = useState(2);
  const [chat, setChat] = useState<ChatMessage[]>([{ id: 1, from: "agent", body: "Hi! 👋 How can the rider support team help?", at: "09:00 AM" }]);
  const [typing, setTyping] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reqIdx = useRef(0);

  /** Signed in → route by KYC status and load the rider's own activity. Returns an error message, or null. */
  const enter = useCallback(async (): Promise<string | null> => {
    try {
      const d = await loadRider();
      if (!d) { setStage("kyc"); return null; }
      if (mode === "signup") flash(`You're already registered — welcome back, ${d.name.split(" ")[0]}!`);
      setRider(d);
      if (d.kyc !== "Approved") { setStage("pending"); return null; }
      if (d.suspended) { await signOut(); setStage("splash"); return SUSPENDED; }
      const a = await loadRiderActivity(d.id);
      setTrips(a.trips); setTxns(a.wallet); setFeedback(a.feedback);
      setOnline(d.online);
      setStage("app");
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Couldn't load your account";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- flash is stable
  }, [mode]);

  // Returning riders skip login (Supabase keeps the session in this browser).
  useEffect(() => {
    let live = true;
    const shown = Date.now();
    hasSession().then(async (yes) => {
      if (!yes || !live) return;
      await new Promise((r) => setTimeout(r, Math.max(0, 1100 - (Date.now() - shown))));
      if (!live) return;
      const err = await enter();
      if (err) flash(err);
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  // Waiting for KYC review → re-check until an admin approves.
  useEffect(() => {
    if (stage !== "pending") return;
    const t = setInterval(async () => {
      const d = await loadRider().catch(() => null);
      if (!d) return;
      if (d.kyc === "Approved") { await enter(); flash("You're approved! Go online to start earning 🎉"); }
      else setRider(d);
    }, APPROVAL_POLL_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- flash is recreated each render
  }, [stage, enter]);

  const detail = stack[stack.length - 1];
  const detailKey = detail ? JSON.stringify(detail) : tab;
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [detailKey]);

  const push = (d: Detail) => setStack((s) => [...s, d]);
  const back = () => setStack((s) => s.slice(0, -1));
  const goTab = (t: Tab) => { setStack([]); setTab(t); };

  const flash = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const addTxn = (kind: WalletTxn["kind"], note: string, amount: number) =>
    setTxns((t) => [{ id: `WT${++txSeq}`, kind, note, amount, at: `Today, ${nowTime()}` }, ...t]);

  // Online & idle → a request arrives a few seconds later (stands in for the dispatch socket).
  // With "Accept cash rides" off, dispatch only sends online-paid rides.
  // Parcels only go to riders who opted in and whose vehicle can carry them; car riders get AC or Non-AC
  // rides depending on their "My AC is working" switch.
  const sendRequest = useCallback(() => {
    const v = vehicleById(rider.vehicle);
    const ok = (r: (typeof REQUESTS)[number]) =>
      (prefs.cash || r.pay !== "Cash") && (r.service !== "parcel" || (prefs.parcels && v.parcelMaxKg > 0));
    let r = REQUESTS[reqIdx.current++ % REQUESTS.length];
    for (let i = 0; i < REQUESTS.length && !ok(r); i++) r = REQUESTS[reqIdx.current++ % REQUESTS.length];
    const parcel = r.service === "parcel";
    const ac = !parcel && v.acOption ? prefs.ac : undefined;
    const fare = ac === false ? Math.round(r.fare * 0.85) : r.fare;
    setRequest({ ...r, fare, ac, id: `${parcel ? "PD" : "RD"}${++seq}` });
  }, [prefs.cash, prefs.parcels, prefs.ac, rider.vehicle, vehicleById]);
  useEffect(() => {
    if (!online || request || trip || stage !== "app") return;
    const t = setTimeout(sendRequest, 4500);
    return () => clearTimeout(t);
  }, [online, request, trip, stage, sendRequest]);

  // Online-time ticker.
  useEffect(() => {
    if (!online) return;
    const t = setInterval(() => setToday((d) => ({ ...d, minutes: d.minutes + 1 })), 60000);
    return () => clearInterval(t);
  }, [online]);

  // Vehicle moves along the route while heading to pickup / on trip.
  const phase = trip?.phase;
  useEffect(() => {
    if (phase !== "toPickup" && phase !== "onTrip") return;
    const step = phase === "toPickup" ? 0.05 : 0.03;
    const t = setInterval(() => setTrip((x) => (x && x.phase === phase ? { ...x, progress: Math.min(1, x.progress + step) } : x)), 450);
    return () => clearInterval(t);
  }, [phase]);

  const decline = useCallback((expired: boolean) => {
    setRequest(null);
    setStats((s) => ({ ...s, declined: s.declined + 1 }));
    flash(expired ? "Request expired — counted as missed" : "Request declined");
  }, [flash]);

  const accept = useCallback(() => {
    if (!request) return;
    setTrip({ req: request, phase: "toPickup", progress: 0 });
    setRequest(null);
    setStack([]);
    setStats((s) => ({ ...s, accepted: s.accepted + 1 }));
    setAlerts((a) => [["Ride Accepted", `${request.from} → ${request.to} · ${inr(request.fare)}`, "just now", "ride"], ...a]);
  }, [request]);

  const cancelTrip = (reason: string) => {
    if (!trip) return;
    const { req } = trip;
    setTrips((t) => [{
      id: req.id, customer: req.customer, driver: rider.name, vehicle: rider.vehicle, from: req.from, to: req.to, km: req.km, min: req.min,
      service: req.service, ac: req.ac, parcel: req.parcel,
      fare: req.fare, discount: 0, pay: req.pay, paid: false, status: "Cancelled", date: "Today", time: nowTime(), cancelReason: reason,
    }, ...t]);
    setStats((s) => ({ ...s, cancelled: s.cancelled + 1 }));
    setTrip(null);
    setSheet(null);
    setTab("home");
    flash(req.service === "parcel" ? "Delivery cancelled" : "Ride cancelled");
  };

  const finish = (stars: number) => {
    if (!trip) return;
    const { req } = trip;
    const total = req.fare + (req.waitFee ?? 0);
    const net = Math.round(total * (1 - commission));
    const cut = Math.round(total * commission);
    const count = today.trips + 1;
    const daily = incentives[0];

    setToday((d) => ({ ...d, earnings: d.earnings + net, trips: count }));
    setWeek((w) => w + 1);
    if (new Date().getHours() >= 18 && new Date().getHours() < 21) setPeak((p) => p + 1);

    if (req.pay === "Cash") {
      setWallet((w) => ({ ...w, dues: w.dues + cut }));
      addTxn("Cash Commission", `Ride ${req.id} · ${Math.round(commission * 100)}% of ${inr(total)}`, -cut);
    } else {
      setWallet((w) => ({ ...w, balance: w.balance + net }));
      addTxn("Trip Earning", `Ride ${req.id} · ${req.pay}`, net);
    }
    if (count === daily.target) {
      setWallet((w) => ({ ...w, balance: w.balance + daily.reward }));
      addTxn("Incentive", `${daily.title} bonus`, daily.reward);
      setAlerts((a) => [["Bonus Unlocked 🎉", `${inr(daily.reward)} ${daily.title} bonus added to wallet`, "just now", "bonus"], ...a]);
      setUnread((u) => u + 1);
    }

    setTrips((t) => [{
      id: req.id, customer: req.customer, driver: rider.name, vehicle: rider.vehicle, from: req.from, to: req.to, km: req.km, min: req.min,
      service: req.service, ac: req.ac, parcel: req.parcel,
      fare: total, discount: 0, pay: req.pay, paid: true, status: "Completed", date: "Today", time: nowTime(), rating: stars || undefined,
    }, ...t]);
    setAlerts((a) => [["Trip Completed", req.pay === "Cash" ? `${inr(total)} collected in cash` : `${inr(net)} credited to your wallet`, "just now", "pay"], ...a]);
    setTrip(null);
    setTab("home");
    flash(count === daily.target ? `+${inr(net)} and ${inr(daily.reward)} bonus unlocked! 🎉` : `+${inr(net)} added to today's earnings`);
  };

  const withdraw = () => {
    const payable = wallet.balance - wallet.dues;
    if (wallet.dues > 0) addTxn("Dues Paid", "Adjusted from wallet", -wallet.dues);
    addTxn("Payout", "Instant payout · HDFC ••4521 (₹5 fee)", -payable);
    setWallet({ balance: 0, dues: 0 });
    flash(`${inr(payable - 5)} is on its way to your bank`);
  };

  const payDues = () => {
    addTxn("Dues Paid", "Paid via UPI", -wallet.dues);
    setWallet((w) => ({ ...w, dues: 0 }));
    flash("Cash dues cleared — thank you!");
  };

  const navigate = (to: string) => {
    if (prefs.nav === "Google Maps") window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(to)}`, "_blank", "noopener");
    else flash(`In-app navigation to ${to}`);
  };

  const sendChat = (body: string) => {
    setChat((c) => [...c, { id: Date.now(), from: "me", body, at: nowTime() }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setChat((c) => [...c, { id: Date.now() + 1, from: "agent", body: /payout|payment|money|wallet/i.test(body) ? "Weekly payouts settle every Monday to your linked bank account. You can also take an instant payout from your Wallet." : "Thanks! A rider support agent will call you back within 10 minutes.", at: nowTime() }]);
    }, 1300);
  };

  const toggleOnline = async (v: boolean) => {
    setOnline(v);
    if (!v) setRequest(null);
    const err = await setRiderOnline(rider.id, v);
    if (err) { setOnline(!v); flash(`Couldn't go ${v ? "online" : "offline"} — ${err}`); return; }
    flash(v ? "You're online — looking for rides" : "You're offline");
  };

  const openQuick = (k: QuickKey) => {
    if (k === "incentives") goTab("incentives");
    else push({ k });
  };

  const openAccount = (k: AccountKey) => push(k === "help" ? { k: "support" } : { k });

  const logout = async () => {
    if (online) await setRiderOnline(rider.id, false);
    await signOut();
    setOnline(false); setTrip(null); setStack([]); setTab("home"); setStage("splash");
    setRider(NO_RIDER); setTrips([]); setTxns([]); setFeedback([]);
  };

  const showNav = stage === "app" && !trip && !detail;
  const acceptance = pct(stats.accepted, stats.accepted + stats.declined);
  const cancellation = pct(stats.cancelled, stats.accepted);

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--app-bg)", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: SHELL_MAX_W, height: "100%", position: "relative", background: "var(--app-bg)", overflow: "hidden", boxShadow: "var(--shadow-float)", display: "flex", flexDirection: "column" }}>

        {stage === "splash" && (
          <SplashScreen tagline="Drive · Earn · Grow" cta="Log in" onStart={() => { setMode("login"); setStage("phone"); }}
            footer={<SplashLink prompt="New rider?" cta="Create an account" onClick={() => { setMode("signup"); setStage("phone"); }} />} />
        )}
        {stage === "phone" && <PhoneLogin
          {...(mode === "signup" ? {
            title: "Become a", accent: "Ridewallah rider", cta: "Continue",
            body: "Sign up with your mobile number. Next you'll add your vehicle, documents and bank details for approval.",
            switchTo: { prompt: "Already registered?", cta: "Log in", onClick: () => setMode("login") },
          } : {
            title: "Welcome, Rider", accent: "Let's get you earning",
            switchTo: { prompt: "New rider?", cta: "Create an account", onClick: () => setMode("signup") },
          })}
          onSend={async (p) => {
          const err = await sendOtp(p);
          if (!err) { setPhone(p); setStage("otp"); }
          return err;
        }} />}
        {stage === "otp" && (
          <OtpStep phone={phone} onBack={() => setStage("phone")} onResend={() => sendOtp(phone)}
            onVerify={async (code) => (await verifyOtp(phone, code)) ?? (await enter())} />
        )}
        {stage === "kyc" && (
          <KycFlow onSubmit={async (k) => {
            try {
              setRider(await registerRider({ name: k.name, vehicle: k.vehicle, model: k.model, plate: k.plate, city: k.city }));
              setMode("login"); // registered now — later checks are plain sign-ins
              setStage("pending");
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Couldn't submit your application";
              flash(/duplicate|unique/i.test(msg) ? "That vehicle number is already registered" : msg);
            }
          }} />
        )}
        {stage === "pending" && <PendingApproval name={rider.name} rejected={rider.kyc === "Rejected"} onLogout={logout} />}

        {stage === "app" && (detail?.k === "support" ? (
          <div style={{ flex: 1, minHeight: 0 }}>
            <ChatScreen title="Rider Support" messages={chat} typing={typing} onSend={sendChat} onBack={back} quick={["Payout issue", "Customer didn't show", "App problem", "Document update"]} />
          </div>
        ) : (
          <div ref={scrollRef} className="no-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", paddingBottom: showNav ? "calc(76px + env(safe-area-inset-bottom))" : undefined }}>
            {trip ? (
              <TripPage req={trip.req} phase={trip.phase} progress={trip.progress}
                onBack={() => flash("Finish or cancel this trip first")}
                onCall={() => { window.location.href = "tel:+919876543210"; }}
                onNavigate={() => navigate(trip.phase === "onTrip" ? trip.req.to : trip.req.from)}
                onCancel={() => setSheet("cancel")}
                onSos={() => setSheet("sos")}
                onArrived={() => { setTrip({ ...trip, phase: "arrived", progress: 1 }); flash("Customer notified that you've arrived"); }}
                onStart={(waitFee) => setTrip({ ...trip, req: { ...trip.req, waitFee }, phase: "onTrip", progress: 0 })}
                onEnd={() => setTrip({ ...trip, phase: "collect", progress: 1 })}
                onCollected={() => setTrip({ ...trip, phase: "rate" })}
                onRated={finish} />
            ) : detail ? (
              <>
                {detail.k === "alerts" && <AlertsScreen items={alerts} onBack={back} />}
                {detail.k === "wallet" && <WalletPage balance={wallet.balance} dues={wallet.dues} txns={txns} onWithdraw={withdraw} onPayDues={payDues} onBack={back} />}
                {detail.k === "performance" && <PerformancePage rider={rider} stats={{ ...stats, acceptance, cancellation }} feedback={feedback} onBack={back} />}
                {detail.k === "hotspots" && <HotspotsPage online={online} onNavigate={navigate} onGoOnline={() => toggleOnline(true)} onBack={back} />}
                {detail.k === "documents" && <DocumentsPage onBack={back} onUploaded={(d) => flash(`${d} uploaded — we'll verify it within 24 hours`)} />}
                {detail.k === "vehicle" && <VehiclePage rider={rider} onBack={back} />}
                {detail.k === "bank" && <BankPage onBack={back} onSaved={() => flash("UPI ID updated")} />}
                {detail.k === "preferences" && (
                  <PreferencesPage prefs={prefs} vehicle={rider.vehicle} onBack={back} onChange={(p) => {
                    setPrefs((x) => ({ ...x, ...p }));
                    if ("goHome" in p) flash(p.goHome ? "Go Home on — only rides towards home" : "Go Home off");
                  }} />
                )}
                {detail.k === "refer" && <ReferPage code={`RIDE${rider.initials}${rider.id.slice(-3)}`} onBack={back} onShare={() => flash("Invite link copied — share it on WhatsApp")} />}
                {detail.k === "trip" && (() => {
                  const r = trips.find((x) => x.id === detail.id);
                  return r ? <TripDetailPage ride={r} onBack={back} onHelp={() => push({ k: "support" })} /> : null;
                })()}
              </>
            ) : (
              <>
                {tab === "home" && (
                  <>
                    <RiderHome rider={rider} online={online} today={today} unread={unread} wallet={wallet.balance} goHome={prefs.goHome}
                      onToggle={toggleOnline}
                      onOpenEarnings={() => goTab("earnings")} onAlerts={() => { setUnread(0); push({ k: "alerts" }); }}
                      onQuick={openQuick} onClearGoHome={() => { setPrefs((p) => ({ ...p, goHome: null })); flash("Go Home off"); }} />
                    {online && !request && <div style={{ textAlign: "center", marginTop: -8, paddingBottom: 16 }}><DemoButton onClick={sendRequest}>send a ride request now</DemoButton></div>}
                  </>
                )}
                {tab === "earnings" && <EarningsScreen today={today} />}
                {tab === "trips" && <TripsScreen trips={trips} onOpen={(r) => push({ k: "trip", id: r.id })} />}
                {tab === "incentives" && <IncentivesScreen progress={{ today: today.trips, week, peak }} />}
                {tab === "account" && <RiderAccount rider={rider} stats={{ acceptance, cancellation }} onMenu={openAccount} onLogout={logout} />}
              </>
            )}
          </div>
        ))}

        {showNav && (
          <BottomNav<Tab> active={tab} onChange={goTab} items={[
            { id: "home", label: "Home", Icon: HomeGlyph },
            { id: "earnings", label: "Earnings", Icon: WalletGlyph },
            { id: "trips", label: "Trips", Icon: RidesGlyph },
            { id: "incentives", label: "Incentives", Icon: OffersGlyph },
            { id: "account", label: "Account", Icon: ProfileGlyph },
          ]} />
        )}

        {request && !trip && <RequestPopup key={request.id} req={request} autoAccept={prefs.autoAccept} towardsHome={!!prefs.goHome} onAccept={accept} onDecline={decline} />}
        {sheet === "cancel" && <CancelTripSheet onClose={() => setSheet(null)} onConfirm={cancelTrip} />}
        {sheet === "sos" && (
          <SosSheet onClose={() => setSheet(null)} onAction={(a) => {
            setSheet(null);
            if (a === "police") window.location.href = "tel:112";
            else flash(a === "safety" ? "Safety team alerted — they'll call you now" : "Live location shared with your emergency contacts");
          }} />
        )}
        <Toast msg={toast} bottom={showNav ? 90 : 96} />
      </div>
    </div>
  );
}
