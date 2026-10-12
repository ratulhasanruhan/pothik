import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_CHARS = 12_000;

export async function readCvFile(file: File): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error("Upload a CV under 4 MB.");
  }
  const name = file.name.toLowerCase();
  const type = file.type;
  const bytes = new Uint8Array(await file.arrayBuffer());
  let text = "";

  if (name.endsWith(".txt") || type.startsWith("text/")) {
    text = new TextDecoder().decode(bytes);
  } else if (name.endsWith(".pdf") || type === "application/pdf") {
    const pdf = await getDocumentProxy(bytes);
    const extracted = await extractText(pdf, { mergePages: true });
    text = extracted.text;
  } else if (name.endsWith(".docx")) {
    const extracted = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    text = extracted.value;
  } else {
    throw new Error("Upload a PDF, DOCX, or TXT CV.");
  }

  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length < 40) {
    throw new Error("That CV did not contain enough text to read.");
  }
  return cleaned.slice(0, MAX_CHARS);
}

export async function readPublicLinkedIn(url: string): Promise<{ text: string; limited: boolean }> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html",
        "User-Agent": "FocusCareer/1.0",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { text: "", limited: true };
    const html = await response.text();
    const title = decode(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "");
    const description = decode(
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ??
        html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)?.[1] ??
        "",
    );
    const body = decode(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    );
    const limited = /sign in|join linkedin|authwall/i.test(body) || body.length < 400;
    const text = [title, description, limited ? "" : body].filter(Boolean).join("\n").slice(0, 6000);
    return { text, limited };
  } catch {
    return { text: "", limited: true };
  }
}

function decode(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}
