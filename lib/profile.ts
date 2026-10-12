import type { Role, SkillStatus } from "./types";

export function buildProfile(role: Role, status: Record<string, SkillStatus>) {
  const mastered = role.nodes.filter((node) => status[node.id] === "mastered");
  const skills = mastered.map((node) => node.linkedinSkill);
  const shown = skills.slice(0, 3).join(" · ");
  const headline = role.headline.replaceAll("{skills}", shown || "learning in public");
  const about = skills.length
    ? role.about.replaceAll("{skills}", skills.join(", "))
    : `I am building toward ${role.title}. My next step is the first open skill on my map. I want an entry-level role in Bangladesh, including Grameenphone, a GP Accelerator startup, or a partner team.`;
  const tags = [
    ...new Set(
      role.nodes
        .filter((node) => status[node.id] !== "gap")
        .map((node) => node.linkedinSkill),
    ),
  ];
  return {
    headline,
    about,
    bullets: mastered.map((node) => node.resumeBullet),
    tags,
  };
}
