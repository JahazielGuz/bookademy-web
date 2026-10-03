"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import GenerationProgress from "@/components/GenerationProgress";
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

function topicState(topic: TopicSummary): { label: string; tone: string } {
  if (topic.status === "failed") return { label: "failed", tone: "text-fail" };
  if (topic.status !== "ready") return { label: "being written", tone: "text-muted" };
  if (topic.complete) return { label: "complete", tone: "text-pass" };
  if (topic.steps_completed > 0 || topic.quiz_passed) {
    return { label: `${topic.steps_completed}/${topic.steps_total} checkpoints`, tone: "text-muted" };
  }
  return { label: "not started", tone: "text-muted" };
}

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

  return (
    <li className={`space-y-3 ${chapter.status === "pending" ? "opacity-45" : ""}`}>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            {chapter.number}. {chapter.title}
          </h2>
          <p className="text-sm text-muted">
            {chapter.summary} · pages {chapter.page_start}–{chapter.page_end}
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
        <ul className="space-y-2">
          {chapter.topics.map((topic) => {
            const state = topicState(topic);
            const ready = topic.status === "ready";
            const inner = (
              <div className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3">
                <span
                  aria-hidden
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px]
                    ${topic.complete ? "border-pass bg-pass text-black" : "border-line text-muted"}`}
                >
                  {topic.complete ? "✓" : ""}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{topic.title}</p>
                  <p className="truncate text-sm text-muted">{topic.summary}</p>
                </div>
                <span className={`shrink-0 text-xs ${state.tone}`}>{state.label}</span>
              </div>
            );

            return (
              <li key={topic.id}>
                {ready ? (
                  <Link
                    href={`/courses/${documentId}/topics/${topic.id}`}
                    className="block hover:opacity-90"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="opacity-60">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
