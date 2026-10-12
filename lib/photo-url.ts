const PHOTO_HOSTS = ["media.licdn.com", "static.licdn.com", "media-exp1.licdn.com", "dms.licdn.com"];

export function safePhotoUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !PHOTO_HOSTS.includes(url.hostname)) return "";
    if (/ghost-person|company-logo_100_100/i.test(url.pathname)) return "";
    return url.toString();
  } catch {
    return "";
  }
}
