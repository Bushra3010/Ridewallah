/* Customer & rider accounts in the browser: phone OTP sign-in plus loading the signed-in person's own data.
 * Everything here runs with the anon key + the user's session, so row-level security decides what comes back. */
import { supabase } from "./supabase/client";
import { RIDE_SELECT, e164, prettyPhone, toCustomer, toDriver, toFeedback, toRide, toWalletTxn, type Feedback } from "./mappers";
import type { Customer, Driver, Ride, VehicleKind, WalletTxn } from "./data";

/** Supabase's messages, reworded where a customer would otherwise see jargon. */
function friendly(message: string) {
  if (/provider|phone.*(disabled|not enabled)|unsupported/i.test(message)) return "Phone sign-in isn't set up yet. Please try again later.";
  if (/expired|invalid.*(otp|token)|token.*(invalid|expired)/i.test(message)) return "That code is wrong or has expired.";
  if (/rate limit|too many|security purposes/i.test(message)) return "Too many attempts — please wait a minute and try again.";
  return message;
}

/* ───────── Sign-in ───────── */

/** Returns an error message, or null when the SMS was sent. */
export async function sendOtp(phone: string) {
  const { error } = await supabase.auth.signInWithOtp({ phone: e164(phone) });
  return error ? friendly(error.message) : null;
}

export async function verifyOtp(phone: string, code: string) {
  const { error } = await supabase.auth.verifyOtp({ phone: e164(phone), token: code, type: "sms" });
  return error ? friendly(error.message) : null;
}

export async function hasSession() {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

export async function signOut() {
  await supabase.auth.signOut();
}

async function uid() {
  return (await me()).id;
}

/** The signed-in user and their verified phone, formatted like stored phones ("+91 98765 43210"). */
async function me() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return { id: data.user.id, phone: prettyPhone((data.user.phone ?? "").replace(/\D/g, "").slice(-10)) };
}

/** Picks up any profile created for this phone before sign-up (seed data or added by an admin). */
async function claim() {
  const { error } = await supabase.rpc("claim_profiles");
  if (error) throw new Error(error.message);
}

const check = <T,>(res: { data: T; error: { message: string } | null }) => {
  if (res.error) throw new Error(res.error.message);
  return res.data;
};
/** Like check, for list queries — an empty result is []. */
const list = <T,>(res: { data: T[] | null; error: { message: string } | null }) => check(res) ?? [];

/* ───────── Customers ───────── */

/** The signed-in customer's profile, or null if they haven't set one up yet. */
export async function loadCustomer(): Promise<Customer | null> {
  await claim();
  const row = check(await supabase.from("customers").select("*").eq("user_id", await uid()).maybeSingle());
  return row ? toCustomer(row) : null;
}

export async function createCustomer(p: { name: string; email: string }): Promise<Customer> {
  const u = await me();
  const row = check(await supabase.from("customers")
    .insert({ user_id: u.id, name: p.name, email: p.email || null, phone: u.phone }).select().single());
  return toCustomer(row);
}

export async function loadCustomerRides(customerId: string): Promise<Ride[]> {
  const rows = list(await supabase.from("rides").select(RIDE_SELECT).eq("customer_id", customerId).order("created_at", { ascending: false }));
  return rows.map(toRide);
}

/* ───────── Riders ───────── */

export async function loadRider(): Promise<Driver | null> {
  await claim();
  const row = check(await supabase.from("drivers").select("*").eq("user_id", await uid()).maybeSingle());
  if (!row) return null;
  const rides = list(await supabase.from("rides").select("driver_id, status, fare, discount").eq("driver_id", row.id));
  return toDriver(row, rides);
}

export async function registerRider(k: { name: string; vehicle: VehicleKind; model: string; plate: string; city: string }): Promise<Driver> {
  const u = await me();
  const row = check(await supabase.from("drivers").insert({
    user_id: u.id, name: k.name, phone: u.phone, vehicle: k.vehicle, model: k.model, plate: k.plate.toUpperCase(), city: k.city,
  }).select().single());
  return toDriver(row);
}

export async function loadRiderActivity(driverId: string): Promise<{ trips: Ride[]; wallet: WalletTxn[]; feedback: Feedback[] }> {
  const [trips, wallet, feedback] = await Promise.all([
    supabase.from("rides").select(RIDE_SELECT).eq("driver_id", driverId).order("created_at", { ascending: false }),
    supabase.from("wallet_txns").select("*").eq("driver_id", driverId).order("created_at", { ascending: false }),
    supabase.from("feedback").select("*, customer:customers(name)").eq("driver_id", driverId).order("created_at", { ascending: false }),
  ]);
  return { trips: list(trips).map(toRide), wallet: list(wallet).map(toWalletTxn), feedback: list(feedback).map(toFeedback) };
}

/** Returns an error message, or null. RLS refuses "online" for riders who aren't approved. */
export async function setRiderOnline(driverId: string, online: boolean) {
  const { error } = await supabase.from("drivers").update({ online }).eq("id", driverId);
  return error ? error.message : null;
}
