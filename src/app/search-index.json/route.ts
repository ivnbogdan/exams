import { getSearchDocs } from "@/lib/queries";

/** Static search index, generated at build (docs/PLAN.md section 8). */
export const dynamic = "force-static";

export async function GET() {
  const docs = await getSearchDocs();
  return Response.json(docs, {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
