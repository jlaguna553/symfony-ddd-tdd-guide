"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "ddd-guide-progress";

interface ProgressContextValue {
  completed: Set<string>;
  toggle: (slug: string) => void;
  isCompleted: (slug: string) => boolean;
  count: number;
  ready: boolean;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // One-time hydration from localStorage after mount: this must run in an
    // effect (not a lazy useState initializer) so the server-rendered and
    // first client render match, avoiding a hydration mismatch.
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCompleted(new Set(JSON.parse(raw)));
      }
    } catch {
      // localStorage unavailable, start empty
    }
    setReady(true);
  }, []);

  const toggle = useCallback((slug: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // ignore persistence errors (private mode, disabled storage, ...)
      }
      return next;
    });
  }, []);

  const isCompleted = useCallback((slug: string) => completed.has(slug), [completed]);

  const value = useMemo(
    () => ({ completed, toggle, isCompleted, count: completed.size, ready }),
    [completed, toggle, isCompleted, ready]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return ctx;
}
