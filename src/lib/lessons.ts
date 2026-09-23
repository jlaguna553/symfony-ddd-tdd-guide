import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { ModuleId } from "./modules";

const LESSONS_DIR = path.join(process.cwd(), "content", "lessons");

export interface LessonFrontmatter {
  slug: string;
  order: number;
  module: ModuleId;
  title: string;
  summary: string;
  objectives: string[];
  newFiles?: string[];
}

export interface Lesson extends LessonFrontmatter {
  content: string;
}

let cache: Lesson[] | null = null;

export function getAllLessons(): Lesson[] {
  if (cache) return cache;

  const files = fs.readdirSync(LESSONS_DIR).filter((f) => f.endsWith(".md"));

  const lessons = files.map((file) => {
    const raw = fs.readFileSync(path.join(LESSONS_DIR, file), "utf8");
    const { data, content } = matter(raw);
    return { ...(data as LessonFrontmatter), content };
  });

  lessons.sort((a, b) => a.order - b.order);

  cache = lessons;
  return lessons;
}

export function getLessonBySlug(slug: string): Lesson | undefined {
  return getAllLessons().find((l) => l.slug === slug);
}

export function getAdjacentLessons(order: number): {
  prev: Lesson | null;
  next: Lesson | null;
} {
  const all = getAllLessons();
  const prev = all.find((l) => l.order === order - 1) ?? null;
  const next = all.find((l) => l.order === order + 1) ?? null;
  return { prev, next };
}

export function getLessonsByModule(moduleId: ModuleId): Lesson[] {
  return getAllLessons().filter((l) => l.module === moduleId);
}

export function totalLessons(): number {
  return getAllLessons().length;
}
