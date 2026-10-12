"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdhdToggle } from "@/components/adhd-toggle";
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
        A career map you can start in two minutes.
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-8 text-muted">
        Paste a LinkedIn URL or upload a CV. The map shows what is mastered, in progress, and still missing.
      </p>
      <div className="mt-6 max-w-xl">
        <AdhdToggle />
      </div>
      <Link
        href="/guide"
        className="mt-6 flex max-w-xl flex-col gap-1 rounded-3xl border-2 border-accent bg-accent-soft px-5 py-4"
      >
        <span className="font-display text-xl">Not sure where to start? Talk it through with Pothik.</span>
        <span className="text-muted">A short chat (English or বাংলা) that suggests 3 career paths and a 90-day plan.</span>
      </Link>
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
