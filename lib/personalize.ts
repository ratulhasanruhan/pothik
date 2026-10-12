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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Add OPENAI_API_KEY to .env.local, then restart the app.");
  }

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

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "career_guide",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["roleId", "statuses", "note"],
            properties: {
              roleId: { type: "string", enum: roleIds },
              note: { type: "string" },
              statuses: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["id", "status"],
                  properties: {
                    id: { type: "string" },
                    status: { type: "string", enum: ["mastered", "in_progress", "gap"] },
                  },
                },
              },
            },
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "You match a Bangladesh entry-level job seeker to one seeded career map. Mark a skill mastered only when the CV or profile text explicitly shows that skill or a close equivalent. Mark in_progress when they have started it but have no finished example. Otherwise keep defaultStatus. Return a status for every node of the chosen role. The note is one or two sentences about what evidence you used. Do not invent employers, degrees, or skills.",
        },
        {
          role: "user",
          content: `Roles:\n${JSON.stringify(catalog)}\n\nEvidence:\n${evidence}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("The OpenAI API key was rejected. Check OPENAI_API_KEY in .env.local.");
    }
    throw new Error("The guide could not be built. Try again in a moment.");
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("The guide could not be built. Try again in a moment.");

  const parsed = JSON.parse(content) as {
    roleId?: RoleId;
    note?: string;
    statuses?: { id?: string; status?: SkillStatus }[];
  };
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
