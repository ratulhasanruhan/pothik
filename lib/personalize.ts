import { safePhotoUrl } from "./photo-url";
import { roles } from "./roles";
import type { PublicLinkedIn } from "./read-profile";
import type { CareerGuide, LinkedInProfile, RoleId, SkillStatus } from "./types";

const roleIds: RoleId[] = ["junior-mobile", "data-analyst", "digital-marketer"];

const line = { type: "string" } as const;
const experience = {
  type: "object",
  additionalProperties: false,
  required: ["role", "organization", "time"],
  properties: { role: line, organization: line, time: line },
};
const school = {
  type: "object",
  additionalProperties: false,
  required: ["school", "detail"],
  properties: { school: line, detail: line },
};
const statusItem = {
  type: "object",
  additionalProperties: false,
  required: ["id", "status", "reason"],
  properties: {
    id: line,
    status: { type: "string", enum: ["mastered", "in_progress", "gap"] },
    reason: line,
  },
};

export async function personalizeGuide(input: {
  linkedinUrl: string | null;
  linkedin: PublicLinkedIn;
  cvText: string;
}): Promise<CareerGuide> {
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
    input.linkedinUrl ? `LinkedIn URL: ${input.linkedinUrl}` : "No LinkedIn URL was provided.",
    input.linkedin.limited
      ? "LinkedIn did not publish the full profile. Leave unknown LinkedIn fields empty. Do not invent jobs, schools, or skills."
      : "",
    input.linkedin.name ? `Parsed name: ${input.linkedin.name}` : "",
    input.linkedin.headline ? `Parsed headline: ${input.linkedin.headline}` : "",
    input.linkedin.location ? `Parsed location: ${input.linkedin.location}` : "",
    input.linkedin.text ? `Public LinkedIn text:\n${input.linkedin.text}` : "",
    input.cvText ? `CV text:\n${input.cvText}` : "No CV was uploaded.",
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
            required: [
              "roleId",
              "analysis",
              "strengths",
              "gaps",
              "nextStep",
              "suggestedHeadline",
              "suggestedAbout",
              "linkedin",
              "statuses",
            ],
            properties: {
              roleId: { type: "string", enum: roleIds },
              analysis: line,
              strengths: { type: "array", items: line },
              gaps: { type: "array", items: line },
              nextStep: line,
              suggestedHeadline: line,
              suggestedAbout: line,
              linkedin: {
                type: "object",
                additionalProperties: false,
                required: ["name", "headline", "location", "about", "experiences", "education", "skills"],
                properties: {
                  name: line,
                  headline: line,
                  location: line,
                  about: line,
                  experiences: { type: "array", items: experience },
                  education: { type: "array", items: school },
                  skills: { type: "array", items: line },
                },
              },
              statuses: { type: "array", items: statusItem },
            },
          },
        },
      },
      messages: [
        {
          role: "system",
          content: [
            "You build a career guide for a job seeker in Bangladesh.",
            "Copy LinkedIn fields only when that fact appears in the evidence. If it does not appear, use an empty string or an empty list.",
            "Do not invent employers, job titles, schools, dates, locations, or skills.",
            "Choose one seeded role. Mark a skill mastered only when the evidence shows it. Mark in_progress when it is started but unfinished. Otherwise keep defaultStatus.",
            "Give one short reason for every node of the chosen role.",
            "analysis is 2 or 3 sentences on the fit. strengths and gaps are short phrases. nextStep is one concrete action.",
            "suggestedHeadline and suggestedAbout are ready to paste on LinkedIn and must only claim skills the evidence supports.",
          ].join(" "),
        },
        { role: "user", content: `Roles:\n${JSON.stringify(catalog)}\n\nEvidence:\n${evidence}` },
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
  return normalizeGuide(JSON.parse(content), input);
}

function normalizeGuide(
  parsed: {
    roleId?: RoleId;
    analysis?: string;
    strengths?: string[];
    gaps?: string[];
    nextStep?: string;
    suggestedHeadline?: string;
    suggestedAbout?: string;
    linkedin?: Partial<LinkedInProfile>;
    statuses?: { id?: string; status?: SkillStatus; reason?: string }[];
  },
  input: { linkedinUrl: string | null; linkedin: PublicLinkedIn; cvText: string },
): CareerGuide {
  if (!parsed.roleId || !roleIds.includes(parsed.roleId)) {
    throw new Error("The guide could not be built. Try again in a moment.");
  }
  const role = roles.find((item) => item.id === parsed.roleId);
  if (!role) throw new Error("The guide could not be built. Try again in a moment.");

  const source = `${input.linkedin.text}\n${input.cvText}`.toLowerCase();
  const keep = (value: string) => {
    const text = value.replace(/\s+/g, " ").trim();
    if (!text) return "";
    const probe = text.toLowerCase().slice(0, 48);
    return source.includes(probe) ? text : "";
  };

  const statuses: Record<string, SkillStatus> = {};
  const reasons: Record<string, string> = {};
  for (const node of role.nodes) statuses[node.id] = node.defaultStatus;
  for (const item of parsed.statuses ?? []) {
    if (!item.id || !(item.id in statuses)) continue;
    if (item.status === "mastered" || item.status === "in_progress" || item.status === "gap") {
      statuses[item.id] = item.status;
    }
    const reason = item.reason?.replace(/\s+/g, " ").trim().slice(0, 180);
    if (reason) reasons[item.id] = reason;
  }

  const profile = parsed.linkedin;
  const experiences = (profile?.experiences ?? [])
    .map((item) => ({
      role: keep(item.role),
      organization: keep(item.organization),
      time: keep(item.time),
    }))
    .filter((item) => item.role || item.organization)
    .slice(0, 4);
  const education = (profile?.education ?? [])
    .map((item) => ({ school: keep(item.school), detail: keep(item.detail) }))
    .filter((item) => item.school)
    .slice(0, 3);
  const skills = (profile?.skills ?? []).map((skill) => keep(skill)).filter(Boolean).slice(0, 12);

  const linkedin: LinkedInProfile | null = input.linkedinUrl
    ? {
        url: input.linkedinUrl,
        name: keep(profile?.name ?? "") || input.linkedin.name,
        headline: keep(profile?.headline ?? "") || input.linkedin.headline,
        location: keep(profile?.location ?? "") || input.linkedin.location,
        about: keep(profile?.about ?? "") || keep(input.linkedin.about),
        experiences,
        education,
        skills,
        photoUrl: safePhotoUrl(input.linkedin.photoUrl),
        limited: input.linkedin.limited,
      }
    : null;

  return {
    roleId: parsed.roleId,
    statuses,
    reasons,
    analysis:
      parsed.analysis?.replace(/\s+/g, " ").trim().slice(0, 800) ||
      "This map is a starting estimate from the profile you shared.",
    strengths: (parsed.strengths ?? []).map((item) => item.trim()).filter(Boolean).slice(0, 4),
    gaps: (parsed.gaps ?? []).map((item) => item.trim()).filter(Boolean).slice(0, 4),
    nextStep: parsed.nextStep?.replace(/\s+/g, " ").trim().slice(0, 240) || "",
    suggestedHeadline: parsed.suggestedHeadline?.replace(/\s+/g, " ").trim().slice(0, 220) || "",
    suggestedAbout: parsed.suggestedAbout?.replace(/\s+/g, " ").trim().slice(0, 800) || "",
    linkedin,
  };
}
