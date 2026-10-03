"use client";

import { useMemo, useState } from "react";

import GhostEditor from "@/components/GhostEditor";
import Markdown from "@/components/Markdown";
import type { CheckResponse, Exercise } from "@/lib/types";

export type ExerciseWorkspaceProps = {
  exercises: Exercise[];
};

type CheckState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "passed" }
  | { kind: "failed"; line: number | null }
  | { kind: "error"; message: string };

/** Index of the first step the learner has not passed, or the last one if all are done. */
function startingStep(exercise: Exercise): number {
  const next = exercise.steps.findIndex((step) => !step.completed);
  return next === -1 ? exercise.steps.length - 1 : next;
}

export default function ExerciseWorkspace({ exercises }: ExerciseWorkspaceProps) {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const exercise = exercises[exerciseIndex];

  const [stepIndex, setStepIndex] = useState(() => startingStep(exercises[0]));
  const [completed, setCompleted] = useState<Set<number>>(
    () => new Set(exercises.flatMap((e) => e.steps.filter((s) => s.completed).map((s) => s.id))),
  );

  const step = exercise.steps[stepIndex];
  const [code, setCode] = useState(step.starter_code);
  const [check, setCheck] = useState<CheckState>({ kind: "idle" });

  const isPassed = completed.has(step.id);
  const isLastStep = stepIndex === exercise.steps.length - 1;
  const hasNextExercise = exerciseIndex < exercises.length - 1;

  const progress = useMemo(() => {
    const done = exercise.steps.filter((s) => completed.has(s.id)).length;
    return { done, total: exercise.steps.length };
  }, [exercise, completed]);

  async function runCheck() {
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
    setStepIndex(index);
    setCode(exercise.steps[index].starter_code);
    setCheck({ kind: "idle" });
  }

  function goToNextExercise() {
    const nextIndex = exerciseIndex + 1;
    const nextExercise = exercises[nextIndex];
    const nextStep = startingStep(nextExercise);
    setExerciseIndex(nextIndex);
    setStepIndex(nextStep);
    setCode(nextExercise.steps[nextStep].starter_code);
    setCheck({ kind: "idle" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted">
            Exercise {exercise.position} of {exercises.length}
          </p>
          <h2 className="text-xl font-semibold">{exercise.title}</h2>
          <Markdown>{exercise.scenario_markdown}</Markdown>
        </header>

        <ol className="space-y-1">
          {exercise.steps.map((candidate, index) => {
            const done = completed.has(candidate.id);
            const reachable = index === 0 || completed.has(exercise.steps[index - 1].id);
            return (
              <li key={candidate.id}>
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => goToStep(index)}
                  className={`flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm transition
                    ${index === stepIndex ? "bg-surface-2" : "hover:bg-surface-2"}
                    ${reachable ? "" : "cursor-not-allowed opacity-40"}`}
                >
                  <span
                    aria-hidden
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px]
                      ${done ? "border-pass bg-pass text-black" : "border-line text-muted"}`}
                  >
                    {done ? "✓" : candidate.number}
                  </span>
                  <span className={done ? "text-muted line-through" : ""}>
                    Checkpoint {candidate.number}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <section className="space-y-3 border-t border-line pt-4">
          <h3 className="text-sm font-semibold">
            {progress.done === progress.total
              ? "Exercise complete"
              : `Checkpoint ${step.number}`}
          </h3>
          <Markdown>{step.instruction_markdown}</Markdown>
          <div className="rounded border border-line bg-surface-2 p-3 text-sm">
            <Markdown>{step.explanation_markdown}</Markdown>
          </div>
          {step.hint.length > 0 ? (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted">Hint</summary>
              <div className="pt-2">
                <Markdown>{step.hint}</Markdown>
              </div>
            </details>
          ) : null}
        </section>
      </div>

      <div className="flex min-h-[28rem] flex-col rounded-lg border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-4 py-2 text-xs text-muted">
          <span>{exercise.language === "python" ? "main.py" : "main.js"}</span>
          <span>
            {progress.done}/{progress.total} checkpoints
          </span>
        </div>

        <div className="min-h-0 flex-1">
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

        <div className="flex items-center gap-3 border-t border-line px-4 py-3">
          <button
            type="button"
            onClick={runCheck}
            disabled={check.kind === "checking"}
            className="rounded bg-accent px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            {check.kind === "checking" ? "Checking…" : "Check"}
          </button>

          {isPassed && !isLastStep ? (
            <button
              type="button"
              onClick={() => goToStep(stepIndex + 1)}
              className="rounded border border-line px-4 py-2 text-sm font-medium"
            >
              Next
            </button>
          ) : null}

          {isPassed && isLastStep && hasNextExercise ? (
            <button
              type="button"
              onClick={goToNextExercise}
              className="rounded border border-line px-4 py-2 text-sm font-medium"
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
            {check.kind === "error" ? <span className="text-fail">{check.message}</span> : null}
          </p>
        </div>
      </div>
    </div>
  );
}
