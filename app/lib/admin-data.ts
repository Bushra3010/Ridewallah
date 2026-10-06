/* Loads everything the admin panel lists — rides, drivers, customers, transactions, tickets — with the
 * service-role key. Server-only; the admin page calls this only after isAdmin(). */
import "server-only";
import { supabaseAdmin } from "./supabase/admin";
import type { Customer, Driver, Ride, Ticket, Txn } from "./data";

export interface AdminData { rides: Ride[]; drivers: Driver[]; customers: Customer[]; txns: Txn[]; tickets: Ticket[] }

/** Share of each fare a driver keeps — mirrors the 20% platform commission. */
const DRIVER_SHARE = 0.8;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n: number) => String(n).padStart(2, "0");

/** Timestamps are shown in IST: "28 Sep 2026", "10:38 AM", and "28 Sep, 10:38 AM". */
function ist(iso: string) {
  const d = new Date(new Date(iso).getTime() + 5.5 * 3600 * 1000);
  const h = d.getUTCHours();
  const day = `${pad(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]}`;
  const time = `${pad(h % 12 || 12)}:${pad(d.getUTCMinutes())} ${h < 12 ? "AM" : "PM"}`;
  return { date: `${day} ${d.getUTCFullYear()}`, time, at: `${day}, ${time}` };
}

const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export async function getAdminData(): Promise<AdminData> {
  const db = supabaseAdmin;
  const [rides, drivers, customers, txns, tickets] = await Promise.all([
    db.from("rides").select("*, customer:customers(name), driver:drivers(name), weight:parcel_weights(label)").order("created_at", { ascending: false }),
    db.from("drivers").select("*").order("id"),
    db.from("customers").select("*").order("id"),
    db.from("transactions").select("*").order("created_at", { ascending: false }),
    db.from("tickets").select("*, notes:ticket_notes(body, created_at)").order("created_at", { ascending: false }),
  ]);
  const err = [rides, drivers, customers, txns, tickets].find((r) => r.error)?.error;
  if (err) throw new Error(`Couldn't load admin data from Supabase: ${err.message}`);

  const rideRows = rides.data!;
  const done = rideRows.filter((r) => r.status === "Completed");
  const sum = <T,>(rows: T[], f: (r: T) => number) => rows.reduce((s, r) => s + f(r), 0);

  return {
    rides: rideRows.map((r): Ride => {
      const t = ist(r.created_at);
      return {
        id: r.id, service: r.service, customer: r.customer?.name ?? "—", driver: r.driver?.name ?? "—", vehicle: r.vehicle,
        ac: r.ac ?? undefined, from: r.from_address, to: r.to_address, km: +r.km, min: r.min,
        fare: +r.fare, discount: +r.discount, pay: r.pay, paid: r.paid, status: r.status,
        date: t.date, time: t.time, rating: r.rating ?? undefined, cancelReason: r.cancel_reason ?? undefined,
        parcel: r.service === "parcel" ? {
          type: r.parcel_type, weight: r.weight?.label ?? "", receiver: r.parcel_receiver ?? "",
          receiverPhone: r.parcel_receiver_phone ?? "", note: r.parcel_note ?? undefined,
        } : undefined,
      };
    }),
    drivers: drivers.data!.map((d): Driver => {
      const mine = done.filter((r) => r.driver_id === d.id);
      return {
        id: d.id, name: d.name, initials: initials(d.name), phone: d.phone, rating: +d.rating, trips: mine.length,
        vehicle: d.vehicle, model: d.model, plate: d.plate, city: d.city, kyc: d.kyc, online: d.online, suspended: d.suspended,
        joined: ist(d.joined).date, earnings: Math.round(sum(mine, (r) => (+r.fare - +r.discount) * DRIVER_SHARE)),
      };
    }),
    customers: customers.data!.map((c): Customer => {
      const mine = done.filter((r) => r.customer_id === c.id);
      return {
        id: c.id, name: c.name, initials: initials(c.name), phone: c.phone, email: c.email ?? "", rides: mine.length,
        spent: sum(mine, (r) => +r.fare - +r.discount), rating: +c.rating, joined: ist(c.joined).date,
        blocked: c.blocked, complaints: c.complaints,
      };
    }),
    txns: txns.data!.map((t): Txn => ({
      id: t.id, kind: t.kind, who: t.who, amount: +t.amount, method: t.method, at: ist(t.created_at).at, ride: t.ride_id ?? undefined,
    })),
    tickets: tickets.data!.map((t): Ticket => ({
      id: t.id, from: t.from_name, role: t.role, subject: t.subject, ride: t.ride_id ?? undefined, status: t.status,
      at: ist(t.created_at).at,
      notes: [...t.notes].sort((a, b) => a.created_at.localeCompare(b.created_at)).map((n) => n.body),
    })),
  };
}
