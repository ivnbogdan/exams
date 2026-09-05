import type { Metadata } from "next";
import Link from "next/link";
import { roman } from "@/lib/format";
import { getCoursesFor } from "@/lib/queries";

export const metadata: Metadata = { title: "Master", description: "Materiile de master și subiectele lor de examen." };

export default async function MasterPage() {
  const courses = await getCoursesFor("master");
  return (
    <div>
      <h1 className="text-2xl font-bold">Master</h1>
      <p className="mt-1 text-black/60">{courses.length} materii cu subiecte</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <li key={c.id}>
            <Link href={`/curs/${c.slug}`} className="flex items-baseline justify-between gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 shadow-sm transition hover:shadow-md">
              <span className="font-semibold text-brand-green">{c.name}</span>
              <span className="shrink-0 text-sm text-black/50">an {roman(c.year)} · {c.subjectCount}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
