import { getRole } from "./roles";
import { safePhotoUrl } from "./photo-url";
import type {
  CareerGuide,
  LinkedInProfile,
  Role,
  RoleId,
  RoleProgress,
  SkillStatus,
  Store,
  Streak,
} from "./types";

export const STORAGE_KEY = "focuscareer-v1";

export function emptyStore(): Store {
  return {
    selectedRoleId: null,
    roles: {},
    streak: { count: 0, lastActiveDate: null },
    guide: null,
    adhdMode: false,
  };
}

export function initialRoleProgress(role: Role): RoleProgress {
  return {
    nodeStatus: Object.fromEntries(role.nodes.map((node) => [node.id, node.defaultStatus])),
    completedSteps: [],
  };
}

export function localDate(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function touchStreak(streak: Streak, date = new Date()): Streak {
  const today = localDate(date);
  if (streak.lastActiveDate === today) return streak;
  const previous = new Date(date);
  previous.setDate(previous.getDate() - 1);
  if (streak.lastActiveDate === localDate(previous)) {
    return { count: streak.count + 1, lastActiveDate: today };
  }
  return { count: 1, lastActiveDate: today };
}

function isStatus(value: unknown): value is SkillStatus {
  return value === "mastered" || value === "in_progress" || value === "gap";
}

function sanitizeProgress(roleId: RoleId, value: unknown): RoleProgress | null {
  if (!value || typeof value !== "object") return null;
  const role = getRole(roleId);
  const raw = value as Partial<RoleProgress>;
  const base = initialRoleProgress(role);
  if (raw.nodeStatus && typeof raw.nodeStatus === "object") {
    for (const node of role.nodes) {
      const status = raw.nodeStatus[node.id];
      if (isStatus(status)) base.nodeStatus[node.id] = status;
    }
  }
  const known = new Set(role.nodes.flatMap((node) => node.microSteps.map((step) => step.id)));
  if (Array.isArray(raw.completedSteps)) {
    base.completedSteps = raw.completedSteps.filter(
      (id): id is string => typeof id === "string" && known.has(id),
    );
  }
  return base;
}

export function sanitizeStore(value: unknown): Store {
  const empty = emptyStore();
  if (!value || typeof value !== "object") return empty;
  const raw = value as Partial<Store>;
  const roles: Store["roles"] = {};
  const roleIds: RoleId[] = ["junior-mobile", "data-analyst", "digital-marketer"];
  for (const roleId of roleIds) {
    const progress = sanitizeProgress(roleId, raw.roles?.[roleId]);
    if (progress) roles[roleId] = progress;
  }
  const selected =
    raw.selectedRoleId && roleIds.includes(raw.selectedRoleId) ? raw.selectedRoleId : null;
  const streak = raw.streak;
  return {
    selectedRoleId: selected && roles[selected] ? selected : selected,
    roles,
    streak: {
      count: typeof streak?.count === "number" && streak.count >= 0 ? streak.count : 0,
      lastActiveDate: typeof streak?.lastActiveDate === "string" ? streak.lastActiveDate : null,
    },
    guide: sanitizeGuide(raw.guide),
    adhdMode: raw.adhdMode === true,
  };
}

function clip(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function clipList(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => clip(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function sanitizeGuide(value: unknown): CareerGuide | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<CareerGuide>;
  const roleIds: RoleId[] = ["junior-mobile", "data-analyst", "digital-marketer"];
  if (!raw.roleId || !roleIds.includes(raw.roleId)) return null;
  const role = getRole(raw.roleId);
  const statuses = initialRoleProgress(role).nodeStatus;
  const reasons: Record<string, string> = {};
  if (raw.statuses && typeof raw.statuses === "object") {
    for (const node of role.nodes) {
      const status = raw.statuses[node.id];
      if (status === "mastered" || status === "in_progress" || status === "gap") {
        statuses[node.id] = status;
      }
      const reason = clip(raw.reasons?.[node.id], 180);
      if (reason) reasons[node.id] = reason;
    }
  }
  return {
    roleId: raw.roleId,
    statuses,
    reasons,
    analysis: clip(raw.analysis, 800),
    strengths: clipList(raw.strengths, 4, 160),
    gaps: clipList(raw.gaps, 4, 160),
    nextStep: clip(raw.nextStep, 240),
    suggestedHeadline: clip(raw.suggestedHeadline, 220),
    suggestedAbout: clip(raw.suggestedAbout, 800),
    linkedin: sanitizeLinkedIn(raw.linkedin),
  };
}

function sanitizeLinkedIn(value: unknown): LinkedInProfile | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<LinkedInProfile>;
  const url = clip(raw.url, 300);
  if (!url) return null;
  const experiences = Array.isArray(raw.experiences)
    ? raw.experiences.slice(0, 4).flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Partial<LinkedInProfile["experiences"][number]>;
        const role = clip(row.role, 120);
        const organization = clip(row.organization, 120);
        if (!role && !organization) return [];
        return [{ role, organization, time: clip(row.time, 80) }];
      })
    : [];
  const education = Array.isArray(raw.education)
    ? raw.education.slice(0, 3).flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Partial<LinkedInProfile["education"][number]>;
        const school = clip(row.school, 120);
        if (!school) return [];
        return [{ school, detail: clip(row.detail, 160) }];
      })
    : [];
  return {
    url,
    name: clip(raw.name, 120),
    headline: clip(raw.headline, 220),
    location: clip(raw.location, 120),
    about: clip(raw.about, 800),
    experiences,
    education,
    skills: clipList(raw.skills, 12, 60),
    photoUrl: safePhotoUrl(clip(raw.photoUrl, 500)),
    limited: raw.limited === true,
  };
}

export function loadStore(): Store {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    return sanitizeStore(JSON.parse(raw));
  } catch {
    return emptyStore();
  }
}

export function saveStore(store: Store) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}
