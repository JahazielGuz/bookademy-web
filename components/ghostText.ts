// The ghost-text computation, kept out of the component so it can be tested and
// reasoned about on its own.

export type Ghost = {
  /** Offset in the learner's buffer where the missing text belongs. */
  at: number;
  /** The characters still to be typed. */
  text: string;
  /** Text the learner has typed that is not in the expected code. */
  extra: string;
};

/**
 * Work out what is still missing from the buffer.
 *
 * Treats the difference as a single hunk: everything the buffer and the target
 * agree on at the start, everything they agree on at the end, and whatever sits
 * between. That covers the three things a learner actually does — typing forward,
 * inserting above code that is already there, and deleting — without a full diff.
 */
export function ghostFor(buffer: string, expected: string): Ghost {
  let prefix = 0;
  while (
    prefix < buffer.length &&
    prefix < expected.length &&
    buffer[prefix] === expected[prefix]
  ) {
    prefix += 1;
  }

  let suffix = 0;
  while (
    suffix < buffer.length - prefix &&
    suffix < expected.length - prefix &&
    buffer[buffer.length - 1 - suffix] === expected[expected.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  return {
    at: prefix,
    text: expected.slice(prefix, expected.length - suffix),
    extra: buffer.slice(prefix, buffer.length - suffix),
  };
}
