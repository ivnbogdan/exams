/** Text normalisation helpers shared by the seed. Pure functions, no I/O. */
import type { AttachmentKind, Session } from "@/db/schema";

/** Lowercase, strip diacritics (ă â î ș ş ț ţ …), collapse whitespace. Used for matching. */
export function fold(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** ASCII slug for URLs and storage keys. */
export function slugify(s: string, max = 60): string {
  const out = fold(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
  return out || "x";
}

/** Title-case a person's name: "valentin cristea" -> "Valentin Cristea", keeps "B. Dumitrescu". */
export function normalizeProfessor(s: string | null | undefined): string | null {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  if (!t || t === "-" || t === "?") return null;
  const cap = (p: string) => (p ? p[0].toUpperCase() + p.slice(1).toLowerCase() : p);
  return t
    .split(" ")
    .map((w) => w.split("-").map((h) => h.split(".").map(cap).join(".")).join("-"))
    .join(" ");
}

export function mapSession(s: string | null | undefined): Session {
  const f = fold(s);
  if (f.startsWith("prima")) return "prima";
  if (f.includes("restant")) return "restante";
  if (f.startsWith("partial")) return "partial";
  return "altele";
}

export function nullIfBlank(s: string | null | undefined): string | null {
  const t = (s ?? "").trim();
  return t ? t : null;
}

export function extensionOf(name: string): string {
  const m = /\.([A-Za-z0-9]{1,5})$/.exec(name);
  return m ? m[1].toLowerCase() : "";
}

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "gif", "bmp"]);
const DOC_EXT = new Set(["doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt"]);
const ARCHIVE_EXT = new Set(["rar", "zip", "7z", "gz", "tar"]);

export function kindOf(ext: string): AttachmentKind {
  if (IMAGE_EXT.has(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (DOC_EXT.has(ext)) return "doc";
  if (ARCHIVE_EXT.has(ext) || /^0\d\d$/.test(ext)) return "archive";
  if (ext === "txt") return "text";
  return "other";
}

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  bmp: "image/bmp",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain; charset=utf-8",
  rar: "application/vnd.rar",
  zip: "application/zip",
};

export function mimeOf(ext: string): string {
  return MIME[ext] ?? "application/octet-stream";
}

/** Decode the handful of HTML entities the old site produced. */
export function decodeEntities(s: string): string {
  const named: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    "#39": "'",
  };
  return s
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (m, ent: string) => {
      const e = ent.toLowerCase();
      if (e in named) return named[e];
      if (e.startsWith("#x")) return String.fromCodePoint(parseInt(e.slice(2), 16));
      if (e.startsWith("#")) return String.fromCodePoint(parseInt(e.slice(1), 10));
      return m;
    })
    .replace(/ /g, " ");
}
