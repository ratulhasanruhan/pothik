"use client";

import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { BotScreen } from "@/components/bot-screen";

export default function BotPage() {
  return (
    <AppShell>
      <Suspense fallback={<p className="text-muted">Loading the bot…</p>}>
        <BotScreen />
      </Suspense>
    </AppShell>
  );
}
