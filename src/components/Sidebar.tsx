"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "@/lib/modules";
import type { Lesson } from "@/lib/lessons";
import { useProgress } from "./ProgressStore";

export default function Sidebar({ lessons }: { lessons: Lesson[] }) {
  const pathname = usePathname();
  const { isCompleted, count, ready } = useProgress();
  const total = lessons.length;
  const percent = total === 0 ? 0 : Math.round((count / total) * 100);

  return (
    <nav className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-800">
        <Link href="/" className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
          Symfony + DDD + TDD
        </Link>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span>Progreso</span>
            <span>{ready ? `${count}/${total}` : "…"}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 transition-all"
              style={{ width: `${ready ? percent : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {MODULES.map((mod) => {
          const modLessons = lessons.filter((l) => l.module === mod.id);
          if (modLessons.length === 0) return null;

          return (
            <div key={mod.id} className="mb-4">
              <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {mod.title}
              </div>
              <ul className="space-y-0.5">
                {modLessons.map((lesson) => {
                  const href = `/lecciones/${lesson.slug}`;
                  const active = pathname === href;
                  const done = ready && isCompleted(lesson.slug);

                  return (
                    <li key={lesson.slug}>
                      <Link
                        href={href}
                        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors ${
                          active
                            ? "bg-violet-50 font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] ${
                            done
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-300 text-transparent dark:border-slate-600"
                          }`}
                        >
                          ✓
                        </span>
                        <span className="truncate">
                          {lesson.order}. {lesson.title}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
