import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { getCourses, getSubjectRefs } from "@/lib/queries";
import { courseUrl, subjectUrl } from "@/lib/urls";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl;
  const [courses, refs] = await Promise.all([getCourses(), getSubjectRefs()]);
  return [
    { url: `${base}/`, priority: 1 },
    ...[1, 2, 3, 4].map((y) => ({ url: `${base}/an/${y}`, priority: 0.8 })),
    { url: `${base}/master`, priority: 0.8 },
    ...courses.map((c) => ({ url: `${base}${courseUrl(c)}`, priority: 0.7 })),
    ...refs.map((r) => ({ url: `${base}${subjectUrl(r, r.id)}`, priority: 0.5 })),
  ];
}
