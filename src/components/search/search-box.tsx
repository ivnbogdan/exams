"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { loadIndex } from "@/lib/search-loader";
import { runSearch, SESSION_LABEL, type Hit } from "@/lib/search";

/** Header search: a plain form for no-JS, with a quick-results dropdown once the index is loaded. */
export function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const box = useRef<HTMLDivElement>(null);

  function onQueryChange(value: string) {
    setQ(value);
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setHits([]);
      return;
    }
    timer.current = setTimeout(() => {
      loadIndex()
        .then((index) => setHits(runSearch(index, value, {}).hits.slice(0, 6)))
        .catch(() => setHits([]));
    }, 150);
  }

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div ref={box} className="relative ml-auto w-full max-w-md sm:w-auto">
      <form
        action="/cauta"
        role="search"
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setOpen(false);
          router.push(`/cauta?q=${encodeURIComponent(q.trim())}`);
        }}
      >
        <label htmlFor="q" className="sr-only">
          Caută subiecte
        </label>
        <input
          id="q"
          name="q"
          type="search"
          value={q}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Caută materie, profesor, subiect…"
          autoComplete="off"
          className="w-full rounded-md border border-black/15 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30"
        />
        <button type="submit" className="rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-black">
          Caută
        </button>
      </form>
      {open && hits.length > 0 && (
        <ul className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-md border border-black/10 bg-white shadow-lg">
          {hits.map((h) => (
            <li key={h.doc.id}>
              <Link href={`/subiect/${h.doc.id}`} onClick={() => setOpen(false)} className="block px-3 py-2 text-sm hover:bg-black/5">
                <span className="font-semibold text-brand-green">{h.doc.course}</span>
                <span className="text-black/60">
                  {" "}
                  · {h.doc.professor || "profesor necunoscut"} · {h.doc.year ?? ""} {SESSION_LABEL[h.doc.session]}
                </span>
              </Link>
            </li>
          ))}
          <li className="border-t border-black/10">
            <Link
              href={`/cauta?q=${encodeURIComponent(q.trim())}`}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-brand-teal hover:bg-black/5"
            >
              Toate rezultatele pentru „{q.trim()}”
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}
