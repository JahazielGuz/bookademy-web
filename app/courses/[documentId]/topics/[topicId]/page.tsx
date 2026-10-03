import Link from "next/link";

import ExerciseWorkspace from "@/components/ExerciseWorkspace";
import Markdown from "@/components/Markdown";
import QuizPanel from "@/components/QuizPanel";
import { requireJson } from "@/lib/api";
import type { TopicDetail } from "@/lib/types";

export type TopicPageProps = {
  params: Promise<{ documentId: string; topicId: string }>;
};

export default async function TopicPage({ params }: TopicPageProps) {
  const { documentId, topicId } = await params;
  const topic = await requireJson<TopicDetail>(`/api/topics/${topicId}/`);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href={`/courses/${documentId}`} className="text-sm text-muted underline">
        ← Syllabus
      </Link>

      <header className="mt-6 mb-8 space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted">
          Chapter {topic.chapter_number} · {topic.chapter_title}
        </p>
        <h1 className="text-3xl font-semibold">{topic.title}</h1>
        <p className="text-muted">{topic.summary}</p>
      </header>

      {topic.status !== "ready" ? (
        <p className="rounded-lg border border-line bg-surface p-6 text-muted">
          {topic.status === "failed"
            ? `This topic could not be generated: ${topic.error}`
            : "This topic is still being written. Check back shortly."}
        </p>
      ) : (
        <div className="space-y-14">
          {topic.lesson !== null ? (
            <section className="max-w-2xl">
              <h2 className="mb-2 text-xl font-semibold">{topic.lesson.title}</h2>
              <Markdown>{topic.lesson.body_markdown}</Markdown>
              {topic.key_points.length > 0 ? (
                <div className="mt-6 rounded-lg border border-line bg-surface p-4">
                  <h3 className="mb-2 text-sm font-semibold">You should come away knowing</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                    {topic.key_points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          {topic.exercises.length > 0 ? (
            <section>
              <h2 className="mb-6 text-xl font-semibold">Practice</h2>
              <ExerciseWorkspace exercises={topic.exercises} />
            </section>
          ) : null}

          {topic.quiz !== null && topic.quiz.questions.length > 0 ? (
            <section className="max-w-2xl">
              <h2 className="mb-6 text-xl font-semibold">Check your understanding</h2>
              <QuizPanel quiz={topic.quiz} />
            </section>
          ) : null}
        </div>
      )}
    </main>
  );
}
