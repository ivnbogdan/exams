import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SubjectCard } from "@/components/subject-card";
import { yearLabel } from "@/lib/format";
import { getCourseBySlug, getCourseSlugs } from "@/lib/queries";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getCourseSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await getCourseBySlug((await params).slug);
  if (!c) return {};
  return { title: c.name, description: `${c.subjects.length} subiecte de examen la ${c.name}, ${yearLabel(c.level, c.year)}.` };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const c = await getCourseBySlug((await params).slug);
  if (!c) notFound();
  const years = [...new Set(c.subjects.map((s) => s.examYear ?? 0))];
  const parentHref = c.level === "master" ? "/master" : `/an/${c.year}`;
  return (
    <div>
      <p className="text-sm text-black/60">
        <Link href={parentHref} className="hover:underline">
          {yearLabel(c.level, c.year)}
        </Link>
      </p>
      <h1 className="mt-1 text-2xl font-bold text-brand-green">{c.name}</h1>
      <p className="mt-1 text-black/60">{c.subjects.length} subiecte</p>
      {years.map((y) => (
        <section key={y} className="mt-8" aria-labelledby={`y-${y}`}>
          <h2 id={`y-${y}`} className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-orange">
            {y || "An necunoscut"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.subjects
              .filter((s) => (s.examYear ?? 0) === y)
              .map((s) => (
                <SubjectCard key={s.id} subject={s} course={c} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
