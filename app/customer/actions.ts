"use server";

/* Customer-side server actions. Customers can't read the drivers table (RLS), so dispatch runs here
 * with the service-role key — after checking the caller's Supabase session. */
import { supabaseAdmin } from "../lib/supabase/admin";
import { toDriver } from "../lib/mappers";
import type { Driver, VehicleKind } from "../lib/data";

const KINDS: VehicleKind[] = ["bike", "auto", "mini", "sedan", "suv"];

/** Picks an available rider for a booking: approved, not suspended, online, driving `vehicle`.
 * Chooses at random among them so requests spread out. Returns null when nobody is available. */
export async function findDriver(accessToken: string, vehicle: VehicleKind): Promise<{ driver: Driver | null; error?: string }> {
  try {
    if (!KINDS.includes(vehicle)) return { driver: null, error: "Unknown vehicle type" };
    const { data: auth } = await supabaseAdmin.auth.getUser(String(accessToken));
    if (!auth.user) return { driver: null, error: "Please log in again" };
    const { data: me } = await supabaseAdmin.from("customers").select("id, blocked").eq("user_id", auth.user.id).maybeSingle();
    if (!me) return { driver: null, error: "Finish setting up your profile first" };
    if (me.blocked) return { driver: null, error: "Your account is blocked" };

    const { data: pool, error } = await supabaseAdmin.from("drivers").select("*")
      .eq("vehicle", vehicle).eq("kyc", "Approved").eq("suspended", false).eq("online", true);
    if (error) return { driver: null, error: error.message };
    if (!pool?.length) return { driver: null };

    const pick = pool[Math.floor(Math.random() * pool.length)];
    const { data: trips } = await supabaseAdmin.from("rides").select("driver_id, status, fare, discount")
      .eq("driver_id", pick.id).eq("status", "Completed");
    return { driver: toDriver(pick, trips ?? []) };
  } catch (e) {
    return { driver: null, error: e instanceof Error ? e.message : "Couldn't reach dispatch" };
  }
}
