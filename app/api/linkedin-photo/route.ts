import { safePhotoUrl } from "@/lib/photo-url";

export async function GET(request: Request) {
  const photoUrl = safePhotoUrl(new URL(request.url).searchParams.get("url") ?? "");
  if (!photoUrl) return new Response("Photo not available", { status: 400 });

  try {
    const response = await fetch(photoUrl, {
      headers: {
        Accept: "image/*",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(8000),
    });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !type.startsWith("image/")) {
      return new Response("Photo not available", { status: 404 });
    }
    return new Response(await response.arrayBuffer(), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Photo not available", { status: 404 });
  }
}
