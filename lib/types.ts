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

export interface LinkedInExperience {
  role: string;
  organization: string;
  time: string;
}

export interface LinkedInEducation {
  school: string;
  detail: string;
}

export interface LinkedInProfile {
  url: string;
  name: string;
  headline: string;
  location: string;
  about: string;
  experiences: LinkedInExperience[];
  education: LinkedInEducation[];
  skills: string[];
  photoUrl: string;
  limited: boolean;
}

export interface CareerGuide {
  roleId: RoleId;
  statuses: Record<string, SkillStatus>;
  reasons: Record<string, string>;
  analysis: string;
  strengths: string[];
  gaps: string[];
  nextStep: string;
  suggestedHeadline: string;
  suggestedAbout: string;
  linkedin: LinkedInProfile | null;
}

export interface Store {
  selectedRoleId: RoleId | null;
  roles: Partial<Record<RoleId, RoleProgress>>;
  streak: Streak;
  guide: CareerGuide | null;
  adhdMode: boolean;
}
