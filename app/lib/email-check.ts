"use server";

/* Sign-up email check: a real address needs a domain that can receive mail, so look up its MX records
 * (falling back to an A/AAAA record, which mail servers also accept). Typos like "gmial.com" fail here.
 * This can't prove the mailbox itself exists — Supabase's confirmation email does that. */
import { resolve4, resolve6, resolveMx } from "node:dns/promises";

/** DNS answers that mean "this domain has nowhere to deliver mail". Anything else (timeouts, no network) isn't held against the user. */
const MISSING = new Set(["ENOTFOUND", "ENODATA", "ENONAME", "NXDOMAIN"]);

async function has(lookup: Promise<unknown[]>) {
  try { return (await lookup).length > 0; }
  catch (e) { if (MISSING.has((e as NodeJS.ErrnoException).code ?? "")) return false; throw e; }
}

/** True when the email's domain can receive mail. */
export async function emailCanReceiveMail(email: string) {
  const domain = email.trim().split("@").pop()?.toLowerCase() ?? "";
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain)) return false;
  try {
    const mx = await resolveMx(domain);
    // RFC 7505 "null MX" (a single record with an empty exchange) means the domain accepts no mail.
    if (mx.length) return !(mx.length === 1 && (mx[0].exchange === "" || mx[0].exchange === "."));
  } catch (e) {
    if (!MISSING.has((e as NodeJS.ErrnoException).code ?? "")) return true;
  }
  try { return (await has(resolve4(domain))) || (await has(resolve6(domain))); }
  catch { return true; }
}
