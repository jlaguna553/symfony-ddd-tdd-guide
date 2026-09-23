const TIERS = [
  { label: "E2E", width: "28%", color: "bg-rose-400 dark:bg-rose-500", note: "Sistema completo" },
  { label: "Functional", width: "46%", color: "bg-amber-400 dark:bg-amber-500", note: "HTTP + Symfony + MySQL" },
  { label: "Integration", width: "64%", color: "bg-sky-400 dark:bg-sky-500", note: "Doctrine + MySQL" },
  { label: "Unit / Application", width: "88%", color: "bg-emerald-400 dark:bg-emerald-500", note: "Domain + Handlers (InMemory)" },
];

export default function TestingPyramid() {
  return (
    <div className="not-prose my-8 flex flex-col items-center gap-2">
      {TIERS.map((tier) => (
        <div key={tier.label} style={{ width: tier.width }} className="flex flex-col items-center">
          <div
            className={`w-full rounded-lg ${tier.color} px-4 py-3 text-center shadow-sm`}
          >
            <div className="text-sm font-bold text-slate-900/80">{tier.label}</div>
            <div className="text-xs text-slate-900/60">{tier.note}</div>
          </div>
        </div>
      ))}
      <p className="mt-3 text-center text-sm text-slate-500 dark:text-slate-400">
        Muchos tests rápidos en la base, pocos tests caros en la punta.
      </p>
    </div>
  );
}
