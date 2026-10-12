import { errorResponse, generateJson } from "@/lib/ai";
import { assessSchema, assessSystem, MAX_QUESTIONS } from "@/lib/pothik/prompts";
import { badRequest, parseSession } from "@/lib/pothik/request";
import type { AssessReply } from "@/lib/pothik/types";

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
    if (!message) throw new Error("empty");
    // Hard stop at the question limit even if the model wants to keep going.
    const done = reply.done === true || asked >= MAX_QUESTIONS;
    return Response.json({
      message,
      suggestions: done ? [] : (reply.suggestions ?? []).filter((s) => typeof s === "string").slice(0, 4),
      done,
      distress: reply.distress === true,
    } satisfies AssessReply);
  } catch (error) {
    return errorResponse(error);
  }
}
