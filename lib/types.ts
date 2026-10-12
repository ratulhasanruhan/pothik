export type SkillStatus = "mastered" | "in_progress" | "gap";

export type RoleId = "junior-mobile" | "data-analyst" | "digital-marketer";

export interface MicroStep {
  id: string;
  label: string;
}

export interface GpCourse {
  title: string;
  summary: string;
  url: string;
}

export interface SkillNode {
  id: string;
  title: string;
  section: string;
  description: string;
  defaultStatus: SkillStatus;
  prerequisites: string[];
  microSteps: MicroStep[];
  resumeBullet: string;
  linkedinSkill: string;
  course?: GpCourse;
}

export interface Role {
  id: RoleId;
  title: string;
  summary: string;
  sections: string[];
  headline: string;
  about: string;
  nodes: SkillNode[];
  readinessNotes: {
    gp: string;
    accelerator: string;
    partners: string;
  };
}

export interface RoleProgress {
  nodeStatus: Record<string, SkillStatus>;
  completedSteps: string[];
}

export interface Streak {
  count: number;
  lastActiveDate: string | null;
}

export interface Store {
  selectedRoleId: RoleId | null;
  roles: Partial<Record<RoleId, RoleProgress>>;
  streak: Streak;
  note: string | null;
}
