import AppHeader from "@/components/AppHeader";
import Library from "@/components/Library";
import { requireJson } from "@/lib/api";
import type { DocumentSummary } from "@/lib/types";

export default async function LibraryPage() {
  const documents = await requireJson<DocumentSummary[]>("/api/documents/");

  return (
    <main>
      <AppHeader>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="text-header-muted hover:text-header-text">
            Sign out
          </button>
        </form>
      </AppHeader>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="mb-8 text-2xl font-semibold">Your library</h1>
        <Library initialDocuments={documents} />
      </div>
    </main>
  );
}
