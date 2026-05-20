import QRCode from "qrcode";
import { NextRequest, NextResponse } from "next/server";
import { getTransactionByPayCode } from "@/lib/store";
import { buildDynamicQris } from "@/lib/qris";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ file: string }> };

export async function GET(_req: NextRequest, ctx: Params) {
  const { file } = await ctx.params;
  const payCode = decodeURIComponent(file).replace(/\.png$/i, "");
  const trx = await getTransactionByPayCode(payCode);

  if (!trx) {
    return new NextResponse("QR tidak ditemukan", { status: 404 });
  }

  const staticQris = process.env.QRIS_STATIC || "";
  const qrisText = buildDynamicQris(staticQris, trx.total);

  const png = await QRCode.toBuffer(qrisText, {
    errorCorrectionLevel: "L",
    margin: 2,
    scale: 6
  });

  return new NextResponse(png as unknown as BodyInit, {
    headers: {
      "content-type": "image/png",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0"
    }
  });
}
