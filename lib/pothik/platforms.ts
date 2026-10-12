// Real, well-known homepages for the platforms the AI is allowed to recommend.
// The AI never writes links; we only link to these homepages and to a Google
// search for the exact phrase it suggested.
export const PLATFORM_HOMES: Record<string, string> = {
  Coursera: "https://www.coursera.org",
  edX: "https://www.edx.org",
  freeCodeCamp: "https://www.freecodecamp.org",
  "Khan Academy": "https://www.khanacademy.org",
  YouTube: "https://www.youtube.com",
  "Google Skillshop": "https://skillshop.withgoogle.com",
  "Google Career Certificates": "https://grow.google/certificates/",
  "10 Minute School": "https://10minuteschool.com",
  Shikho: "https://shikho.com",
  "Bdjobs Training": "https://www.bdjobs.com",
  "Grameenphone Academy": "https://www.grameenphone.academy",
  "Microsoft Learn": "https://learn.microsoft.com",
  "Kaggle Learn": "https://www.kaggle.com/learn",
};

export function googleSearchUrl(platform: string, phrase: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${platform} ${phrase}`)}`;
}
