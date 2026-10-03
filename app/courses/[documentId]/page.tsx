import Link from "next/link";

import CourseView from "@/components/CourseView";
import { optionalJson, requireJson } from "@/lib/api";
import type { DocumentSummary, Syllabus } from "@/lib/types";

export type SyllabusPageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function SyllabusPage({ params }: SyllabusPageProps) {
  const { documentId } = await params;
  const [document, syllabus] = await Promise.all([
    requireJson<DocumentSummary>(`/api/documents/${documentId}/`),
    // Absent until the outline has been written, which is a normal state here.
    optionalJson<Syllabus>(`/api/documents/${documentId}/syllabus/`),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/library" className="text-sm text-muted underline">
        ← Library
      </Link>
      <CourseView
        documentId={Number(documentId)}
        initialDocument={document}
        initialSyllabus={syllabus}
      />
    </main>
  );
}
