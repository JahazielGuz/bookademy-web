import Link from "next/link";

import Wordmark from "@/components/Wordmark";

export type AppHeaderProps = {
  /** Where "back" goes, if this page has somewhere to go back to. */
  backHref?: string;
  backLabel?: string;
  title?: string;
  children?: React.ReactNode;
};

/** The bar across the top of every signed-in page.
 *
 * Dark regardless of what sits beneath it: a light reading page and a dark editor
 * both need framing, and a header that changed with the page would make the two feel
 * like different applications. */
export default function AppHeader({ backHref, backLabel, title, children }: AppHeaderProps) {
  return (
    <header className="flex shrink-0 items-center gap-4 bg-header px-6 py-4 text-header-text">
      <Link href="/library" aria-label="BooKademy">
        <Wordmark onDark />
      </Link>
      {backHref !== undefined ? (
        <>
          <span className="text-header-muted">/</span>
          <Link href={backHref} className="text-sm text-header-muted hover:text-header-text">
            {backLabel ?? "Back"}
          </Link>
        </>
      ) : null}
      {title !== undefined ? (
        <>
          <span className="text-header-muted">/</span>
          <span className="truncate text-sm">{title}</span>
        </>
      ) : null}
      <div className="ml-auto flex items-center gap-5 text-sm">{children}</div>
    </header>
  );
}
