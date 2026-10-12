import { allowlistedPage, isPublicHttps, previewImageUrl } from "@/lib/link-preview";

export async function GET(request: Request) {
  const pageUrl = allowlistedPage(new URL(request.url).searchParams.get("url") ?? "");
  const site = pageUrl ? new URL(pageUrl).hostname.replace(/^www\./, "") : "P";
  if (!pageUrl) return letterMark(site);

  const image = await previewImageUrl(pageUrl);
  if (!image || !isPublicHttps(image)) return letterMark(site);

  try {
    const response = await fetch(image, {
      headers: {
        Accept: "image/*",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    const type = (response.headers.get("content-type") ?? "").split(";")[0];
    if (!response.ok || !type.startsWith("image/") || !isPublicHttps(response.url)) return letterMark(site);
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 1_500_000) return letterMark(site);
    return new Response(bytes, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return letterMark(site);
  }
}

function letterMark(site: string) {
  const letter = (site.replace(/^www\./, "").charAt(0) || "P").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180" viewBox="0 0 240 180"><rect width="240" height="180" fill="#e5f2f1"/><text x="120" y="108" text-anchor="middle" font-family="Georgia, serif" font-size="72" fill="#0f6e6b">${letter}</text></svg>`;
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
