"use client";

import { useState } from "react";
import { GoalPicker } from "@/components/goal-picker";
import { LinkedInCard } from "@/components/linkedin-card";
import { useProgress } from "@/components/progress-context";
import { buildProfile } from "@/lib/profile";
import { readinessBand, readinessPercent } from "@/lib/readiness";

export function ProfileScreen() {
  const { hydrated, role, progress, store } = useProgress();
  if (!hydrated) return <p className="text-muted">Loading your profile…</p>;

  const linkedin = store.guide?.linkedin ?? null;
  const matched = role && store.guide?.roleId === role.id ? store.guide : null;

  return (
    <div className="flex flex-col gap-8">
      {linkedin ? <LinkedInCard profile={linkedin} /> : null}
      {role && progress ? (
        <Workbench
          roleTitle={role.title}
          headline={matched?.suggestedHeadline || buildProfile(role, progress.nodeStatus).headline}
          about={matched?.suggestedAbout || buildProfile(role, progress.nodeStatus).about}
          tags={[
            ...new Set([
              ...buildProfile(role, progress.nodeStatus).tags,
              ...(linkedin?.skills ?? []),
            ]),
          ]}
          bullets={buildProfile(role, progress.nodeStatus).bullets}
          drafts={role.nodes
            .filter((node) => progress.nodeStatus[node.id] === "in_progress")
            .map((node) => node.resumeBullet)}
          percent={readinessPercent(role, progress.nodeStatus)}
          notes={role.readinessNotes}
        />
      ) : (
        <div>
          <h1 className="font-display text-4xl">Set a goal first</h1>
          <p className="mt-3 max-w-xl leading-7 text-muted">
            The workbench opens after you choose the role you are aiming for.
          </p>
        </div>
      )}
      <GoalPicker selected={store.selectedRoleId} />
    </div>
  );
}

function Workbench({
  roleTitle,
  headline,
  about,
  tags,
  bullets,
  drafts,
  percent,
  notes,
}: {
  roleTitle: string;
  headline: string;
  about: string;
  tags: string[];
  bullets: string[];
  drafts: string[];
  percent: number;
  notes: { gp: string; accelerator: string; partners: string };
}) {
  const ready = bullets.length ? bullets : drafts;
  const readyLabel = bullets.length ? "CV bullets" : "Draft bullets for this goal";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <article className="rounded-3xl border border-line bg-surface px-6 py-8">
        <p className="text-sm text-accent">Personal brand</p>
        <h1 className="mt-2 font-display text-3xl">{roleTitle}</h1>
        <p className="mt-3 max-w-xl leading-7 text-muted">
          This is how you show up for {roleTitle}. Copy the headline, About, tags, and proof onto LinkedIn or a CV.
        </p>
        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm text-muted">LinkedIn headline</h2>
            <CopyButton text={headline} />
          </div>
          <p className="mt-2 text-lg leading-7">{headline}</p>
        </section>
        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm text-muted">About</h2>
            <CopyButton text={about} />
          </div>
          <p className="mt-2 leading-7">{about}</p>
        </section>
        <section className="mt-8">
          <h2 className="text-sm text-muted">Skill tags</h2>
          {tags.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <li key={tag} className="rounded-full bg-accent-soft px-3 py-2 text-sm text-accent">
                  {tag}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-muted">Tags appear as skills leave the gap column.</p>
          )}
        </section>
        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm text-muted">{readyLabel}</h2>
            {ready.length ? <CopyButton text={ready.map((bullet) => `• ${bullet}`).join("\n")} /> : null}
          </div>
          {ready.length ? (
            <ul className="mt-3 flex flex-col gap-3">
              {ready.map((bullet) => (
                <li key={bullet} className="leading-7">
                  {bullet}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-muted">Master a skill to unlock its CV bullet.</p>
          )}
        </section>
        <button
          type="button"
          onClick={() => window.print()}
          className="no-print mt-8 inline-flex min-h-12 items-center rounded-full bg-accent px-5 text-white"
        >
          Download PDF
        </button>
      </article>
      <aside className="no-print h-fit rounded-3xl border border-line bg-surface px-5 py-6">
        <p className="text-sm text-muted">Internship readiness</p>
        <p className="mt-2 font-display text-5xl">{percent}%</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-background">
          <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-4 leading-6">{readinessBand(percent)}</p>
        <dl className="mt-6 flex flex-col gap-4 text-sm leading-6">
          <div>
            <dt className="text-muted">GP internships</dt>
            <dd>{notes.gp}</dd>
          </div>
          <div>
            <dt className="text-muted">GP Accelerator</dt>
            <dd>{notes.accelerator}</dd>
          </div>
          <div>
            <dt className="text-muted">Corporate partners</dt>
            <dd>{notes.partners}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="no-print inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm"
      onClick={() => {
        const fallback = () => {
          const area = document.createElement("textarea");
          area.value = text;
          area.setAttribute("readonly", "");
          area.style.position = "fixed";
          area.style.left = "-9999px";
          document.body.appendChild(area);
          area.select();
          document.execCommand("copy");
          area.remove();
        };
        if (navigator.clipboard?.writeText) {
          void navigator.clipboard.writeText(text).catch(fallback);
        } else {
          fallback();
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
