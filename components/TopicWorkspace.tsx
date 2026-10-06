"use client";

import { useState } from "react";

import GhostEditor from "@/components/GhostEditor";
import Markdown from "@/components/Markdown";
import type { CheckResponse, TopicDetail } from "@/lib/types";

export type TopicWorkspaceProps = {
  topic: TopicDetail;
};

type CheckState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "passed" }
  | { kind: "failed"; line: number | null }
  | { kind: "error"; message: string };

/** The first checkpoint the learner has not passed, or the last if all are done. */
function startingStep(steps: { completed: boolean }[]): number {
  const next = steps.findIndex((step) => !step.completed);
  return next === -1 ? steps.length - 1 : next;
}

/**
 * The lesson page: reading on the left, code on the right.
 *
 * One component owns both panes because they share a single piece of state — which
 * checkpoint you are on. Splitting them would mean lifting that state somewhere else
 * and threading it back down through two trees.
 *
 * The outer frame is a fixed-height flex row, so the editor never moves with the
 * page: the left pane scrolls on its own, and the editor only scrolls when the code
 * inside it is taller than the pane.
 */
export default function TopicWorkspace({ topic }: TopicWorkspaceProps) {
  const exercises = topic.exercises;
  const hasExercise = exercises.length > 0;

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const exercise = hasExercise ? exercises[exerciseIndex] : null;

  const [stepIndex, setStepIndex] = useState(() =>
    hasExercise ? startingStep(exercises[0].steps) : 0,
  );
  const [completed, setCompleted] = useState<Set<number>>(
    () => new Set(exercises.flatMap((e) => e.steps.filter((s) => s.completed).map((s) => s.id))),
  );

  const step = exercise ? exercise.steps[stepIndex] : null;
  const [code, setCode] = useState(step ? step.starter_code : "");
  const [check, setCheck] = useState<CheckState>({ kind: "idle" });

  const isPassed = step !== null && completed.has(step.id);
  const isLastStep = exercise !== null && stepIndex === exercise.steps.length - 1;
  const hasNextExercise = exerciseIndex < exercises.length - 1;
  const done = exercise ? exercise.steps.filter((s) => completed.has(s.id)).length : 0;

  async function runCheck() {
    if (step === null) return;
    setCheck({ kind: "checking" });
    try {
      const response = await fetch(`/api/django/steps/${step.id}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { detail?: string };
        setCheck({ kind: "error", message: body.detail ?? "Could not check that." });
        return;
      }
      const result = (await response.json()) as CheckResponse;
      if (result.passed) {
        setCompleted((previous) => new Set(previous).add(step.id));
        setCheck({ kind: "passed" });
      } else {
        setCheck({ kind: "failed", line: result.first_mismatch_line });
      }
    } catch {
      setCheck({ kind: "error", message: "The network dropped. Try again." });
    }
  }

  function goToStep(index: number) {
    if (exercise === null) return;
    setStepIndex(index);
    setCode(exercise.steps[index].starter_code);
    setCheck({ kind: "idle" });
  }

  function goToNextExercise() {
    const next = exercises[exerciseIndex + 1];
    const first = startingStep(next.steps);
    setExerciseIndex(exerciseIndex + 1);
    setStepIndex(first);
    setCode(next.steps[first].starter_code);
    setCheck({ kind: "idle" });
  }

  return (
    <div className="flex min-h-0 flex-1">
      {/* Reading pane. Scrolls on its own; the editor beside it does not move. */}
      <div className="w-1/2 overflow-y-auto border-r border-line">
        <div className="mx-auto max-w-2xl px-8 py-8">
          <p className="text-xs uppercase tracking-wide text-muted">
            Chapter {topic.chapter_number} · {topic.chapter_title}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{topic.title}</h1>
          <p className="mt-2 text-muted">{topic.summary}</p>

          {topic.lesson !== null ? (
            <section className="mt-8">
              <Markdown>{topic.lesson.body_markdown}</Markdown>
            </section>
          ) : null}

          {topic.key_points.length > 0 ? (
            <div className="mt-8 rounded-lg border border-line bg-surface p-4">
              <h3 className="mb-2 text-sm font-semibold">You should come away knowing</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                {topic.key_points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {exercise !== null && step !== null ? (
            <section className="mt-12 border-t border-line pt-8">
              <p className="text-xs uppercase tracking-wide text-muted">
                Exercise {exercise.position} of {exercises.length}
              </p>
              <h2 className="mt-2 text-xl font-semibold">{exercise.title}</h2>
              <div className="mt-2">
                <Markdown>{exercise.scenario_markdown}</Markdown>
              </div>

              <h3 className="mt-8 border-b border-line pb-2 text-sm font-semibold">
                Instructions
              </h3>

              {/* Every instruction, in full, stacked. Not a list of labels with the
                  current one shown somewhere else: the text of step 3 is what tells
                  you whether step 2 made sense, and hiding it behind a click makes
                  the exercise harder to follow than the book it came from. */}
              <ol className="mt-5 space-y-8">
                {exercise.steps.map((candidate) => {
                  const passed = completed.has(candidate.id);
                  const active = candidate.id === step.id;
                  return (
                    <li key={candidate.id} className="flex gap-3">
                      <span
                        aria-hidden
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border text-[11px] font-bold
                          ${
                            passed
                              ? "border-accent bg-accent text-on-accent"
                              : active
                                ? "border-accent text-transparent"
                                : "border-line text-transparent"
                          }`}
                      >
                        ✓
                      </span>

                      <div className={`min-w-0 flex-1 ${passed ? "opacity-60" : ""}`}>
                        <div className="flex gap-2">
                          <span className="font-semibold">{candidate.number}.</span>
                          <div className="min-w-0 flex-1">
                            <Markdown>{candidate.instruction_markdown}</Markdown>
                            <div className="mt-2 text-sm text-muted">
                              <Markdown>{candidate.explanation_markdown}</Markdown>
                            </div>
                            {candidate.hint.length > 0 && active ? (
                              <details className="mt-2 text-sm">
                                <summary className="cursor-pointer text-muted">Hint</summary>
                                <div className="pt-2">
                                  <Markdown>{candidate.hint}</Markdown>
                                </div>
                              </details>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ) : null}


        </div>
      </div>

      {/* Code pane. Fixed to the right half; only the editor's own content scrolls. */}
      <div className="flex w-1/2 flex-col bg-code-bg text-code-text">
        {exercise !== null && step !== null ? (
          <>
            <div className="flex shrink-0 items-center justify-between border-b border-code-line px-5 py-2.5 text-xs text-code-muted">
              <span className="font-mono">
                {exercise.language === "python" ? "main.py" : "main.js"}
              </span>
              <span>
                {done}/{exercise.steps.length} checkpoints
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              <GhostEditor
                value={code}
                expected={step.expected_code}
                language={exercise.language}
                resetKey={step.id}
                readOnly={false}
                errorLine={check.kind === "failed" ? check.line : null}
                onChange={setCode}
              />
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-code-line px-5 py-3">
              <button
                type="button"
                onClick={runCheck}
                disabled={check.kind === "checking"}
                className="rounded bg-accent px-4 py-2 text-sm font-semibold text-on-accent disabled:opacity-50"
              >
                {check.kind === "checking" ? "Checking…" : "Check"}
              </button>

              {isPassed && !isLastStep ? (
                <button
                  type="button"
                  onClick={() => goToStep(stepIndex + 1)}
                  className="rounded border border-code-line px-4 py-2 text-sm font-medium text-code-text"
                >
                  Next
                </button>
              ) : null}

              {isPassed && isLastStep && hasNextExercise ? (
                <button
                  type="button"
                  onClick={goToNextExercise}
                  className="rounded border border-code-line px-4 py-2 text-sm font-medium text-code-text"
                >
                  Next exercise
                </button>
              ) : null}

              <p className="text-sm" role="status" aria-live="polite">
                {check.kind === "passed" ? <span className="text-pass">Correct.</span> : null}
                {check.kind === "failed" ? (
                  <span className="text-fail">
                    Not quite
                    {check.line === null ? "." : ` — look at line ${check.line}.`}
                  </span>
                ) : null}
                {check.kind === "error" ? (
                  <span className="text-fail">{check.message}</span>
                ) : null}
              </p>
            </div>
          </>
        ) : (
          <div className="grid flex-1 place-items-center px-8 text-center text-sm text-code-muted">
            This topic has no coding exercise.
          </div>
        )}
      </div>
    </div>
  );
}
