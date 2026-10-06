"use server";

/* Admin panel writes. Every action re-checks the admin session (server actions are reachable by direct POST)
 * and validates its input before touching Supabase with the service-role key. */
import { revalidatePath } from "next/cache";
import { checkCredentials, endSession, requireAdmin, startSession } from "../lib/admin-auth";
import { supabaseAdmin } from "../lib/supabase/admin";
import type { Coupon, Driver, Ticket, Vehicle } from "../lib/data";

export type Result = { error?: string };

async function run(fn: () => PromiseLike<{ error: { message: string } | null } | void>): Promise<Result> {
  try {
    await requireAdmin();
    const res = await fn();
    if (res && res.error) return { error: res.error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

/** Catalog edits show up in the customer and rider apps on their next load. */
const refreshApps = () => { revalidatePath("/customer"); revalidatePath("/rider"); };

/* ───────── Session ───────── */

export async function login(email: string, password: string): Promise<Result> {
  if (!checkCredentials(String(email), String(password))) return { error: "Wrong email or password" };
  await startSession();
  return {};
}

export async function logout() {
  await endSession();
}

/* ───────── Drivers & customers ───────── */

const KYC: Driver["kyc"][] = ["Approved", "Pending", "Rejected"];

export async function updateDriver(id: string, p: Partial<Pick<Driver, "kyc" | "suspended" | "online">>) {
  return run(async () => {
    const patch: Record<string, unknown> = {};
    if (p.kyc !== undefined) { if (!KYC.includes(p.kyc)) throw new Error("Invalid KYC status"); patch.kyc = p.kyc; }
    if (p.suspended !== undefined) patch.suspended = !!p.suspended;
    if (p.online !== undefined) patch.online = !!p.online;
    return supabaseAdmin.from("drivers").update(patch).eq("id", String(id));
  });
}

export async function setCustomerBlocked(id: string, blocked: boolean) {
  return run(() => supabaseAdmin.from("customers").update({ blocked: !!blocked }).eq("id", String(id)));
}

/* ───────── Support ───────── */

const TICKET_STATUS: Ticket["status"][] = ["Open", "In Progress", "Resolved"];

export async function setTicketStatus(id: string, status: Ticket["status"]) {
  return run(async () => {
    if (!TICKET_STATUS.includes(status)) throw new Error("Invalid ticket status");
    return supabaseAdmin.from("tickets").update({ status }).eq("id", String(id));
  });
}

/** Adds a note; an Open ticket moves to In Progress once someone replies. */
export async function addTicketNote(id: string, body: string) {
  return run(async () => {
    const text = String(body).trim().slice(0, 2000);
    if (!text) throw new Error("Note is empty");
    const ins = await supabaseAdmin.from("ticket_notes").insert({ ticket_id: String(id), body: text });
    if (ins.error) return ins;
    return supabaseAdmin.from("tickets").update({ status: "In Progress" }).eq("id", String(id)).eq("status", "Open");
  });
}

/* ───────── Pricing & coupons ───────── */

const num = (n: unknown) => { const v = Number(n); if (!Number.isFinite(v) || v < 0) throw new Error("Prices must be zero or more"); return v; };

export async function savePricing(vehicles: Vehicle[]) {
  return run(async () => {
    for (const v of vehicles) {
      const res = await supabaseAdmin.from("vehicles").update({
        base: num(v.base), per_km: num(v.perKm), per_min: num(v.perMin), min_fare: num(v.minFare), cancel_fee: num(v.cancelFee),
        parcel_max_kg: Math.round(num(v.parcelMaxKg)), ac_option: !!v.acOption, enabled: !!v.enabled,
      }).eq("id", String(v.id));
      if (res.error) return res;
    }
    refreshApps();
  });
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "31 Dec 2026" → "2026-12-31" */
const isoDate = (label: string) => {
  const [d, m, y] = String(label).split(" ");
  const mi = MONTHS.indexOf(m);
  if (mi < 0 || !/^\d{1,2}$/.test(d) || !/^\d{4}$/.test(y)) throw new Error("Invalid expiry date");
  return `${y}-${String(mi + 1).padStart(2, "0")}-${d.padStart(2, "0")}`;
};

export async function createCoupon(c: Coupon) {
  return run(async () => {
    const code = String(c.code).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
    if (!code) throw new Error("Code is required");
    const off = num(c.off);
    if (off <= 0 || (c.pct && off > 100)) throw new Error("Enter a valid discount");
    const res = await supabaseAdmin.from("coupons").insert({
      code, title: String(c.title).slice(0, 80), body: String(c.body ?? "").slice(0, 200), off, pct: !!c.pct,
      max: c.max === undefined ? null : num(c.max), expires: isoDate(c.expires), uses: 0, active: c.active ?? true,
    });
    if (res.error?.code === "23505") throw new Error(`Coupon ${code} already exists`);
    if (res.error) return res;
    refreshApps();
  });
}

export async function setCouponActive(code: string, active: boolean) {
  return run(async () => {
    const res = await supabaseAdmin.from("coupons").update({ active: !!active }).eq("code", String(code));
    if (res.error) return res;
    refreshApps();
  });
}
