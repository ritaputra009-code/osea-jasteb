import crypto from "node:crypto";

const ALNUM = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function htmlEscape(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function jsString(value: unknown) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "");
}

export function numberFormat(value: number) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

export function numberFormatId(value: number) {
  return new Intl.NumberFormat("id-ID").format(Number(value || 0));
}

function partsJakarta(date = new Date()) {
  const dtf = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const p: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) p[part.type] = part.value;
  return p;
}

export function phpDateTimeJakarta(date = new Date()) {
  const p = partsJakarta(date);
  return `${p.day}-${p.month}-${p.year} ${p.hour}:${p.minute}:${p.second}`;
}

export function phpDateJakarta(date = new Date()) {
  const p = partsJakarta(date);
  return `${p.day}-${p.month}-${p.year}`;
}

export function phpYmdTimeJakarta(date = new Date()) {
  const p = partsJakarta(date);
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

export function phpEnglishDashboardDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).formatToParts(date);
  const obj: Record<string, string> = {};
  for (const part of parts) obj[part.type] = part.value;
  return `${obj.weekday}, ${obj.day} ${obj.month} ${obj.year}`;
}

export function randomPayCode(length = 40) {
  const digits = "0123456789";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const bytes = crypto.randomBytes(Math.max(length, 3) + 8);
  let out =
    digits[bytes[0] % digits.length] +
    upper[bytes[1] % upper.length] +
    lower[bytes[2] % lower.length];
  for (let i = 3; out.length < length; i += 1) out += ALNUM[bytes[i] % ALNUM.length];
  return out.split("").sort(() => Math.random() - 0.5).join("");
}

export function makeTransactionId() {
  const time = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(2).toString("hex").toUpperCase().slice(0, 3);
  return `INV-${time}-${random}`;
}

export function makeProductId(nama: string) {
  const slug = nama.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `p-${slug || Date.now().toString(36)}-${crypto.randomBytes(2).toString("hex")}`;
}

export function normalizeStatus(status: unknown): "pending" | "sukses" | "expired" {
  const s = String(status || "pending").toLowerCase();
  if (s === "sukses" || s === "expired") return s;
  return "pending";
}
