import Link from "next/link";
import type { Course } from "@/db/schema";
import type { SubjectListItem } from "@/lib/queries";
import { SESSION_LABEL, formatDate } from "@/lib/format";
import { courseUrl, subjectUrl } from "@/lib/urls";

export function SubjectCard({ subject, course }: { subject: SubjectListItem; course: Pick<Course, "name" | "slug" | "year" | "level"> }) {
  const href = subjectUrl(course, subject.legacyId ?? subject.id);
  const place = subject.groupName && subject.series && subject.groupName !== subject.series ? `${subject.groupName} ${subject.series}` : subject.groupName || subject.series;
  const meta = [subject.examYear, SESSION_LABEL[subject.session], place].filter(Boolean).join(" · ");
  return (
    <article className="relative rounded-xl border border-line bg-card p-4 shadow-sm transition hover:shadow-md">
      <p className="text-sm font-semibold text-brand-green-strong">
        <Link href={courseUrl(course)} className="hover:underline">
          {course.name}
        </Link>
      </p>
      <h3 className="mt-1 text-base font-semibold leading-snug">
        <Link href={href} className="after:absolute after:inset-0">
          <span className="text-brand-teal">{subject.professor ?? "profesor necunoscut"}</span>
        </Link>
      </h3>
      <p className="mt-1 text-sm text-brand-orange-strong">{meta}</p>
      <p className="mt-2 line-clamp-3 text-sm text-soft">{subject.contentText}</p>
      <p className="mt-3 flex flex-wrap gap-x-3 text-xs text-faint">
        <span>{formatDate(subject.createdAt)}</span>
        {subject.attachmentCount > 0 && (
          <span>
            {subject.attachmentCount} {subject.attachmentCount === 1 ? "fișier" : "fișiere"}
            {subject.imageCount > 0 ? `, ${subject.imageCount} ${subject.imageCount === 1 ? "imagine" : "imagini"}` : ""}
          </span>
        )}
        {subject.lostFiles > 0 && (
          <span className="text-brand-orange-strong">
            {subject.lostFiles} {subject.lostFiles === 1 ? "fișier pierdut" : "fișiere pierdute"}
          </span>
        )}
      </p>
    </article>
  );
}
