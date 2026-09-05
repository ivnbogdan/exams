import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Attachments } from "@/components/attachments";
import { SESSION_LABEL, formatDate, subjectTitle, yearLabel } from "@/lib/format";
import { getSubject, getVisibleSubjectIds } from "@/lib/queries";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getVisibleSubjectIds()).map((id) => ({ id: String(id) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const s = await getSubject(Number((await params).id));
  if (!s) return {};
  const title = subjectTitle(s.course.name, s.examYear, s.session);
  return { title, description: s.contentText.slice(0, 160) || `Subiect de examen la ${s.course.name}.` };
}

export default async function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await getSubject(Number((await params).id));
  if (!s) notFound();
  const label = subjectTitle(s.course.name, s.examYear, s.session);
  const parentHref = s.course.level === "master" ? "/master" : `/an/${s.course.year}`;
  const facts: [string, string][] = [
    ["Profesor", s.professor ?? "necunoscut"],
    ["Anul examenului", s.examYear ? String(s.examYear) : "necunoscut"],
    ["Sesiune", SESSION_LABEL[s.session]],
  ];
  if (s.series) facts.push(["Serie", s.series]);
  if (s.groupName) facts.push(["Grupă", s.groupName]);
  facts.push(["Adăugat", `${formatDate(s.createdAt)} de ${s.posterName ?? "anonim"}`]);

  return (
    <article>
      <nav aria-label="Navigare" className="text-sm text-black/60">
        <Link href={parentHref} className="hover:underline">
          {yearLabel(s.course.level, s.course.year)}
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href={`/curs/${s.course.slug}`} className="hover:underline">
          {s.course.name}
        </Link>
      </nav>
      <h1 className="mt-2 text-2xl font-bold">
        <span className="text-brand-green">{s.course.name}</span>
        {s.examYear && <span className="text-brand-orange"> · {s.examYear}</span>}
        <span className="text-black/60"> · {SESSION_LABEL[s.session]}</span>
      </h1>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt className="text-black/50">{k}</dt>
            <dd className={k === "Profesor" ? "font-medium text-brand-teal" : "font-medium"}>{v}</dd>
          </div>
        ))}
      </dl>
      {s.contentHtml && (
        <div className="subject-content mt-6 rounded-xl border border-black/10 bg-white p-5 text-[15px]" dangerouslySetInnerHTML={{ __html: s.contentHtml }} />
      )}
      <Attachments attachments={s.attachments} subjectLabel={label} />
    </article>
  );
}
