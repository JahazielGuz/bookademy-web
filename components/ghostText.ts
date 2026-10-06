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

export type Mismatch = {
  /** Offset in the buffer where the wrong characters start. */
  from: number;
  /** Offset just past them. */
  to: number;
};

/**
 * The characters the learner has typed that the target does not have.
 *
 * Aligned by line rather than as one hunk over the whole buffer. A checkpoint adds
 * whole lines, so most lines of the buffer have an exact counterpart in the target
 * and drop out; only the lines that differ are compared character by character.
 *
 * Doing this over the whole buffer instead would mark everything between the first
 * and last disagreement — type `canDrbbb` on line 1 of code you have already
 * finished and the console.log below it goes red too, because the single hunk
 * cannot see that the line in between matches.
 */
export function mismatchesFor(buffer: string, expected: string): Mismatch[] {
  const typed = buffer.split("\n");
  const target = expected.split("\n");

  let head = 0;
  while (head < typed.length && head < target.length && typed[head] === target[head]) {
    head += 1;
  }

  let tail = 0;
  while (
    tail < typed.length - head &&
    tail < target.length - head &&
    typed[typed.length - 1 - tail] === target[target.length - 1 - tail]
  ) {
    tail += 1;
  }

  let offset = 0;
  for (let line = 0; line < head; line += 1) {
    offset += typed[line].length + 1;
  }

  const marks: Mismatch[] = [];
  const changed = typed.length - tail - head;
  const available = target.length - tail - head;

  for (let line = 0; line < changed; line += 1) {
    const got = typed[head + line];
    // Past the end of the target's own changed lines, every character is surplus.
    const want = line < available ? target[head + line] : "";

    let start = 0;
    while (start < got.length && start < want.length && got[start] === want[start]) {
      start += 1;
    }

    let end = 0;
    while (
      end < got.length - start &&
      end < want.length - start &&
      got[got.length - 1 - end] === want[want.length - 1 - end]
    ) {
      end += 1;
    }

    if (got.length - end > start) {
      marks.push({ from: offset + start, to: offset + got.length - end });
    }
    offset += got.length + 1;
  }

  return marks;
}
