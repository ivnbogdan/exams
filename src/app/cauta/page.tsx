import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchClient } from "@/components/search/search-client";

export const metadata: Metadata = {
  title: "Caută",
  description: "Caută subiecte de examen după materie, profesor, an sau conținut.",
};

/** Static shell; the client component reads the query string and searches the build-time index. */
export default function SearchPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Caută</h1>
      <Suspense fallback={<p className="text-black/60">Se încarcă…</p>}>
        <SearchClient />
      </Suspense>
    </div>
  );
}
