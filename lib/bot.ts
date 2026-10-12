import { contentFor } from "./node-content";
import { getRole } from "./roles";
import type { Role, RoleId, SkillNode, SkillStatus } from "./types";

export interface BotMessage {
  role: "user" | "assistant";
  content: string;
}

const roleIds: RoleId[] = ["junior-mobile", "data-analyst", "digital-marketer"];

export function replyFromMap(role: Role, node: SkillNode | null, question: string) {
  const asked = findNode(role, question) ?? node ?? role.nodes[0];
  const { lesson, resources } = contentFor(asked);
  const links = resources
    .map((item) => `${item.kind}: ${item.title} — ${item.summary} ${item.url}`)
    .join("\n");
  const steps = asked.microSteps.map((step, index) => `${index + 1}. ${step.label}`).join("\n");
  return [
    `${asked.title} is the skill to work on for ${role.title}.`,
    lesson,
    steps ? `Do these in order:\n${steps}` : "",
    links ? `Resources:\n${links}` : "Use the 2-minute steps on this skill. A course link is not attached yet.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function contextForBot(role: Role, node: SkillNode | null, statuses: Record<string, SkillStatus>) {
  const open = role.nodes.filter((item) => statuses[item.id] !== "mastered");
  const focus = node ?? open[0] ?? role.nodes[0];
  const { lesson, resources } = contentFor(focus);
  const resourceLines = resources
    .map((item) => `- ${item.kind}: ${item.title}. ${item.summary} ${item.url}`)
    .join("\n");
  return [
    "You are the পথিক career bot for entry-level roles in Bangladesh.",
    "Answer in short paragraphs. Recommend only the resources listed below. When you name a resource, include its exact URL. Do not invent courses, links, jobs, or employers.",
    `Goal: ${role.title}. ${role.summary}`,
    `Open skills: ${open.map((item) => item.title).join(", ") || "none"}.`,
    `Current skill: ${focus.title}. ${focus.description}`,
    `Lesson: ${lesson}`,
    `Steps: ${focus.microSteps.map((step) => step.label).join(" | ")}`,
    resourceLines ? `Resources:\n${resourceLines}` : "No external resources are listed for this skill.",
  ].join("\n");
}

export function parseBotRequest(body: unknown) {
  const raw = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const roleId = roleIds.find((id) => id === raw.roleId);
  if (!roleId) return null;
  const role = getRole(roleId);
  const skillId = typeof raw.skillId === "string" ? raw.skillId : "";
  const node = role.nodes.find((item) => item.id === skillId) ?? null;
  const statuses: Record<string, SkillStatus> = {};
  const incoming = raw.statuses && typeof raw.statuses === "object" ? (raw.statuses as Record<string, unknown>) : {};
  for (const item of role.nodes) {
    const status = incoming[item.id];
    statuses[item.id] = status === "mastered" || status === "in_progress" || status === "gap" ? status : "gap";
  }
  const messages = Array.isArray(raw.messages)
    ? raw.messages.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Partial<BotMessage>;
        if (row.role !== "user" && row.role !== "assistant") return [];
        const content = typeof row.content === "string" ? row.content.replace(/\s+/g, " ").trim().slice(0, 800) : "";
        if (!content) return [];
        return [{ role: row.role, content }];
      }).slice(-8)
    : [];
  return { role, node, statuses, messages };
}

function findNode(role: Role, question: string) {
  const text = question.toLowerCase();
  return role.nodes.find((node) => text.includes(node.title.toLowerCase())) ?? null;
}
