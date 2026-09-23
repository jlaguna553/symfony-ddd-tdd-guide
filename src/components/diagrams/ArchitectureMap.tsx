import type { ReactNode } from "react";

function Arrow({ note }: { note?: string }) {
  return (
    <div className="flex flex-col items-center py-1">
      <svg width="20" height="26" viewBox="0 0 20 26" className="text-slate-400 dark:text-slate-600">
        <line x1="10" y1="0" x2="10" y2="16" stroke="currentColor" strokeWidth="2" />
        <path d="M4 14 L10 22 L16 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {note && <span className="text-[11px] italic text-slate-400 dark:text-slate-500">{note}</span>}
    </div>
  );
}

function SimpleBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
      {children}
    </div>
  );
}

function Panel({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: string;
}) {
  return (
    <div className={`w-full max-w-sm rounded-2xl border-2 ${accent} bg-white p-4 shadow-sm dark:bg-slate-800`}>
      <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        {title}
      </div>
      <ul className="space-y-1 text-center text-sm font-medium text-slate-700 dark:text-slate-200">
        {items.map((item) => (
          <li key={item} className="rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-900/40">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ArchitectureMap() {
  return (
    <div className="not-prose my-8 flex flex-col items-center">
      <SimpleBox>HTTP</SimpleBox>
      <Arrow />
      <SimpleBox>Controllers</SimpleBox>
      <Arrow />
      <SimpleBox>Commands / Queries</SimpleBox>
      <Arrow />
      <SimpleBox>Handlers</SimpleBox>
      <Arrow />
      <Panel
        title="Domain"
        accent="border-violet-300 dark:border-violet-700"
        items={["Entity", "Value Objects", "Domain Rules", "Repository Interfaces"]}
      />
      <Arrow note="abstracción" />
      <Panel
        title="Infrastructure"
        accent="border-sky-300 dark:border-sky-700"
        items={["Doctrine Repository", "DBAL Types", "HTTP Exception Mapping"]}
      />
      <Arrow />
      <SimpleBox>Doctrine</SimpleBox>
      <Arrow />
      <SimpleBox>MySQL</SimpleBox>
    </div>
  );
}
