import Link from "next/link";

import TopicWorkspace from "@/components/TopicWorkspace";
import { requireJson } from "@/lib/api";
import type { TopicDetail } from "@/lib/types";

export type TopicPageProps = {
  params: Promise<{ documentId: string; topicId: string }>;
};

export default async function TopicPage({ params }: TopicPageProps) {
  const { documentId, topicId } = await params;
  const topic = await requireJson<TopicDetail>(`/api/topics/${topicId}/`);

  if (topic.status !== "ready") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Link href={`/courses/${documentId}`} className="text-sm text-muted underline">
          ← Syllabus
        </Link>
        <p className="mt-8 rounded-lg border border-line bg-card p-6 text-muted">
          {topic.status === "failed"
            ? `This topic could not be generated: ${topic.error}`
            : "This topic is still being written. Check back shortly."}
        </p>
      </main>
    );
  }

  // Fixed to the viewport so the two panes scroll independently: the reading side on
  // its own, and the editor only when its code is taller than the pane.
  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-4 bg-header px-6 py-3 text-header-text">
        <Link href={`/courses/${documentId}`} className="text-sm text-header-muted hover:text-header-text">
          ← Syllabus
        </Link>
        <span className="truncate text-sm font-medium">{topic.title}</span>
      </header>

      <TopicWorkspace topic={topic} />
    </main>
  );
}
