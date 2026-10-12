import { errorResponse, generateJson } from "@/lib/ai";
import { analyzeSystem, resultSchema } from "@/lib/pothik/prompts";
import { badRequest, parseSession } from "@/lib/pothik/request";
import { normalizeResult } from "@/lib/pothik/result";

// Turns the finished assessment into the structured career review.
export async function POST(request: Request) {
  const session = parseSession(await request.json().catch(() => null));
  if (!session || session.history.length === 0) return badRequest();
  const { mode, lang, history } = session;

  const transcript = history
    .map((turn) => `${turn.role === "model" ? "Pothik" : "User"}: ${turn.text}`)
    .join("\n");

  try {
    const raw = await generateJson<unknown>({
      system: analyzeSystem(mode, lang),
      turns: [{ role: "user", text: `Assessment conversation:\n${transcript}\n\nWrite my career review now.` }],
      schema: resultSchema,
    });
    const result = normalizeResult(raw);
    if (!result) {
      return Response.json({ error: "The review came back incomplete. Try again." }, { status: 502 });
    }
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
