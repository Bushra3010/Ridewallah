/* Loads the admin-managed catalog (pricing, parcel slabs, offers, hotspots, incentives) from Supabase.
 * Server-only: pages call this and hand the result to <CatalogProvider>. */
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "./supabase/admin";
import type { Coupon, Hotspot, Incentive, ParcelWeight, Vehicle } from "./data";

export interface Catalog {
  vehicles: Vehicle[];
  parcelWeights: ParcelWeight[];
  coupons: Coupon[];
  hotspots: Hotspot[];
  incentives: Incentive[];
}

// Public reads go through the anon key so RLS decides what's visible (e.g. only active coupons).
const supabasePublic = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-10-31" → "31 Oct 2026" */
const dateLabel = (iso: string) => { const [y, m, d] = iso.split("-"); return `${d} ${MONTHS[+m - 1]} ${y}`; };

/** `asAdmin` reads with the service-role key — the admin panel needs inactive coupons too. */
export async function getCatalog({ asAdmin = false } = {}): Promise<Catalog> {
  const db = asAdmin ? supabaseAdmin : supabasePublic;
  const [vehicles, weights, coupons, hotspots, incentives] = await Promise.all([
    db.from("vehicles").select("*").order("sort"),
    db.from("parcel_weights").select("*").order("sort"),
    db.from("coupons").select("*").order("expires"),
    db.from("hotspots").select("*").order("surge", { ascending: false }),
    db.from("incentives").select("*").order("id"),
  ]);
  const err = [vehicles, weights, coupons, hotspots, incentives].find((r) => r.error)?.error;
  if (err) throw new Error(`Couldn't load catalog from Supabase: ${err.message}`);

  return {
    vehicles: vehicles.data!.map((v) => ({
      id: v.id, name: v.name, tagline: v.tagline, seats: v.seats,
      base: +v.base, perKm: +v.per_km, perMin: +v.per_min, minFare: +v.min_fare, cancelFee: +v.cancel_fee,
      eta: v.eta, enabled: v.enabled, acOption: v.ac_option, parcelMaxKg: v.parcel_max_kg,
    })),
    parcelWeights: weights.data!.map((w) => ({ id: w.id, label: w.label, kg: +w.kg, extra: +w.extra })),
    coupons: coupons.data!.map((c) => ({
      code: c.code, title: c.title, body: c.body, off: +c.off, pct: c.pct, max: c.max === null ? undefined : +c.max,
      expires: dateLabel(c.expires), uses: c.uses, active: c.active,
    })),
    hotspots: hotspots.data!.map((h) => ({ id: h.id, area: h.area, km: +h.km, surge: +h.surge, waiting: h.waiting })),
    incentives: incentives.data!.map((i) => ({ id: i.id, title: i.title, body: i.body, target: i.target, reward: +i.reward, kind: i.kind, ends: i.ends })),
  };
}
