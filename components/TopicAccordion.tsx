"use client";

import Link from "next/link";
import { useState } from "react";

import ProgressRing from "@/components/ProgressRing";
import { topicProgress } from "@/lib/courseProgress";
import type { TopicSummary } from "@/lib/types";

export type TopicAccordionProps = {
  topic: TopicSummary;
  documentId: number;
};

/**
 * One subject, expanding to the two things you can do with it.
 *
 * The topic is the unit — a short name for a concept. Its lesson and its quiz are
 * parts of it rather than siblings of it, so they live inside it rather than beside
 * it in the list. Collapsed, a chapter reads as a list of subjects; expanded, each
 * says what there is to do.
 */
export default function TopicAccordion({ topic, documentId }: TopicAccordionProps) {
  const ready = topic.status === "ready";
  const [open, setOpen] = useState(false);
  const progress = topicProgress(topic);

  return (
    <li className="border-b border-line last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={!ready}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition
          ${ready ? "hover:bg-surface" : "cursor-not-allowed opacity-50"}`}
      >
        <ProgressRing
          done={progress.done}
          total={progress.total}
          size={42}
          label={`${topic.title} progress`}
        />
        <span className="min-w-0 flex-1">
          <span className="block font-bold">{topic.title}</span>
          <span className="block truncate text-sm text-muted">{topic.summary}</span>
        </span>
        {!ready ? (
          <span className="shrink-0 text-xs text-muted">
            {topic.status === "failed" ? "failed" : "being written"}
          </span>
        ) : (
          <Chevron open={open} />
        )}
      </button>

      {open && ready ? (
        <div className="space-y-1 pb-3 pl-14 pr-4">
          <Part
            href={`/courses/${documentId}/topics/${topic.id}`}
            label="Lesson"
            title={topic.title}
            detail={
              topic.steps_total > 0
                ? `${topic.steps_completed}/${topic.steps_total} checkpoints`
                : undefined
            }
            done={topic.steps_completed}
            total={Math.max(topic.steps_total, 1)}
          />
          <Part
            href={`/courses/${documentId}/topics/${topic.id}/quiz`}
            label="Quiz"
            title={topic.title}
            done={topic.quiz_passed ? 1 : 0}
            total={1}
          />
        </div>
      ) : null}
    </li>
  );
}

type PartProps = {
  href: string;
  label: string;
  title: string;
  detail?: string;
  done: number;
  total: number;
};

function Part({ href, label, title, detail, done, total }: PartProps) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded px-3 py-2.5 hover:bg-surface">
      <ProgressRing done={done} total={total} size={34} label={label} />
      <span className="w-16 shrink-0 text-sm font-semibold text-muted">{label}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{title}</span>
      {detail !== undefined ? (
        <span className="shrink-0 text-xs text-muted">{detail}</span>
      ) : null}
    </Link>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
