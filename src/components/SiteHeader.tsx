import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md sm:px-6 dark:border-slate-800 dark:bg-slate-950/80">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-violet-600 to-fuchsia-500 text-xs font-black text-white">
          λ
        </span>
        <span className="hidden text-sm font-bold text-slate-900 sm:inline dark:text-white">
          Symfony + DDD + TDD
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <a
          href="https://symfony.com"
          target="_blank"
          rel="noreferrer"
          className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 sm:inline dark:bg-slate-800 dark:text-slate-400"
        >
          Guía completa · 31 lecciones
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}
