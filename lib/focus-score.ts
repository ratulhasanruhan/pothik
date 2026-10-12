export const focusQuestions = [
  "A long task list makes it hard to start.",
  "After a call with HR or a manager, the details fade quickly.",
  "Writing a short work message takes longer than the task itself.",
  "Interviews and HR calls feel like too many questions at once.",
  "A deadline slips when the next step is not written down.",
  "One step is easier to finish than seeing the whole map.",
] as const;

export const focusChoices = [
  { label: "Not often", points: 0 },
  { label: "Sometimes", points: 1 },
  { label: "Often", points: 2 },
] as const;

export function focusBand(score: number) {
  if (score >= 9) {
    return {
      title: "One step will help most",
      detail:
        "Turn on ADHD focus. Before you write to HR, a manager, or an interviewer, start from one of the short messages below.",
    };
  }
  if (score >= 5) {
    return {
      title: "Write the next step down",
      detail:
        "Use one step when the map feels loud. After a meeting, send a short written note so the request does not stay only in your head.",
    };
  }
  return {
    title: "The full map is comfortable",
    detail:
      "You can keep the whole roadmap open. The messages below are still there when a note to HR or a manager is the hard part.",
  };
}
