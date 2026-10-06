"use client";

import Link from "next/link";
import { useState } from "react";

import Markdown from "@/components/Markdown";
import type { Quiz, QuizAttemptResponse, TopicDetail } from "@/lib/types";

export type QuizViewProps = {
  topic: TopicDetail;
  quiz: Quiz;
  documentId: string;
};

/**
 * A quiz, one question at a time, occupying the whole page.
 *
 * Deliberately not a list of every question at once: answering one thing at a time is
 * what makes a quiz feel like a test of recall rather than a form to fill in, and it
 * leaves room to show a question properly instead of cramming four into a column.
 *
 * Answers are held until the end and submitted together, so the server grades the
 * whole attempt and nothing is revealed while there are still questions to answer.
 */
export default function QuizView({ topic, quiz, documentId }: QuizViewProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [outcome, setOutcome] = useState<QuizAttemptResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = quiz.questions.length;
  const question = quiz.questions[index];
  const chosen = question === undefined ? undefined : answers[question.id];
  const isLast = index === total - 1;

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/django/quizzes/${quiz.id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.fromEntries(
            Object.entries(answers).map(([id, value]) => [String(id), value]),
          ),
        }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { detail?: string };
        setError(body.detail ?? "Could not submit that.");
        return;
      }
      setOutcome((await response.json()) as QuizAttemptResponse);
    } catch {
      setError("The network dropped. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (outcome !== null) {
    return (
      <Shell documentId={documentId} title={topic.title}>
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="text-3xl font-semibold">
            {outcome.score} of {outcome.total} correct
          </h1>
          <p className={`mt-2 ${outcome.passed ? "text-pass" : "text-code-muted"}`}>
            {outcome.passed
              ? "Quiz passed."
              : "Have another look at the ones below, then try again."}
          </p>

          <ol className="mt-10 space-y-6">
            {quiz.questions.map((q) => {
              const result = outcome.results.find((r) => r.question_id === q.id);
              if (result === undefined) return null;
              return (
                <li key={q.id} className="rounded-lg border border-code-line p-5">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className={result.correct ? "text-pass" : "text-fail"}
                    >
                      {result.correct ? "✓" : "✗"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Markdown>{q.prompt}</Markdown>
                      <p className="mt-3 text-sm text-code-muted">
                        You chose <em>{q.choices[result.chosen_index]}</em>.
                        {!result.correct ? (
                          <>
                            {" "}
                            The answer is <em>{q.choices[result.correct_index]}</em>.
                          </>
                        ) : null}
                      </p>
                      <div className="mt-3 rounded bg-code-surface p-3 text-sm">
                        <Markdown>{result.explanation}</Markdown>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-10 flex gap-4 pb-16">
            <button
              type="button"
              onClick={() => {
                setOutcome(null);
                setAnswers({});
                setIndex(0);
              }}
              className="rounded bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent"
            >
              Try again
            </button>
            <Link
              href={`/courses/${documentId}`}
              className="rounded border border-code-line px-5 py-2.5 text-sm font-medium"
            >
              Back to syllabus
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell documentId={documentId} title={topic.title}>
      <div className="mx-auto w-full max-w-3xl">
        <div className="text-2xl font-semibold leading-snug">
          <Markdown>{question.prompt}</Markdown>
        </div>

        <div className="mt-10 space-y-4">
          {question.choices.map((choice, choiceIndex) => {
            const selected = chosen === choiceIndex;
            return (
              <button
                key={choiceIndex}
                type="button"
                onClick={() =>
                  setAnswers((previous) => ({ ...previous, [question.id]: choiceIndex }))
                }
                className={`block w-full rounded-lg border px-6 py-5 text-left transition
                  ${
                    selected
                      ? "border-accent bg-code-surface"
                      : "border-code-line hover:bg-code-surface"
                  }`}
              >
                {choice}
              </button>
            );
          })}
        </div>

        {error !== null ? <p className="mt-6 text-sm text-fail">{error}</p> : null}
      </div>

      <footer className="sticky bottom-0 mt-auto flex items-center gap-6 border-t border-code-line bg-code-bg px-8 py-4">
        <button
          type="button"
          onClick={() => setIndex(index - 1)}
          disabled={index === 0}
          className="rounded border border-code-line px-4 py-2 text-sm disabled:opacity-30"
        >
          Back
        </button>

        <div className="flex flex-1 items-center justify-center gap-4 text-sm text-code-muted">
          <span>
            {index + 1} / {total}
          </span>
          <span className="h-1 w-40 overflow-hidden rounded bg-code-surface">
            <span
              className="block h-full bg-accent transition-all"
              style={{ width: `${((index + 1) / total) * 100}%` }}
            />
          </span>
        </div>

        <button
          type="button"
          onClick={() => (isLast ? submit() : setIndex(index + 1))}
          disabled={chosen === undefined || submitting}
          className="rounded bg-accent px-5 py-2 text-sm font-semibold text-on-accent disabled:opacity-30"
        >
          {isLast ? (submitting ? "Marking…" : "Finish") : "Next"}
        </button>
      </footer>
    </Shell>
  );
}

type ShellProps = {
  documentId: string;
  title: string;
  children: React.ReactNode;
};

/** The quiz owns the whole page, and takes the dark surface to say so. */
function Shell({ documentId, title, children }: ShellProps) {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-code-bg text-code-text">
      <header className="flex shrink-0 items-center gap-4 bg-header px-6 py-3 text-header-text">
        <Link href={`/courses/${documentId}`} className="text-sm text-header-muted hover:text-header-text">
          ← Syllabus
        </Link>
        <span className="text-code-line">/</span>
        <span className="truncate text-sm font-medium">{title}</span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-8 py-14">{children}</div>
    </main>
  );
}
