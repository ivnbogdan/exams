import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SubjectView, subjectMetadata } from "@/components/subject-view";
import { getSubject, getSubjectRefs } from "@/lib/queries";

export const dynamicParams = false;

type Params = Promise<{ year: string; course: string; id: string }>;

export async function generateStaticParams() {
  return (await getSubjectRefs())
    .filter((r) => r.level === "licenta")
    .map((r) => ({ year: String(r.year), course: r.slug, id: String(r.id) }));
}

async function load({ year, course, id }: Awaited<Params>) {
  const s = await getSubject(Number(id));
  return s && s.course.level === "licenta" && String(s.course.year) === year && s.course.slug === course ? s : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const s = await load(await params);
  return s ? subjectMetadata(s) : {};
}

export default async function SubjectPage({ params }: { params: Params }) {
  const s = await load(await params);
  if (!s) notFound();
  return <SubjectView subject={s} />;
}
