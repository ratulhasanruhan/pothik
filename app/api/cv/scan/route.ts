import { errorResponse, generateJson } from "@/lib/ai";
import { normalizeScan, scanSchema, scanSystem } from "@/lib/pothik/cv";
import { MAX_ROLE_CHARS } from "@/lib/pothik/request";
import { readCvFile } from "@/lib/read-profile";

// Reads an uploaded CV (PDF, DOCX or TXT) and returns the scan plus the CV text.
// The text goes back to the browser tab so later calls can use it; nothing is stored here.
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const cv = form?.get("cv");
  const lang = form?.get("lang") === "bn" ? "bn" : "en";
  const roleRaw = form?.get("targetRole");
  const targetRole = typeof roleRaw === "string" ? roleRaw.trim().slice(0, MAX_ROLE_CHARS) : "";
  if (!(cv instanceof File) || cv.size === 0) {
    return Response.json({ error: "Add a CV file first." }, { status: 400 });
  }

  let cvText: string;
  try {
    cvText = await readCvFile(cv);
  } catch (error) {
    // readCvFile only throws user-facing messages (size, type, empty file).
    const message = error instanceof Error ? error.message : "That CV could not be read.";
    return Response.json({ error: message }, { status: 400 });
  }

  try {
    const raw = await generateJson<unknown>({
      system: scanSystem(lang, targetRole),
      turns: [{ role: "user", text: `CV:\n<cv>\n${cvText}\n</cv>` }],
      schema: scanSchema,
    });
    const scan = normalizeScan(raw);
    if (!scan) return Response.json({ error: "The CV check came back empty. Try again." }, { status: 502 });
    return Response.json({ scan, cvText });
  } catch (error) {
    return errorResponse(error);
  }
}
