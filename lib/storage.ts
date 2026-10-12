import { getRole } from "./roles";
import type { Role, RoleId, RoleProgress, SkillStatus, Store, Streak } from "./types";

export const STORAGE_KEY = "focuscareer-v1";

export function emptyStore(): Store {
  return {
    selectedRoleId: null,
    roles: {},
    streak: { count: 0, lastActiveDate: null },
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
