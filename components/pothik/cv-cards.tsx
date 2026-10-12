"use client";

import { useState } from "react";
import type { CvScan, JobMatch } from "@/lib/pothik/types";
import { postJson } from "./api";
import { useSession } from "./session";

function ScoreRing({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center">
      <div
        className="grid size-24 place-items-center rounded-full"
        style={{ background: `conic-gradient(var(--accent) ${value * 3.6}deg, var(--accent-soft) 0deg)` }}
        role="img"
        aria-label={`${label}: ${value}%`}
      >
        <span className="grid size-[4.75rem] place-items-center rounded-full bg-surface font-display text-2xl">
          {value}%
        </span>
      </div>
      <span className="mt-2 text-sm text-muted">{label}</span>
    </div>
  );
}

function Bullets({ title, items, tone }: { title: string; items: string[]; tone?: "good" | "gap" }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="text-sm text-muted">{title}</h3>
      <ul className="mt-2 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 leading-7">
            <span
              aria-hidden
              className={`mt-2.5 size-2.5 shrink-0 rounded-full ${
                tone === "good" ? "bg-mastered" : tone === "gap" ? "bg-gap" : "bg-accent"
              }`}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Results card: the CV scanner's score, strengths, gaps and rewrites. */
export function CvCheckCard({ scan, targetRole }: { scan: CvScan; targetRole: string }) {
  const { t } = useSession();
  return (
    <section className="rounded-3xl border border-line bg-surface p-5">
      <h2 className="mb-4 font-display text-2xl">{t.cvCheck}</h2>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <ScoreRing value={scan.score} label={`${t.cvScore} · ${t.cvScoreHint(targetRole)}`} />
        <div className="grid flex-1 gap-4 sm:grid-cols-2">
          <Bullets title={t.cvStrengths} items={scan.strengths} tone="good" />
          <Bullets title={t.cvMissing} items={scan.missing} tone="gap" />
        </div>
      </div>
      {scan.rewrites.length ? (
        <div className="mt-6">
          <h3 className="text-sm text-muted">{t.cvRewrites}</h3>
          <ul className="mt-2 flex flex-col gap-3">
            {scan.rewrites.map((rewrite) => (
              <li key={rewrite.before} className="rounded-2xl border border-line bg-background p-4 leading-7">
                <p className="text-muted">
                  <span className="text-sm">{t.cvBefore}: </span>
                  <span className="line-through decoration-gap/60">{rewrite.before}</span>
                </p>
                <p className="mt-1">
                  <span className="text-sm text-muted">{t.cvAfter}: </span>
                  {rewrite.after}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-muted">{t.cvPlaceholderNote}</p>
        </div>
      ) : null}
      <div className="mt-6">
        <Bullets title={t.atsTips} items={scan.atsTips} />
      </div>
    </section>
  );
}

/** Results card: paste a job description and compare it with the CV (or the review). */
export function JobMatchCard({ candidate, hasCv }: { candidate: string; hasCv: boolean }) {
  const { t, lang } = useSession();
  const [job, setJob] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<JobMatch | null>(null);
  const [copied, setCopied] = useState(false);

  async function check() {
    setPending(true);
    setError(null);
    try {
      setMatch(await postJson<JobMatch>("/api/cv/match", { lang, candidate, jobDescription: job }, t.errorGeneric));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorGeneric);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-3xl border border-line bg-surface p-5">
      <h2 className="font-display text-2xl">{t.jobMatch}</h2>
      <p className="mt-2 leading-7 text-muted">{t.jobMatchHint}</p>
      {!hasCv ? <p className="mt-1 text-sm text-muted">{t.jobMatchNoCv}</p> : null}
      <div className="no-print mt-4 flex flex-col gap-3">
        <textarea
          value={job}
          onChange={(event) => setJob(event.target.value)}
          rows={6}
          maxLength={8000}
          placeholder={t.jobPlaceholder}
          aria-label={t.jobPlaceholder}
          className="w-full rounded-2xl border border-line bg-background px-4 py-3 leading-7 outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={() => void check()}
          disabled={pending || job.trim().length < 80}
          className="inline-flex min-h-12 items-center justify-center self-start rounded-full bg-accent px-5 text-white disabled:opacity-50 dark:text-background"
        >
          {pending ? t.checking : t.checkMatch}
        </button>
        {error ? (
          <p role="alert" className="text-gap">
            {error}
          </p>
        ) : null}
      </div>

      {match ? (
        <div className="mt-6 flex flex-col gap-5" aria-live="polite">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <ScoreRing value={match.matchPercent} label={t.matchPercent} />
            <p className="flex-1 text-lg leading-8">{match.verdict}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Bullets title={t.matched} items={match.matched} tone="good" />
            <Bullets title={t.missingKeywords} items={match.missing} tone="gap" />
          </div>
          <Bullets title={t.cvChanges} items={match.changes} />
          {match.coverNote ? (
            <div>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm text-muted">{t.coverNote}</h3>
                <button
                  type="button"
                  className="no-print min-h-9 rounded-full border border-line px-3 text-sm"
                  onClick={() => {
                    void navigator.clipboard?.writeText(match.coverNote).then(() => {
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1500);
                    });
                  }}
                >
                  {copied ? t.copied : t.copy}
                </button>
              </div>
              <p className="mt-2 whitespace-pre-line rounded-2xl border border-line bg-background p-4 leading-7">
                {match.coverNote}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
