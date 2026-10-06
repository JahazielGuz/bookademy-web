import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

export type MarkdownProps = {
  children: string;
  /** Render into running text — no block wrapper, no paragraph. */
  inline?: boolean;
};

/** Paragraphs are dropped in inline mode: a quiz choice is one phrase, and a <p>
 *  inside a <button> is both invalid and a line break where none belongs. */
const INLINE_COMPONENTS = {
  p: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
};

export default function Markdown({ children, inline = false }: MarkdownProps) {
  const markdown = (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={inline ? INLINE_COMPONENTS : undefined}
    >
      {children}
    </ReactMarkdown>
  );

  return inline ? (
    <span className="prose-bk">{markdown}</span>
  ) : (
    <div className="prose-bk">{markdown}</div>
  );
}
