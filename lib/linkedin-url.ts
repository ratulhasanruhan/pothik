export function parseLinkedInUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] !== "in" && parts[0] !== "pub") return null;
    if (!parts[1]) return null;
    url.hash = "";
    url.search = "";
    url.protocol = "https:";
    return url.toString();
  } catch {
    return null;
  }
}
