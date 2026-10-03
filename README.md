# bookademy-web

Next.js App Router. The only thing a browser talks to.

## Auth

`bookademy-core` issues a JWT access/refresh pair. The browser never sees either: the
route handlers in `app/api/auth/` set them as httpOnly cookies, and every call to
Django happens on this server (`lib/api.ts`), which refreshes an expired access token
once and retries.

Client components cannot call Django, because they cannot read the cookie. They call
`app/api/django/[...path]/route.ts`, which attaches the token server-side. It is
restricted to the learner-facing prefixes and can only ever do what the signed-in
user could already do.

## The ghost-text editor

`components/GhostEditor.tsx` and `components/ghostText.ts` are the interesting part.

`ghostFor(buffer, expected)` treats the difference as a single hunk: the common
prefix, the common suffix, and whatever sits between. That covers the three things a
learner actually does — typing forward, inserting above code already there, and
deleting — without a full diff. The result is rendered as two CodeMirror decorations:
an inline widget for the rest of the current line, and a block widget for the lines
below it, which is how Copilot-style multi-line ghost text has to be done since an
inline widget cannot span lines.

Decorations are rebuilt on every transaction rather than mapped through changes. A
step's buffer is a few dozen lines, so it costs nothing and cannot go stale.

The editor is constructed once. Language and read-only live in compartments, and
`expected`, the error line and a step reset arrive as state effects, so it is never
torn down mid-exercise.

Known limit: when a learner inserts *above* existing code, the block ghost text
renders after the whole current line rather than mid-line. Typing forward — the
common case — is exact.

## Pages

| Route | Is |
|---|---|
| `/login`, `/register` | Auth |
| `/library` | Uploads, and documents with live generation status (polls while anything is still being written) |
| `/courses/[documentId]` | The syllabus: chapters, topics, ticks |
| `/courses/[documentId]/topics/[topicId]` | Lesson, exercises, quiz |

## Types

`lib/types.ts` mirrors `bookademy-core`'s serialisers by hand. There is no codegen,
so changing a serialiser means changing this file.
