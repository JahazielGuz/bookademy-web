"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import CourseHeader from "@/components/CourseHeader";
import ProgressRing from "@/components/ProgressRing";
import TopicAccordion from "@/components/TopicAccordion";
import { chapterProgress } from "@/lib/courseProgress";
import type { Chapter, DocumentSummary, Syllabus, TopicSummary } from "@/lib/types";

export type CourseViewProps = {
  documentId: number;
  initialDocument: DocumentSummary;
  initialSyllabus: Syllabus | null;
};

// Slower than the library's four seconds. A chapter takes minutes, so this only has
// to be faster than someone gets curious.
const POLL_MS = 5000;

export default function CourseView({
  documentId,
  initialDocument,
  initialSyllabus,
}: CourseViewProps) {
  const [syllabus, setSyllabus] = useState(initialSyllabus);
  const [document, setDocument] = useState(initialDocument);
  const finished = document.status === "ready" || document.status === "failed";
  const ready = useRef(initialDocument.chapters_ready);

  /**
   * While a book is being written, ask what has changed.
   *
   * Polling rather than a stream. The page needs one fact — has another chapter
   * landed — and a held connection, a reconnect cursor and heartbeats are a lot of
   * machinery to deliver one integer that changes every few minutes.
   *
   * The small document endpoint is what gets polled; the syllabus is only refetched
   * when the chapter count actually moves, so this costs a few hundred bytes a tick
   * rather than the whole course.
   */
  useEffect(() => {
    if (finished) return;

    const timer = setInterval(async () => {
      const response = await fetch(`/api/django/documents/${documentId}`);
      if (!response.ok) return;
      const latest = (await response.json()) as DocumentSummary;
      setDocument(latest);

      if (latest.chapters_ready === ready.current) return;
      ready.current = latest.chapters_ready;

      const syllabusResponse = await fetch(`/api/django/documents/${documentId}/syllabus`);
      if (syllabusResponse.ok) setSyllabus((await syllabusResponse.json()) as Syllabus);
    }, POLL_MS);

    return () => clearInterval(timer);
  }, [documentId, finished]);

  return (
    <>
      {syllabus !== null ? (
        <CourseHeader
          documentId={documentId}
          document={document}
          syllabus={syllabus}
        />
      ) : (
        <header className="mt-8 mb-12">
          <h1 className="text-4xl font-bold">{document.title}</h1>
          <p className="mt-3 text-muted">Reading your document.</p>
        </header>
      )}

      {syllabus === null ? null : (
        <section>
          <h2 className="mb-5 text-2xl font-bold">Syllabus</h2>
          {/* One sheet for the whole syllabus, as in the reference. A card per
              chapter turns a course into a stack of unrelated things. */}
          <ol className="divide-y divide-line rounded-xl border border-line bg-card px-6 sm:px-8">
            {syllabus.chapters.map((chapter) => (
              <ChapterBlock key={chapter.id} chapter={chapter} documentId={documentId} />
            ))}
          </ol>
        </section>
      )}
    </>
  );
}

type ChapterBlockProps = {
  chapter: Chapter;
  documentId: number;
};

/** What a chapter that is not ready yet says for itself, on the right of its row. */
const CHAPTER_STATE: Record<string, string> = {
  pending: "Queued",
  generating: "Generating",
  failed: "Failed",
};

function ChapterBlock({ chapter, documentId }: ChapterBlockProps) {
  const progress = chapterProgress(chapter);
  const state = CHAPTER_STATE[chapter.status];

  return (
    <li className={`py-7 ${chapter.status === "ready" ? "" : "opacity-50"}`}>
      <div className="-ml-2 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <ProgressRing
            done={progress.done}
            total={progress.total}
            size={48}
            label={`Chapter ${chapter.number} progress`}
          />
          <div className="min-w-0">
            <h2 className="text-xl font-bold">
              {chapter.number}. {chapter.title}
            </h2>
            <p className="text-sm text-muted">
              {chapter.topics.length} topics · pages {chapter.page_start}–{chapter.page_end}
            </p>
          </div>
        </div>
        {state !== undefined ? (
          <span
            className={`shrink-0 text-sm font-semibold ${
              chapter.status === "failed" ? "text-fail" : "text-muted"
            }`}
          >
            {state}
          </span>
        ) : null}
      </div>

      {chapter.status === "pending" ? null : (
        <ul className="mt-2 pl-7">
          {chapter.topics.map((topic) => (
            <TopicAccordion key={topic.id} topic={topic} documentId={documentId} />
          ))}
        </ul>
      )}
    </li>
  );
}
