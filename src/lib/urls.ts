/** Every internal link is built here so the URL scheme lives in one place. */
import type { CourseLevel } from "@/db/schema";

export interface CourseRef {
  slug: string;
  year: number;
  level: CourseLevel;
}

/** "/an/2" or "/master" */
export function levelUrl(c: Pick<CourseRef, "year" | "level">): string {
  return c.level === "master" ? "/master" : `/an/${c.year}`;
}

/** "/an/2/baze-de-date-1" or "/master/calcul-cluster-si-grid" */
export function courseUrl(c: CourseRef): string {
  return `${levelUrl(c)}/${c.slug}`;
}

/** "/an/2/baze-de-date-1/15" */
export function subjectUrl(c: CourseRef, id: number): string {
  return `${courseUrl(c)}/${id}`;
}
