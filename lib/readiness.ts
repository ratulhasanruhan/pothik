import type { Role, SkillStatus } from "./types";

export function readinessPercent(role: Role, status: Record<string, SkillStatus>) {
  if (role.nodes.length === 0) return 0;
  const mastered = role.nodes.filter((node) => status[node.id] === "mastered").length;
  return Math.round((mastered / role.nodes.length) * 100);
}

export function readinessBand(percent: number) {
  if (percent >= 70) return "Ready for entry-level applications.";
  if (percent >= 40) return "Building proof. Keep the current skill moving.";
  return "Early map. Finish the open skill before collecting more options.";
}
