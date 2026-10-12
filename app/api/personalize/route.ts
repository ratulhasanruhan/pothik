import { errorResponse, AiError } from "@/lib/ai";
import { personalizeGuide } from "@/lib/personalize";
import { parseLinkedInUrl } from "@/lib/linkedin-url";
import { readCvFile, readPublicLinkedIn } from "@/lib/read-profile";

export async function POST(request: Request) {
  const form = await request.formData();
  const linkedinRaw = form.get("linkedinUrl");
  const cv = form.get("cv");
  const linkedinInput = typeof linkedinRaw === "string" ? linkedinRaw.trim() : "";
  const hasCv = cv instanceof File && cv.size > 0;

  if (!linkedinInput && !hasCv) {
    return Response.json({ error: "Add a LinkedIn URL or a CV." }, { status: 400 });
  }

  const linkedinUrl = linkedinInput ? parseLinkedInUrl(linkedinInput) : null;
  if (linkedinInput && !linkedinUrl) {
    return Response.json(
      { error: "Use a LinkedIn profile link, like linkedin.com/in/your-name." },
      { status: 400 },
    );
  }

  try {
    const cvText = hasCv ? await readCvFile(cv) : "";
    const linkedin = linkedinUrl
      ? await readPublicLinkedIn(linkedinUrl)
      : { text: "", limited: false };
    const guide = await personalizeGuide({
      linkedinUrl,
      linkedinText: linkedin.text,
      linkedinLimited: linkedin.limited,
      cvText,
    });
    return Response.json(guide);
  } catch (error) {
    // CV reading errors are user-facing; Gemini errors carry their own status.
    if (error instanceof Error && !(error instanceof AiError) && /Upload|CV/.test(error.message)) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return errorResponse(error);
  }
}
