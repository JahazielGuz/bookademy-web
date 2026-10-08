"use client";

import { useEffect, useRef } from "react";

export type ConfirmDialogProps = {
  title: string;
  /** What will happen, in full. The point of the dialog is that this gets read. */
  children: React.ReactNode;
  confirmLabel: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * A modal for something that cannot be undone.
 *
 * Cancel holds the focus, not the destructive button: a dialog that opens with
 * "Delete" under the cursor is a dialog that gets dismissed by the same reflex that
 * opened it. Escape and a click outside both cancel; neither deletes.
 */
export default function ConfirmDialog({
  title,
  children,
  confirmLabel,
  busy = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancel = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancel.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      role="presentation"
      onClick={onCancel}
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-6"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-line bg-card p-6 shadow-2xl"
      >
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="mt-3 space-y-3 text-[15px] leading-relaxed">{children}</div>

        {error !== null ? <p className="mt-4 text-sm text-fail">{error}</p> : null}

        <div className="mt-7 flex justify-end gap-3">
          <button
            ref={cancel}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded border border-line px-4 py-2 text-sm font-semibold hover:bg-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded bg-fail px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
