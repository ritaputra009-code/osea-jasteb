import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db, logWebhook } from "@/lib/store";
import { phpYmdTimeJakarta } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Payload = Record<string, unknown>;

function text(message: string, status = 200) {
  return new NextResponse(message, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
  });
}

function flattenObject(input: any, prefix = "", out: Record<string, unknown> = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return out;
  for (const [key, value] of Object.entries(input)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) flattenObject(value, nextKey, out);
    else {
      out[nextKey.toLowerCase()] = value;
      out[String(key).toLowerCase()] = value;
    }
  }
  return out;
}

function pick(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key.toLowerCase()];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
}

function normalizeType(value: unknown) {
  return String(value ?? "").toLowerCase().replace(/[\[\]]/g, "").trim();
}

function parseAmount(value: unknown) {
  if (typeof value === "number") return Math.round(value);
  let s = String(value ?? "").trim().replace(/[^\d.,]/g, "");
  if (!s) return 0;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  const lastSep = Math.max(lastComma, lastDot);
  if (lastSep >= 0) {
    const after = s.slice(lastSep + 1);
    if (after.length === 2) s = s.slice(0, lastSep);
  }
  return Number.parseInt(s.replace(/\D/g, ""), 10) || 0;
}

async function readPayload(req: NextRequest) {
  const raw = await req.text();
  const trimmed = raw.trim();
  let parsed: any = {};

  try {
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) parsed = parsed[0] || {};
    } else if (trimmed.includes("=")) {
      parsed = Object.fromEntries(new URLSearchParams(trimmed).entries());
    }
  } catch {
    parsed = {};
  }

  const queryPayload = Object.fromEntries(req.nextUrl.searchParams.entries());
  return { raw, payload: flattenObject({ ...queryPayload, ...parsed }) };
}

async function saveLog(data: { amount?: number; response: string; trx_id?: string; raw: string; payload: Payload }) {
  await logWebhook({
    amount: data.amount ?? null,
    response: data.response,
    trx_id: data.trx_id ?? null,
    raw: data.raw,
    payload: data.payload
  });
}

async function findTarget(amount: number, now: number) {
  const client = db();
  const pending = await client
    .from("transactions")
    .select("trx_id,total,status,expired")
    .eq("total", amount)
    .eq("status", "pending")
    .gte("expired", now - 30 * 60)
    .order("expired", { ascending: true })
    .limit(1);
  if (pending.error) throw pending.error;
  if (pending.data && pending.data.length > 0) return pending.data[0];

  const expired = await client
    .from("transactions")
    .select("trx_id,total,status,expired")
    .eq("total", amount)
    .eq("status", "expired")
    .gte("expired", now - 30 * 60)
    .order("expired", { ascending: false })
    .limit(1);
  if (expired.error) throw expired.error;
  if (expired.data && expired.data.length > 0) return expired.data[0];

  return null;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.INFOSALDO_API_KEY || "";
  const incomingKey = req.headers.get("x-is-apikey") || "";
  if (!incomingKey || incomingKey.trim() !== apiKey.trim()) return text("Invalid API Key", 400);

  const { raw, payload } = await readPayload(req);
  const type = normalizeType(pick(payload, ["type", "jenis", "direction", "mutation_type", "transaction_type"]));
  if (type && !type.includes("masuk") && !type.includes("credit") && !type.includes("kredit") && type !== "in" && type !== "cr") {
    const response = `NOT_IN:${type}`;
    await saveLog({ response, raw, payload });
    return text(response);
  }

  const amount = parseAmount(pick(payload, ["amount", "nominal", "jumlah", "total", "value", "credit", "mutasi_amount"]));
  if (!amount) {
    const response = `NO_AMOUNT:${raw.slice(0, 120)}`;
    await saveLog({ response, raw, payload });
    return text(response, 400);
  }

  const token = String(pick(payload, ["token", "ref_id", "reference", "id", "trxid", "mutasi_id", "rrn"])).trim();
  const time = String(pick(payload, ["time", "date", "created_at", "datetime", "tanggal"])).trim();
  const uniqueHash = token || time ? crypto.createHash("md5").update(`${token}|${amount}|${time}`).digest("hex") : "";
  const client = db();

  if (uniqueHash) {
    const duplicate = await client.from("transactions").select("trx_id,status").eq("unik", uniqueHash).maybeSingle();
    if (duplicate.error) throw duplicate.error;
    if (duplicate.data) {
      const response = `OK_DUPLICATE:${duplicate.data.trx_id}`;
      await saveLog({ amount, response, trx_id: duplicate.data.trx_id, raw, payload });
      return text(response);
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const target = await findTarget(amount, now);
  if (!target) {
    const response = `NO_MATCH_AMOUNT:${amount}`;
    await saveLog({ amount, response, raw, payload });
    return text(response);
  }

  const update = await client
    .from("transactions")
    .update({
      status: "sukses",
      paid_time: now,
      waktu_bayar: phpYmdTimeJakarta(new Date()),
      token,
      unik: uniqueHash || null
    })
    .eq("trx_id", target.trx_id)
    .select("trx_id,status")
    .maybeSingle();

  if (update.error) {
    const response = `UPDATE_ERROR:${update.error.message}`;
    await saveLog({ amount, response, trx_id: target.trx_id, raw, payload });
    return text(response, 500);
  }

  const response = `OK:${target.trx_id}`;
  await saveLog({ amount, response, trx_id: target.trx_id, raw, payload });
  return text(response);
}

export async function GET() {
  return text("Webhook aktif. Gunakan POST dari InfoSaldo.");
}
