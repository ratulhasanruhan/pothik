import { AiError, errorResponse, generateJson } from "@/lib/ai";
import { assessSchema, assessSystem, MAX_QUESTIONS } from "@/lib/pothik/prompts";
import { badRequest, parseSession } from "@/lib/pothik/request";
import type { AssessReply } from "@/lib/pothik/types";

// When the user shows serious distress we always send this fixed, reviewed
// reply instead of model text, so the tone and language are guaranteed.
const DISTRESS_REPLY = {
  en: "I'm really sorry you're feeling this way. You don't have to carry it alone. Please talk to someone you trust, or a counsellor or professional. There's no rush here: we can continue with your career questions whenever you feel ready.",
  bn: "আপনার এমন লাগছে শুনে আমি সত্যিই দুঃখিত। এটা আপনাকে একা বইতে হবে না। দয়া করে আপনার বিশ্বস্ত কারো সাথে, অথবা একজন কাউন্সেলর বা পেশাদারের সাথে কথা বলুন। কোনো তাড়া নেই: আপনি যখন প্রস্তুত বোধ করবেন, তখন আমরা ক্যারিয়ারের প্রশ্নগুলো নিয়ে আবার এগোতে পারি।",
};

// Returns the next assessment question (or the closing line when done).
export async function POST(request: Request) {
  const session = parseSession(await request.json().catch(() => null));
  if (!session) return badRequest();
  const { mode, lang, history } = session;
  const asked = history.filter((turn) => turn.role === "model").length;

  try {
    const reply = await generateJson<Partial<AssessReply>>({
      system: assessSystem(mode, lang, asked),
      // The model needs a user turn to start; the opener is never shown in the UI.
      turns: [{ role: "user", text: "Hi, I am ready to start." }, ...history],
      schema: assessSchema,
    });
    const message = typeof reply.message === "string" ? reply.message.trim() : "";
    if (!message) throw new AiError("The AI sent an empty answer. Try again.");
    // Hard stop at the question limit even if the model wants to keep going.
    const done = (reply.done === true || asked >= MAX_QUESTIONS) && reply.distress !== true;
    const distress = reply.distress === true;
    return Response.json({
      message: distress ? DISTRESS_REPLY[lang] : message,
      // No quick-reply chips after a distress reply: the user sets the pace.
      suggestions: done || distress ? [] : (reply.suggestions ?? []).filter((s) => typeof s === "string").slice(0, 4),
      done,
      distress,
    } satisfies AssessReply);
  } catch (error) {
    return errorResponse(error);
  }
}
