import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SubjectView, subjectMetadata } from "@/components/subject-view";
import { getSubject, getSubjectRefs } from "@/lib/queries";

export const dynamicParams = false;

type Params = Promise<{ course: string; id: string }>;

export async function generateStaticParams() {
  return (await getSubjectRefs())
    .filter((r) => r.level === "master")
    .map((r) => ({ course: r.slug, id: String(r.id) }));
}

async function load({ course, id }: Awaited<Params>) {
  const s = await getSubject(Number(id));
  return s && s.course.level === "master" && s.course.slug === course ? s : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const s = await load(await params);
  return s ? subjectMetadata(s) : {};
}

export default async function MasterSubjectPage({ params }: { params: Params }) {
  const s = await load(await params);
  if (!s) notFound();
  return <SubjectView subject={s} />;
}
