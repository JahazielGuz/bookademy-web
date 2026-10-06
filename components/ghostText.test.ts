import { ghostFor, mismatchesFor } from "@/components/ghostText";

/** The buffer a learner is handed at checkpoint 2 of the TypeScript topic: exactly
 *  what checkpoint 1 asked for, and nothing else. */
const TYPED = `function canDrive(usr) {
  console.log("user is", usr.name);
}`;

/** What checkpoint 2 wants — the same code with a branch added inside the body. */
const TARGET = `function canDrive(usr) {
  console.log("user is", usr.name);
  if (usr.age >= 16) {
    console.log("allow to drive");
  } else {
    console.log("do not allow to drive");
  }
}`;

describe("ghostFor", () => {
  it("offers the whole target when nothing has been typed", () => {
    const ghost = ghostFor("", "let a = 5;");

    expect(ghost).toEqual({ at: 0, text: "let a = 5;", extra: "" });
  });

  it("offers only what is left when the learner is partway through a line", () => {
    const ghost = ghostFor("let a =", "let a = 5;");

    expect(ghost.at).toBe(7);
    expect(ghost.text).toBe(" 5;");
    expect(ghost.extra).toBe("");
  });

  it("offers nothing once the buffer matches", () => {
    expect(ghostFor("let a = 5;", "let a = 5;").text).toBe("");
  });

  it("places an added block at the start of the line it belongs above", () => {
    const ghost = ghostFor(TYPED, TARGET);

    // The closing brace the learner typed is the last character of the buffer, so
    // the insertion point is the start of its line, and the added text ends with a
    // newline. GhostEditor relies on both to render the block above that line
    // rather than through it.
    expect(TYPED.slice(0, ghost.at).endsWith("\n")).toBe(true);
    expect(TYPED.slice(ghost.at)).toBe("}");
    expect(ghost.text.endsWith("\n")).toBe(true);
    expect(ghost.text).toBe(
      '  if (usr.age >= 16) {\n    console.log("allow to drive");\n' +
        '  } else {\n    console.log("do not allow to drive");\n  }\n',
    );
  });
});

describe("mismatchesFor", () => {
  it("finds nothing while the learner is typing forward correctly", () => {
    expect(mismatchesFor("function canD", TARGET)).toEqual([]);
  });

  it("finds nothing when the buffer is a prefix of the target by whole lines", () => {
    expect(mismatchesFor(TYPED, TARGET)).toEqual([]);
  });

  it("marks only the wrong characters, not the rest of the line", () => {
    const marks = mismatchesFor("function canDrbbb", TARGET);

    expect(marks).toEqual([{ from: 14, to: 17 }]);
    expect("function canDrbbb".slice(14, 17)).toBe("bbb");
  });

  it("does not spill onto lines that match, even when they sit between changes", () => {
    const typo = TYPED.replace("canDrive", "canDrbbb");

    const marks = mismatchesFor(typo, TARGET);

    // A single hunk over the whole buffer would run from the `bbb` all the way to
    // the console.log below it, because it cannot see the matching line between.
    expect(marks).toEqual([{ from: 14, to: 17 }]);
  });

  it("marks surplus lines the target does not have at all", () => {
    const marks = mismatchesFor("let a = 5;\nlet b = 6;", "let a = 5;");

    expect(marks).toEqual([{ from: 11, to: 21 }]);
  });

  it("marks a wrong character in the middle of an otherwise correct line", () => {
    const marks = mismatchesFor("let a = 9;", "let a = 5;");

    expect(marks).toEqual([{ from: 8, to: 9 }]);
  });

  it("finds nothing when the buffer is empty", () => {
    expect(mismatchesFor("", TARGET)).toEqual([]);
  });

  // GhostEditor withdraws the ghost whenever there is a mark, so these two decide
  // whether it keeps helping: a gap is something still to type, a wrong character
  // is not.
  it("treats a deletion as missing text rather than wrong text", () => {
    const gap = TYPED.replace("usr.name", "usr.nam");

    expect(mismatchesFor(gap, TARGET)).toEqual([]);
  });

  it("treats a substitution as wrong text", () => {
    const swapped = TYPED.replace("usr.name", "usr.nerd");

    expect(mismatchesFor(swapped, TARGET)).not.toEqual([]);
  });
});
