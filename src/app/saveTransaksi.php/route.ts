import { NextRequest, NextResponse } from "next/server";
import { addTransaction, getTransactions } from "@/lib/store";
import { makeTransactionId, phpDateTimeJakarta, randomPayCode } from "@/lib/utils";

export const dynamic = "force-dynamic";

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function makeKodeUnik(harga: number) {
  const existing = await getTransactions();
  let kode = randInt(100, 500);
  for (let i = 0; i < 40; i += 1) {
    const total = harga + kode;
    const bentrok = existing.some((trx) => trx.status === "pending" && trx.total === total);
    if (!bentrok) return kode;
    kode = randInt(100, 500);
  }
  return kode;
}

export async function POST(req: NextRequest) {
  const input = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!input) return NextResponse.json({ success: false, msg: "Input tidak valid" }, { status: 400 });

  const harga = Number.parseInt(String(input.harga ?? "0"), 10) || 0;
  const kodeUnik = await makeKodeUnik(harga);
  const trxId = String(input.trx_id || makeTransactionId());
  const payCode = randomPayCode(44);
  const now = Math.floor(Date.now() / 1000);

  const trx = await addTransaction({
    trx_id: trxId,
    pay_code: payCode,
    kode_unik: kodeUnik,
    email: String(input.email ?? ""),
    result: String(input.result ?? ""),
    harga,
    total: harga + kodeUnik,
    status: "pending",
    expired: now + 1200,
    tanggal: phpDateTimeJakarta(new Date()),
    waktu_bayar: null,
    paid_time: null,
    token: null,
    unik: null
  });

  return NextResponse.json({
    success: true,
    msg: "Transaksi berhasil disimpan",
    trx_id: trx.pay_code,
    real_trx_id: trx.trx_id,
    pay_code: trx.pay_code,
    kode_unik: trx.kode_unik,
    total: trx.total,
    qris_url: `/qris.php?trx=${encodeURIComponent(trx.pay_code)}`
  });
}
