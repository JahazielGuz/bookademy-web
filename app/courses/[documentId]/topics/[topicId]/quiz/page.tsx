import Link from "next/link";

import QuizView from "@/components/QuizView";
import { requireJson } from "@/lib/api";
import type { TopicDetail } from "@/lib/types";

export type TopicQuizPageProps = {
  params: Promise<{ documentId: string; topicId: string }>;
};

/** A topic's quiz, on its own page.
 *
 * A separate route rather than a tab, because answering questions and reading with an
 * editor beside you are different enough that each wants the whole window — and
 * because a quiz you can link to is a quiz you can come back to. */
export default async function TopicQuizPage({ params }: TopicQuizPageProps) {
  const { documentId, topicId } = await params;
  const topic = await requireJson<TopicDetail>(`/api/topics/${topicId}/`);

  if (topic.quiz === null || topic.quiz.questions.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Link href={`/courses/${documentId}`} className="text-sm text-muted underline">
          ← Syllabus
        </Link>
        <p className="mt-8 rounded-lg border border-line bg-surface p-6 text-muted">
          This topic has no quiz yet.
        </p>
      </main>
    );
  }

  return <QuizView topic={topic} quiz={topic.quiz} documentId={documentId} />;
}
