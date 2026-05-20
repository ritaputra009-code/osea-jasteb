import crypto from "node:crypto";
import type { NextRequest } from "next/server";

const COOKIE = "jasteb_admin";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  return process.env.AUTH_SECRET || "dev-secret-change-me";
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

export function makeSession() {
  const payload = `admin.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySession(value?: string) {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const created = Number(parts[1]);
  if (!Number.isFinite(created)) return false;
  if (Date.now() - created > MAX_AGE * 1000) return false;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(parts[2]);
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}

export function isAdmin(req: NextRequest) {
  return verifySession(req.cookies.get(COOKIE)?.value);
}

export function setAdminCookie(response: Response) {
  response.headers.append(
    "Set-Cookie",
    `${COOKIE}=${makeSession()}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
  );
}

export function clearAdminCookie(response: Response) {
  response.headers.append(
    "Set-Cookie",
    `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
  );
}
