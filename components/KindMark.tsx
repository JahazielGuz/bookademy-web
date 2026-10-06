import type { TopicKind } from "@/lib/types";

export type KindMarkProps = {
  kind: TopicKind;
};

/** Says what an item is, on the left of its row, before you read the title.
 *
 * Icon and word together rather than either alone: an icon on its own has to be
 * learned, and a word on its own is easy to skim past in a column of forty rows. */
export default function KindMark({ kind }: KindMarkProps) {
  const quiz = kind === "quiz";
  return (
    <span
      className={`flex w-[72px] shrink-0 flex-col items-center gap-1 rounded py-1.5 text-[10px] font-semibold uppercase tracking-wide
        ${quiz ? "bg-accent/15 text-[#8a6d00]" : "bg-surface-2 text-muted"}`}
    >
      {quiz ? <QuizIcon /> : <LessonIcon />}
      {kind}
    </span>
  );
}

/** An open book. */
function LessonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 3.5C6.8 2.6 5.3 2.3 3.3 2.5A.6.6 0 0 0 2.75 3v8.3c0 .35.3.62.65.59 1.8-.16 3.2.1 4.6 1.1 1.4-1 2.8-1.26 4.6-1.1a.6.6 0 0 0 .65-.6V3a.6.6 0 0 0-.55-.6c-2-.2-3.5.1-4.7 1.1Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M8 3.5v9.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/** A ticked checklist. */
function QuizIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect
        x="2.6"
        y="2.1"
        width="10.8"
        height="11.8"
        rx="1.6"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M5.3 6.4l1.2 1.2 2.1-2.1M5.3 10.6l1.2 1.2 2.1-2.1"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10.6 6.4h0.9M10.6 10.6h0.9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
