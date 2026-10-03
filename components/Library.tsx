"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { DocumentSummary } from "@/lib/types";

export type LibraryProps = {
  initialDocuments: DocumentSummary[];
};

const IN_PROGRESS = ["pending", "uploading", "outlining", "generating"];

function statusLabel(document: DocumentSummary): string {
  switch (document.status) {
    case "pending":
      return "Queued";
    case "uploading":
      return "Reading the PDF";
    case "outlining":
      return "Working out the syllabus";
    case "generating":
      return `Writing lessons — ${document.topics_ready} of ${document.topics_total} topics`;
    case "ready":
      return `${document.topics_total} topics`;
    case "failed":
      return "Failed";
  }
}

export default function Library({ initialDocuments }: LibraryProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const working = documents.some((document) => IN_PROGRESS.includes(document.status));

  // Generation takes minutes, so the list refreshes itself while anything is still
  // being written, and stops as soon as nothing is.
  useEffect(() => {
    if (!working) return;
    const timer = setInterval(async () => {
      const response = await fetch("/api/django/documents");
      if (response.ok) setDocuments((await response.json()) as DocumentSummary[]);
    }, 4000);
    return () => clearInterval(timer);
  }, [working]);

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file === undefined) return;

    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);

    const response = await fetch("/api/django/documents", { method: "POST", body: form });
    if (response.ok) {
      const created = (await response.json()) as DocumentSummary;
      setDocuments((previous) => [created, ...previous]);
    } else {
      const body = (await response.json()) as Record<string, string[] | string>;
      const first = Object.values(body).flat()[0];
      setError(typeof first === "string" ? first : "That upload failed.");
    }
    setUploading(false);
    if (fileInput.current !== null) fileInput.current.value = "";
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-dashed border-line p-6 text-center">
        <p className="mb-3 text-sm text-muted">
          Upload a PDF and it will be turned into a syllabus with quizzes and exercises.
        </p>
        <label className="inline-block cursor-pointer rounded bg-accent px-4 py-2 text-sm font-medium text-black">
          {uploading ? "Uploading…" : "Choose a PDF"}
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf"
            onChange={upload}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {error !== null ? <p className="mt-3 text-sm text-fail">{error}</p> : null}
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-muted">Nothing here yet.</p>
      ) : (
        <ul className="space-y-3">
          {documents.map((document) => {
            // Always openable: the course page is where the live progress is, so
            // there is something worth seeing long before anything is ready.
            const row = (
              <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{document.title}</p>
                  <p className="text-sm text-muted">
                    {statusLabel(document)}
                    {document.page_count !== null ? ` · ${document.page_count} pages` : ""}
                  </p>
                  {document.status === "failed" && document.error.length > 0 ? (
                    <p className="mt-1 text-sm text-fail">{document.error}</p>
                  ) : null}
                </div>
                {IN_PROGRESS.includes(document.status) ? (
                  <span className="text-xs text-muted">working…</span>
                ) : null}
              </div>
            );

            return (
              <li key={document.id}>
                <Link href={`/courses/${document.id}`} className="block hover:opacity-90">
                  {row}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
