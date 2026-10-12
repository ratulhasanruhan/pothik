"use client";

import Link from "next/link";
import { useState } from "react";
import type { CvScan, Mode } from "@/lib/pothik/types";
import { request } from "./api";
import { useSession } from "./session";

/** First screen: a warm intro and the mode choice. */
export function Welcome() {
  const { t, lang, startChat, setCalm } = useSession();
  const [mode, setMode] = useState<Mode | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [reading, setReading] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);

  function begin(chosen: Mode, scan: CvScan | null = null, cvText = "") {
    // Focus-Friendly Mode starts with a quieter screen; the toggle can undo it.
    if (chosen === "focus") setCalm(true);
    startChat(chosen, { targetRole: targetRole.trim(), cvText }, scan);
  }

  // Scans the CV first (if one was added), then starts the chat.
  async function onStart() {
    if (!mode || reading) return;
    if (!file) return begin(mode);
    setReading(true);
    setCvError(null);
    try {
      const body = new FormData();
      body.set("cv", file);
      body.set("lang", lang);
      body.set("targetRole", targetRole.trim());
      const data = await request<{ scan: CvScan; cvText: string }>("/api/cv/scan", { body }, t.cvFailed);
      begin(mode, data.scan, data.cvText);
    } catch (err) {
      setCvError(err instanceof Error ? err.message : t.cvFailed);
      setReading(false);
    }
  }

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

      <section className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5">
        <div>
          <h2 className="font-display text-2xl">{t.aboutYou}</h2>
          <p className="mt-1 text-muted">{t.aboutYouHint}</p>
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-sm text-muted">{t.targetRole}</span>
          <input
            type="text"
            value={targetRole}
            maxLength={120}
            onChange={(event) => setTargetRole(event.target.value)}
            placeholder={t.targetRolePlaceholder}
            className="min-h-12 rounded-2xl border border-line bg-background px-4 outline-none focus:border-accent"
          />
        </label>
        <div className="flex flex-col gap-2">
          <label htmlFor="pothik-cv" className="text-sm text-muted">
            {t.cvUpload}
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              key={fileKey}
              id="pothik-cv"
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setCvError(null);
              }}
              className="min-h-12 flex-1 rounded-2xl border border-line bg-background px-4 py-3"
            />
            {file ? (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setFileKey((key) => key + 1);
                  setCvError(null);
                }}
                className="min-h-10 rounded-full border border-line px-4 text-sm"
              >
                {t.cvRemove}
              </button>
            ) : null}
          </div>
        </div>
        {cvError ? (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-gap px-4 py-3">
            <p className="flex-1 text-gap">{cvError}</p>
            {mode ? (
              <button
                type="button"
                onClick={() => begin(mode)}
                className="min-h-10 rounded-full border border-line px-4 text-sm"
              >
                {t.continueWithoutCv}
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={!mode || reading}
          onClick={() => void onStart()}
          className="inline-flex min-h-14 items-center justify-center rounded-full bg-accent px-6 text-lg text-white disabled:opacity-50 dark:text-background"
        >
          {reading ? t.cvReading : t.start}
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
