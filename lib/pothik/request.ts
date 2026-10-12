import type { ChatTurn } from "@/lib/ai";
import type { Lang, Mode } from "./types";

const MAX_TURNS = 30;
const MAX_CHARS = 1500;

/** Validates the JSON body shared by /api/assess and /api/analyze. */
export function parseSession(body: unknown): { mode: Mode; lang: Lang; history: ChatTurn[] } | null {
  if (!body || typeof body !== "object") return null;
  const raw = body as { mode?: unknown; lang?: unknown; history?: unknown };
  if (raw.mode !== "standard" && raw.mode !== "focus") return null;
  if (raw.lang !== "en" && raw.lang !== "bn") return null;
  if (!Array.isArray(raw.history) || raw.history.length > MAX_TURNS) return null;
  const history: ChatTurn[] = [];
  for (const item of raw.history) {
    if (!item || typeof item !== "object") return null;
    const { role, text } = item as { role?: unknown; text?: unknown };
    if ((role !== "user" && role !== "model") || typeof text !== "string") return null;
    history.push({ role, text: text.slice(0, MAX_CHARS) });
  }
  return { mode: raw.mode, lang: raw.lang, history };
}

export const badRequest = () => Response.json({ error: "That request was not valid." }, { status: 400 });
