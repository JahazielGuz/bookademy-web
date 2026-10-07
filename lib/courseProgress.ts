// How far through a course a learner is, and where they should go next. Kept out of
// the components so the arithmetic can be tested without rendering anything.

import type { Chapter, Syllabus, TopicSummary } from "@/lib/types";

export type Progress = { done: number; total: number };

export type ResumeTarget = {
  topicId: number;
  part: "lesson" | "quiz";
};

const EMPTY: Progress = { done: 0, total: 0 };

function add(a: Progress, b: Progress): Progress {
  return { done: a.done + b.done, total: a.total + b.total };
}

/** Only topics that exist to be worked on count. A topic still being written is not
 *  progress a learner is missing; counting it would make the bar fall as the course
 *  fills in. */
function workable(topics: TopicSummary[]): TopicSummary[] {
  return topics.filter((topic) => topic.status === "ready");
}

/**
 * A topic is its checkpoints plus its quiz.
 *
 * The quiz counts as one unit rather than as its questions: it is passed or it is
 * not, and weighting it by question count would make a five-question quiz worth more
 * than a five-checkpoint exercise that took ten times as long.
 */
export function topicProgress(topic: TopicSummary): Progress {
  return {
    done: topic.steps_completed + (topic.quiz_passed ? 1 : 0),
    total: topic.steps_total + 1,
  };
}

export function chapterProgress(chapter: Chapter): Progress {
  return workable(chapter.topics).map(topicProgress).reduce(add, EMPTY);
}

export function courseProgress(syllabus: Syllabus): Progress {
  return syllabus.chapters.map(chapterProgress).reduce(add, EMPTY);
}

/** 0 to 100, rounded, and never rounded up to 100 before it is actually finished. */
export function percent({ done, total }: Progress): number {
  if (total === 0) return 0;
  if (done >= total) return 100;
  return Math.min(99, Math.round((done / total) * 100));
}

/**
 * The first thing left to do, in syllabus order.
 *
 * Returns null when there is nothing left, which is a different state from "nothing
 * started" — the caller tells those apart by the progress, not by this.
 */
export function resumeTarget(syllabus: Syllabus): ResumeTarget | null {
  for (const chapter of syllabus.chapters) {
    for (const topic of workable(chapter.topics)) {
      if (topic.steps_total > 0 && topic.steps_completed < topic.steps_total) {
        return { topicId: topic.id, part: "lesson" };
      }
      if (!topic.quiz_passed) {
        return { topicId: topic.id, part: "quiz" };
      }
    }
  }
  return null;
}

/** The first topic a learner could open at all, for when there is nothing left to do. */
export function firstTopic(syllabus: Syllabus): ResumeTarget | null {
  for (const chapter of syllabus.chapters) {
    const [topic] = workable(chapter.topics);
    if (topic !== undefined) return { topicId: topic.id, part: "lesson" };
  }
  return null;
}

export type InProgress = {
  chapter: Chapter;
  topic: TopicSummary;
  progress: Progress;
};

/**
 * The furthest topic a learner has started but not finished.
 *
 * The last one in syllabus order rather than the first, because it is where they
 * actually were. Going back to the first unfinished topic is a decision they can
 * make from the list; picking up is not.
 */
export function latestInProgress(syllabus: Syllabus): InProgress | null {
  let found: InProgress | null = null;
  for (const chapter of syllabus.chapters) {
    for (const topic of workable(chapter.topics)) {
      const progress = topicProgress(topic);
      if (progress.done > 0 && progress.done < progress.total) {
        found = { chapter, topic, progress };
      }
    }
  }
  return found;
}

/** Where an in-progress topic continues: its lesson if there are checkpoints left,
 *  otherwise its quiz. */
export function continueAt(topic: TopicSummary): ResumeTarget {
  const unfinishedLesson = topic.steps_total > 0 && topic.steps_completed < topic.steps_total;
  return { topicId: topic.id, part: unfinishedLesson ? "lesson" : "quiz" };
}

export function href(documentId: number, target: ResumeTarget): string {
  const base = `/courses/${documentId}/topics/${target.topicId}`;
  return target.part === "quiz" ? `${base}/quiz` : base;
}
