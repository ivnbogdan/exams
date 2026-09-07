import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseView, courseMetadata } from "@/components/course-view";
import { getCourseBySlug, getCourses } from "@/lib/queries";

export const dynamicParams = false;

type Params = Promise<{ year: string; course: string }>;

export async function generateStaticParams() {
  return (await getCourses()).filter((c) => c.level === "licenta").map((c) => ({ year: String(c.year), course: c.slug }));
}

async function load({ year, course }: Awaited<Params>) {
  const c = await getCourseBySlug(course);
  return c && c.level === "licenta" && String(c.year) === year ? c : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const c = await load(await params);
  return c ? courseMetadata(c) : {};
}

export default async function CoursePage({ params }: { params: Params }) {
  const c = await load(await params);
  if (!c) notFound();
  return <CourseView course={c} />;
}
