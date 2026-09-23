"use client";

import Link from "next/link";
import type { Lesson } from "@/lib/lessons";
import { useProgress } from "./ProgressStore";

export function MarkComplete({ slug }: { slug: string }) {
  const { isCompleted, toggle, ready } = useProgress();
  const done = ready && isCompleted(slug);

  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
        done
          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "border-slate-300 text-slate-600 hover:border-violet-400 hover:text-violet-700 dark:border-slate-700 dark:text-slate-300"
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full border text-[9px] ${
          done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-400"
        }`}
      >
        ✓
      </span>
      {done ? "Lección completada" : "Marcar como completada"}
    </button>
  );
}

export default function LessonNav({ prev, next }: { prev: Lesson | null; next: Lesson | null }) {
  return (
    <div className="mt-10 grid grid-cols-1 gap-3 border-t border-slate-200 pt-6 sm:grid-cols-2 dark:border-slate-800">
      {prev ? (
        <Link
          href={`/lecciones/${prev.slug}`}
          className="group rounded-xl border border-slate-200 p-4 transition-colors hover:border-violet-300 hover:bg-violet-50/50 dark:border-slate-800 dark:hover:border-violet-700 dark:hover:bg-violet-500/5"
        >
          <div className="text-xs font-medium text-slate-400">← Anterior</div>
          <div className="mt-1 font-semibold text-slate-800 group-hover:text-violet-700 dark:text-slate-100 dark:group-hover:text-violet-300">
            {prev.title}
          </div>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={`/lecciones/${next.slug}`}
          className="group rounded-xl border border-slate-200 p-4 text-right transition-colors hover:border-violet-300 hover:bg-violet-50/50 dark:border-slate-800 dark:hover:border-violet-700 dark:hover:bg-violet-500/5"
        >
          <div className="text-xs font-medium text-slate-400">Siguiente →</div>
          <div className="mt-1 font-semibold text-slate-800 group-hover:text-violet-700 dark:text-slate-100 dark:group-hover:text-violet-300">
            {next.title}
          </div>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
