export type WordmarkProps = {
  /** "sm" for a footer line, "md" for a page header, "lg" to introduce the product. */
  size?: "sm" | "md" | "lg";
  /** Dark chrome, where the badge and the text need the light end of the palette. */
  onDark?: boolean;
};

const SCALE = {
  sm: { badge: "h-7 w-7 text-base rounded-md", text: "text-lg", gap: "gap-2" },
  md: { badge: "h-9 w-9 text-xl rounded-lg", text: "text-2xl", gap: "gap-2.5" },
  lg: { badge: "h-12 w-12 text-3xl rounded-xl", text: "text-4xl", gap: "gap-3" },
} as const;

/**
 * The name, set as a mark rather than as a word in a sentence.
 *
 * The badge is what makes it read as a logo: a bare bold string at any size still
 * looks like a heading that happens to be in the corner. Defined once because it
 * appears on the signed-in header, the landing page, its footer and the sign-in
 * page, and four copies drift.
 */
export default function Wordmark({ size = "md", onDark = false }: WordmarkProps) {
  const scale = SCALE[size];

  return (
    <span className={`inline-flex items-center ${scale.gap} font-extrabold tracking-tight`}>
      <span
        aria-hidden
        className={`grid shrink-0 place-items-center ${scale.badge} bg-accent text-on-accent`}
      >
        B
      </span>
      <span className={`${scale.text} ${onDark ? "text-header-text" : "text-text"}`}>
        BooKademy
      </span>
    </span>
  );
}
