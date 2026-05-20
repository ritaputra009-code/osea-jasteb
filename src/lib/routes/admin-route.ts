import { NextRequest, NextResponse } from "next/server";
import { clearAdminCookie, isAdmin, setAdminCookie } from "@/lib/auth";
import { approveTransactionByIndex, deleteProductByIndex, editProductByIndex, getProducts, getTransactions, upsertProduct } from "@/lib/store";
import { renderAdminDashboard, renderAdminLogin } from "@/lib/render-admin";
import { makeProductId } from "@/lib/utils";

export const dynamic = "force-dynamic";

function html(body: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }
  });
}

function redirectSelf(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.search = "";
  return NextResponse.redirect(url);
}

async function dashboard() {
  const [products, transactions] = await Promise.all([getProducts(), getTransactions()]);
  return renderAdminDashboard(products, transactions);
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.has("logout")) {
    const res = redirectSelf(req);
    clearAdminCookie(res);
    return res;
  }

  if (!isAdmin(req)) return html(renderAdminLogin());

  if (req.nextUrl.searchParams.has("approve")) {
    const index = Number.parseInt(req.nextUrl.searchParams.get("approve") || "-1", 10);
    if (Number.isFinite(index)) await approveTransactionByIndex(index);
    return redirectSelf(req);
  }

  if (req.nextUrl.searchParams.has("hapus_result")) {
    const index = Number.parseInt(req.nextUrl.searchParams.get("hapus_result") || "-1", 10);
    if (Number.isFinite(index)) await deleteProductByIndex(index);
    return redirectSelf(req);
  }

  return html(await dashboard());
}

export async function POST(req: NextRequest) {
  const form = await req.formData();

  if (form.has("login")) {
    const user = String(form.get("user") || "");
    const pass = String(form.get("pass") || "");
    const expectedUser = process.env.ADMIN_USER || "PW";
    const expectedPass = process.env.ADMIN_PASSWORD || "PW";

    if (user === expectedUser && pass === expectedPass) {
      const res = redirectSelf(req);
      setAdminCookie(res);
      return res;
    }
    return html(renderAdminLogin("Username atau password salah!"), 401);
  }

  if (!isAdmin(req)) return html(renderAdminLogin(), 401);

  if (form.has("tambah_result")) {
    const nama = String(form.get("nama") || "");
    const harga = Number.parseInt(String(form.get("harga") || "0"), 10) || 0;
    await upsertProduct({ id: makeProductId(nama), nama, harga });
    return redirectSelf(req);
  }

  if (form.has("edit_result")) {
    const index = Number.parseInt(String(form.get("index") || "-1"), 10);
    const nama = String(form.get("nama") || "");
    const harga = Number.parseInt(String(form.get("harga") || "0"), 10) || 0;
    if (Number.isFinite(index)) await editProductByIndex(index, nama, harga);
    return redirectSelf(req);
  }

  return redirectSelf(req);
}
