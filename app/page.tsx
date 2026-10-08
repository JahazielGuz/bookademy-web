import Link from "next/link";

import Wordmark from "@/components/Wordmark";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import Feature from "@/components/landing/Feature";
import GhostDemo from "@/components/landing/GhostDemo";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/api";

export default async function Home() {
  const store = await cookies();
  // Someone already signed in wants their shelf, not the pitch.
  if (store.has(ACCESS_COOKIE) || store.has(REFRESH_COOKIE)) redirect("/library");

  return (
    <main>
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Wordmark />
        <div className="flex items-center gap-5 text-sm">
          <Link href="/login" className="text-muted hover:text-text">
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded bg-brand px-3.5 py-1.5 font-medium text-on-brand"
          >
            Start free
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-5xl px-6 pt-16 pb-20">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_minmax(0,520px)]">
          <div>
            <p className="mb-4 inline-block rounded-full border border-line px-3 py-1 text-xs text-muted">
              Free, and without an account limit
            </p>
            <h1 className="text-5xl font-semibold leading-[1.1] tracking-tight">
              Turn any PDF into a course you actually practise.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Upload a programming book. BooKademy reads it, lays out a syllabus of
              chapters and topics, and generates a lesson for each one. The coding is a
              step-by-step code-along: the exact code appears in grey, you type it out
              a line at a time, and each checkpoint is checked before you move on. Then
              a quiz for each topic.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="rounded bg-brand px-5 py-2.5 font-medium text-on-brand"
              >
                Upload your first PDF
              </Link>
              <Link href="/login" className="text-sm text-muted underline">
                I already have an account
              </Link>
            </div>

            <p className="mt-6 max-w-lg text-sm leading-relaxed text-muted">
              <span className="text-text">One requirement:</span> your PDF needs a
              table of contents — the clickable chapter list most published books
              have. Scanned books usually don&rsquo;t.
            </p>
          </div>

          <GhostDemo />
        </div>
      </section>

      <section className="border-t border-line bg-surface/40">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-2xl font-semibold tracking-tight">
            Reading a chapter is not the same as knowing it.
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted">
            Most people finish a technical book having understood every page and
            retained almost none of it, because reading is recognition and coding is
            recall. BooKademy closes that gap: every topic ends with code you type
            yourself, one line at a time, checked as you go.
          </p>

          <div className="mt-12 grid gap-10 md:grid-cols-3">
            <div>
              <span className="font-mono text-sm text-accent">01</span>
              <h3 className="mt-2 font-semibold">Upload a PDF</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Any programming book you own, as long as it has a table of contents.
                BooKademy reads the chapters and their page ranges straight from it,
                which is why they are the book&rsquo;s real chapters rather than a
                guess — and why a scanned PDF, which has no such list, cannot be used.
              </p>
            </div>
            <div>
              <span className="font-mono text-sm text-accent">02</span>
              <h3 className="mt-2 font-semibold">Watch it being written</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Chapters arrive in order as they finish, so you can start chapter one
                while chapter nine is still being written. Progress streams live — no
                spinner, no guessing.
              </p>
            </div>
            <div>
              <span className="font-mono text-sm text-accent">03</span>
              <h3 className="mt-2 font-semibold">Type your way through</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Read the lesson, take the quiz, then build the code checkpoint by
                checkpoint — with the next line shown in grey until you&rsquo;ve
                written it.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-2xl font-semibold tracking-tight">What you get</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Feature title="A syllabus, not a summary">
            Chapters and the key topics inside each one, drawn from the book&rsquo;s own
            table of contents and page ranges. Nothing invented, nothing skipped.
          </Feature>
          <Feature title="Type-along exercises">
            Every exercise is a series of checkpoints. The code you need appears as grey
            text in the editor and disappears as you type it, so you are never stuck
            staring at a blank file.
          </Feature>
          <Feature title="Checked, not self-marked">
            Press Check and the server compares your code to what the step expected. Next
            only unlocks when it passes — and invisible differences like trailing spaces
            are forgiven, because failing you for a character you cannot see is not
            teaching.
          </Feature>
          <Feature title="Quizzes that probe, not pad">
            Three to five questions per topic, with wrong answers drawn from real
            misunderstandings. You see the explanations once you have committed to an
            answer.
          </Feature>
          <Feature title="Progress that is actually yours">
            A topic is complete when every checkpoint passes and the quiz does. Your
            syllabus ticks off as you go, and picks up exactly where you stopped.
          </Feature>
          <Feature title="Python and JavaScript">
            Exercises are written in the language the book teaches, with a proper code
            editor — syntax highlighting, real indentation, keyboard shortcuts.
          </Feature>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            It&rsquo;s free. There is no paid tier.
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-muted">
            No trial, no credit card, no per-document charge, no upsell at chapter three.
            Upload a book, learn it, upload another.
          </p>
          <Link
            href="/register"
            className="mt-9 inline-block rounded bg-brand px-6 py-3 font-medium text-on-brand"
          >
            Create an account
          </Link>
          <p className="mt-5 text-xs text-muted">
            Upload PDFs you own. Your documents are private to your account.
          </p>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8 text-sm text-muted">
          <Wordmark size="sm" />
          <Link href="/login" className="hover:text-text">
            Sign in
          </Link>
        </div>
      </footer>
    </main>
  );
}
