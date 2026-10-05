import Link from "next/link";

import type { DocumentSummary } from "@/lib/types";

export type DocumentRowProps = {
  document: DocumentSummary;
};

const IN_PROGRESS = ["pending", "uploading", "outlining", "generating"];

/** What the row says about itself, in chapters rather than topics.
 *
 * The topic count is the wrong number to show while a run is going: topics for a
 * chapter do not exist until that chapter is reached, so the total climbs and the
 * progress never looks like it is approaching anything. Chapters are known from the
 * moment the document is read. */
function status(document: DocumentSummary): string {
  switch (document.status) {
    case "pending":
      return "Queued";
    case "uploading":
      return "Reading the PDF";
    case "outlining":
      return "Working out the chapters";
    case "generating":
      return `${document.chapters_ready} of ${document.chapters_total} chapters ready`;
    case "ready":
      return `${document.chapters_total} chapters · ${document.topics_total} topics`;
    case "failed":
      return "Failed";
  }
}

export default function DocumentRow({ document }: DocumentRowProps) {
  const working = IN_PROGRESS.includes(document.status);
  // There is something to open the moment the first chapter lands, long before the
  // whole book is done.
  const openable = document.chapters_ready > 0 || document.status === "ready";

  return (
    <div className="flex items-center gap-4 rounded-lg border border-line bg-surface px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{document.title}</p>
        <p className="text-sm text-muted">
          {status(document)}
          {document.page_count !== null ? ` · ${document.page_count} pages` : ""}
        </p>
        {document.calls_made > 0 ? (
          <p className="mt-0.5 text-xs text-muted">
            {/* Measured from recorded usage, not estimated. */}
            ${document.cost_usd.toFixed(2)}
            {document.spend_limit_usd > 0
              ? ` of $${document.spend_limit_usd.toFixed(2)} limit`
              : " spent"}{" "}
            · {document.calls_made} calls
          </p>
        ) : null}
        {document.status === "failed" && document.error.length > 0 ? (
          <p className="mt-1 text-sm text-fail">{document.error}</p>
        ) : null}
      </div>

      {openable ? (
        <Link
          href={`/courses/${document.id}`}
          className="shrink-0 rounded bg-accent px-4 py-2 text-sm font-medium text-on-accent"
        >
          {working ? "Start learning →" : "Open course →"}
        </Link>
      ) : working ? (
        <span className="shrink-0 text-xs text-muted">working…</span>
      ) : null}
    </div>
  );
}
