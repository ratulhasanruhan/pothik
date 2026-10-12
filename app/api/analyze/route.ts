import { errorResponse, generateJson } from "@/lib/ai";
import { analyzeSystem, coreSchema, phaseSchema, phaseSystem } from "@/lib/pothik/prompts";
import { badRequest, parseSession } from "@/lib/pothik/request";
import { normalizeResult } from "@/lib/pothik/result";

// Turns the finished assessment into the structured career review.
// The core review and the three 30-day phases are generated in parallel,
// so the wait is roughly the time of the slowest single call.
export async function POST(request: Request) {
  const session = parseSession(await request.json().catch(() => null));
  if (!session || session.history.length === 0) return badRequest();
  const { mode, lang, history } = session;

  const transcript = history
    .map((turn) => `${turn.role === "model" ? "Pothik" : "User"}: ${turn.text}`)
    .join("\n");
  const turns = (ask: string) => [
    { role: "user" as const, text: `Assessment conversation:\n${transcript}\n\n${ask}` },
  ];

  try {
    const [core, ...roadmap] = await Promise.all([
      generateJson<Record<string, unknown>>({
        system: analyzeSystem(mode, lang),
        turns: turns("Write my career review now."),
        schema: coreSchema,
      }),
      ...[0, 1, 2].map((phase) =>
        generateJson<unknown>({
          system: phaseSystem(mode, lang, phase),
          turns: turns(`Write phase ${phase + 1} of my 90-day roadmap now.`),
          schema: phaseSchema,
        }),
      ),
    ]);
    const result = normalizeResult({ ...core, roadmap });
    if (!result) {
      return Response.json({ error: "The review came back incomplete. Try again." }, { status: 502 });
    }
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
