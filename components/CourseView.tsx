"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import GenerationProgress from "@/components/GenerationProgress";
import TopicAccordion from "@/components/TopicAccordion";
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
      <header className="mt-6 mb-8 space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted">
          {syllabus?.subject ?? "Reading your document"}
        </p>
        <h1 className="text-3xl font-semibold">{syllabus?.title ?? initialDocument.title}</h1>
        {syllabus !== null ? <p className="text-muted">{syllabus.description}</p> : null}
      </header>

      {!finished ? (
        <div className="mb-10">
          <GenerationProgress events={events} connected={connected} finished={finished} />
        </div>
      ) : null}

      {syllabus === null ? null : (
        <ol className="space-y-8">
          {syllabus.chapters.map((chapter) => (
            <ChapterBlock
              key={chapter.id}
              chapter={chapter}
              documentId={documentId}
              justArrived={arrived.has(chapter.number)}
            />
          ))}
        </ol>
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
  const done = chapter.topics.filter((topic) => topic.complete).length;

  return (
    <li className={`${chapter.status === "pending" ? "opacity-45" : ""}`}>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            {chapter.number}. {chapter.title}
          </h2>
          <p className="text-sm text-muted">
            {chapter.topics.length} topics · pages {chapter.page_start}–{chapter.page_end}
            {done > 0 ? ` · ${done} complete` : ""}
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted">
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
        <ul className="overflow-hidden rounded-lg border border-line bg-bg">
          {chapter.topics.map((topic) => (
            <TopicAccordion key={topic.id} topic={topic} documentId={documentId} />
          ))}
        </ul>
      )}
    </li>
  );
}
