import type { SkillStatus } from "@/lib/types";

const label: Record<SkillStatus, string> = {
  mastered: "Mastered",
  in_progress: "In progress",
  gap: "Skill gap",
};

const dot: Record<SkillStatus, string> = {
  mastered: "bg-mastered",
  in_progress: "bg-progress",
  gap: "bg-gap",
};

export function StatusMark({ status }: { status: SkillStatus }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted">
      <span className={`size-2.5 rounded-full ${dot[status]}`} aria-hidden />
      {label[status]}
    </span>
  );
}
