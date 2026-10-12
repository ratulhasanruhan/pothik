"use client";

import { useState } from "react";
import type { Strings } from "@/lib/pothik/i18n";
import { googleSearchUrl, PLATFORM_HOMES } from "@/lib/pothik/platforms";
import type { Result, RoadmapTask } from "@/lib/pothik/types";
import { useSession } from "./session";

interface FlatTask extends RoadmapTask {
  key: string;
  week: number;
  /** 1-based position in the whole plan; in Focus mode this is the day number. */
  index: number;
}

/** Flattens the roadmap into an ordered task list with stable keys for progress. */
function flatten(result: Result): FlatTask[] {
  const tasks: FlatTask[] = [];
  result.roadmap.forEach((phase, p) =>
    phase.weeks.forEach((week, w) =>
      week.tasks.forEach((task, i) =>
        tasks.push({ ...task, key: `${p}-${w}-${i}`, week: week.week, index: tasks.length + 1 }),
      ),
    ),
  );
  return tasks;
}

/** The structured career review, rendered as cards. */
export function Results() {
  const { t, plan, toggleTask, reset } = useSession();
  const [weekOneOnly, setWeekOneOnly] = useState(plan?.mode === "focus");
  if (!plan) return null;

  const { result, mode, doneTasks } = plan;
  const focus = mode === "focus";
  const done = new Set(doneTasks);
  const tasks = flatten(result);
  const firstWeek = result.roadmap[0]?.weeks[0]?.week ?? 1;
  const visible = focus && weekOneOnly ? tasks.filter((task) => task.week === firstWeek) : tasks;
  const visibleDone = visible.filter((task) => done.has(task.key)).length;
  const today = visible.find((task) => !done.has(task.key)) ?? null;
  const textSize = focus ? "text-lg leading-8" : "leading-7";

  return (
    <div className={`flex flex-col gap-6 ${focus ? "gap-8" : ""}`}>
      {focus ? (
        <TodayCard t={t} task={today} onDone={(key) => toggleTask(key)} allDone={visible.length > 0 && !today} />
      ) : null}

      <Card title={t.firstStep} highlight={!focus}>
        <p className={textSize}>{result.firstSmallStep.task}</p>
        <p className="mt-2 text-sm text-muted">
          {t.minutes(result.firstSmallStep.minutes)} · {t.firstStepHint}
        </p>
      </Card>

      <Card title={t.profileSummary}>
        <p className={textSize}>{result.profileSummary}</p>
      </Card>

      <section>
        <h2 className="mb-3 font-display text-2xl">{t.careerPaths}</h2>
        <div className="flex flex-col gap-4">
          {result.careerPaths.map((path, index) => (
            <article key={path.title} className="rounded-3xl border border-line bg-surface p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-xl">
                  {index + 1}. {path.title}
                </h3>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge>
                    {t.difficulty}: {t.difficultyLabel[path.difficulty]}
                  </Badge>
                  {path.soloFriendly ? <Badge>{t.soloFriendly}</Badge> : null}
                </div>
              </div>
              <dl className={`mt-3 flex flex-col gap-3 ${textSize}`}>
                <div>
                  <dt className="text-sm text-muted">{t.whyFits}</dt>
                  <dd>{path.whyItFits}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">{t.salary}</dt>
                  <dd className="font-medium">{path.salaryRangeBdt}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">{t.keySkills}</dt>
                  <dd className="mt-1 flex flex-wrap gap-2">
                    {path.keySkills.map((skill) => (
                      <Badge key={skill}>{skill}</Badge>
                    ))}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <Card title={t.skillGap}>
        <div className="grid gap-4 sm:grid-cols-2">
          <SkillList title={t.youHave} items={result.skillGap.have} tone="have" />
          <SkillList title={t.youNeed} items={result.skillGap.need} tone="need" />
        </div>
      </Card>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl">{t.roadmap}</h2>
          {focus ? (
            <div role="group" className="no-print inline-flex rounded-full border border-line p-0.5">
              {[true, false].map((value) => (
                <button
                  key={String(value)}
                  type="button"
                  aria-pressed={weekOneOnly === value}
                  onClick={() => setWeekOneOnly(value)}
                  className={`min-h-9 rounded-full px-3 text-sm ${
                    weekOneOnly === value ? "bg-accent text-white dark:text-background" : "text-muted"
                  }`}
                >
                  {value ? t.chunkWeek1 : t.chunkAll}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <ProgressBar t={t} done={visibleDone} total={visible.length} gentle={focus} />

        {focus ? (
          <ol className="mt-4 flex flex-col gap-2">
            {visible.map((task) => (
              <TaskRow
                key={task.key}
                label={`${t.day(task.index)} · ${task.title}`}
                minutes={t.minutes(task.minutes)}
                checked={done.has(task.key)}
                onToggle={() => toggleTask(task.key)}
                large
              />
            ))}
          </ol>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {result.roadmap.map((phase, p) => (
              <article key={p} className="rounded-3xl border border-line bg-surface p-5">
                <h3 className="font-display text-xl">
                  {t.phase(p)}
                  {phase.label ? <span className="text-muted"> · {phase.label}</span> : null}
                </h3>
                <p className="mt-1 text-muted">{phase.goal}</p>
                <div className="mt-4 flex flex-col gap-4">
                  {phase.weeks.map((week, w) => (
                    <div key={week.week}>
                      <h4 className="font-medium">
                        {t.week(week.week)} · <span className="text-muted">{week.focus}</span>
                      </h4>
                      <ul className="mt-2 flex flex-col gap-2">
                        {week.tasks.map((task, i) => {
                          const key = `${p}-${w}-${i}`;
                          return (
                            <TaskRow
                              key={key}
                              label={task.title}
                              minutes={t.minutes(task.minutes)}
                              checked={done.has(key)}
                              onToggle={() => toggleTask(key)}
                            />
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Card title={t.resources}>
        <ul className="flex flex-col gap-4">
          {result.resources.map((resource, index) => (
            <li key={index} className="border-b border-line pb-4 last:border-0 last:pb-0">
              <p className="text-sm text-muted">
                {resource.skill} · {resource.cost === "free" ? t.free : t.lowCost}
              </p>
              <p className="mt-1 font-medium">{resource.platform}</p>
              <p className={textSize}>
                {t.searchFor}: “{resource.searchPhrase}”
              </p>
              <div className="no-print mt-2 flex flex-wrap gap-3 text-sm">
                {PLATFORM_HOMES[resource.platform] ? (
                  <a
                    href={PLATFORM_HOMES[resource.platform]}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline underline-offset-4"
                  >
                    {t.openPlatform} {resource.platform}
                  </a>
                ) : null}
                <a
                  href={googleSearchUrl(resource.platform, resource.searchPhrase)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline underline-offset-4"
                >
                  {t.searchGoogle}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {result.jobTips.length > 0 ? (
        <Card title={t.jobTips}>
          <ul className="flex flex-col gap-3">
            {result.jobTips.map((tip, index) => (
              <li key={index} className={textSize}>
                <span className="font-medium">{tip.topic}: </span>
                {tip.tip}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {result.messageScripts.length > 0 ? (
        <Card title={t.scripts}>
          <p className="mb-4 text-muted">{t.scriptsHint}</p>
          <ul className="flex flex-col gap-4">
            {result.messageScripts.map((script, index) => (
              <li key={index} className="rounded-2xl border border-line bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-muted">{script.situation}</p>
                  <CopyButton t={t} text={script.script} />
                </div>
                <p className={`mt-2 whitespace-pre-line ${textSize}`}>{script.script}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {result.stayOnTrackTips.length > 0 ? (
        <Card title={t.stayOnTrack}>
          <p className="mb-3 text-sm text-muted">{t.stayOnTrackHint}</p>
          <ul className={`flex list-disc flex-col gap-2 pl-5 ${textSize}`}>
            {result.stayOnTrackTips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <p className="text-sm leading-6 text-muted">{t.aiNote}</p>

      <div className="no-print flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-12 items-center rounded-full bg-accent px-5 text-white dark:text-background"
        >
          {t.printPlan}
        </button>
        <button
          type="button"
          onClick={() => downloadText(result, t)}
          className="inline-flex min-h-12 items-center rounded-full border border-line px-5"
        >
          {t.downloadText}
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(t.startOverConfirm)) reset();
          }}
          className="inline-flex min-h-12 items-center rounded-full border border-line px-5"
        >
          {t.startOver}
        </button>
      </div>
    </div>
  );
}

function Card({
  title,
  highlight,
  children,
}: {
  title: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-3xl border p-5 ${highlight ? "border-accent bg-accent-soft" : "border-line bg-surface"}`}
    >
      <h2 className="mb-3 font-display text-2xl">{title}</h2>
      {children}
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-accent-soft px-3 py-1 text-sm text-accent">{children}</span>;
}

function SkillList({ title, items, tone }: { title: string; items: string[]; tone: "have" | "need" }) {
  return (
    <div>
      <h3 className="text-sm text-muted">{title}</h3>
      <ul className="mt-2 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span
              aria-hidden
              className={`mt-2 size-2.5 shrink-0 rounded-full ${tone === "have" ? "bg-mastered" : "bg-gap"}`}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TaskRow({
  label,
  minutes,
  checked,
  onToggle,
  large,
}: {
  label: string;
  minutes: string;
  checked: boolean;
  onToggle: () => void;
  large?: boolean;
}) {
  return (
    <li>
      <label
        className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border border-line bg-background px-3 py-3 ${
          large ? "text-lg leading-8" : "leading-6"
        }`}
      >
        <input type="checkbox" checked={checked} onChange={onToggle} className="mt-1.5 size-5 shrink-0 accent-accent" />
        <span className={`flex-1 ${checked ? "text-muted line-through" : ""}`}>{label}</span>
        <span className="shrink-0 text-sm text-muted">{minutes}</span>
      </label>
    </li>
  );
}

function ProgressBar({ t, done, total, gentle }: { t: Strings; done: number; total: number; gentle: boolean }) {
  const ratio = total ? done / total : 0;
  const message = t.encourage[Math.min(Math.floor(ratio * t.encourage.length), t.encourage.length - 1)];
  return (
    <div className="no-print">
      <div className="flex flex-wrap justify-between gap-2 text-sm text-muted">
        <span>{t.progress(done, total)}</span>
        {gentle ? <span>{message}</span> : null}
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-accent-soft">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

function TodayCard({
  t,
  task,
  onDone,
  allDone,
}: {
  t: Strings;
  task: FlatTask | null;
  onDone: (key: string) => void;
  allDone: boolean;
}) {
  return (
    <section className="rounded-3xl border-2 border-accent bg-accent-soft p-6">
      <p className="text-sm text-muted">{t.todayTask}</p>
      {task ? (
        <>
          <p className="mt-3 font-display text-2xl leading-snug sm:text-3xl">{task.title}</p>
          <p className="mt-2 text-muted">
            {t.day(task.index)} · {t.minutes(task.minutes)} · {t.todayHint}
          </p>
          <button
            type="button"
            onClick={() => onDone(task.key)}
            className="no-print mt-5 inline-flex min-h-12 items-center rounded-full bg-accent px-6 text-white dark:text-background"
          >
            {t.markDone}
          </button>
        </>
      ) : allDone ? (
        <p className="mt-3 font-display text-2xl leading-snug">{t.allDone}</p>
      ) : null}
    </section>
  );
}

function CopyButton({ t, text }: { t: Strings; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="no-print inline-flex min-h-9 shrink-0 items-center rounded-full border border-line px-3 text-sm"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? t.copied : t.copy}
    </button>
  );
}

/** Saves the plan as a plain-text file. */
function downloadText(result: Result, t: Strings) {
  const lines: string[] = [t.appName, "", `${t.profileSummary}`, result.profileSummary, "", t.careerPaths];
  result.careerPaths.forEach((path, i) => {
    lines.push(
      `${i + 1}. ${path.title}`,
      `   ${t.whyFits}: ${path.whyItFits}`,
      `   ${t.salary}: ${path.salaryRangeBdt}`,
      `   ${t.keySkills}: ${path.keySkills.join(", ")}`,
      `   ${t.difficulty}: ${t.difficultyLabel[path.difficulty]}`,
    );
  });
  lines.push("", t.skillGap, `${t.youHave}: ${result.skillGap.have.join(", ")}`, `${t.youNeed}: ${result.skillGap.need.join(", ")}`);
  lines.push("", t.roadmap);
  for (const [p, phase] of result.roadmap.entries()) {
    lines.push("", `${t.phase(p)} · ${phase.label}: ${phase.goal}`);
    for (const week of phase.weeks) {
      lines.push(`  ${t.week(week.week)}: ${week.focus}`);
      for (const task of week.tasks) lines.push(`    [ ] ${task.title} (${t.minutes(task.minutes)})`);
    }
  }
  lines.push("", t.resources);
  for (const r of result.resources) {
    lines.push(`- ${r.skill}: ${r.platform}, ${t.searchFor} "${r.searchPhrase}"`);
  }
  lines.push("", t.firstStep, result.firstSmallStep.task);
  if (result.jobTips.length) {
    lines.push("", t.jobTips, ...result.jobTips.map((tip) => `- ${tip.topic}: ${tip.tip}`));
  }
  if (result.messageScripts.length) {
    lines.push("", t.scripts, ...result.messageScripts.map((s) => `- ${s.situation}:\n  ${s.script}`));
  }
  if (result.stayOnTrackTips.length) {
    lines.push("", t.stayOnTrack, ...result.stayOnTrackTips.map((tip) => `- ${tip}`));
  }
  lines.push("", t.footer);

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "pothik-career-plan.txt";
  link.click();
  URL.revokeObjectURL(url);
}
