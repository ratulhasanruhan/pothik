"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdhdToggle } from "@/components/adhd-toggle";
import { CommunicationHelp } from "@/components/communication-help";
import { Logo } from "@/components/logo";
import { useProgress } from "@/components/progress-context";
import { parseLinkedInUrl } from "@/lib/linkedin-url";
import { roles } from "@/lib/roles";
import { readinessPercent } from "@/lib/readiness";
import type { CareerGuide, RoleId } from "@/lib/types";

export function HomeScreen() {
  const router = useRouter();
  const { store, setGoal, resetRole, applyGuide } = useProgress();
  const [linkedin, setLinkedin] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saved = store.selectedRoleId ? roles.find((role) => role.id === store.selectedRoleId) : null;
  const savedProgress = saved ? store.roles[saved.id] : null;
  const percent = saved && savedProgress ? readinessPercent(saved, savedProgress.nodeStatus) : 0;

  async function onPersonalize(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!linkedin.trim() && !file) {
      setError("Add a LinkedIn URL or a CV.");
      return;
    }
    if (linkedin.trim() && !parseLinkedInUrl(linkedin)) {
      setError("Use a LinkedIn profile link, like linkedin.com/in/your-name.");
      return;
    }
    const body = new FormData();
    if (linkedin.trim()) body.set("linkedinUrl", linkedin.trim());
    if (file) body.set("cv", file);
    setPending(true);
    try {
      const response = await fetch("/api/personalize", { method: "POST", body });
      const data = (await response.json()) as CareerGuide & { error?: string };
      if (!response.ok || !data.roleId || !data.statuses) {
        setError(data.error ?? "The guide could not be built.");
        return;
      }
      applyGuide(data);
      router.push("/insights");
    } catch {
      setError("The guide could not be built. Try again.");
    } finally {
      setPending(false);
    }
  }

  function start(id: RoleId) {
    setGoal(id);
    router.push("/profile");
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 py-10">
      <Logo size="hero" />
      <h1 className="mt-3 max-w-xl font-display text-5xl leading-tight">
        One clear step. A brand people can read.
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-8 text-muted">
        Set a goal, keep the next step small, and turn your proof into a headline you can paste.
      </p>
      <Link
        href="/adhd"
        className="mt-8 flex max-w-xl flex-col gap-2 rounded-3xl border-2 border-accent bg-accent-soft px-5 py-5"
      >
        <span className="text-sm font-medium text-accent">ADHD focus</span>
        <span className="font-display text-3xl leading-tight">Get a focus support score</span>
        <span className="leading-7 text-muted">
          Six short questions, then messages you can send to HR, a manager, an interviewer, or a recruiter.
          {store.focusScore !== null ? ` Your last score was ${store.focusScore}/12.` : ""}
        </span>
        <span className="text-sm font-medium text-accent">Start the score</span>
      </Link>
      <div className="mt-4 max-w-xl">
        <AdhdToggle />
      </div>
      <div className="mt-4 grid max-w-xl gap-3 sm:grid-cols-2">
        <Link href="/profile" className="rounded-3xl border border-line bg-surface px-5 py-4">
          <span className="block font-display text-xl">Personal brand</span>
          <span className="mt-1 block text-sm leading-6 text-muted">Headline, About, and proof.</span>
        </Link>
        <Link href="/guide" className="rounded-3xl border border-line bg-surface px-5 py-4">
          <span className="block font-display text-xl">Talk with Pothik</span>
          <span className="mt-1 block text-sm leading-6 text-muted">English or বাংলা, one question at a time.</span>
        </Link>
      </div>
      <section className="mt-10">
        <h2 className="font-display text-2xl">Messages for HR and similar conversations</h2>
        <p className="mt-2 max-w-xl leading-7 text-muted">
          Copy one note when you need to write to HR, a manager, an interviewer, or a recruiter.
        </p>
        <div className="mt-4">
          <CommunicationHelp />
        </div>
      </section>
      {saved && savedProgress ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-line bg-surface px-5 py-5">
          <div>
            <p className="text-sm text-muted">Continue</p>
            <p className="mt-1 text-lg">{saved.title}</p>
            <p className="text-sm text-muted">
              {percent}% ready
              {store.streak.count > 0
                ? ` · ${store.streak.count}-day streak`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="inline-flex min-h-12 items-center rounded-full bg-accent px-5 text-white"
            >
              Open workbench
            </button>
            <button
              type="button"
              onClick={() => resetRole(saved.id)}
              className="inline-flex min-h-12 items-center rounded-full border border-line px-5"
            >
              Reset this role
            </button>
          </div>
        </div>
      ) : null}
      <form
        onSubmit={onPersonalize}
        className="mt-8 flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5"
      >
        <div>
          <h2 className="font-display text-2xl">Start from your profile</h2>
          <p className="mt-2 text-muted">
            A LinkedIn link is enough to begin. A CV makes the skill colors closer to your experience.
          </p>
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-sm text-muted">LinkedIn URL</span>
          <input
            type="url"
            value={linkedin}
            onChange={(event) => setLinkedin(event.target.value)}
            placeholder="https://www.linkedin.com/in/your-name"
            className="min-h-12 rounded-2xl border border-line bg-background px-4"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm text-muted">CV, PDF, DOCX, or TXT</span>
          <input
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="min-h-12 rounded-2xl border border-line bg-background px-4 py-3"
          />
        </label>
        {error ? <p className="text-sm text-gap">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-5 text-white disabled:opacity-70"
        >
          {pending ? "Reading your profile…" : "Continue"}
        </button>
      </form>
      <h2 className="mt-10 font-display text-2xl">Set a goal</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {roles.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => start(role.id)}
            className="flex min-h-48 flex-col rounded-3xl border border-line bg-surface p-5 text-left"
          >
            <span className="font-display text-2xl leading-snug">{role.title}</span>
            <span className="mt-3 flex-1 leading-7 text-muted">{role.summary}</span>
            <span className="mt-4 text-sm text-accent">Set this goal</span>
          </button>
        ))}
      </div>
    </div>
  );
}
