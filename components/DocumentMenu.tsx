"use client";

import { useEffect, useRef, useState } from "react";

import ConfirmDialog from "@/components/ConfirmDialog";
import type { DocumentSummary } from "@/lib/types";

export type DocumentMenuProps = {
  document: DocumentSummary;
  onDeleted: (id: number) => void;
};

/** The per-book menu. One item today; it exists so the row has somewhere to put the
 *  things you do to a book that are not "open it". */
export default function DocumentMenu({ document: book, onDeleted }: DocumentMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function away(event: MouseEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", away);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("mousedown", away);
      window.removeEventListener("keydown", escape);
    };
  }, [open]);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/django/documents/${book.id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 404) {
        setError("That could not be deleted. Try again.");
        return;
      }
      // A 404 means it is already gone, which is the state we were asking for.
      onDeleted(book.id);
    } catch {
      setError("The network dropped. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={wrapper} className="relative shrink-0">
      <button
        type="button"
        aria-label={`More for ${book.title}`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface-2"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
          <circle cx="9" cy="3.5" r="1.6" fill="currentColor" />
          <circle cx="9" cy="9" r="1.6" fill="currentColor" />
          <circle cx="9" cy="14.5" r="1.6" fill="currentColor" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-11 z-20 w-48 overflow-hidden rounded-lg border border-line bg-card py-1 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setConfirming(true);
            }}
            className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-fail hover:bg-surface"
          >
            Delete book
          </button>
        </div>
      ) : null}

      {confirming ? (
        <ConfirmDialog
          title="Delete this book?"
          confirmLabel="Delete book"
          busy={busy}
          error={error}
          onCancel={() => {
            setConfirming(false);
            setError(null);
          }}
          onConfirm={remove}
        >
          <p>
            <strong>{book.title}</strong> and all progress will be deleted. This cannot
            be undone.
          </p>
        </ConfirmDialog>
      ) : null}
    </div>
  );
}
