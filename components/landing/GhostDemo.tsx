/** A still of the editor mid-exercise: typed text solid, the rest waiting in grey.
 *
 * This is the one thing about BooKademy that has to be seen rather than described,
 * so the landing page shows it instead of claiming it. */
export default function GhostDemo() {
  return (
    <div className="overflow-hidden rounded-xl border border-code-line bg-code-bg text-code-text shadow-2xl">
      <div className="flex items-center justify-between border-b border-code-line px-4 py-2.5">
        <span className="font-mono text-xs text-code-muted">main.py</span>
        <span className="text-xs text-code-muted">2/4 checkpoints</span>
      </div>

      <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed">
        <code>
          <span className="select-none pr-4 text-code-muted/60">1</span>
          <span>def favorite_color():</span>
          {"\n"}
          <span className="select-none pr-4 text-code-muted/60">2</span>
          <span>{"    color = 'Red'"}</span>
          {"\n"}
          <span className="select-none pr-4 text-code-muted/60">3</span>
          <span>{"    print(c"}</span>
          <span className="text-ghost">olor)</span>
          {"\n"}
          <span className="select-none pr-4 text-code-muted/60">4</span>
          <span className="text-ghost">{""}</span>
          {"\n"}
          <span className="select-none pr-4 text-code-muted/60">5</span>
          <span className="text-ghost">favorite_color()</span>
        </code>
      </pre>

      <div className="flex items-center gap-3 border-t border-code-line px-5 py-3">
        <span className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-on-accent">Check</span>
        <span className="rounded border border-code-line px-3 py-1.5 text-xs text-code-muted">Next</span>
        <span className="ml-auto text-xs text-code-muted">grey text is what to type next</span>
      </div>
    </div>
  );
}
