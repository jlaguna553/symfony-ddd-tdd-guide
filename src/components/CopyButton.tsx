"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // clipboard unavailable, ignore silently
        }
      }}
      className="absolute right-2 top-2 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-[11px] font-medium text-slate-300 opacity-0 transition-opacity hover:bg-slate-700 group-hover:opacity-100"
    >
      {copied ? "¡Copiado!" : "Copiar"}
    </button>
  );
}
