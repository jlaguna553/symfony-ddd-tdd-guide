"use client";

import { useState } from "react";
import type { Lesson } from "@/lib/lessons";
import Sidebar from "./Sidebar";

export default function SidebarShell({ lessons }: { lessons: Lesson[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir índice de lecciones"
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-600/30 md:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-white shadow-xl dark:bg-slate-950">
            <div className="flex justify-end p-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar índice"
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="h-[calc(100%-2.5rem)]" onClick={() => setOpen(false)}>
              <Sidebar lessons={lessons} />
            </div>
          </div>
        </div>
      )}

      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-200 md:block dark:border-slate-800">
        <Sidebar lessons={lessons} />
      </aside>
    </>
  );
}
