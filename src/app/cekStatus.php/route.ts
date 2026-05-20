import { NextRequest, NextResponse } from "next/server";
import { getTransactionByAnyId } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("trx") || "";
  const trx = id ? await getTransactionByAnyId(id) : null;
  const body = trx
    ? { status: trx.status, expired: trx.expired, result: trx.result }
    : { status: "notfound", expired: 0, result: "" };
  return NextResponse.json(body, { headers: { "cache-control": "no-store" } });
}
