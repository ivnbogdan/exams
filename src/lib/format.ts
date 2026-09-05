import type { AttachmentKind, CourseLevel, Session } from "@/db/schema";

export const SESSION_LABEL: Record<Session, string> = {
  prima: "Sesiune",
  restante: "Restanțe",
  partial: "Parțial",
  altele: "Altele",
};

export const SESSION_ORDER: Record<Session, number> = { prima: 0, restante: 1, partial: 2, altele: 3 };

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

export function roman(n: number): string {
  return ROMAN[n - 1] ?? String(n);
}

export function yearLabel(level: CourseLevel, year: number): string {
  return level === "master" ? `Master, an ${roman(year)}` : `An ${roman(year)}`;
}

export function levelLabel(level: CourseLevel): string {
  return level === "master" ? "Master" : "Licență";
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

export const KIND_LABEL: Record<AttachmentKind, string> = {
  image: "imagine",
  pdf: "PDF",
  doc: "document",
  archive: "arhivă",
  text: "text",
  other: "fișier",
};

/** "Analiza Algoritmilor · 2015 · Sesiune" */
export function subjectTitle(course: string, examYear: number | null, session: Session): string {
  return [course, examYear ? String(examYear) : null, SESSION_LABEL[session]].filter(Boolean).join(" · ");
}
