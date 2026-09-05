"use client";

import { buildIndex, type Index, type SearchDoc } from "@/lib/search";

let pending: Promise<Index> | null = null;

/** Fetches /search-index.json once per page load and builds the MiniSearch index. */
export function loadIndex(): Promise<Index> {
  pending ??= fetch("/search-index.json")
    .then((r) => {
      if (!r.ok) throw new Error(`search index: HTTP ${r.status}`);
      return r.json() as Promise<SearchDoc[]>;
    })
    .then(buildIndex)
    .catch((e) => {
      pending = null;
      throw e;
    });
  return pending;
}
