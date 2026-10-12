"use client";

import Link from "next/link";
import { GoalPicker } from "@/components/goal-picker";
import { StatusMark } from "@/components/status-mark";
import { useProgress } from "@/components/progress-context";
import { getRole } from "@/lib/roles";
import type { SkillStatus } from "@/lib/types";

export function GuideScreen() {
  const { hydrated, store } = useProgress();
  if (!hydrated) return <p className="text-muted">Loading your guide…</p>;
  const guide = store.guide;
  if (!guide) {
    return (
      <div className="max-w-xl">
        <h1 className="font-display text-4xl">No guide yet</h1>
        <p className="mt-3 leading-7 text-muted">
          Add a CV or a profile link on the home page. The guide shows up here.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-12 items-center rounded-full bg-accent px-5 text-white"
        >
          Start a guide
        </Link>
      </div>
    );
  }

  const role = getRole(guide.roleId);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm text-muted">Your guide</p>
        <h1 className="mt-1 font-display text-4xl">Your guide</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          Suggested goal: {role.title}. Set a goal to open the profile workbench.
        </p>
      </div>

      <GoalPicker selected={store.selectedRoleId} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-line bg-surface px-6 py-6">
          <h2 className="font-display text-2xl">AI guide</h2>
          <p className="mt-4 leading-7">{guide.analysis}</p>
          {guide.nextStep ? (
            <p className="mt-4 leading-7">
              <span className="text-muted">Next step. </span>
              {guide.nextStep}
            </p>
          ) : null}
          {guide.strengths.length ? (
            <div className="mt-5">
              <h3 className="text-sm text-muted">Already in the profile</h3>
              <ul className="mt-2 list-disc pl-5 leading-7">
                {guide.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {guide.gaps.length ? (
            <div className="mt-5">
              <h3 className="text-sm text-muted">Still missing</h3>
              <ul className="mt-2 list-disc pl-5 leading-7">
                {guide.gaps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {guide.suggestedHeadline ? (
            <div className="mt-5">
              <h3 className="text-sm text-muted">Suggested headline</h3>
              <p className="mt-2 leading-7">{guide.suggestedHeadline}</p>
            </div>
          ) : null}
          {guide.suggestedAbout ? (
            <div className="mt-5">
              <h3 className="text-sm text-muted">Suggested About</h3>
              <p className="mt-2 leading-7">{guide.suggestedAbout}</p>
            </div>
          ) : null}
        </section>
      </div>

      <section>
        <h2 className="font-display text-2xl">How each skill was read</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {role.nodes.map((node) => (
            <li key={node.id} className="rounded-2xl border border-line bg-surface px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium">{node.title}</p>
                <StatusMark status={guide.statuses[node.id] ?? ("gap" as SkillStatus)} />
              </div>
              {guide.reasons[node.id] ? (
                <p className="mt-2 leading-7 text-muted">{guide.reasons[node.id]}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
