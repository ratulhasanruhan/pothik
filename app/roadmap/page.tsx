"use client";

import { AppShell, QuietRoute, RequireRole } from "@/components/app-shell";
import { RoadmapScreen } from "@/components/roadmap-screen";

export default function RoadmapPage() {
  return (
    <AppShell>
      <RequireRole>
        <QuietRoute>
          <RoadmapScreen />
        </QuietRoute>
      </RequireRole>
    </AppShell>
  );
}
