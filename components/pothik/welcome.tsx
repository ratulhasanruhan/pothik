"use client";

import Link from "next/link";
import { useState } from "react";
import type { Mode } from "@/lib/pothik/types";
import { useSession } from "./session";

/** First screen: a warm intro and the mode choice. */
export function Welcome() {
  const { t, startChat, setCalm } = useSession();
  const [mode, setMode] = useState<Mode | null>(null);

  const options: { id: Mode; title: string; body: string }[] = [
    { id: "standard", title: t.standardTitle, body: t.standardBody },
    { id: "focus", title: t.focusTitle, body: t.focusBody },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section>
        <p className="text-sm tracking-wide text-accent">{t.tagline}</p>
        <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{t.welcomeTitle}</h1>
        <p className="mt-4 text-lg leading-8 text-muted">{t.welcomeBody}</p>
      </section>

      <section>
        <h2 className="font-display text-2xl">{t.chooseMode}</h2>
        <div role="radiogroup" aria-label={t.chooseMode} className="mt-4 grid gap-4 sm:grid-cols-2">
          {options.map((option) => {
            const selected = mode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setMode(option.id)}
                className={`flex flex-col rounded-3xl border-2 bg-surface p-5 text-left ${
                  selected ? "border-accent" : "border-line"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={`grid size-5 place-items-center rounded-full border-2 ${
                      selected ? "border-accent" : "border-line"
                    }`}
                  >
                    {selected ? <span className="size-2.5 rounded-full bg-accent" /> : null}
                  </span>
                  <span className="font-display text-2xl">{option.title}</span>
                </span>
                <span className="mt-3 leading-7 text-muted">{option.body}</span>
                {option.id === "focus" ? (
                  <span className="mt-3 text-sm leading-6 text-muted">{t.focusNote}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={!mode}
          onClick={() => {
            if (!mode) return;
            // Focus-Friendly Mode starts with a quieter screen; the toggle can undo it.
            if (mode === "focus") setCalm(true);
            startChat(mode);
          }}
          className="inline-flex min-h-14 items-center justify-center rounded-full bg-accent px-6 text-lg text-white disabled:opacity-50 dark:text-background"
        >
          {t.start}
        </button>
        <p className="text-center text-sm text-muted">{t.privacy}</p>
      </div>

      <p className="calm-hide rounded-2xl border border-dashed border-line px-4 py-3 text-sm text-muted">
        {t.skillMap}{" "}
        <Link href="/" className="text-accent underline underline-offset-4">
          {t.openSkillMap}
        </Link>
      </p>
    </div>
  );
}
