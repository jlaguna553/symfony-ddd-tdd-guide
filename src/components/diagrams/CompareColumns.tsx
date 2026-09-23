import type { CompareColumn } from "@/lib/diagrams";
import FlowVertical from "./FlowVertical";

export default function CompareColumns({ columns }: { columns: CompareColumn[] }) {
  return (
    <div
      className="not-prose my-6 grid gap-4"
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))` }}
    >
      {columns.map((col, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60"
        >
          {col.title && (
            <div className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-violet-600 dark:text-violet-400">
              {col.title}
            </div>
          )}
          <FlowVertical steps={col.steps} />
        </div>
      ))}
    </div>
  );
}
