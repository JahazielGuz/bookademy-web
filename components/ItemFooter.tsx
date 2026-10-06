import Link from "next/link";

import type { ItemLink, ItemLinks } from "@/lib/types";

export type ItemFooterProps = {
  documentId: number | string;
  links: ItemLinks;
  /** Next only opens once the whole item is finished — every checkpoint, or the quiz. */
  complete: boolean;
  /** What is still outstanding, shown while Next is closed. */
  remaining?: string;
};

function href(documentId: number | string, link: ItemLink): string {
  const base = `/courses/${documentId}/topics/${link.topic_id}`;
  return link.part === "quiz" ? `${base}/quiz` : base;
}

/**
 * The bar across the bottom of a content item.
 *
 * Next means one thing only: move through the syllabus, to this topic's quiz or on to
 * the next topic. It never advances a checkpoint or a question — those are inside the
 * item, and a button that sometimes moves you a line and sometimes moves you a lesson
 * teaches you not to trust it.
 *
 * It stays closed until the item is finished, and is shown closed rather than hidden,
 * so the way forward is visible before it is available.
 */
export default function ItemFooter({
  documentId,
  links,
  complete,
  remaining,
}: ItemFooterProps) {
  const next = complete ? links.next : null;

  return (
    <footer className="flex shrink-0 items-center gap-4 border-t border-black/30 bg-header px-6 py-3 text-header-text">
      {links.previous !== null ? (
        <Link
          href={href(documentId, links.previous)}
          className="rounded border border-header-muted/40 px-4 py-2 text-sm font-semibold hover:bg-white/10"
        >
          Back
        </Link>
      ) : (
        <span className="cursor-not-allowed rounded border border-header-muted/20 px-4 py-2 text-sm font-semibold text-header-muted opacity-50">
          Back
        </span>
      )}

      <p className="flex-1 text-center text-sm text-header-muted">
        {complete ? null : remaining}
      </p>

      {next !== null ? (
        <Link
          href={href(documentId, next)}
          className="rounded bg-accent px-6 py-2 text-sm font-bold text-on-accent"
        >
          Next
        </Link>
      ) : (
        <span
          aria-disabled="true"
          title={complete ? "This is the last item in the syllabus" : "Finish this first"}
          className="cursor-not-allowed rounded bg-white/10 px-6 py-2 text-sm font-bold text-header-muted"
        >
          Next
        </span>
      )}
    </footer>
  );
}
