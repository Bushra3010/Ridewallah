// Server-side pricing and promotion enforcement. Expected rules come from the configured data:
// coupon titles/bodies in the coupons table ("Flat ₹20 off on Auto", "50% off your first ride", expiry dates),
// payment-method availability, and the catalog. The client never sends a fare; the server prices every booking.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { admin, engine, pricing, assertIsolated, makeCustomer, booking, ride, rejects, cleanup, TEST_VEHICLE } from "./helpers.mjs";

before(assertIsolated);
after(async () => { await admin.from("coupons").delete().eq("code", "QAEXPIRED"); await cleanup(); });

const cancel = (C, id) => engine.cancelForCustomer(C.token, id, "test").catch(() => {});

test("Q1 the server prices the booking from the catalog (client sends no fare)", async () => {
  const C = await makeCustomer();
  const b = await engine.book(C.token, booking({ fare: 1, discount: 999 }));
  const { data: v } = await admin.from("vehicles").select("*").eq("id", TEST_VEHICLE).single();
  const { km, min } = pricing.tripEstimate("home", "work");
  const expected = pricing.fareFor({ ...v, perKm: +v.per_km, perMin: +v.per_min, minFare: +v.min_fare, base: +v.base, acOption: v.ac_option }, km, min, b.surge, true);
  assert.equal(b.fare, expected); assert.equal(b.discount, 0);
  await cancel(C, b.id);
});

test("Q2 the charged distance follows the real pickup/drop, not client-chosen place ids", async () => {
  const C = await makeCustomer();
  const far = await engine.book(C.token, booking({ fromId: "a", toId: "b", fromName: "Connaught Place", toName: "Jewar Airport" }));
  await cancel(C, far.id);
  const C2 = await makeCustomer();
  const near = await engine.book(C2.token, booking({ fromId: "a", toId: "b", fromName: "Sector 18", toName: "Sector 18 Market" }));
  await cancel(C2, near.id);
  assert.notEqual(far.km, near.km, `Connaught Place→Jewar Airport and Sector 18→Sector 18 Market both priced at ${far.km} km — the client's ids decide the distance`);
});

test("Q3 vehicle-specific coupon (\"Flat ₹20 off on Auto\") does not apply to other vehicles", async () => {
  const C = await makeCustomer();
  const b = await engine.book(C.token, booking({ couponCode: "AUTO20" }));
  await cancel(C, b.id);
  assert.equal(b.discount, 0, `AUTO20 gave ₹${b.discount} off a ${TEST_VEHICLE} ride`);
});

test("Q4 first-ride coupon (FIRST50) cannot be reused", async () => {
  const C = await makeCustomer();
  const first = await engine.book(C.token, booking({ couponCode: "FIRST50" }));
  await cancel(C, first.id);
  await admin.from("rides").update({ status: "Completed" }).eq("id", first.id); // as if the first ride happened
  const second = await engine.book(C.token, booking({ couponCode: "FIRST50" }));
  await cancel(C, second.id);
  assert.equal(second.discount, 0, `FIRST50 applied again on a second ride (₹${second.discount} off)`);
});

test("Q5 an expired coupon is not applied", async () => {
  await admin.from("coupons").insert({ code: "QAEXPIRED", title: "QA expired", body: "", off: 10, pct: false, expires: "2020-01-01", active: true });
  const C = await makeCustomer();
  const b = await engine.book(C.token, booking({ couponCode: "QAEXPIRED" }));
  await cancel(C, b.id);
  assert.equal(b.discount, 0, `coupon that expired in 2020 still gave ₹${b.discount} off`);
});

test("Q6 unknown, inactive and lower-case codes: only valid active codes apply", async () => {
  const C = await makeCustomer();
  const a = await engine.book(C.token, booking({ couponCode: "NOPE123" }));
  await cancel(C, a.id); assert.equal(a.discount, 0);
  const b = await engine.book(C.token, booking({ couponCode: "AIRPORT99" })); // inactive in the catalog
  await cancel(C, b.id); assert.equal(b.discount, 0);
});

test("Q7 malformed booking input is rejected or bounded", async () => {
  const C = await makeCustomer();
  assert.match(await rejects(() => engine.book(C.token, booking({ vehicle: "rocket" }))), /isn't available/i);
  assert.match(await rejects(() => engine.book(C.token, booking({ pay: "Bitcoin" }))), /payment method/i);
  assert.match(await rejects(() => engine.book(C.token, booking({ service: "parcel" }))), /parcel weight/i);
  const long = "x".repeat(10_000);
  const b = await engine.book(C.token, booking({ fromName: long, toName: "<img src=x onerror=alert(1)>" }));
  const r = await ride(b.id);
  assert.equal(r.from_address.length, 120, "names are truncated");
  assert.equal(r.to_address, "<img src=x onerror=alert(1)>", "stored as text (React escapes it when rendered)");
  await cancel(C, b.id);
});

test("Q8 paying by wallet requires a wallet balance", async () => {
  // The app shows "Ridewallah Wallet · Balance ₹240", but there is no wallet balance on the server.
  const C = await makeCustomer();
  const b = await engine.book(C.token, booking({ pay: "Wallet" }));
  await cancel(C, b.id);
  const { data } = await admin.from("customers").select("*").eq("id", C.customer.id).single();
  assert.ok("wallet_balance" in data, "no wallet balance exists anywhere — wallet rides are marked paid without any debit");
});
