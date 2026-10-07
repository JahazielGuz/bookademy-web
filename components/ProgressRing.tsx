import { percent } from "@/lib/courseProgress";

export type ProgressRingProps = {
  done: number;
  total: number;
  /** Pixels. Stroke and the number inside scale with it. */
  size?: number;
  label?: string;
};

/**
 * How far through something a learner is, as a ring with the figure inside it.
 *
 * Nothing started draws nothing. A ring at 0% is a circle saying "not begun", which
 * is what the empty space beside the title already says, and a column of them makes
 * a syllabus look like a checklist of chores. The space is still held, so titles
 * stay in line whether or not their neighbour has been started.
 *
 * Finished keeps the tick rather than reading "100%": the ring is full, and a figure
 * that can only say one thing is not worth reading.
 */
export default function ProgressRing({ done, total, size = 44, label }: ProgressRingProps) {
  const complete = percent({ done, total });

  if (total === 0 || done === 0) {
    return <span aria-hidden className="shrink-0" style={{ width: size, height: size }} />;
  }

  const described = label !== undefined ? `${label}: ${complete}%` : `${complete}% complete`;

  if (done >= total) {
    return (
      <span
        title={described}
        className="grid shrink-0 place-items-center rounded-full bg-accent font-bold text-on-accent"
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        <span className="sr-only">{described}</span>
        <span aria-hidden>✓</span>
      </span>
    );
  }

  const stroke = Math.max(3, size * 0.1);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <span
      title={described}
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="sr-only">{described}</span>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--line)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference * (complete / 100)} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {/* Tabular figures so 9% and 88% sit on the same centre. */}
      <span
        aria-hidden
        className="absolute inset-0 grid place-items-center font-bold tabular-nums leading-none"
        style={{ fontSize: size * 0.28 }}
      >
        {complete}%
      </span>
    </span>
  );
}
