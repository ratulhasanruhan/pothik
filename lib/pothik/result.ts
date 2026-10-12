import { PLATFORMS } from "./prompts";
import type { CareerPath, Difficulty, Resource, Result, RoadmapPhase } from "./types";

// The model is asked for structured JSON, but we still check every field so a
// partial or odd answer can never crash the results screen.

const URL_PATTERN = /\b(?:https?:\/\/|www\.)\S+/gi;

/** Text with any URL removed: links only ever come from our own platform list. */
function text(value: unknown, max = 600): string {
  return typeof value === "string" ? value.replace(URL_PATTERN, "").trim().slice(0, max) : "";
}

function list(value: unknown, max = 12): string[] {
  return Array.isArray(value) ? value.map((item) => text(item, 160)).filter(Boolean).slice(0, max) : [];
}

function minutes(value: unknown, fallback: number) {
  const n = typeof value === "number" ? Math.round(value) : NaN;
  return Number.isFinite(n) && n > 0 && n <= 240 ? n : fallback;
}

function objects(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === "object") : [];
}

export function normalizeResult(raw: unknown): Result | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const careerPaths: CareerPath[] = objects(r.careerPaths)
    .map((p) => ({
      title: text(p.title, 120),
      whyItFits: text(p.whyItFits),
      salaryRangeBdt: text(p.salaryRangeBdt, 80),
      keySkills: list(p.keySkills, 8),
      difficulty: (["easy", "medium", "hard"].includes(p.difficulty as string)
        ? p.difficulty
        : "medium") as Difficulty,
      soloFriendly: p.soloFriendly === true,
    }))
    .filter((p) => p.title)
    .slice(0, 3);

  const roadmap: RoadmapPhase[] = objects(r.roadmap)
    .map((phase) => ({
      label: text(phase.label, 60),
      goal: text(phase.goal, 300),
      weeks: objects(phase.weeks).map((week, index) => ({
        week: typeof week.week === "number" ? week.week : index + 1,
        focus: text(week.focus, 200),
        tasks: objects(week.tasks)
          .map((task) => ({ title: text(task.title, 240), minutes: minutes(task.minutes, 20) }))
          .filter((task) => task.title)
          .slice(0, 7),
      })),
    }))
    .filter((phase) => phase.weeks.length > 0)
    .slice(0, 3);

  const resources: Resource[] = objects(r.resources)
    .map((item) => ({
      skill: text(item.skill, 100),
      platform: (PLATFORMS as readonly string[]).includes(item.platform as string)
        ? (item.platform as string)
        : "YouTube",
      searchPhrase: text(item.searchPhrase, 160),
      cost: (item.cost === "low-cost" ? "low-cost" : "free") as Resource["cost"],
    }))
    .filter((item) => item.searchPhrase)
    .slice(0, 12);

  const step = (r.firstSmallStep ?? {}) as Record<string, unknown>;
  const gap = (r.skillGap ?? {}) as Record<string, unknown>;

  const result: Result = {
    profileSummary: text(r.profileSummary, 900),
    careerPaths,
    skillGap: { have: list(gap.have), need: list(gap.need) },
    roadmap,
    resources,
    firstSmallStep: { task: text(step.task, 300), minutes: Math.min(minutes(step.minutes, 10), 15) },
    jobTips: objects(r.jobTips)
      .map((t) => ({ topic: text(t.topic, 60), tip: text(t.tip, 400) }))
      .filter((t) => t.tip)
      .slice(0, 8),
    messageScripts: objects(r.messageScripts)
      .map((s) => ({ situation: text(s.situation, 120), script: text(s.script, 600) }))
      .filter((s) => s.script)
      .slice(0, 4),
    stayOnTrackTips: list(r.stayOnTrackTips, 6),
  };

  // The three core sections must be present for the review to be useful.
  if (!result.profileSummary || careerPaths.length === 0 || roadmap.length === 0) return null;
  return result;
}
