import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  AUTH_COOKIE,
  buildAuthCookieValue,
  checkAuthHash,
  getExpectedAuthHash,
} from "@/lib/showcase-admin";

export const runtime = "nodejs";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

type LoginBody = { password?: string };

export async function POST(req: Request) {
  if (!getExpectedAuthHash()) {
    return NextResponse.json(
      { error: "Server is not configured (DASHBOARD_PASSWORD unset)" },
      { status: 503 },
    );
  }

  let body: LoginBody;
  try {
    body = (await req.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const password = body.password?.toString() ?? "";
  if (!password) {
    return NextResponse.json(
      { error: "Password is required" },
      { status: 400 },
    );
  }

  const candidate = buildAuthCookieValue(password);
  if (!checkAuthHash(candidate)) {
    return NextResponse.json(
      { error: "Incorrect password" },
      { status: 401 },
    );
  }

  const store = await cookies();
  store.set(AUTH_COOKIE, candidate, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });

  return NextResponse.json({ ok: true });
}
