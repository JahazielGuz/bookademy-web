/** A still of the editor mid-exercise: typed text solid, the rest waiting in grey.
 *
 * This is the one thing about BooKademy that has to be seen rather than described,
 * so the landing page shows it instead of claiming it.
 *
 * The typed half is coloured from the same --vs-* tokens the real editor and the
 * lesson's fenced blocks use. A still of a code editor showing flat white text is a
 * still of something nobody would want to use.
 */
export default function GhostDemo() {
  return (
    <div className="overflow-hidden rounded-xl border border-code-line bg-code-bg text-code-text shadow-2xl">
      <div className="flex items-center justify-between border-b border-code-line px-4 py-2.5">
        <span className="font-mono text-xs text-code-muted">main.py</span>
        <span className="text-xs text-code-muted">2/4 checkpoints</span>
      </div>

      <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed">
        <code>
          <Gutter n={1} />
          <span className="text-vs-keyword">def </span>
          <span className="text-vs-function">favorite_color</span>
          <span className="text-vs-punctuation">():</span>
          {"\n"}

          <Gutter n={2} />
          <span className="text-vs-variable">{"    color"}</span>
          <span className="text-vs-punctuation"> = </span>
          <span className="text-vs-string">{"'Red'"}</span>
          {"\n"}

          <Gutter n={3} />
          <span className="text-vs-function">{"    print"}</span>
          <span className="text-vs-punctuation">(</span>
          <span className="text-vs-variable">c</span>
          {/* The cut falls mid-word, which is the point: the grey picks up from
              wherever you have got to, not from the next line. */}
          <span className="text-ghost">olor)</span>
          {"\n"}

          <Gutter n={4} />
          {"\n"}

          <Gutter n={5} />
          <span className="text-ghost">favorite_color()</span>
        </code>
      </pre>

      <div className="flex items-center gap-3 border-t border-code-line px-5 py-3">
        <span className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-on-accent">
          Check
        </span>
        <span className="ml-auto text-xs text-code-muted">grey text is what to type next</span>
      </div>
    </div>
  );
}

function Gutter({ n }: { n: number }) {
  return <span className="select-none pr-4 text-code-muted/60">{n}</span>;
}
