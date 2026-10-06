"use client";

import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { HighlightStyle, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { Compartment, EditorState, StateEffect, StateField } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  WidgetType,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { useEffect, useRef } from "react";

import { ghostFor, mismatchesFor } from "@/components/ghostText";
import type { Language } from "@/lib/types";

export type GhostEditorProps = {
  /** Buffer contents to load. Reloaded whenever `resetKey` changes. */
  value: string;
  /** The code this step is finished at; the grey text is the difference. */
  expected: string;
  language: Language;
  /** Change this (the step id) to load a new step's starter code. */
  resetKey: number;
  readOnly: boolean;
  /** 1-indexed line the last failed check disagreed with, if any. */
  errorLine: number | null;
  onChange: (value: string) => void;
};

class InlineGhost extends WidgetType {
  constructor(readonly text: string) {
    super();
  }

  eq(other: InlineGhost): boolean {
    return other.text === this.text;
  }

  toDOM(): HTMLElement {
    const span = document.createElement("span");
    span.className = "cm-ghost";
    span.textContent = this.text;
    return span;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

class BlockGhost extends WidgetType {
  constructor(readonly lines: string[]) {
    super();
  }

  eq(other: BlockGhost): boolean {
    return other.lines.join("\n") === this.lines.join("\n");
  }

  toDOM(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "cm-ghost-block";
    for (const line of this.lines) {
      const row = document.createElement("div");
      // A blank ghost line still needs height, or the block collapses.
      row.textContent = line.length > 0 ? line : " ";
      wrapper.appendChild(row);
    }
    return wrapper;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

const setExpected = StateEffect.define<string>();
const setErrorLine = StateEffect.define<number | null>();

const expectedField = StateField.define<string>({
  create: () => "",
  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setExpected)) return effect.value;
    }
    return value;
  },
});

const errorLineField = StateField.define<number | null>({
  create: () => null,
  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setErrorLine)) return effect.value;
    }
    // Any edit means the learner is working on it again; drop the marker.
    return transaction.docChanged ? null : value;
  },
});

function buildDecorations(state: EditorState): DecorationSet {
  const ranges = [];
  const errorLine = state.field(errorLineField);
  if (errorLine !== null && errorLine >= 1 && errorLine <= state.doc.lines) {
    const line = state.doc.line(errorLine);
    ranges.push(Decoration.line({ class: "cm-error-line" }).range(line.from));
  }

  const expected = state.field(expectedField);
  if (expected.length > 0) {
    const buffer = state.doc.toString();

    // Anything typed that the target does not have, marked where it was typed. The
    // learner sees which characters are wrong rather than a check that only says no:
    // `function canDrbbb` points at the `bbb`.
    const wrong = mismatchesFor(buffer, expected);
    for (const mark of wrong) {
      ranges.push(Decoration.mark({ class: "cm-wrong" }).range(mark.from, mark.to));
    }

    // While something is wrong, the ghost is withdrawn. It answers "what comes next
    // if everything so far is right", and once that is not true it has nothing to
    // say — it would re-offer the rest of the line from inside the mistake, which is
    // how `function canDrbbb` came out as `function canDrive(usr) {bbbive(usr) {`.
    //
    // Deleting is not a mistake and leaves no mark, so the ghost stays for that.
    const { at, text } = wrong.length > 0 ? { at: 0, text: "" } : ghostFor(buffer, expected);

    if (text.length > 0) {
      const line = state.doc.lineAt(at);

      // Whole lines going in above code that is already there — the usual shape of a
      // checkpoint that adds a body inside a block you have already closed. The
      // insertion starts at a line boundary and ends with a newline, so none of it
      // shares a line with anything typed, and all of it belongs above that line.
      //
      // Splitting it the other way is what produced `if (usr.age >= 16) {}`: the
      // ghost's first line was drawn inline, which pushed the brace on that line to
      // the end of it, and the remaining ghost lines went underneath both.
      if (at === line.from && text.endsWith("\n")) {
        ranges.push(
          Decoration.widget({
            widget: new BlockGhost(text.slice(0, -1).split("\n")),
            side: -1,
            block: true,
          }).range(line.from),
        );
      } else {
        const [firstLine, ...restLines] = text.split("\n");
        if (firstLine.length > 0) {
          ranges.push(
            Decoration.widget({ widget: new InlineGhost(firstLine), side: 1 }).range(at),
          );
        }
        if (restLines.length > 0) {
          ranges.push(
            Decoration.widget({
              widget: new BlockGhost(restLines),
              side: 1,
              block: true,
            }).range(line.to),
          );
        }
      }
    }
  }

  // `true` sorts the ranges: a block and a line decoration can share a position.
  return Decoration.set(ranges, true);
}

const decorationField = StateField.define<DecorationSet>({
  create: (state) => buildDecorations(state),
  // Rebuilt on every transaction rather than mapped through changes. A step's
  // buffer is a few dozen lines, so this costs nothing and cannot go stale.
  update: (_deco, transaction) => buildDecorations(transaction.state),
  provide: (field) => EditorView.decorations.from(field),
});

/* VS Code's Dark+ colours.
 *
 * Without a highlight style CodeMirror parses the language and then renders every
 * token the same colour — which is what it was doing. Parsing without highlighting
 * is the worst of both: the cost of a grammar and none of the benefit.
 *
 * The ghost text sits at #6f7a8d, duller than any of these, so what you have yet to
 * type still reads as unwritten rather than as another kind of token. */
const vsCodeDark = HighlightStyle.define([
  { tag: tags.comment, color: "#6a9955", fontStyle: "italic" },
  { tag: [tags.keyword, tags.modifier, tags.self, tags.null, tags.bool], color: "#569cd6" },
  { tag: [tags.controlKeyword, tags.moduleKeyword], color: "#c586c0" },
  { tag: [tags.string, tags.special(tags.string)], color: "#ce9178" },
  { tag: tags.escape, color: "#d7ba7d" },
  { tag: tags.regexp, color: "#d16969" },
  { tag: [tags.number, tags.integer, tags.float], color: "#b5cea8" },
  { tag: [tags.typeName, tags.className, tags.namespace], color: "#4ec9b0" },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: "#dcdcaa" },
  { tag: [tags.variableName, tags.propertyName, tags.attributeName], color: "#9cdcfe" },
  { tag: tags.definition(tags.variableName), color: "#9cdcfe" },
  { tag: [tags.operator, tags.punctuation, tags.separator, tags.bracket], color: "#d4d4d4" },
  { tag: tags.atom, color: "#569cd6" },
  { tag: tags.meta, color: "#9cdcfe" },
  { tag: tags.invalid, color: "#f08a8d" },
]);

// The editor is the one dark surface on a light page, so it takes the code palette
// rather than inheriting the page's.
const editorTheme = EditorView.theme(
  {
    // The editor fills the pane it is given; the pane decides when to scroll.
    "&": {
      fontSize: "14px",
      height: "100%",
      backgroundColor: "var(--code-bg)",
      color: "var(--code-text)",
    },
    ".cm-scroller": { overflow: "auto" },
    ".cm-content": { fontFamily: "var(--font-mono)", padding: "12px 0", caretColor: "var(--code-text)" },
    ".cm-gutters": {
      backgroundColor: "var(--code-bg)",
      color: "var(--code-muted)",
      border: "none",
    },
    ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.03)" },
    ".cm-activeLineGutter": { backgroundColor: "transparent" },
    ".cm-cursor": { borderLeftColor: "var(--code-text)" },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      backgroundColor: "rgba(120,140,200,0.30)",
    },
    ".cm-ghost": { color: "var(--ghost)" },
    ".cm-ghost-block": { color: "var(--ghost)", whiteSpace: "pre" },
    ".cm-error-line": { backgroundColor: "var(--error-line)" },
    // Wins over the syntax highlighting underneath it: a keyword you have misspelt
    // is no longer a keyword, and colouring it as one hides the thing being flagged.
    ".cm-wrong, .cm-wrong span": {
      color: "var(--wrong) !important",
      backgroundColor: "var(--wrong-bg)",
      borderRadius: "2px",
    },
    "&.cm-focused": { outline: "none" },
  },
  { dark: true },
);

function languageSupport(language: Language) {
  return language === "python" ? python() : javascript();
}

export default function GhostEditor({
  value,
  expected,
  language,
  resetKey,
  readOnly,
  errorLine,
  onChange,
}: GhostEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const languageCompartment = useRef(new Compartment());
  const readOnlyCompartment = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Built once. Everything that varies is either a compartment or an effect, so the
  // editor is never torn down and rebuilt mid-exercise.
  useEffect(() => {
    if (host.current === null) return;

    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          languageCompartment.current.of(languageSupport(language)),
          syntaxHighlighting(vsCodeDark),
          readOnlyCompartment.current.of(EditorState.readOnly.of(readOnly)),
          indentUnit.of(language === "python" ? "    " : "  "),
          expectedField,
          errorLineField,
          decorationField,
          editorTheme,
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
        ],
      }),
    });
    editor.dispatch({ effects: setExpected.of(expected) });
    view.current = editor;

    return () => {
      editor.destroy();
      view.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A new step: load its starter code and its new target.
  useEffect(() => {
    const editor = view.current;
    if (editor === null) return;
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: value },
      effects: [setExpected.of(expected), setErrorLine.of(null)],
    });
    editor.focus();
    // Only on a step change; typing must not reload the buffer under the learner.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    view.current?.dispatch({ effects: setExpected.of(expected) });
  }, [expected]);

  useEffect(() => {
    view.current?.dispatch({ effects: setErrorLine.of(errorLine) });
  }, [errorLine]);

  useEffect(() => {
    const editor = view.current;
    if (editor === null) return;
    editor.dispatch({
      effects: [
        languageCompartment.current.reconfigure(languageSupport(language)),
        readOnlyCompartment.current.reconfigure(EditorState.readOnly.of(readOnly)),
      ],
    });
  }, [language, readOnly]);

  return <div ref={host} className="h-full" />;
}
