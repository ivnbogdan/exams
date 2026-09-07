import { notFound, permanentRedirect } from "next/navigation";
import { getSubject, getVisibleSubjectIds } from "@/lib/queries";
import { subjectUrl } from "@/lib/urls";

/** Former subject address; redirects to the hierarchical URL. */
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getVisibleSubjectIds()).map((id) => ({ id: String(id) }));
}

export default async function LegacySubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const s = await getSubject(id);
  if (!s) notFound();
  permanentRedirect(subjectUrl(s.course, id));
}
