import { contextForBot, parseBotRequest, replyFromMap } from "@/lib/bot";

export async function POST(request: Request) {
  const parsed = parseBotRequest(await request.json().catch(() => null));
  if (!parsed) {
    return Response.json({ error: "Set a goal before asking the bot." }, { status: 400 });
  }

  const latest = [...parsed.messages].reverse().find((item) => item.role === "user");
  const fallback = replyFromMap(parsed.role, parsed.node, latest?.content ?? "");
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || parsed.messages.length === 0) {
    return Response.json({ reply: fallback, source: "map" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: contextForBot(parsed.role, parsed.node, parsed.statuses) },
          ...parsed.messages,
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!response.ok || !reply) return Response.json({ reply: fallback, source: "map" });
    return Response.json({ reply, source: "ai" });
  } catch {
    return Response.json({ reply: fallback, source: "map" });
  }
}
