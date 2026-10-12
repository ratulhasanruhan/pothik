import { errorResponse, generateJson } from "@/lib/ai";
import { matchSchema, matchSystem, normalizeMatch } from "@/lib/pothik/cv";
import { badRequest, MAX_CV_CHARS } from "@/lib/pothik/request";

const MAX_JD_CHARS = 8000;

// Compares the candidate (CV text, or the review's profile when there is no CV)
// with a pasted job description.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return badRequest();
  const lang = body.lang === "bn" ? "bn" : "en";
  const candidate = typeof body.candidate === "string" ? body.candidate.trim().slice(0, MAX_CV_CHARS) : "";
  const job = typeof body.jobDescription === "string" ? body.jobDescription.trim().slice(0, MAX_JD_CHARS) : "";
  if (!candidate) return badRequest();
  if (job.length < 80) {
    return Response.json({ error: "Paste the full job description (at least a few lines)." }, { status: 400 });
  }

  try {
    const raw = await generateJson<unknown>({
      system: matchSystem(lang),
      turns: [
        {
          role: "user",
          text: `Candidate:\n<candidate>\n${candidate}\n</candidate>\n\nJob description:\n<job>\n${job}\n</job>`,
        },
      ],
      schema: matchSchema,
    });
    const match = normalizeMatch(raw);
    if (!match) return Response.json({ error: "The match came back empty. Try again." }, { status: 502 });
    return Response.json(match);
  } catch (error) {
    return errorResponse(error);
  }
}
