export type WordmarkProps = {
  /** "sm" for a footer line, "md" for a page header, "lg" to introduce the product. */
  size?: "sm" | "md" | "lg";
  /** Dark chrome, where the name needs the light end of the palette. */
  onDark?: boolean;
};

const SCALE = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" } as const;

/**
 * The name, on its own.
 *
 * Extrabold and tightly tracked is the whole mark — no badge, no second element.
 * Defined once because it appears on the signed-in header, the landing page, its
 * footer and the sign-in page, and four copies drift.
 */
export default function Wordmark({ size = "md", onDark = false }: WordmarkProps) {
  return (
    <span
      className={`inline-block font-extrabold tracking-tight ${SCALE[size]} ${
        onDark ? "text-header-text" : "text-text"
      }`}
    >
      BooKademy
    </span>
  );
}
