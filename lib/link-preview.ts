import { allResources, normalizeResourceUrl } from "./node-content";

const cache = new Map<string, { expires: number; image: string }>();

export function allowlistedPage(input: string) {
  try {
    const key = normalizeResourceUrl(input);
    return allResources().some((item) => normalizeResourceUrl(item.url) === key) ? key : null;
  } catch {
    return null;
  }
}

export async function previewImageUrl(pageUrl: string) {
  const cached = cache.get(pageUrl);
  if (cached && cached.expires > Date.now()) return cached.image;
  const image = await readImage(pageUrl);
  cache.set(pageUrl, { expires: Date.now() + 60 * 60 * 1000, image });
  return image;
}

async function readImage(pageUrl: string) {
  try {
    const response = await fetch(pageUrl, {
      headers: {
        Accept: "text/html",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    if (!response.ok || !isPublicHttps(response.url)) return "";
    const html = (await response.text()).slice(0, 120_000);
    const image = absoluteImage(
      pageUrl,
      metaContent(html, "og:image") || metaContent(html, "twitter:image") || iconHref(html),
    );
    return image && isPublicHttps(image) ? image : "";
  } catch {
    return "";
  }
}

function metaContent(html: string, key: string) {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decode(match[1]);
  }
  return "";
}

function iconHref(html: string) {
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const rel of ["apple-touch-icon", "icon", "shortcut icon"]) {
    for (const tag of tags) {
      const relValue = tag.match(/\brel=["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? "";
      if (!relValue.split(/\s+/).includes(rel)) continue;
      const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
      if (href) return decode(href);
    }
  }
  return "";
}

function absoluteImage(pageUrl: string, image: string) {
  if (!image) return "";
  try {
    return new URL(image, pageUrl).toString();
  } catch {
    return "";
  }
}

function decode(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function isPublicHttps(input: string) {
  try {
    const url = new URL(input);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
    if (!/^\d+\.\d+\.\d+\.\d+$/.test(host)) return true;
    const [a, b] = host.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 192 && b === 168)) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    return true;
  } catch {
    return false;
  }
}
