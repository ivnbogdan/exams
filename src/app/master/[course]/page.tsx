import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseView, courseMetadata } from "@/components/course-view";
import { getCourseBySlug, getCourses } from "@/lib/queries";

export const dynamicParams = false;

type Params = Promise<{ course: string }>;

export async function generateStaticParams() {
  return (await getCourses()).filter((c) => c.level === "master").map((c) => ({ course: c.slug }));
}

async function load({ course }: Awaited<Params>) {
  const c = await getCourseBySlug(course);
  return c && c.level === "master" ? c : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const c = await load(await params);
  return c ? courseMetadata(c) : {};
}

export default async function MasterCoursePage({ params }: { params: Params }) {
  const c = await load(await params);
  if (!c) notFound();
  return <CourseView course={c} />;
}
