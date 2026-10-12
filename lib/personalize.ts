import { generateJson } from "./ai";
import { roles } from "./roles";
import type { RoleId, SkillStatus } from "./types";

export interface PersonalizedGuide {
  roleId: RoleId;
  statuses: Record<string, SkillStatus>;
  note: string;
}

const roleIds: RoleId[] = ["junior-mobile", "data-analyst", "digital-marketer"];

export async function personalizeGuide(input: {
  linkedinUrl: string | null;
  linkedinText: string;
  linkedinLimited: boolean;
  cvText: string;
}): Promise<PersonalizedGuide> {
  const catalog = roles.map((role) => ({
    id: role.id,
    title: role.title,
    summary: role.summary,
    nodes: role.nodes.map((node) => ({
      id: node.id,
      title: node.title,
      section: node.section,
      description: node.description,
      defaultStatus: node.defaultStatus,
    })),
  }));

  const evidence = [
    input.linkedinUrl ? `LinkedIn URL: ${input.linkedinUrl}` : "",
    input.linkedinLimited
      ? "The public LinkedIn page did not include the full profile. Do not invent jobs or skills from the URL alone."
      : "",
    input.linkedinText ? `Public LinkedIn text:\n${input.linkedinText}` : "",
    input.cvText ? `CV text:\n${input.cvText}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  // Gemini returns the role and one status per node as structured JSON.
  const parsed = await generateJson<{
    roleId?: RoleId;
    note?: string;
    statuses?: { id?: string; status?: SkillStatus }[];
  }>({
    system:
      "You match a Bangladesh entry-level job seeker to one seeded career map. Mark a skill mastered only when the CV or profile text explicitly shows that skill or a close equivalent. Mark in_progress when they have started it but have no finished example. Otherwise keep defaultStatus. Return a status for every node of the chosen role. The note is one or two sentences about what evidence you used. Do not invent employers, degrees, or skills.",
    turns: [{ role: "user", text: `Roles:\n${JSON.stringify(catalog)}\n\nEvidence:\n${evidence}` }],
    schema: {
      type: "object",
      required: ["roleId", "statuses", "note"],
      properties: {
        roleId: { type: "string", enum: roleIds },
        note: { type: "string" },
        statuses: {
          type: "array",
          items: {
            type: "object",
            required: ["id", "status"],
            properties: {
              id: { type: "string" },
              status: { type: "string", enum: ["mastered", "in_progress", "gap"] },
            },
          },
        },
      },
    },
  });

  if (!parsed.roleId || !roleIds.includes(parsed.roleId)) {
    throw new Error("The guide could not be built. Try again in a moment.");
  }

  const role = roles.find((item) => item.id === parsed.roleId);
  if (!role) throw new Error("The guide could not be built. Try again in a moment.");

  const statuses: Record<string, SkillStatus> = {};
  for (const node of role.nodes) statuses[node.id] = node.defaultStatus;
  for (const item of parsed.statuses ?? []) {
    if (!item.id || !item.status) continue;
    if (!(item.id in statuses)) continue;
    if (item.status === "mastered" || item.status === "in_progress" || item.status === "gap") {
      statuses[item.id] = item.status;
    }
  }

  const note =
    parsed.note?.replace(/\s+/g, " ").trim().slice(0, 320) ||
    "This map is a starting estimate from the profile you shared.";

  return { roleId: parsed.roleId, statuses, note };
}
