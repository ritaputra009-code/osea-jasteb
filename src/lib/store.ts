import { createClient } from "@supabase/supabase-js";
import type { Product, Transaction } from "@/lib/types";
import { normalizeStatus, phpYmdTimeJakarta } from "@/lib/utils";

let cachedClient: any = null;

export function db(): any {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diisi.");
  if (!cachedClient) {
    cachedClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return cachedClient;
}

function clean(obj: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

function normalizeProduct(row: any): Product {
  return {
    id: String(row.id),
    nama: String(row.nama),
    harga: Number(row.harga),
    created_at: row.created_at
  };
}

function normalizeTransaction(row: any): Transaction {
  return {
    trx_id: String(row.trx_id),
    pay_code: String(row.pay_code || ""),
    kode_unik: Number(row.kode_unik),
    email: String(row.email || ""),
    result: String(row.result || ""),
    harga: Number(row.harga || 0),
    total: Number(row.total || 0),
    status: normalizeStatus(row.status),
    expired: Number(row.expired || 0),
    tanggal: String(row.tanggal || ""),
    waktu_bayar: row.waktu_bayar ?? null,
    paid_time: row.paid_time == null ? null : Number(row.paid_time),
    token: row.token ?? null,
    unik: row.unik ?? null,
    created_at: row.created_at
  };
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await db()
    .from("products")
    .select("id,nama,harga,created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(normalizeProduct);
}

export async function upsertProduct(product: Product): Promise<Product> {
  const payload = { id: product.id, nama: product.nama, harga: Number(product.harga) };
  const { data, error } = await db()
    .from("products")
    .upsert(payload, { onConflict: "id" })
    .select("id,nama,harga,created_at")
    .single();
  if (error) throw error;
  return normalizeProduct(data);
}

export async function deleteProductByIndex(index: number) {
  const products = await getProducts();
  const target = products[index];
  if (!target) return false;
  const { error } = await db().from("products").delete().eq("id", target.id);
  if (error) throw error;
  return true;
}

export async function editProductByIndex(index: number, nama: string, harga: number) {
  const products = await getProducts();
  const target = products[index];
  if (!target) return null;
  return upsertProduct({ id: target.id, nama, harga });
}

export async function addTransaction(trx: Transaction): Promise<Transaction> {
  const payload = clean({
    trx_id: trx.trx_id,
    pay_code: trx.pay_code,
    kode_unik: trx.kode_unik,
    email: trx.email,
    result: trx.result,
    harga: trx.harga,
    total: trx.total,
    status: trx.status,
    expired: trx.expired,
    tanggal: trx.tanggal,
    waktu_bayar: trx.waktu_bayar ?? null,
    paid_time: trx.paid_time ?? null,
    token: trx.token ?? null,
    unik: trx.unik ?? null
  });
  const { data, error } = await db().from("transactions").insert(payload).select("*").single();
  if (error) throw error;
  return normalizeTransaction(data);
}

export async function getTransactions(): Promise<Transaction[]> {
  const { data, error } = await db()
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(normalizeTransaction);
}

export async function getTransactionByTrxId(trxId: string): Promise<Transaction | null> {
  const { data, error } = await db()
    .from("transactions")
    .select("*")
    .eq("trx_id", trxId)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeTransaction(data) : null;
}

export async function getTransactionByPayCode(payCode: string): Promise<Transaction | null> {
  const { data, error } = await db()
    .from("transactions")
    .select("*")
    .eq("pay_code", payCode)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeTransaction(data) : null;
}

export async function getTransactionByAnyId(id: string): Promise<Transaction | null> {
  const pay = await getTransactionByPayCode(id);
  if (pay) return pay;
  return getTransactionByTrxId(id);
}

export async function updateTransaction(trxId: string, patch: Partial<Transaction>): Promise<Transaction | null> {
  const payload = clean({
    pay_code: patch.pay_code,
    kode_unik: patch.kode_unik,
    email: patch.email,
    result: patch.result,
    harga: patch.harga,
    total: patch.total,
    status: patch.status,
    expired: patch.expired,
    tanggal: patch.tanggal,
    waktu_bayar: patch.waktu_bayar,
    paid_time: patch.paid_time,
    token: patch.token,
    unik: patch.unik
  });
  const { data, error } = await db()
    .from("transactions")
    .update(payload)
    .eq("trx_id", trxId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeTransaction(data) : null;
}

export async function approveTransactionByIndex(index: number) {
  const all = await getTransactions();
  const target = all[index];
  if (!target) return null;
  return updateTransaction(target.trx_id, {
    status: "sukses",
    waktu_bayar: target.waktu_bayar || phpYmdTimeJakarta(new Date()),
    paid_time: Math.floor(Date.now() / 1000)
  });
}

export async function markExpiredTransactions() {
  const now = Math.floor(Date.now() / 1000);
  const { error } = await db()
    .from("transactions")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expired", now);
  if (error) throw error;
}

export async function logWebhook(row: Record<string, unknown>) {
  try {
    await db().from("webhook_logs").insert(row);
  } catch {
    // tabel log opsional
  }
}
