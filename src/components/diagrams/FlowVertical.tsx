import type { FlowStep } from "@/lib/diagrams";

function ArrowDown() {
  return (
    <svg width="20" height="28" viewBox="0 0 20 28" className="text-slate-400 dark:text-slate-600">
      <line x1="10" y1="0" x2="10" y2="18" stroke="currentColor" strokeWidth="2" />
      <path d="M4 16 L10 24 L16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowUp() {
  return (
    <svg width="20" height="28" viewBox="0 0 20 28" className="text-violet-400 dark:text-violet-500">
      <line x1="10" y1="10" x2="10" y2="28" stroke="currentColor" strokeWidth="2" />
      <path d="M4 12 L10 4 L16 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function FlowVertical({ steps }: { steps: FlowStep[] }) {
  return (
    <div className="not-prose my-6 flex flex-col items-center">
      {steps.map((step, i) => (
        <div key={i} className="flex flex-col items-center">
          {i > 0 && (step.reversed ? <ArrowUp /> : <ArrowDown />)}
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
            {step.label}
          </div>
        </div>
      ))}
    </div>
  );
}
