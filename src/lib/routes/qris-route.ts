import { NextRequest, NextResponse } from "next/server";
import { getTransactionByAnyId, updateTransaction } from "@/lib/store";
import { renderQrisPage } from "@/lib/render-qris";
import { randomPayCode } from "@/lib/utils";

export const dynamic = "force-dynamic";

function text(message: string, status = 200) {
  return new NextResponse(message, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
  });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("trx") || req.nextUrl.searchParams.get("token") || req.nextUrl.searchParams.get("id") || "";
  if (!id) return text("Sesi tidak valid", 400);

  let trx = await getTransactionByAnyId(id);
  if (!trx) return text("Transaksi tidak ditemukan", 404);

  if (!trx.pay_code) {
    const updated = await updateTransaction(trx.trx_id, { pay_code: randomPayCode(44) });
    if (updated) trx = updated;
  }

  // Kalau URL lama masih memakai trx_id, redirect ke kode acak panjang.
  if (trx.pay_code && id !== trx.pay_code) {
    const url = req.nextUrl.clone();
    url.search = "";
    url.searchParams.set("trx", trx.pay_code);
    return NextResponse.redirect(url);
  }

  const html = renderQrisPage(trx);
  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0"
    }
  });
}
