import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";
import { safePhotoUrl } from "./photo-url";

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

export interface PublicLinkedIn {
  text: string;
  limited: boolean;
  name: string;
  headline: string;
  location: string;
  about: string;
  photoUrl: string;
  experiences: { role: string; organization: string; time: string }[];
  education: { school: string; detail: string }[];
}

export async function readPublicLinkedIn(url: string): Promise<PublicLinkedIn> {
  const empty: PublicLinkedIn = {
    text: "",
    limited: true,
    name: "",
    headline: "",
    location: "",
    about: "",
    photoUrl: "",
    experiences: [],
    education: [],
  };
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return empty;
    return readLinkedInHtml(await response.text());
  } catch {
    return empty;
  }
}

export function readLinkedInHtml(html: string): PublicLinkedIn {
  const title = meta(html, "og:title") || decode(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "");
  const description = meta(html, "og:description") || meta(html, "description");
  const image = meta(html, "og:image") || meta(html, "twitter:image");
  const heading = parseLinkedInHeading(title);
  const details = parseLinkedInDescription(description);
  const text = [title, description].filter(Boolean).join("\n").slice(0, 8000);
  return {
    text,
    limited: true,
    name: heading.name,
    headline: heading.headline,
    location: details.location,
    about: details.about,
    photoUrl: safePhotoUrl(image),
    experiences: details.experience
      ? [{ role: "", organization: details.experience, time: "" }]
      : [],
    education: details.education ? [{ school: details.education, detail: "" }] : [],
  };
}

function meta(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decode(match[1]);
  }
  return "";
}

function parseLinkedInHeading(title: string) {
  const cleaned = title.replace(/\s*[|–-]\s*LinkedIn\s*$/i, "").trim();
  if (!cleaned || /sign in|sign up|authwall/i.test(cleaned)) {
    return { name: "", headline: "" };
  }
  const [namePart, ...rest] = cleaned.split(/\s+-\s+/);
  const name = namePart.trim();
  if (!name || /linkedin/i.test(name)) return { name: "", headline: "" };
  return { name, headline: rest.join(" - ").trim() };
}

function parseLinkedInDescription(description: string) {
  const location = field(description, "Location");
  const experience = field(description, "Experience");
  const education = field(description, "Education");
  const about = description
    .split("·")
    .map((part) => part.trim())
    .filter((part) => part && !/^(Experience|Education|Location):/i.test(part) && !/connections on LinkedIn/i.test(part))
    .slice(1)
    .join(" ")
    .trim();
  return { location, experience, education, about };
}

function field(description: string, label: string) {
  const match = description.match(new RegExp(`${label}:\\s*([^·|]+)`, "i"));
  const value = match?.[1]?.replace(/\s+/g, " ").trim() ?? "";
  return /linkedin|sign in/i.test(value) ? "" : value;
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
