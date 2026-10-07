export type ProgressRingProps = {
  done: number;
  total: number;
  /** Pixels. The row decides; the ring scales its stroke to match. */
  size?: number;
  label?: string;
};

/**
 * How far through something a learner is, as a ring.
 *
 * Nothing started draws nothing. A ring at 0% is a circle saying "not begun", which
 * is what the empty space beside the title already says, and a column of them makes
 * a syllabus look like a checklist of chores. The space is still held, so titles
 * stay in line whether or not their neighbour has been started.
 */
export default function ProgressRing({ done, total, size = 24, label }: ProgressRingProps) {
  const fraction = total > 0 ? Math.min(done / total, 1) : 0;

  if (fraction === 0) {
    return <span aria-hidden className="shrink-0" style={{ width: size, height: size }} />;
  }

  const described = label ?? `${Math.round(fraction * 100)}% complete`;

  if (fraction >= 1) {
    return (
      <span
        title={described}
        className="grid shrink-0 place-items-center rounded-full bg-accent font-bold text-on-accent"
        style={{ width: size, height: size, fontSize: size * 0.5 }}
      >
        <span className="sr-only">{described}</span>
        <span aria-hidden>✓</span>
      </span>
    );
  }

  const stroke = Math.max(2, size * 0.12);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <span title={described} className="shrink-0" style={{ width: size, height: size }}>
      <span className="sr-only">{described}</span>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        {/* The track is only drawn once there is something to track against. */}
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
          strokeDasharray={`${circumference * fraction} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
    </span>
  );
}
