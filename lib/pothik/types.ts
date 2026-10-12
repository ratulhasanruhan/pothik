// Shared types for the Pothik assessment flow.

export type Mode = "standard" | "focus";
export type Lang = "en" | "bn";

export interface Message {
  role: "user" | "model";
  text: string;
  /** Set on user turns that were a "skip" or "not sure" quick reply. */
  quick?: "skip" | "unsure";
}

/** One assessment turn returned by /api/assess. */
export interface AssessReply {
  message: string;
  /** Short tappable answer ideas for the current question. */
  suggestions: string[];
  done: boolean;
  /** True when the user's last answer showed serious distress or hopelessness. */
  distress: boolean;
}

export type Difficulty = "easy" | "medium" | "hard";

export interface CareerPath {
  title: string;
  whyItFits: string;
  salaryRangeBdt: string;
  keySkills: string[];
  difficulty: Difficulty;
  soloFriendly: boolean;
}

export interface RoadmapWeek {
  week: number;
  focus: string;
  tasks: RoadmapTask[];
}

export interface RoadmapTask {
  title: string;
  minutes: number;
}

export interface RoadmapPhase {
  label: string;
  goal: string;
  weeks: RoadmapWeek[];
}

export interface Resource {
  skill: string;
  platform: string;
  /** The exact course name or search phrase to type on the platform. */
  searchPhrase: string;
  cost: "free" | "low-cost";
}

export interface Result {
  profileSummary: string;
  careerPaths: CareerPath[];
  skillGap: { have: string[]; need: string[] };
  roadmap: RoadmapPhase[];
  resources: Resource[];
  firstSmallStep: { task: string; minutes: number };
  /** Standard mode: networking, CV, LinkedIn and interview tips. */
  jobTips: { topic: string; tip: string }[];
  /** Focus mode: low-pressure "send one message" scripts for introverts. */
  messageScripts: { situation: string; script: string }[];
  /** Focus mode: general productivity tips (not medical advice). */
  stayOnTrackTips: string[];
}
