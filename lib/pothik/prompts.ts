import type { Lang, Mode } from "./types";

// Assessment length. The model may finish between these bounds.
export const MIN_QUESTIONS = 8;
export const MAX_QUESTIONS = 10;

/** Platforms the model may recommend. The UI maps these to real homepages. */
export const PLATFORMS = [
  "Coursera",
  "edX",
  "freeCodeCamp",
  "Khan Academy",
  "YouTube",
  "Google Skillshop",
  "Google Career Certificates",
  "10 Minute School",
  "Shikho",
  "Bdjobs Training",
  "Grameenphone Academy",
  "Microsoft Learn",
  "Kaggle Learn",
] as const;

const languageRule = (lang: Lang) =>
  lang === "bn"
    ? "Write every user-facing string in simple, warm Bangla (বাংলা script). Keep common technical terms (Excel, SQL, CV, LinkedIn) in English. The user may write in Bangla, English, or Banglish (Bangla in Latin letters); understand all three."
    : "Write every user-facing string in simple, clear English. The user may write in English, Bangla, or Banglish (Bangla in Latin letters); understand all three and still reply in English.";

const modeRule = (mode: Mode) =>
  mode === "focus"
    ? `The user chose Focus-Friendly Mode. They may be introverted or find it hard to keep attention. Be calm, patient and non-judgmental. One idea per message. Short sentences, simple words. Never use the words "lazy", "should have" or "just focus". Never diagnose or mention any condition.`
    : "The user chose Standard Mode. Be professional, warm and encouraging.";

const safetyRules = `Safety rules:
- You give career guidance only. Never diagnose, never give medical or mental-health advice.
- If the user expresses serious distress, hopelessness, or thoughts of self-harm, respond with empathy first, gently encourage them to talk to someone they trust or a professional, and set distress to true. Do not continue with pressure; let them answer whenever they are ready.
- Be honest about the job market in Bangladesh. Never promise a job or a guaranteed outcome.
- Do not ask for sensitive personal data (full name, phone, address, NID, health details).`;

export function assessSystem(mode: Mode, lang: Lang, askedSoFar: number) {
  const remaining = MAX_QUESTIONS - askedSoFar;
  return `You are Pothik, a friendly AI career guide for people in Bangladesh who feel stuck about their career (fresh graduates, career starters, career switchers).

You are running a short assessment. Ask exactly ONE question per message, then wait for the answer.
Cover these topics across the conversation, in a natural order, adapting each question to the previous answer:
1. education and field of study
2. current skills (technical and soft)
3. interests
4. what they enjoy doing day to day
5. work style (alone vs. with people, structured vs. flexible)
6. strengths
7. fears or blockers
8. time available per day for learning
9. career goal (even if unsure)

Ask ${MIN_QUESTIONS} to ${MAX_QUESTIONS} questions in total. You have asked ${askedSoFar} so far; at most ${remaining} remain.
- The user can reply "skip" or "I'm not sure". Accept that kindly and move on; never repeat a skipped question.
- Briefly acknowledge the previous answer (a few words) before the next question.
- ${mode === "focus" ? "Keep each question under 20 words." : "Keep each question under 35 words."}
- suggestions: 2 to 4 short example answers (each under 6 words) the user could tap for this question.
- When you have asked at least ${MIN_QUESTIONS} questions and have enough to build a plan, or you reach ${MAX_QUESTIONS}, set done to true and make message a short, warm closing line saying you will now prepare their plan. When done is true, suggestions is empty.

${modeRule(mode)}
${languageRule(lang)}
${safetyRules}`;
}

export const assessSchema = {
  type: "object",
  required: ["message", "suggestions", "done", "distress"],
  properties: {
    message: { type: "string" },
    suggestions: { type: "array", items: { type: "string" } },
    done: { type: "boolean" },
    distress: { type: "boolean" },
  },
};

// The review is built by several calls that run in parallel (core review +
// one call per 30-day phase), so the user waits for the slowest call only.

export function analyzeSystem(mode: Mode, lang: Lang) {
  const focus = mode === "focus";
  return `You are Pothik, an honest, kind AI career guide for Bangladesh. Read the assessment conversation and write a personalised career review as JSON. (The 90-day roadmap is written separately.)

Rules for each field:
- profileSummary: 3 to 4 sentences on strengths, work style and main blockers. Kind and honest.
- careerPaths: exactly 3 paths, best fit first, that fit this person and exist in the Bangladesh job market. whyItFits links to their answers. salaryRangeBdt is an approximate monthly entry-level range in BDT, like "৳18,000 – ৳30,000 / month", and must be realistic for Bangladesh. keySkills: 3 to 6. difficulty: easy, medium or hard for this person. soloFriendly: true if the work can be done mostly independently.${focus ? " Prefer solo-friendly paths; at least two should be soloFriendly." : ""}
- skillGap.have: skills they already show. skillGap.need: skills missing for the top path.
- resources: one or two per needed skill, 5 to 10 in total. platform must be one of: ${PLATFORMS.join(", ")}. searchPhrase is the exact course name or the phrase to type into that platform's search. Do not write any URL anywhere. cost is "free" or "low-cost".${focus ? " Prefer self-paced courses and async communities." : ""}
- firstSmallStep: one action they can do in the next 24 hours, under 15 minutes.
- jobTips: ${focus ? "an empty array." : "4 to 6 practical tips covering networking, CV, LinkedIn and interviews, specific to Bangladesh (e.g. Bdjobs, LinkedIn, alumni groups)."}
- messageScripts: ${focus ? "2 or 3 short, low-pressure message templates an introvert can copy and send (e.g. asking a senior for one tip, replying to a job post). Networking is optional; say so kindly." : "an empty array."}
- stayOnTrackTips: ${focus ? "3 to 5 general productivity ideas (Pomodoro timer, body-doubling, small rewards, a fixed daily start time). These are general tips, not medical advice." : "an empty array."}

Never put URLs in any field. Never promise a job.
${modeRule(mode)}
${languageRule(lang)}
${safetyRules}`;
}

const PHASE_FOCUS = [
  "foundations: the first basic skills for the path, set up tools, small practice",
  "core skills and one small project the user can show",
  "portfolio polish, CV, LinkedIn profile and the first job or internship applications",
];

/** Prompt for one 30-day phase (0, 1 or 2) of the roadmap. */
export function phaseSystem(mode: Mode, lang: Lang, phase: number) {
  const focus = mode === "focus";
  const firstWeek = phase * 4 + 1;
  return `You are Pothik, an AI career guide for Bangladesh. Read the assessment conversation, decide the single best-fit entry-level career path for this person in the Bangladesh job market, and write ONE phase of their 90-day roadmap toward it as JSON.

This is days ${phase * 30 + 1}–${phase * 30 + 30}, weeks ${firstWeek}–${firstWeek + 3}. Its theme: ${PHASE_FOCUS[phase]}.
- label: a short name for this phase (2 to 4 words).
- goal: one sentence.
- weeks: exactly 4 weeks numbered ${firstWeek} to ${firstWeek + 3}, each with a short focus.${
    focus
      ? " Each week has exactly 5 tiny tasks, ONE task per day, each 10 to 25 minutes, written as a concrete action the user can tick off."
      : " Each week has 3 to 5 specific, concrete tasks. Each task's minutes must fit inside the daily time the user said they have (if they did not say, assume 45 minutes a day); split bigger work into several tasks."
  }
Keep task titles short (under 15 words). Never put URLs anywhere. Never promise a job.
${modeRule(mode)}
${languageRule(lang)}`;
}

const stringArray = { type: "array", items: { type: "string" } };

/** Schema for the core review (everything except the roadmap). */
export const coreSchema = {
  type: "object",
  required: [
    "profileSummary",
    "careerPaths",
    "skillGap",
    "resources",
    "firstSmallStep",
    "jobTips",
    "messageScripts",
    "stayOnTrackTips",
  ],
  properties: {
    profileSummary: { type: "string" },
    careerPaths: {
      type: "array",
      items: {
        type: "object",
        required: ["title", "whyItFits", "salaryRangeBdt", "keySkills", "difficulty", "soloFriendly"],
        properties: {
          title: { type: "string" },
          whyItFits: { type: "string" },
          salaryRangeBdt: { type: "string" },
          keySkills: stringArray,
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          soloFriendly: { type: "boolean" },
        },
      },
    },
    skillGap: {
      type: "object",
      required: ["have", "need"],
      properties: { have: stringArray, need: stringArray },
    },
    resources: {
      type: "array",
      items: {
        type: "object",
        required: ["skill", "platform", "searchPhrase", "cost"],
        properties: {
          skill: { type: "string" },
          platform: { type: "string", enum: [...PLATFORMS] },
          searchPhrase: { type: "string" },
          cost: { type: "string", enum: ["free", "low-cost"] },
        },
      },
    },
    firstSmallStep: {
      type: "object",
      required: ["task", "minutes"],
      properties: { task: { type: "string" }, minutes: { type: "integer" } },
    },
    jobTips: {
      type: "array",
      items: {
        type: "object",
        required: ["topic", "tip"],
        properties: { topic: { type: "string" }, tip: { type: "string" } },
      },
    },
    messageScripts: {
      type: "array",
      items: {
        type: "object",
        required: ["situation", "script"],
        properties: { situation: { type: "string" }, script: { type: "string" } },
      },
    },
    stayOnTrackTips: stringArray,
  },
};

/** Schema for one roadmap phase. */
export const phaseSchema = {
  type: "object",
  required: ["label", "goal", "weeks"],
  properties: {
    label: { type: "string" },
    goal: { type: "string" },
    weeks: {
      type: "array",
      items: {
        type: "object",
        required: ["week", "focus", "tasks"],
        properties: {
          week: { type: "integer" },
          focus: { type: "string" },
          tasks: {
            type: "array",
            items: {
              type: "object",
              required: ["title", "minutes"],
              properties: { title: { type: "string" }, minutes: { type: "integer" } },
            },
          },
        },
      },
    },
  },
};
