import Link from "next/link";
import type { Course } from "@/db/schema";
import type { SubjectListItem } from "@/lib/queries";
import { SESSION_LABEL, formatDate } from "@/lib/format";

export function SubjectCard({ subject, course }: { subject: SubjectListItem; course: Pick<Course, "name" | "slug"> }) {
  const href = `/subiect/${subject.legacyId ?? subject.id}`;
  const meta = [subject.examYear, SESSION_LABEL[subject.session], subject.series, subject.groupName].filter(Boolean).join(" · ");
  return (
    <article className="relative rounded-xl border border-black/10 bg-white p-4 shadow-sm transition hover:shadow-md">
      <p className="text-sm font-semibold text-brand-green">
        <Link href={`/curs/${course.slug}`} className="hover:underline">
          {course.name}
        </Link>
      </p>
      <h3 className="mt-1 text-base font-semibold leading-snug">
        <Link href={href} className="after:absolute after:inset-0">
          <span className="text-brand-teal">{subject.professor ?? "profesor necunoscut"}</span>
        </Link>
      </h3>
      <p className="mt-1 text-sm text-brand-orange">{meta}</p>
      <p className="mt-2 line-clamp-3 text-sm text-black/70">{subject.contentText}</p>
      <p className="mt-3 flex flex-wrap gap-x-3 text-xs text-black/50">
        <span>{formatDate(subject.createdAt)}</span>
        {subject.attachmentCount > 0 && (
          <span>
            {subject.attachmentCount} {subject.attachmentCount === 1 ? "fișier" : "fișiere"}
            {subject.imageCount > 0 ? `, ${subject.imageCount} ${subject.imageCount === 1 ? "imagine" : "imagini"}` : ""}
          </span>
        )}
      </p>
    </article>
  );
}
