
import AppHeader from "@/components/AppHeader";
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
    <main>
      <AppHeader backHref="/library" backLabel="Library" />
      <div className="mx-auto max-w-6xl px-6 pb-20">
      <CourseView
        documentId={Number(documentId)}
        initialDocument={document}
        initialSyllabus={syllabus}
      />
      </div>
    </main>
  );
}
