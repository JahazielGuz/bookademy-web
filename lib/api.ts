// Server-side access to bookademy-core.
//
// The token pair lives in httpOnly cookies, so every call to Django happens on this
// server and the browser only ever talks to this app. An expired access token is
// refreshed once and the call retried; a failed refresh means the session is over.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = process.env.DJANGO_API_URL ?? "http://localhost:8000";

export const ACCESS_COOKIE = "bk_access";
export const REFRESH_COOKIE = "bk_refresh";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`Django returned ${status}`);
  }
}

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}

async function refreshAccessToken(): Promise<string | null> {
  const store = await cookies();
  const refresh = store.get(REFRESH_COOKIE)?.value;
  if (!refresh) return null;

  const response = await fetch(apiUrl("/api/auth/token/refresh/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  });
  if (!response.ok) return null;

  const data = (await response.json()) as { access: string; refresh?: string };
  // Route handlers may set cookies; server components may not. Writing is therefore
  // best-effort here, and the refreshed token is returned for immediate use either way.
  try {
    store.set(ACCESS_COOKIE, data.access, cookieOptions(60 * 15));
    if (data.refresh) {
      store.set(REFRESH_COOKIE, data.refresh, cookieOptions(60 * 60 * 24 * 14));
    }
  } catch {
    // Read-only cookie store: this is a server component render.
  }
  return data.access;
}

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

/** Call Django as the signed-in user. Refreshes once on 401. */
export async function djangoFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const store = await cookies();
  let access = store.get(ACCESS_COOKIE)?.value;

  const send = (token: string | undefined) =>
    fetch(apiUrl(path), {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

  let response = await send(access);
  if (response.status !== 401) return response;

  access = (await refreshAccessToken()) ?? undefined;
  if (!access) return response;

  response = await send(access);
  return response;
}

/** Fetch JSON for a page render, sending the visitor to /login if not signed in. */
export async function requireJson<T>(path: string): Promise<T> {
  const response = await djangoFetch(path);
  if (response.status === 401) redirect("/login");
  if (!response.ok) throw new ApiError(response.status, await response.text());
  return (await response.json()) as T;
}

/** Like requireJson, but tolerates a 404.
 *
 * A course page is opened while the run is still going, so the syllabus may not
 * exist yet. That is a normal state to render, not an error. */
export async function optionalJson<T>(path: string): Promise<T | null> {
  const response = await djangoFetch(path);
  if (response.status === 401) redirect("/login");
  if (response.status === 404) return null;
  if (!response.ok) throw new ApiError(response.status, await response.text());
  return (await response.json()) as T;
}
