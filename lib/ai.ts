import { ApiError, GoogleGenAI } from "@google/genai";

// Server-side AI helper. Keys are read from .env.local and never reach the browser.
// GEMINI_API_KEY is preferred; OPENAI_API_KEY works as a fallback provider.

export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

/** An error whose message is safe to show to the user. */
export class AiError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

export interface ChatTurn {
  role: "user" | "model";
  text: string;
}

interface JsonRequest {
  system: string;
  turns: ChatTurn[];
  schema: Record<string, unknown>;
}

/**
 * Sends the full conversation (stateless) and returns JSON matching `schema`.
 * Nothing is stored server-side between calls.
 */
export async function generateJson<T>(request: JsonRequest): Promise<T> {
  let text: string | null | undefined;
  if (process.env.GEMINI_API_KEY) {
    text = await callGemini(process.env.GEMINI_API_KEY, request);
  } else if (process.env.OPENAI_API_KEY) {
    text = await callOpenAI(process.env.OPENAI_API_KEY, request);
  } else {
    throw new AiError("Add GEMINI_API_KEY (or OPENAI_API_KEY) to .env.local, then restart the app.", 500);
  }

  if (!text) throw new AiError("The AI sent an empty answer. Try again.");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AiError("The AI answer could not be read. Try again.");
  }
}

let gemini: GoogleGenAI | null = null;

async function callGemini(apiKey: string, request: JsonRequest) {
  gemini ??= new GoogleGenAI({ apiKey });
  try {
    const interaction = await gemini.interactions.create({
      model: GEMINI_MODEL,
      store: false,
      system_instruction: request.system,
      input: request.turns.map((turn) => ({
        type: turn.role === "user" ? ("user_input" as const) : ("model_output" as const),
        content: [{ type: "text" as const, text: turn.text }],
      })),
      response_format: { type: "text", mime_type: "application/json", schema: request.schema },
      generation_config: { thinking_level: "low" },
    });
    return interaction.output_text;
  } catch (error) {
    if (error instanceof ApiError) throw fromStatus(error.status, /api key/i.test(error.message));
    throw new AiError("The AI could not answer. Try again in a moment.");
  }
}

async function callOpenAI(apiKey: string, request: JsonRequest) {
  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.4,
        // Non-strict schema so optional fields and free-form objects are allowed.
        response_format: {
          type: "json_schema",
          json_schema: { name: "pothik_response", strict: false, schema: request.schema },
        },
        messages: [
          { role: "system", content: request.system },
          ...request.turns.map((turn) => ({
            role: turn.role === "user" ? "user" : "assistant",
            content: turn.text,
          })),
        ],
      }),
      signal: AbortSignal.timeout(90_000),
    });
  } catch {
    throw new AiError("The AI could not be reached. Check your connection and try again.");
  }
  if (!response.ok) throw fromStatus(response.status, false);
  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  return payload.choices?.[0]?.message?.content;
}

function fromStatus(status: number, keyProblem: boolean) {
  if (status === 401 || status === 403 || keyProblem) {
    return new AiError("The AI API key was rejected. Check the key in .env.local.", 500);
  }
  if (status === 429) {
    return new AiError("Too many requests right now. Wait a minute and try again.", 429);
  }
  return new AiError("The AI could not answer. Try again in a moment.");
}

/** Turns any thrown value into a JSON error response for a route handler. */
export function errorResponse(error: unknown) {
  if (error instanceof AiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return Response.json({ error: "Something went wrong. Try again." }, { status: 500 });
}
