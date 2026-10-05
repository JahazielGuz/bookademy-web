"use client";

import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { indentUnit } from "@codemirror/language";
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

import { ghostFor } from "@/components/ghostText";
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
    const { at, text } = ghostFor(state.doc.toString(), expected);
    if (text.length > 0) {
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
          }).range(state.doc.lineAt(at).to),
        );
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

const editorTheme = EditorView.theme({
  // The editor fills the pane it is given; the pane decides when to scroll.
  "&": { fontSize: "14px", height: "100%" },
  ".cm-scroller": { overflow: "auto" },
  ".cm-content": { fontFamily: "var(--font-mono)", padding: "12px 0" },
  ".cm-ghost": { color: "var(--ghost)" },
  ".cm-ghost-block": { color: "var(--ghost)", whiteSpace: "pre" },
  ".cm-error-line": { backgroundColor: "var(--error-line)" },
  "&.cm-focused": { outline: "none" },
});

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
