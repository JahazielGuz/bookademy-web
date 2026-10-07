import Link from "next/link";

import ContinueCard from "@/components/ContinueCard";

import {
  courseProgress,
  courseStats,
  firstTopic,
  href,
  latestInProgress,
  percent,
  resumeTarget,
} from "@/lib/courseProgress";
import type { DocumentSummary, Syllabus } from "@/lib/types";

export type CourseHeaderProps = {
  documentId: number;
  document: DocumentSummary;
  syllabus: Syllabus;
};

/**
 * Everything above the chapter list: what the course is, where to pick it up, and
 * how far through it you are.
 *
 * The one call to action is the point of the page. Someone arriving has one of two
 * questions — "what is this" or "where was I" — and both are answered here rather
 * than by scrolling a chapter list looking for the first unticked row.
 */
export default function CourseHeader({ documentId, document, syllabus }: CourseHeaderProps) {
  const progress = courseProgress(syllabus);
  const done = percent(progress);
  const next = resumeTarget(syllabus) ?? firstTopic(syllabus);
  const started = progress.done > 0;
  const finished = resumeTarget(syllabus) === null && progress.total > 0;
  const stats = courseStats(syllabus);
  const current = latestInProgress(syllabus);

  return (
    <header className="mt-8 mb-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">{syllabus.title}</h1>

        {next !== null ? (
          <div className="mt-7">
            <Link
              href={href(documentId, next)}
              className="inline-block rounded bg-brand px-7 py-3 font-bold text-on-brand hover:opacity-90"
            >
              {finished ? "Review course" : started ? "Resume course" : "Start learning"}
            </Link>
          </div>
        ) : null}

        {/* The blurb a course was generated with, or the bare count it had before
            summaries existed. */}
        <p className="mt-7 max-w-2xl text-[17px] leading-relaxed">
          {syllabus.summary.length > 0 ? syllabus.summary : syllabus.description}
        </p>

        {progress.total > 0 ? (
          <section className="mt-10">
            <h2 className="text-xl font-bold">Course Progress</h2>
            <div className="mt-4 flex items-center gap-4">
              <span className="h-4 flex-1 overflow-hidden rounded-full bg-surface-2">
                <span
                  className="block h-full rounded-full bg-accent transition-all"
                  style={{ width: `${Math.max(done, 2)}%` }}
                />
              </span>
              <span className="w-12 shrink-0 text-sm font-bold tabular-nums">{done}%</span>
            </div>

            {current !== null ? (
              <ContinueCard documentId={documentId} current={current} />
            ) : null}
          </section>
        ) : null}
      </div>

      <aside className="lg:pt-2">
        <dl className="text-[15px]">
          <Stat label={`${stats.chapters} chapters`} icon={<BookIcon />} />
          <Stat label={`${stats.topics} topics`} icon={<ListIcon />} />
          <Stat label={`${stats.checkpoints} checkpoints`} icon={<CodeIcon />} />
          {document.page_count !== null ? (
            <Stat label={`${document.page_count} pages`} icon={<PageIcon />} />
          ) : null}
          <Stat
            label={syllabus.language === "python" ? "Python" : "JavaScript"}
            icon={<TrendIcon />}
          />
        </dl>

        {syllabus.outcomes.length > 0 ? (
          <div className="mt-10">
            <h2 className="text-sm font-bold uppercase tracking-wide">What you will learn</h2>
            <ul className="mt-4 space-y-2.5 text-[15px]">
              {syllabus.outcomes.map((outcome) => (
                <li key={outcome} className="flex gap-2.5">
                  <span aria-hidden className="mt-0.5 shrink-0 font-bold text-accent">
                    ✓
                  </span>
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>
    </header>
  );
}

function Stat({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-line py-3.5 first:border-t">
      <span aria-hidden className="shrink-0 text-muted">
        {icon}
      </span>
      <dt className="font-semibold">{label}</dt>
    </div>
  );
}

const SVG = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function BookIcon() {
  return (
    <svg {...SVG}>
      <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v16H5.5A1.5 1.5 0 0 0 4 20.5z" />
      <path d="M4 17.5A1.5 1.5 0 0 1 5.5 16H19" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg {...SVG}>
      <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg {...SVG}>
      <path d="m9 17-5-5 5-5M15 7l5 5-5 5" />
    </svg>
  );
}

function PageIcon() {
  return (
    <svg {...SVG}>
      <path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z" />
      <path d="M14 3v4h4" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg {...SVG}>
      <path d="m3 16 5-6 4 4 5-7" />
      <path d="M14 7h4v4" />
    </svg>
  );
}
