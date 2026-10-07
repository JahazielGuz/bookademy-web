import Link from "next/link";

import ProgressRing from "@/components/ProgressRing";
import { continueAt, href, type InProgress } from "@/lib/courseProgress";

export type ContinueCardProps = {
  documentId: number;
  current: InProgress;
};

/**
 * The topic a learner was last in the middle of.
 *
 * Says where they were rather than where they should go next, which is the button's
 * job: a topic half done is the one thing on this page they already have context for,
 * and finding it again in a 104-topic list is the work this saves.
 */
export default function ContinueCard({ documentId, current }: ContinueCardProps) {
  const { chapter, topic, progress } = current;
  const target = continueAt(topic);
  const left = topic.steps_total - topic.steps_completed;

  return (
    <Link
      href={href(documentId, target)}
      className="mt-8 flex items-center gap-4 rounded-xl border border-line bg-card p-4 transition hover:border-brand"
    >
      <ProgressRing
        done={progress.done}
        total={progress.total}
        size={48}
        label={topic.title}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold uppercase tracking-wide text-muted">
          Pick up where you left off
        </span>
        <span className="mt-1 block truncate font-bold">{topic.title}</span>
        <span className="mt-0.5 block text-sm text-muted">
          Chapter {chapter.number}
          {target.part === "quiz"
            ? " · quiz left"
            : left === 1
              ? " · 1 checkpoint left"
              : ` · ${left} checkpoints left`}
        </span>
      </span>
      <span aria-hidden className="shrink-0 pr-1 text-xl font-bold text-brand">
        →
      </span>
    </Link>
  );
}
