import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LessonNav, { MarkComplete } from "@/components/LessonNav";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import ProjectExplorer from "@/components/ProjectExplorer";
import { getAdjacentLessons, getAllLessons, getLessonBySlug } from "@/lib/lessons";
import { moduleById } from "@/lib/modules";
import { getProjectTreeUpTo } from "@/lib/project-tree";

export function generateStaticParams() {
  return getAllLessons().map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata(
  props: PageProps<"/lecciones/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const lesson = getLessonBySlug(slug);

  if (!lesson) return {};

  return {
    title: `${lesson.title} — Symfony + DDD + TDD`,
    description: lesson.summary,
  };
}

export default async function LessonPage(props: PageProps<"/lecciones/[slug]">) {
  const { slug } = await props.params;
  const lesson = getLessonBySlug(slug);

  if (!lesson) notFound();

  const mod = moduleById(lesson.module);
  const { prev, next } = getAdjacentLessons(lesson.order);
  const tree = getProjectTreeUpTo(lesson.order);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
        <Link href="/" className="hover:text-violet-600 dark:hover:text-violet-400">
          Guía
        </Link>
        <span>/</span>
        {mod && <span>{mod.title.replace(/^\d+\.\s*/, "")}</span>}
        <span>/</span>
        <span className="text-slate-500 dark:text-slate-400">Lección {lesson.order}</span>
      </div>

      <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
        {lesson.title}
      </h1>
      <p className="mt-3 text-base text-slate-600 dark:text-slate-300">{lesson.summary}</p>

      {lesson.objectives?.length > 0 && (
        <div className="mt-6 rounded-xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-800/60 dark:bg-violet-500/5">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-violet-600 dark:text-violet-400">
            Lo que vas a aprender
          </div>
          <ul className="space-y-1">
            {lesson.objectives.map((obj) => (
              <li key={obj} className="flex gap-2 text-sm text-slate-700 dark:text-slate-200">
                <span className="mt-0.5 text-violet-500">✓</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ProjectExplorer tree={tree} />

      <MarkdownRenderer content={lesson.content} />

      <div className="mt-8 flex justify-end">
        <MarkComplete slug={lesson.slug} />
      </div>

      <LessonNav prev={prev} next={next} />
    </div>
  );
}
