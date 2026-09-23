"use client";

import Link from "next/link";
import { useProgress } from "./ProgressStore";

export default function HomeProgress({
  total,
  firstSlug,
}: {
  total: number;
  firstSlug: string;
}) {
  const { count, ready } = useProgress();
  const percent = total === 0 ? 0 : Math.round((count / total) * 100);
  const started = ready && count > 0;

  return (
    <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
      <Link
        href={`/lecciones/${firstSlug}`}
        className="rounded-xl bg-linear-to-r from-violet-600 to-fuchsia-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/25 transition-transform hover:scale-[1.02]"
      >
        {started ? "Continuar la guía →" : "Empezar la guía →"}
      </Link>

      <div className="flex w-full max-w-xs items-center gap-3 sm:w-56">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 transition-all"
            style={{ width: `${ready ? percent : 0}%` }}
          />
        </div>
        <span className="whitespace-nowrap text-xs font-semibold text-slate-500 dark:text-slate-400">
          {ready ? `${count}/${total}` : "…"}
        </span>
      </div>
    </div>
  );
}
