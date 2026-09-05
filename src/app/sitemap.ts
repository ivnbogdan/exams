import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { getCourseSlugs, getVisibleSubjectIds } from "@/lib/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl;
  const [slugs, ids] = await Promise.all([getCourseSlugs(), getVisibleSubjectIds()]);
  return [
    { url: `${base}/`, priority: 1 },
    ...[1, 2, 3, 4].map((y) => ({ url: `${base}/an/${y}`, priority: 0.8 })),
    { url: `${base}/master`, priority: 0.8 },
    ...slugs.map((s) => ({ url: `${base}/curs/${s}`, priority: 0.7 })),
    ...ids.map((id) => ({ url: `${base}/subiect/${id}`, priority: 0.5 })),
  ];
}
