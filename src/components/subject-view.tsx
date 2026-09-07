import type { Metadata } from "next";
import Link from "next/link";
import { Attachments } from "@/components/attachments";
import { SESSION_LABEL, formatDate, subjectTitle, yearLabel } from "@/lib/format";
import type { SubjectFull } from "@/lib/queries";
import { courseUrl, levelUrl } from "@/lib/urls";

export function subjectMetadata(s: SubjectFull): Metadata {
  const title = subjectTitle(s.course.name, s.examYear, s.session);
  return { title, description: s.contentText.slice(0, 160) || `Subiect de examen la ${s.course.name}.` };
}

export function SubjectView({ subject: s }: { subject: SubjectFull }) {
  const label = subjectTitle(s.course.name, s.examYear, s.session);
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
        <Link href={levelUrl(s.course)} className="hover:underline">
          {yearLabel(s.course.level, s.course.year)}
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href={courseUrl(s.course)} className="hover:underline">
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
      {s.lostFiles > 0 && (
        <p className="mt-6 rounded-xl border border-brand-orange/40 bg-brand-orange/10 p-4 text-sm" role="note">
          Acest subiect avea {s.lostFiles} {s.lostFiles === 1 ? "fișier atașat" : "fișiere atașate"} pe vechiul site, dar{" "}
          {s.lostFiles === 1 ? "s-a pierdut" : "s-au pierdut"} din cauza unei defecțiuni a vechiului server, înainte de mutare.
          {s.attachments.length > 0 ? " Fișierele de mai jos sunt cele care s-au păstrat." : ""}
        </p>
      )}
      <Attachments attachments={s.attachments} subjectLabel={label} />
    </article>
  );
}
