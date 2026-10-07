"use client";

import type { GenerationEvent } from "@/lib/types";

export type GenerationProgressProps = {
  events: GenerationEvent[];
  connected: boolean;
  finished: boolean;
};

/** The running commentary: what is happening now, and what has happened so far. */
export default function GenerationProgress({
  events,
  connected,
  finished,
}: GenerationProgressProps) {
  const latest = events[events.length - 1];
  const earlier = events.slice(0, -1).slice(-6);

  if (latest === undefined) {
    return (
      <div className="rounded-lg border border-line bg-card p-5">
        <p className="text-sm text-muted">
          {connected ? "Waiting for the run to start…" : "Connecting…"}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-card p-5">
      <div className="flex items-start gap-3">
        {!finished ? (
          <span
            aria-hidden
            className="mt-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full bg-accent"
          />
        ) : (
          <span aria-hidden className="mt-0.5 text-pass">
            ✓
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p
            className={`font-medium ${latest.kind === "failed" ? "text-fail" : ""}`}
            role="status"
            aria-live="polite"
          >
            {latest.message}
          </p>

          {earlier.length > 0 ? (
            <ol className="mt-3 space-y-1">
              {earlier
                .slice()
                .reverse()
                .map((event) => (
                  <li
                    key={event.id}
                    className={`text-sm ${event.kind === "failed" ? "text-fail" : "text-muted"}`}
                  >
                    {event.message}
                  </li>
                ))}
            </ol>
          ) : null}
        </div>
      </div>

      {!connected && !finished ? (
        <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
          Reconnecting… progress is saved, nothing is lost.
        </p>
      ) : null}
    </div>
  );
}
