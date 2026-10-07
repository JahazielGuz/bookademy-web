"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import CourseHeader from "@/components/CourseHeader";
import GenerationProgress from "@/components/GenerationProgress";
import ProgressRing from "@/components/ProgressRing";
import TopicAccordion from "@/components/TopicAccordion";
import { chapterProgress } from "@/lib/courseProgress";
import type {
  Chapter,
  DocumentSummary,
  GenerationEvent,
  Syllabus,
  TopicSummary,
} from "@/lib/types";

export type CourseViewProps = {
  documentId: number;
  initialDocument: DocumentSummary;
  initialSyllabus: Syllabus | null;
};

const FINISHED: GenerationEvent["kind"][] = ["done"];

export default function CourseView({
  documentId,
  initialDocument,
  initialSyllabus,
}: CourseViewProps) {
  const [syllabus, setSyllabus] = useState(initialSyllabus);
  const [events, setEvents] = useState<GenerationEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [finished, setFinished] = useState(
    initialDocument.status === "ready" || initialDocument.status === "failed",
  );
  // Chapters that landed while this page was open, so they can be called out.
  const [arrived, setArrived] = useState<Set<number>>(new Set());
  const source = useRef<EventSource | null>(null);

  useEffect(() => {
    if (finished) return;

    const stream = new EventSource(`/api/django/documents/${documentId}/events`);
    source.current = stream;

    stream.onopen = () => setConnected(true);
    stream.onerror = () => setConnected(false);

    stream.onmessage = async (message) => {
      const event = JSON.parse(message.data) as GenerationEvent;
      setEvents((previous) => [...previous, event]);

      // A finished chapter is a chapter a learner can start, so pull the syllabus
      // again and let it render in place.
      if (event.kind === "chapter_ready" || event.kind === "syllabus_ready") {
        const response = await fetch(`/api/django/documents/${documentId}/syllabus`);
        if (response.ok) setSyllabus((await response.json()) as Syllabus);
        if (event.chapter_number !== null) {
          setArrived((previous) => new Set(previous).add(event.chapter_number as number));
        }
      }

      if (FINISHED.includes(event.kind)) {
        setFinished(true);
        stream.close();
      }
    };

    return () => {
      stream.close();
      source.current = null;
    };
  }, [documentId, finished]);

  return (
    <>
      {syllabus !== null ? (
        <CourseHeader
          documentId={documentId}
          document={initialDocument}
          syllabus={syllabus}
        />
      ) : (
        <header className="mt-8 mb-12">
          <h1 className="text-4xl font-bold">{initialDocument.title}</h1>
          <p className="mt-3 text-muted">Reading your document.</p>
        </header>
      )}

      {!finished ? (
        <div className="mb-10">
          <GenerationProgress events={events} connected={connected} finished={finished} />
        </div>
      ) : null}

      {syllabus === null ? null : (
        <section>
          <h2 className="mb-5 text-2xl font-bold">Syllabus</h2>
          {/* One sheet for the whole syllabus, as in the reference. A card per
              chapter turns a course into a stack of unrelated things. */}
          <ol className="divide-y divide-line rounded-xl border border-line bg-card px-6 sm:px-8">
            {syllabus.chapters.map((chapter) => (
              <ChapterBlock
                key={chapter.id}
                chapter={chapter}
                documentId={documentId}
                justArrived={arrived.has(chapter.number)}
              />
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
  justArrived: boolean;
};

function ChapterBlock({ chapter, documentId, justArrived }: ChapterBlockProps) {
  const writing = chapter.status === "generating";
  const progress = chapterProgress(chapter);

  return (
    <li className={`py-7 ${chapter.status === "pending" ? "opacity-45" : ""}`}>
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
        <span className="shrink-0 text-sm text-muted">
          {writing ? (
            <span className="text-accent">writing now…</span>
          ) : chapter.status === "pending" ? (
            "queued"
          ) : justArrived ? (
            <span className="text-pass">just arrived</span>
          ) : null}
        </span>
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
