// Client components cannot reach Django: the access token is in an httpOnly cookie.
// They call this proxy instead, which attaches the token server-side and refreshes it
// when it has expired. It can only ever do what the signed-in user could already do.

import { NextResponse } from "next/server";

import { djangoFetch } from "@/lib/api";

// Kept pointed at the learner-facing endpoints rather than all of Django.
const ALLOWED = ["steps", "quizzes", "documents", "topics"];

type Context = { params: Promise<{ path: string[] }> };

async function forward(request: Request, context: Context): Promise<Response> {
  const { path } = await context.params;
  if (path.length === 0 || !ALLOWED.includes(path[0])) {
    return NextResponse.json({ detail: "Not proxied." }, { status: 404 });
  }

  // The content type is passed through verbatim so multipart uploads keep their
  // boundary parameter.
  const contentType = request.headers.get("content-type");
  const raw = request.method === "GET" ? null : await request.arrayBuffer();
  const body = raw !== null && raw.byteLength > 0 ? raw : undefined;

  const response = await djangoFetch(`/api/${path.join("/")}/`, {
    method: request.method,
    headers: {
      ...(contentType !== null && body !== undefined ? { "Content-Type": contentType } : {}),
      // Carries the browser's reconnect cursor through to Django.
      ...(request.headers.get("last-event-id")
        ? { "Last-Event-ID": request.headers.get("last-event-id") as string }
        : {}),
      ...(request.headers.get("accept") ? { Accept: request.headers.get("accept") as string } : {}),
    },
    body,
  });

  const upstreamType = response.headers.get("Content-Type") ?? "application/json";

  // An event stream has to be handed straight back. Reading it to text here would
  // wait for the generation run to finish and then deliver every event at once,
  // which is the opposite of the point.
  if (upstreamType.includes("text/event-stream")) {
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: { "Content-Type": upstreamType },
  });
}

export const GET = forward;
export const POST = forward;
export const DELETE = forward;
