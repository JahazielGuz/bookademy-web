import Library from "@/components/Library";
import { requireJson } from "@/lib/api";
import type { DocumentSummary } from "@/lib/types";

export default async function LibraryPage() {
  const documents = await requireJson<DocumentSummary[]>("/api/documents/");

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Your library</h1>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="text-sm text-muted underline">
            Sign out
          </button>
        </form>
      </header>
      <Library initialDocuments={documents} />
    </main>
  );
}
