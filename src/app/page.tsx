import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { SubjectCard } from "@/components/subject-card";
import { roman } from "@/lib/format";
import { getCourses, getLatestSubjects, getStats } from "@/lib/queries";

export default async function HomePage() {
  const [courses, latest, stats] = await Promise.all([getCourses(), getLatestSubjects(12), getStats()]);
  const tiles = [1, 2, 3, 4].map((year) => ({
    href: `/an/${year}`,
    label: `An ${roman(year)}`,
    count: courses.filter((c) => c.level === "licenta" && c.year === year).length,
  }));
  tiles.push({ href: "/master", label: "Master", count: courses.filter((c) => c.level === "master").length });

  return (
    <div className="space-y-12">
      <section className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
        <BrandMark className="w-56 shrink-0" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subiectele de examen, la un loc.</h1>
          <p className="mt-2 max-w-xl text-black/70">
            Arhiva subiectelor de la Automatică și Calculatoare, Politehnica București: {stats.subjects} subiecte din {stats.courses} materii,
            cu {stats.files} fișiere atașate.
          </p>
        </div>
      </section>

      <section aria-labelledby="browse">
        <h2 id="browse" className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/60">
          Răsfoiește pe ani
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {tiles.map((t) => (
            <li key={t.href}>
              <Link href={t.href} className="block rounded-xl border border-black/10 bg-white p-4 text-center shadow-sm transition hover:shadow-md">
                <span className="block text-lg font-bold">{t.label}</span>
                <span className="text-sm text-black/60">{t.count} materii</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="latest">
        <h2 id="latest" className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/60">
          Ultimele subiecte adăugate
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((s) => (
            <SubjectCard key={s.id} subject={s} course={s.course} />
          ))}
        </div>
      </section>
    </div>
  );
}
