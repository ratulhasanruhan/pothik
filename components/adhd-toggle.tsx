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
        className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium ring-2 ring-accent ${
          on ? "bg-accent text-white" : "bg-accent-soft text-accent"
        }`}
      >
        ADHD
        <span>{on ? "On" : "Off"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setAdhd(!on)}
      className={`flex min-h-16 items-center justify-between gap-4 rounded-3xl border-2 border-accent px-5 py-4 text-left ${
        on ? "bg-accent text-white" : "bg-accent-soft"
      }`}
    >
      <span>
        <span className="mt-1 block font-display text-2xl leading-tight">Hide the full map</span>
        <span className={`mt-1 block text-sm leading-6 ${on ? "text-white/90" : "text-muted"}`}>
          One 2-minute step stays on screen. The focus room stays available.
        </span>
      </span>
      <span
        className={`inline-flex min-h-9 shrink-0 items-center rounded-full px-3 text-sm font-medium ${
          on ? "bg-white text-accent" : "bg-accent text-white"
        }`}
      >
        {on ? "On" : "Off"}
      </span>
    </button>
  );
}
