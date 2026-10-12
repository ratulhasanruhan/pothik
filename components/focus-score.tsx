"use client";

import Link from "next/link";
import { useState } from "react";
import { useProgress } from "@/components/progress-context";
import { focusBand, focusChoices, focusQuestions } from "@/lib/focus-score";
import { CommunicationHelp } from "@/components/communication-help";

export function FocusScore() {
  const { hydrated, store, setAdhd, setFocusScore } = useProgress();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  if (!hydrated) return <p className="text-muted">Loading the focus check…</p>;
  const saved = store.focusScore;
  const finished = answers.length === focusQuestions.length;
  const score = finished ? answers.reduce((sum, points) => sum + points, 0) : saved;
  const band = score === null ? null : focusBand(score);

  function choose(points: number) {
    const next = [...answers, points];
    setAnswers(next);
    if (next.length === focusQuestions.length) {
      setFocusScore(next.reduce((sum, value) => sum + value, 0));
    } else {
      setStep(next.length);
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8">
      <div>
        <p className="text-sm font-medium text-accent">ADHD focus</p>
        <h1 className="mt-2 font-display text-4xl leading-tight">Focus support score</h1>
        <p className="mt-3 leading-7 text-muted">
          Six questions about how work feels. You choose the answers. This is not a diagnosis, and it does not ask for medical details.
        </p>
      </div>

      {finished || (saved !== null && answers.length === 0) ? (
        <Result
          score={score ?? 0}
          title={band?.title ?? ""}
          detail={band?.detail ?? ""}
          onRetake={() => {
            setAnswers([]);
            setStep(0);
          }}
          onFocus={() => setAdhd(true)}
          focused={store.adhdMode}
          hasGoal={Boolean(store.selectedRoleId)}
        />
      ) : (
        <section className="rounded-3xl border-2 border-accent bg-surface px-6 py-8">
          <p className="text-sm text-muted">
            Question {step + 1} of {focusQuestions.length}
          </p>
          <h2 className="mt-3 font-display text-3xl leading-snug">{focusQuestions[step]}</h2>
          <div className="mt-6 flex flex-col gap-3">
            {focusChoices.map((choice) => (
              <button
                key={choice.label}
                type="button"
                onClick={() => choose(choice.points)}
                className="min-h-12 rounded-full border border-line bg-background px-5 text-left"
              >
                {choice.label}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Result({
  score,
  title,
  detail,
  onRetake,
  onFocus,
  focused,
  hasGoal,
}: {
  score: number;
  title: string;
  detail: string;
  onRetake: () => void;
  onFocus: () => void;
  focused: boolean;
  hasGoal: boolean;
}) {
  return (
    <>
      <section className="rounded-3xl border-2 border-accent bg-accent-soft px-6 py-8">
        <p className="text-sm text-accent">Your score</p>
        <p className="mt-2 font-display text-6xl">{score}<span className="text-3xl">/12</span></p>
        <h2 className="mt-4 font-display text-2xl">{title}</h2>
        <p className="mt-2 leading-7">{detail}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onFocus}
            className="inline-flex min-h-12 items-center rounded-full bg-accent px-5 text-white"
          >
            {focused ? "ADHD focus is on" : "Turn on ADHD focus"}
          </button>
          {hasGoal ? (
            <Link href="/focus" className="inline-flex min-h-12 items-center rounded-full border border-line bg-surface px-5">
              Open the one step
            </Link>
          ) : (
            <Link href="/" className="inline-flex min-h-12 items-center rounded-full border border-line bg-surface px-5">
              Set a goal first
            </Link>
          )}
          <button type="button" onClick={onRetake} className="inline-flex min-h-12 items-center px-3 text-sm text-accent">
            Retake
          </button>
        </div>
      </section>
      <section>
        <h2 className="font-display text-2xl">Messages you can send</h2>
        <p className="mt-2 leading-7 text-muted">
          HR, a manager, an interviewer, or a recruiter. Copy one message and change the names if you need to.
        </p>
        <div className="mt-4">
          <CommunicationHelp />
        </div>
      </section>
    </>
  );
}
