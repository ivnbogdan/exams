/** All database reads. Server components, route handlers and scripts only (docs/PLAN.md section 7). */
import { cache } from "react";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { attachment, course, subject } from "@/db/schema";
import type { Attachment, Course, CourseLevel, Subject } from "@/db/schema";
import { db } from "@/lib/db";
import { SESSION_ORDER } from "@/lib/format";
import type { SearchDoc } from "@/lib/search";

export type { SearchDoc };

export type CourseWithCount = Course & { subjectCount: number };
export type SubjectListItem = Subject & { attachmentCount: number; imageCount: number };
export type SubjectWithCourse = SubjectListItem & { course: Course };
export type SubjectFull = Subject & { course: Course; attachments: Attachment[] };

const visible = eq(subject.hidden, false);
const attachmentCount = sql<number>`count(${attachment.id})::int`;
const imageCount = sql<number>`(count(${attachment.id}) filter (where ${attachment.kind} = 'image'))::int`;

function sortSubjects<T extends Subject>(rows: T[]): T[] {
  return rows.sort(
    (a, b) =>
      (b.examYear ?? 0) - (a.examYear ?? 0) ||
      SESSION_ORDER[a.session] - SESSION_ORDER[b.session] ||
      b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

/** Every course with the number of visible subjects. Courses without visible subjects are excluded. */
export const getCourses = cache(async (): Promise<CourseWithCount[]> => {
  const rows = await db()
    .select({ course, subjectCount: sql<number>`count(${subject.id})::int` })
    .from(course)
    .leftJoin(subject, and(eq(subject.courseId, course.id), visible))
    .groupBy(course.id)
    .orderBy(asc(course.level), asc(course.year), asc(course.name));
  return rows.map((r) => ({ ...r.course, subjectCount: r.subjectCount })).filter((c) => c.subjectCount > 0);
});

export const getCoursesFor = cache(async (level: CourseLevel, year?: number): Promise<CourseWithCount[]> => {
  const all = await getCourses();
  return all.filter((c) => c.level === level && (year === undefined || c.year === year));
});

export const getCourseBySlug = cache(async (slug: string): Promise<(Course & { subjects: SubjectListItem[] }) | null> => {
  const c = await db().query.course.findFirst({ where: eq(course.slug, slug) });
  if (!c) return null;
  const rows = await db()
    .select({ subject, attachmentCount, imageCount })
    .from(subject)
    .leftJoin(attachment, eq(attachment.subjectId, subject.id))
    .where(and(eq(subject.courseId, c.id), visible))
    .groupBy(subject.id);
  const subjects = sortSubjects(rows.map((r) => ({ ...r.subject, attachmentCount: r.attachmentCount, imageCount: r.imageCount })));
  return { ...c, subjects };
});

/** A visible subject by its public id (the legacy id), with course and ordered attachments. */
export const getSubject = cache(async (legacyId: number): Promise<SubjectFull | null> => {
  if (!Number.isInteger(legacyId)) return null;
  const s = await db().query.subject.findFirst({
    where: and(eq(subject.legacyId, legacyId), visible),
    with: { course: true, attachments: { orderBy: (a, { asc: up }) => [up(a.sortOrder), up(a.id)] } },
  });
  return s ?? null;
});

export const getLatestSubjects = cache(async (limit: number): Promise<SubjectWithCourse[]> => {
  const rows = await db()
    .select({ subject, course, attachmentCount, imageCount })
    .from(subject)
    .innerJoin(course, eq(course.id, subject.courseId))
    .leftJoin(attachment, eq(attachment.subjectId, subject.id))
    .where(visible)
    .groupBy(subject.id, course.id)
    .orderBy(desc(subject.createdAt), desc(subject.id))
    .limit(limit);
  return rows.map((r) => ({ ...r.subject, course: r.course, attachmentCount: r.attachmentCount, imageCount: r.imageCount }));
});

export const getStats = cache(async (): Promise<{ subjects: number; courses: number; files: number }> => {
  const [row] = await db()
    .select({
      subjects: sql<number>`count(distinct ${subject.id})::int`,
      courses: sql<number>`count(distinct ${subject.courseId})::int`,
      files: sql<number>`count(${attachment.id})::int`,
    })
    .from(subject)
    .leftJoin(attachment, eq(attachment.subjectId, subject.id))
    .where(visible);
  return row;
});

export const getVisibleSubjectIds = cache(async (): Promise<number[]> => {
  const rows = await db().select({ id: subject.legacyId }).from(subject).where(visible).orderBy(asc(subject.legacyId));
  return rows.map((r) => r.id).filter((id): id is number => id !== null);
});

export const getCourseSlugs = cache(async (): Promise<string[]> => (await getCourses()).map((c) => c.slug));

export const getSearchDocs = cache(async (): Promise<SearchDoc[]> => {
  const rows = await db()
    .select({ subject, course, attachmentCount })
    .from(subject)
    .innerJoin(course, eq(course.id, subject.courseId))
    .leftJoin(attachment, eq(attachment.subjectId, subject.id))
    .where(visible)
    .groupBy(subject.id, course.id)
    .orderBy(desc(subject.createdAt));
  return rows
    .filter((r) => r.subject.legacyId !== null)
    .map((r) => ({
      id: r.subject.legacyId as number,
      course: r.course.name,
      courseSlug: r.course.slug,
      professor: r.subject.professor ?? "",
      year: r.subject.examYear,
      session: r.subject.session,
      series: r.subject.series ?? "",
      group: r.subject.groupName ?? "",
      text: r.subject.contentText.slice(0, 3000),
      date: r.subject.createdAt.toISOString().slice(0, 10),
      files: r.attachmentCount,
    }));
});
