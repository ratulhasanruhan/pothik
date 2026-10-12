"use client";

import Link from "next/link";
import { StatusMark } from "@/components/status-mark";
import { useProgress } from "@/components/progress-context";
import type { SkillNode, SkillStatus } from "@/lib/types";

const statuses: SkillStatus[] = ["mastered", "in_progress", "gap"];

export function NodeDrawer({ node, onClose }: { node: SkillNode; onClose: () => void }) {
  const { progress, setStatus, toggleStep } = useProgress();
  if (!progress) return null;
  const status = progress.nodeStatus[node.id] ?? node.defaultStatus;
  const unlocked = status === "mastered";

  return (
    <aside className="flex h-full flex-col bg-surface">
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <p className="text-sm text-muted">{node.section}</p>
          <h2 className="font-display text-2xl">{node.title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 items-center rounded-full px-3 text-sm text-muted"
        >
          Close
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
        <StatusMark status={status} />
        <p className="text-base leading-7">{node.description}</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Skill status">
          {statuses.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={status === option}
              onClick={() => setStatus(node.id, option)}
              className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm ${
                status === option ? "bg-accent text-white" : "border border-line bg-background"
              }`}
            >
              {option === "mastered" ? "Mastered" : option === "in_progress" ? "In progress" : "Skill gap"}
            </button>
          ))}
        </div>
        <div>
          <h3 className="text-sm text-muted">2-minute steps</h3>
          <ul className="mt-3 flex flex-col gap-2">
            {node.microSteps.map((step) => {
              const done = progress.completedSteps.includes(step.id);
              return (
                <li key={step.id}>
                  <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border border-line bg-background px-3 py-3">
                    <input
                      type="checkbox"
                      className="mt-1 size-4 accent-accent"
                      checked={done}
                      onChange={(event) => toggleStep(node.id, step.id, event.target.checked)}
                    />
                    <span className="leading-6">{step.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
        {node.course ? (
          <a
            href={node.course.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-line bg-accent-soft px-4 py-4"
          >
            <p className="text-sm text-accent">Grameenphone Academy</p>
            <p className="mt-1 font-medium">{node.course.title}</p>
            <p className="mt-1 text-sm leading-6 text-muted">{node.course.summary}</p>
          </a>
        ) : null}
        <div className={unlocked ? "" : "opacity-70"}>
          <h3 className="text-sm text-muted">
            {unlocked ? "CV bullet" : "CV bullet unlocks when this skill is mastered"}
          </h3>
          <p className="mt-2 leading-7">{node.resumeBullet}</p>
        </div>
        <Link
          href={`/focus?node=${node.id}`}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-5 text-white"
        >
          Open in Focus
        </Link>
      </div>
    </aside>
  );
}
