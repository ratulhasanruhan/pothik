"use client";

import { useProgress } from "@/components/progress-context";

export function AdhdToggle({ compact = false }: { compact?: boolean }) {
  const { store, setAdhd } = useProgress();
  const on = store.adhdMode;

  if (compact) {
    return (
      <button
        type="button"
        aria-pressed={on}
        onClick={() => setAdhd(!on)}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm ${
          on ? "bg-accent text-white" : "border border-line bg-background"
        }`}
      >
        ADHD focus
        <span>{on ? "On" : "Off"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setAdhd(!on)}
      className={`flex min-h-12 items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left ${
        on ? "border-accent bg-accent-soft" : "border-line bg-surface"
      }`}
    >
      <span>
        <span className="block font-medium">ADHD focus</span>
        <span className="mt-1 block text-sm leading-5 text-muted">
          One 2-minute step. The rest of the map stays hidden.
        </span>
      </span>
      <span
        className={`inline-flex min-h-9 shrink-0 items-center rounded-full px-3 text-sm ${
          on ? "bg-accent text-white" : "bg-background text-muted"
        }`}
      >
        {on ? "On" : "Off"}
      </span>
    </button>
  );
}
