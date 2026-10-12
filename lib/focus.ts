import type { Role, SkillNode, SkillStatus } from "./types";

export function orderedNodes(role: Role): SkillNode[] {
  const rank = new Map(role.sections.map((section, index) => [section, index]));
  return role.nodes
    .map((node, index) => ({ node, index }))
    .sort((a, b) => {
      const sectionDelta = (rank.get(a.node.section) ?? 0) - (rank.get(b.node.section) ?? 0);
      return sectionDelta || a.index - b.index;
    })
    .map(({ node }) => node);
}

export function pickActiveNode(
  role: Role,
  status: Record<string, SkillStatus>,
  preferredId?: string | null,
): SkillNode | null {
  const nodes = orderedNodes(role);
  if (preferredId) {
    const preferred = nodes.find((node) => node.id === preferredId);
    if (preferred && status[preferred.id] !== "mastered") return preferred;
  }
  const inProgress = nodes.find((node) => status[node.id] === "in_progress");
  if (inProgress) return inProgress;
  return (
    nodes.find(
      (node) =>
        status[node.id] === "gap" &&
        node.prerequisites.every((id) => status[id] === "mastered"),
    ) ?? null
  );
}

export function nextOpenStep(node: SkillNode, completed: string[]) {
  return node.microSteps.find((step) => !completed.includes(step.id)) ?? null;
}
