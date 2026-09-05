"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Highlight } from "@/components/search/highlight";
import { loadIndex } from "@/lib/search-loader";
import { facets, runSearch, SESSION_LABEL, snippet, type Filters, type Index } from "@/lib/search";

const PAGE = 20;

type FacetKey = "course" | "year" | "session" | "professor";

export function SearchClient() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [index, setIndex] = useState<Index | null>(null);
  const [error, setError] = useState<string | null>(null);

  const q = params.get("q") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const filters: Filters = useMemo(
    () => ({
      course: params.get("course") ?? undefined,
      year: params.get("year") ? Number(params.get("year")) : undefined,
      session: params.get("session") ?? undefined,
      professor: params.get("professor") ?? undefined,
    }),
    [params],
  );

  useEffect(() => {
    loadIndex()
      .then(setIndex)
      .catch((e: Error) => setError(e.message));
  }, []);

  const result = useMemo(() => (index ? runSearch(index, q, filters) : null), [index, q, filters]);
  const fac = useMemo(() => (result ? facets(result.hits) : null), [result]);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  function setPage(p: number) {
    const next = new URLSearchParams(params.toString());
    if (p <= 1) next.delete("page");
    else next.set("page", String(p));
    router.replace(`${pathname}?${next.toString()}`);
  }

  const active = (Object.entries(filters) as [FacetKey, string | number | undefined][]).filter(([, v]) => v !== undefined);
  const hits = result?.hits ?? [];
  const pages = Math.max(1, Math.ceil(hits.length / PAGE));
  const slice = hits.slice((page - 1) * PAGE, page * PAGE);
  const terms = result && result.text ? result.text.split(/\s+/) : [];

  const facetGroups: { key: FacetKey; title: string }[] = [
    { key: "course", title: "Materie" },
    { key: "year", title: "Anul examenului" },
    { key: "session", title: "Sesiune" },
    { key: "professor", title: "Profesor" },
  ];

  function activeLabel(key: FacetKey, v: string | number | undefined): string {
    if (key === "session") return SESSION_LABEL[String(v)] ?? String(v);
    if (key === "course") return fac?.course.find((f) => f.value === v)?.label ?? String(v);
    return String(v);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      <aside aria-label="Filtre" className="space-y-6 text-sm">
        {active.length > 0 && (
          <div>
            <h2 className="mb-2 font-semibold uppercase tracking-wide text-black/60">Filtre active</h2>
            <ul className="flex flex-wrap gap-2">
              {active.map(([k, v]) => (
                <li key={k}>
                  <button
                    type="button"
                    onClick={() => setParam(k, null)}
                    className="rounded-full bg-ink px-3 py-1 text-white hover:bg-black"
                    aria-label={`Elimină filtrul ${activeLabel(k, v)}`}
                  >
                    {activeLabel(k, v)} ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {fac &&
          facetGroups.map(({ key, title }) => {
            const list = fac[key];
            if (list.length === 0 || (list.length === 1 && filters[key] !== undefined)) return null;
            return (
              <div key={key}>
                <h2 className="mb-2 font-semibold uppercase tracking-wide text-black/60">{title}</h2>
                <ul className="space-y-1">
                  {list.map((f) => {
                    const selected = String(filters[key] ?? "") === f.value;
                    return (
                      <li key={f.value}>
                        <button
                          type="button"
                          onClick={() => setParam(key, selected ? null : f.value)}
                          className={`flex w-full items-center justify-between rounded px-2 py-1 text-left hover:bg-black/5 ${selected ? "bg-black/10 font-semibold" : ""}`}
                        >
                          <span className="truncate">{f.label}</span>
                          <span className="ml-2 shrink-0 text-black/50">{f.count}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
      </aside>

      <section aria-live="polite">
        {error && <p className="text-brand-red">Căutarea nu a putut fi încărcată: {error}</p>}
        {!index && !error && <p className="text-black/60">Se încarcă indexul…</p>}
        {result && (
          <p className="mb-4 text-sm text-black/60">
            {hits.length === 0 ? "Niciun rezultat" : hits.length === 1 ? "1 rezultat" : `${hits.length} rezultate`}
            {q ? ` pentru „${q}”` : ""}
          </p>
        )}
        <ol className="space-y-4">
          {slice.map((h) => (
            <li key={h.doc.id} className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
              <p className="text-sm">
                <Link href={`/curs/${h.doc.courseSlug}`} className="font-semibold text-brand-green hover:underline">
                  <Highlight text={h.doc.course} terms={terms} />
                </Link>
                <span className="text-black/60">
                  {" "}
                  ·{" "}
                  <span className="text-brand-teal">
                    <Highlight text={h.doc.professor || "profesor necunoscut"} terms={terms} />
                  </span>{" "}
                  ·{" "}
                  <span className="text-brand-orange">
                    {h.doc.year ?? ""} {SESSION_LABEL[h.doc.session]}
                  </span>
                  {h.doc.group ? ` · ${h.doc.group}${h.doc.series}` : ""}
                </span>
              </p>
              <Link href={`/subiect/${h.doc.id}`} className="mt-1 block text-[15px] leading-relaxed hover:underline">
                <Highlight text={snippet(h.doc.text, terms)} terms={terms} />
              </Link>
              <p className="mt-2 text-xs text-black/50">
                {h.doc.date}
                {h.doc.files ? ` · ${h.doc.files} ${h.doc.files === 1 ? "fișier" : "fișiere"}` : ""}
              </p>
            </li>
          ))}
        </ol>
        {pages > 1 && (
          <nav aria-label="Paginare" className="mt-6 flex items-center justify-between text-sm">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md border border-black/15 px-3 py-1.5 disabled:opacity-40">
              ← Anterioare
            </button>
            <span className="text-black/60">
              Pagina {page} din {pages}
            </span>
            <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded-md border border-black/15 px-3 py-1.5 disabled:opacity-40">
              Următoarele →
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
