/**
 * Browser-side search (docs/PLAN.md section 8). Client-safe: no database, no Node APIs.
 * The index document shape is shared with the /search-index.json route.
 */
import MiniSearch from "minisearch";

export interface SearchDoc {
  id: number;
  course: string;
  courseSlug: string;
  professor: string;
  year: number | null;
  session: string;
  series: string;
  group: string;
  text: string;
  date: string;
  files: number;
}

export interface Filters {
  course?: string; // courseSlug
  year?: number;
  session?: string;
  professor?: string;
  group?: string;
  series?: string;
}

export const SESSION_TEXT: Record<string, string> = {
  prima: "prima sesiune sesiunea",
  restante: "restante restanțe restanta",
  partial: "partial parțial",
  altele: "altele favorite",
};

export const SESSION_LABEL: Record<string, string> = { prima: "Sesiune", restante: "Restanțe", partial: "Parțial", altele: "Altele" };

/** Lowercase and strip diacritics: "Sinteză elementară" -> "sinteza elementara". */
export function fold(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function processTerm(term: string): string | null {
  const t = fold(term).replace(/[^a-z0-9]+/g, "");
  return t.length >= 2 ? t : null;
}

type IndexedDoc = SearchDoc & { sessionText: string; yearText: string };

export type Index = { ms: MiniSearch<IndexedDoc>; docs: Map<number, SearchDoc>; all: SearchDoc[] };

export function buildIndex(docs: SearchDoc[]): Index {
  const ms = new MiniSearch<IndexedDoc>({
    fields: ["course", "professor", "text", "sessionText", "series", "group", "yearText"],
    storeFields: ["id"],
    processTerm,
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      boost: { course: 4, professor: 3, group: 2, series: 2, sessionText: 2, yearText: 2, text: 1 },
    },
  });
  ms.addAll(docs.map((d) => ({ ...d, sessionText: SESSION_TEXT[d.session] ?? d.session, yearText: d.year ? String(d.year) : "" })));
  return { ms, docs: new Map(docs.map((d) => [d.id, d])), all: docs };
}

/** Pulls structured hints out of free text: a year, a group like 321CA, a session word. */
export function parseQuery(q: string): { text: string; hints: Filters } {
  const hints: Filters = {};
  const rest: string[] = [];
  for (const tok of q.trim().split(/\s+/).filter(Boolean)) {
    const f = fold(tok);
    const group = /^(\d{3})([a-z]{1,2})?$/.exec(f);
    if (/^(19|20)\d{2}$/.test(f)) hints.year = Number(f);
    else if (group) {
      hints.group = group[1];
      if (group[2]) hints.series = group[2].toUpperCase();
    } else if (f.startsWith("restant")) hints.session = "restante";
    else if (f.startsWith("partial")) hints.session = "partial";
    else rest.push(tok);
  }
  return { text: rest.join(" "), hints };
}

function matchesFilters(d: SearchDoc, f: Filters): boolean {
  if (f.course && d.courseSlug !== f.course) return false;
  if (f.year && d.year !== f.year) return false;
  if (f.session && d.session !== f.session) return false;
  if (f.professor && fold(d.professor) !== fold(f.professor)) return false;
  if (f.group && !fold(d.group).startsWith(f.group)) return false;
  if (f.series && fold(d.series) !== fold(f.series)) return false;
  return true;
}

export interface Hit {
  doc: SearchDoc;
  score: number;
  terms: string[];
}

/** Runs the query: AND first, OR when AND finds nothing; empty text lists everything newest first. */
export function runSearch(index: Index, q: string, filters: Filters): { hits: Hit[]; text: string } {
  const { text, hints } = parseQuery(q);
  const f: Filters = { ...hints, ...filters };
  let hits: Hit[];
  if (text.trim()) {
    let results = index.ms.search(text, { combineWith: "AND" });
    if (results.length === 0) results = index.ms.search(text, { combineWith: "OR" });
    hits = results.flatMap((r) => {
      const doc = index.docs.get(r.id as number);
      return doc ? [{ doc, score: r.score, terms: r.terms }] : [];
    });
  } else {
    hits = index.all.map((doc) => ({ doc, score: 0, terms: [] }));
  }
  return { hits: hits.filter((h) => matchesFilters(h.doc, f)), text };
}

export interface Facet {
  value: string;
  label: string;
  count: number;
}

export function facets(hits: Hit[]) {
  const count = (get: (d: SearchDoc) => string | null, label: (v: string) => string = (v) => v, limit = 12): Facet[] => {
    const m = new Map<string, number>();
    for (const h of hits) {
      const v = get(h.doc);
      if (v) m.set(v, (m.get(v) ?? 0) + 1);
    }
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit)
      .map(([value, c]) => ({ value, label: label(value), count: c }));
  };
  const courseNames = new Map(hits.map((h) => [h.doc.courseSlug, h.doc.course]));
  return {
    course: count(
      (d) => d.courseSlug,
      (v) => courseNames.get(v) ?? v,
    ),
    year: count((d) => (d.year ? String(d.year) : null)).sort((a, b) => Number(b.value) - Number(a.value)),
    session: count(
      (d) => d.session,
      (v) => SESSION_LABEL[v] ?? v,
    ),
    professor: count((d) => d.professor || null),
  };
}

const ACCENT: Record<string, string> = { a: "[aăâ]", i: "[iî]", s: "[sșş]", t: "[tțţ]" };

/** Regex that matches any of the query terms as word prefixes, ignoring diacritics. */
export function highlighter(terms: string[]): RegExp | null {
  const parts = terms
    .map((t) => fold(t).replace(/[^a-z0-9]/g, ""))
    .filter((t) => t.length >= 2)
    .map((t) =>
      t
        .split("")
        .map((c) => ACCENT[c] ?? c)
        .join(""),
    );
  if (!parts.length) return null;
  return new RegExp(`(^|[^\\p{L}\\p{N}])((?:${parts.join("|")})[\\p{L}\\p{N}]*)`, "giu");
}

/** A window of the text around the first matched term. */
export function snippet(text: string, terms: string[], width = 180): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const re = highlighter(terms);
  const m = re ? re.exec(clean) : null;
  if (!m) return clean.length > width ? clean.slice(0, width) + "…" : clean;
  const start = Math.max(0, m.index - Math.floor(width / 3));
  const end = Math.min(clean.length, start + width);
  return (start > 0 ? "…" : "") + clean.slice(start, end) + (end < clean.length ? "…" : "");
}
