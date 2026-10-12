export interface WorkMessage {
  id: string;
  who: string;
  when: string;
  message: string;
}

export const workMessages: WorkMessage[] = [
  {
    id: "hr",
    who: "HR",
    when: "When the next step is unclear",
    message:
      "Hi, thank you for the update. Could you send the next step in writing, with the date you need it? A short list is enough. I will reply once I have read it.",
  },
  {
    id: "manager",
    who: "A manager",
    when: "When several tasks arrive together",
    message:
      "I can work on this today. If I finish one thing first, which one should it be? I will send a short note when that one is done.",
  },
  {
    id: "interview",
    who: "An interviewer",
    when: "When the question was long",
    message:
      "I want to answer the main part. Could you say the question again in one sentence? Then I will give a short example.",
  },
  {
    id: "recruiter",
    who: "A recruiter",
    when: "When you need to follow up",
    message:
      "Hi, I am still interested in this role. Could you tell me the next step and when I should hear back? Thank you.",
  },
];
