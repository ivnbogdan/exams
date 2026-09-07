import type { Metadata } from "next";
import Link from "next/link";
import type { Course } from "@/db/schema";
import { SubjectCard } from "@/components/subject-card";
import { yearLabel } from "@/lib/format";
import type { SubjectListItem } from "@/lib/queries";
import { levelUrl } from "@/lib/urls";

export type CourseWithSubjects = Course & { subjects: SubjectListItem[] };

export function courseMetadata(c: CourseWithSubjects): Metadata {
  return { title: c.name, description: `${c.subjects.length} subiecte de examen la ${c.name}, ${yearLabel(c.level, c.year)}.` };
}

export function CourseView({ course: c }: { course: CourseWithSubjects }) {
  const years = [...new Set(c.subjects.map((s) => s.examYear ?? 0))];
  return (
    <div>
      <p className="text-sm text-black/60">
        <Link href={levelUrl(c)} className="hover:underline">
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
