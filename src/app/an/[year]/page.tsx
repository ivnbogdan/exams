import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { roman } from "@/lib/format";
import { getCoursesFor } from "@/lib/queries";

export const dynamicParams = false;

export function generateStaticParams() {
  return [1, 2, 3, 4].map((year) => ({ year: String(year) }));
}

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }): Promise<Metadata> {
  const { year } = await params;
  return { title: `An ${roman(Number(year))}`, description: `Materiile din anul ${roman(Number(year))} și subiectele lor de examen.` };
}

export default async function YearPage({ params }: { params: Promise<{ year: string }> }) {
  const year = Number((await params).year);
  if (!(year >= 1 && year <= 4)) notFound();
  const courses = await getCoursesFor("licenta", year);
  return (
    <div>
      <h1 className="text-2xl font-bold">An {roman(year)}</h1>
      <p className="mt-1 text-black/60">{courses.length} materii cu subiecte</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <li key={c.id}>
            <Link href={`/curs/${c.slug}`} className="flex items-baseline justify-between gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 shadow-sm transition hover:shadow-md">
              <span className="font-semibold text-brand-green">{c.name}</span>
              <span className="shrink-0 text-sm text-black/50">{c.subjectCount}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
