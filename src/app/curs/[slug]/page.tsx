import { notFound, permanentRedirect } from "next/navigation";
import { getCourseBySlug, getCourseSlugs } from "@/lib/queries";
import { courseUrl } from "@/lib/urls";

/** Former course address; redirects to the hierarchical URL. */
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getCourseSlugs()).map((slug) => ({ slug }));
}

export default async function LegacyCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const c = await getCourseBySlug((await params).slug);
  if (!c) notFound();
  permanentRedirect(courseUrl(c));
}
