import { NextRequest, NextResponse } from "next/server";
import { getTransactionByAnyId } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") || "";
  const trx = id ? await getTransactionByAnyId(id) : null;
  const body = trx
    ? { status: trx.status, email: trx.email || "", result: trx.result || "" }
    : { status: "not_found" };
  return NextResponse.json(body, {
    headers: {
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      "pragma": "no-cache"
    }
  });
}
