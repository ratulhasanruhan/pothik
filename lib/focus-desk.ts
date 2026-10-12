export const companionLines = [
  "Stay with this sentence.",
  "Extra thoughts can wait in the parking lot.",
  "Two minutes is the whole job.",
  "You can stop when the ring closes.",
] as const;

export const starterTasks = [
  { id: "reply", label: "Reply to one message", task: "Reply to one message. Write the first sentence only." },
  { id: "headline", label: "Write one headline line", task: "Write one line you could paste as a headline." },
  { id: "note", label: "Send one follow-up", task: "Send one short follow-up. Name, request, and a date." },
] as const;

const shrinks = [
  (task: string) => task,
  (task: string) => `Open the page and read only the title. Then stop. The task is: ${task}`,
  () => "Write one sentence about where this starts.",
  () => "Put your hands on the keyboard and type the first word.",
] as const;

export function smallerStep(task: string, level: number) {
  const line = task.trim();
  if (!line) return "";
  const index = Math.max(0, Math.min(level, shrinks.length - 1));
  return shrinks[index](line);
}

export const maxShrink = shrinks.length - 1;

export const followUpPeople = [
  { id: "hr", label: "HR" },
  { id: "manager", label: "A manager" },
  { id: "interview", label: "An interviewer" },
  { id: "recruiter", label: "A recruiter" },
] as const;

export type FollowUpId = (typeof followUpPeople)[number]["id"];

export function followUpMessage(who: FollowUpId, asked: string) {
  const detail = asked.trim().slice(0, 160);
  const heard = detail ? ` I heard this: “${detail}”.` : "";
  if (who === "hr") {
    return `Hi, thank you for speaking with me.${heard} Could you send the next step in writing, with the date you need it? I will reply after I have read it.`;
  }
  if (who === "manager") {
    return `Thank you for the update.${heard} I can finish one thing first. Which one should it be? I will send a short note when that one is done.`;
  }
  if (who === "interview") {
    return `Thank you for the question.${heard} Could you say the main part again in one sentence? Then I will give a short example.`;
  }
  return `Hi, I am still interested in this role.${heard} Could you tell me the next step and when I should hear back? Thank you.`;
}

export function formatMinute(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
