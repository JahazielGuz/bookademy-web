import { NextResponse } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE, apiUrl, cookieOptions } from "@/lib/api";

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as {
    email?: string;
    password?: string;
  };

  const upstream = await fetch(apiUrl("/api/auth/token/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (!upstream.ok) {
    return NextResponse.json({ detail: "Those details did not match." }, { status: 401 });
  }

  const { access, refresh } = (await upstream.json()) as {
    access: string;
    refresh: string;
  };

  // The tokens stay on the server side of this app; the browser gets cookies it
  // cannot read.
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE, access, cookieOptions(60 * 15));
  response.cookies.set(REFRESH_COOKIE, refresh, cookieOptions(60 * 60 * 24 * 14));
  return response;
}
