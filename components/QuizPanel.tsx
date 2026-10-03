"use client";

import { useState } from "react";

import Markdown from "@/components/Markdown";
import type { Quiz, QuizAttemptResponse, QuizResult } from "@/lib/types";

export type QuizPanelProps = {
  quiz: Quiz;
};

export default function QuizPanel({ quiz }: QuizPanelProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [outcome, setOutcome] = useState<QuizAttemptResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answered = Object.keys(answers).length;
  const resultFor = (questionId: number): QuizResult | undefined =>
    outcome?.results.find((result) => result.question_id === questionId);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/django/quizzes/${quiz.id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Django keys answers by question id as a string, as JSON objects require.
        body: JSON.stringify({
          answers: Object.fromEntries(
            Object.entries(answers).map(([id, index]) => [String(id), index]),
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

  function retry() {
    setOutcome(null);
    setAnswers({});
  }

  return (
    <section className="space-y-6">
      {quiz.questions.map((question) => {
        const result = resultFor(question.id);
        return (
          <div key={question.id} className="space-y-3 rounded-lg border border-line p-4">
            <div className="flex gap-3">
              <span className="text-sm text-muted">{question.position}</span>
              <div className="min-w-0 flex-1">
                <Markdown>{question.prompt}</Markdown>
              </div>
            </div>

            <div className="space-y-2">
              {question.choices.map((choice, index) => {
                const chosen = answers[question.id] === index;
                const showAsCorrect = result !== undefined && result.correct_index === index;
                const showAsWrong =
                  result !== undefined && result.chosen_index === index && !result.correct;
                return (
                  <label
                    key={index}
                    className={`flex cursor-pointer items-start gap-3 rounded border px-3 py-2 text-sm
                      ${showAsCorrect ? "border-pass bg-pass/10" : ""}
                      ${showAsWrong ? "border-fail bg-fail/10" : ""}
                      ${!showAsCorrect && !showAsWrong ? "border-line" : ""}
                      ${chosen && result === undefined ? "bg-surface-2" : ""}`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      checked={chosen}
                      disabled={outcome !== null}
                      onChange={() =>
                        setAnswers((previous) => ({ ...previous, [question.id]: index }))
                      }
                      className="mt-1"
                    />
                    <span>{choice}</span>
                  </label>
                );
              })}
            </div>

            {result !== undefined ? (
              <div className="rounded bg-surface-2 p-3 text-sm">
                <Markdown>{result.explanation}</Markdown>
              </div>
            ) : null}
          </div>
        );
      })}

      <div className="flex items-center gap-4">
        {outcome === null ? (
          <button
            type="button"
            onClick={submit}
            disabled={answered < quiz.questions.length || submitting}
            className="rounded bg-accent px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            {submitting ? "Marking…" : "Submit answers"}
          </button>
        ) : (
          <button
            type="button"
            onClick={retry}
            className="rounded border border-line px-4 py-2 text-sm font-medium"
          >
            Try again
          </button>
        )}

        <p className="text-sm" role="status" aria-live="polite">
          {outcome !== null ? (
            <span className={outcome.passed ? "text-pass" : "text-fail"}>
              {outcome.score} of {outcome.total} correct
              {outcome.passed ? " — topic quiz passed." : "."}
            </span>
          ) : (
            <span className="text-muted">
              {answered} of {quiz.questions.length} answered
            </span>
          )}
          {error !== null ? <span className="text-fail">{error}</span> : null}
        </p>
      </div>
    </section>
  );
}
