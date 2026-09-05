import type { ReactNode } from "react";
import { highlighter } from "@/lib/search";

/** Wraps matched terms in <mark>. */
export function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const re = highlighter(terms);
  if (!re) return <>{text}</>;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    const start = m.index + m[1].length;
    out.push(text.slice(last, start));
    out.push(
      <mark key={i++} className="rounded bg-brand-orange/30 px-0.5">
        {m[2]}
      </mark>,
    );
    last = start + m[2].length;
    if (m[0].length === 0) re.lastIndex++;
  }
  out.push(text.slice(last));
  return <>{out}</>;
}
