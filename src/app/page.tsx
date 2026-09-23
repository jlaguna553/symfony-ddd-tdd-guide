import Link from "next/link";
import ArchitectureMap from "@/components/diagrams/ArchitectureMap";
import HomeProgress from "@/components/HomeProgress";
import { getAllLessons } from "@/lib/lessons";
import { MODULES } from "@/lib/modules";

const BUILD_LIST = [
  "Symfony + PHP + MySQL + Doctrine",
  "DDD por bounded context, con Value Objects y Entidad de dominio",
  "Repository Port + Adapter con Doctrine",
  "Commands, Queries, Handlers y DTOs",
  "Controllers HTTP delgados y validación de dominio",
  "Manejo centralizado de errores con contrato HTTP estable",
  "Unit, Application, Integration y Functional Tests",
  "Migraciones, CI, static analysis y architecture tests",
  "Docker, observabilidad, Domain Events, Outbox y CQRS",
];

export default function HomePage() {
  const lessons = getAllLessons();
  const first = lessons[0];

  return (
    <div className="flex-1">
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-16 text-center sm:px-8 sm:pt-24">
        <span className="inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
          Guía interactiva · 31 lecciones
        </span>

        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          Symfony + DDD + TDD:{" "}
          <span className="bg-linear-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
            CRUD completo de User
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
          Construye desde cero un CRUD de usuarios con Symfony, MySQL y Doctrine siguiendo Domain-Driven
          Design y Test-Driven Development — y aprende a explicar cada decisión de arquitectura como lo
          haría un Senior / Tech Lead.
        </p>

        {first && <HomeProgress total={lessons.length} firstSlug={first.slug} />}
      </section>

      <section className="mx-auto max-w-4xl px-4 sm:px-8">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 dark:border-slate-800 dark:bg-slate-900/40">
          <h2 className="text-center text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            La arquitectura que vas a construir
          </h2>
          <ArchitectureMap />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-8">
        <h2 className="text-center text-2xl font-black text-slate-900 dark:text-white">
          Qué vas a tener al terminar
        </h2>
        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
          {BUILD_LIST.map((item) => (
            <div
              key={item}
              className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
                ✓
              </span>
              {item}
            </div>
          ))}
        </div>

        <blockquote className="mx-auto mt-10 max-w-2xl border-l-4 border-violet-400 bg-violet-50/60 px-5 py-4 text-slate-700 italic dark:border-violet-600 dark:bg-violet-500/5 dark:text-slate-200">
          &ldquo;Sé por qué cada pieza existe, qué responsabilidad tiene y cómo verifico que los límites
          arquitectónicos realmente se respetan.&rdquo;
        </blockquote>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-8">
        <h2 className="text-center text-2xl font-black text-slate-900 dark:text-white">
          El recorrido, módulo por módulo
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500 dark:text-slate-400">
          31 lecciones agrupadas en 9 módulos. El proyecto va creciendo lección a lección: cada una
          muestra qué archivos se agregan al código.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((mod) => {
            const modLessons = lessons.filter((l) => l.module === mod.id);
            const firstLesson = modLessons[0];
            if (!firstLesson) return null;

            return (
              <Link
                key={mod.id}
                href={`/lecciones/${firstLesson.slug}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-700"
              >
                <div className="text-xs font-bold uppercase tracking-wide text-violet-500">
                  {modLessons.length} {modLessons.length === 1 ? "lección" : "lecciones"}
                </div>
                <div className="mt-1.5 font-bold text-slate-900 group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-300">
                  {mod.title}
                </div>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{mod.description}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
