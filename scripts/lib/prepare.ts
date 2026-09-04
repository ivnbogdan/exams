/** Builds the in-memory model from the export, applying every rule in PLAN section 6. */
import { statSync } from "node:fs";
import { basename, join } from "node:path";
import sharp from "sharp";
import type { AttachmentKind, CourseLevel, Session } from "@/db/schema";
import { convertContent } from "./content";
import type { ExportData, ExportSubject } from "./export";
import {
  extensionOf,
  fold,
  kindOf,
  mapSession,
  mimeOf,
  normalizeProfessor,
  nullIfBlank,
  slugify,
} from "./normalize";

export interface PCourse {
  legacyId: number;
  name: string;
  slug: string;
  year: number;
  level: CourseLevel;
}

export interface PAttachment {
  subjectLegacyId: number;
  originalName: string;
  localPath: string; // absolute
  storageKey: string;
  webKey: string | null;
  thumbKey: string | null;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  kind: AttachmentKind;
  sortOrder: number;
}

export interface PSubject {
  legacyId: number;
  courseLegacyId: number;
  professor: string | null;
  examYear: number | null;
  session: Session;
  series: string | null;
  groupName: string | null;
  contentHtml: string;
  contentText: string;
  posterName: string | null;
  hidden: boolean;
  createdAt: Date;
  attachments: PAttachment[];
}

export interface Prepared {
  courses: PCourse[];
  subjects: PSubject[];
  counts: Record<string, number>;
}

export const EXPECTED: Record<string, number> = {
  courses: 88,
  subjects: 708,
  hidden: 45,
  attachments: 680,
  images: 400,
};

function isAC(s: ExportSubject): boolean {
  return fold(s.institutie).includes("politehnica") && fold(s.facultate).includes("automatica");
}

function uniqueSlug(base: string, taken: Set<string>, fallback: string): string {
  let slug = base;
  if (taken.has(slug)) slug = `${base}-${fallback}`;
  let i = 2;
  while (taken.has(slug)) slug = `${base}-${fallback}-${i++}`;
  taken.add(slug);
  return slug;
}

async function imageDims(path: string): Promise<{ width: number; height: number } | null> {
  try {
    const m = await sharp(path).metadata();
    if (!m.width || !m.height) return null;
    const swap = m.orientation !== undefined && m.orientation >= 5;
    return swap ? { width: m.height, height: m.width } : { width: m.width, height: m.height };
  } catch {
    return null;
  }
}

export async function prepare(data: ExportData, opts: { readImages: boolean }): Promise<Prepared> {
  // courses under AC faculties
  const acFaculties = new Map<string, CourseLevel>();
  for (const f of data.faculties) {
    const n = fold(f.nume);
    if (n.includes("automatica")) acFaculties.set(f.id, n.includes("master") ? "master" : "licenta");
  }
  const courseByFold = new Map<string, PCourse>();
  const takenSlugs = new Set<string>();
  for (const c of data.courses) {
    const level = acFaculties.get(c.id_parinte);
    if (!level) continue;
    const name = c.nume.replace(/\s+/g, " ").trim();
    const key = fold(name);
    if (courseByFold.has(key)) continue;
    courseByFold.set(key, {
      legacyId: Number(c.id),
      name,
      slug: uniqueSlug(slugify(name), takenSlugs, level === "master" ? "master" : `an-${c.an}`),
      year: Number(c.an) || 0,
      level,
    });
  }

  const extrasBySubject = new Map<string, typeof data.extraFiles>();
  for (const e of data.extraFiles) {
    const list = extrasBySubject.get(e.subject_id) ?? [];
    list.push(e);
    extrasBySubject.set(e.subject_id, list);
  }

  const usedCourses = new Set<number>();
  const subjects: PSubject[] = [];
  const misses: string[] = [];
  let attachmentsTotal = 0;
  let images = 0;

  for (const s of data.subjects) {
    if (!isAC(s)) continue;
    const course = courseByFold.get(fold(s.materie));
    if (!course) {
      misses.push(`${s.id}: ${s.materie}`);
      continue;
    }
    usedCourses.add(course.legacyId);
    const legacyId = Number(s.id);
    const { html, text } = convertContent(s.content);

    // attachments: DB rows that exist on disk, then the extra on-disk files
    const sources: { name: string; localRel: string; size: number | null }[] = [];
    for (const a of s.attachments) {
      if (a.status === "missing_on_server" || !a.local_path) continue;
      // The disk name is the real upload name; the DB name was mangled by the old site
      // (cut at '&', spaces as '+', broken accents), so it is never used.
      sources.push({ name: basename(a.local_path), localRel: a.local_path, size: a.size });
    }
    for (const e of extrasBySubject.get(s.id) ?? []) {
      sources.push({ name: basename(e.local_path), localRel: e.local_path, size: Number(e.size) || null });
    }

    const attachments: PAttachment[] = [];
    const keyTaken = new Set<string>();
    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];
      const localPath = join(data.dir, src.localRel);
      const ext = extensionOf(src.name);
      const kind = kindOf(ext);
      const size = src.size ?? statSync(localPath).size;
      const stem = slugify(src.name.replace(/\.[A-Za-z0-9]{1,5}$/, ""), 50);
      let base = `subjects/${legacyId}/${i + 1}-${stem}`;
      while (keyTaken.has(base)) base += "-x";
      keyTaken.add(base);
      const storageKey = ext ? `${base}.${ext}` : base;
      let dims: { width: number; height: number } | null = null;
      if (kind === "image") {
        images++;
        if (opts.readImages) dims = await imageDims(localPath);
      }
      attachments.push({
        subjectLegacyId: legacyId,
        originalName: src.name,
        localPath,
        storageKey,
        webKey: kind === "image" ? `${base}-web.webp` : null,
        thumbKey: kind === "image" ? `${base}-thumb.webp` : null,
        mime: mimeOf(ext),
        size,
        width: dims?.width ?? null,
        height: dims?.height ?? null,
        kind,
        sortOrder: i,
      });
    }
    attachmentsTotal += attachments.length;

    const hidden = attachments.length === 0 && text.length < 80;
    const examYear = Number(s.data_an);
    subjects.push({
      legacyId,
      courseLegacyId: course.legacyId,
      professor: normalizeProfessor(s.profesor),
      examYear: Number.isFinite(examYear) && examYear > 1990 ? examYear : null,
      session: mapSession(s.sesiune),
      series: nullIfBlank(s.serie),
      groupName: nullIfBlank(s.grupa),
      contentHtml: html,
      contentText: text,
      posterName: s.anonim === "1" ? null : nullIfBlank(s.user),
      hidden,
      createdAt: new Date(`${(s.data ?? "2011-01-01").trim()}T12:00:00Z`),
      attachments,
    });
  }

  if (misses.length) {
    throw new Error(`Subjects whose course could not be matched (expected none):\n${misses.join("\n")}`);
  }

  const courses = [...courseByFold.values()].filter((c) => usedCourses.has(c.legacyId));
  const counts = {
    courses: courses.length,
    coursesLicenta: courses.filter((c) => c.level === "licenta").length,
    coursesMaster: courses.filter((c) => c.level === "master").length,
    subjects: subjects.length,
    hidden: subjects.filter((s) => s.hidden).length,
    visible: subjects.filter((s) => !s.hidden).length,
    anonymous: subjects.filter((s) => s.posterName === null).length,
    attachments: attachmentsTotal,
    images,
    bytes: subjects.reduce((n, s) => n + s.attachments.reduce((m, a) => m + a.size, 0), 0),
  };
  return { courses, subjects, counts };
}
