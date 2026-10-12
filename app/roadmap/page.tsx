"use client";

import { AppShell, RequireRole } from "@/components/app-shell";
import { RoadmapScreen } from "@/components/roadmap-screen";

export default function RoadmapPage() {
  return (
    <AppShell>
      <RequireRole>
        <RoadmapScreen />
      </RequireRole>
    </AppShell>
  );
}
