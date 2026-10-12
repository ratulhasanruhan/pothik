import type { Metadata } from "next";
import { Noto_Sans_Bengali } from "next/font/google";
import { GuideApp } from "@/components/pothik/guide-app";
import { SessionProvider } from "@/components/pothik/session";

// Bangla glyphs for the language toggle; Latin text keeps the app's sans font.
const bengali = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-bengali" });

export const metadata: Metadata = {
  title: "পথিক · Pothik career guide",
  description: "AI career guidance for people in Bangladesh who feel stuck.",
};

export default function GuidePage() {
  return (
    <div className={`${bengali.variable} font-sans`}>
      <SessionProvider>
        <GuideApp />
      </SessionProvider>
    </div>
  );
}
