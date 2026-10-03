import { NextResponse } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE, apiUrl, cookieOptions } from "@/lib/api";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
    display_name?: string;
  };

  const created = await fetch(apiUrl("/api/auth/register/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!created.ok) {
    // Django's field errors are useful to show verbatim: "password too common", etc.
    return NextResponse.json(await created.json(), { status: created.status });
  }

  const tokens = await fetch(apiUrl("/api/auth/token/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password }),
    cache: "no-store",
  });
  if (!tokens.ok) {
    return NextResponse.json({ detail: "Account created. Please sign in." }, { status: 201 });
  }

  const { access, refresh } = (await tokens.json()) as { access: string; refresh: string };
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE, access, cookieOptions(60 * 15));
  response.cookies.set(REFRESH_COOKIE, refresh, cookieOptions(60 * 60 * 24 * 14));
  return response;
}
