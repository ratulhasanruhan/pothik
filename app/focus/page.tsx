"use client";

import { Suspense } from "react";
import { AppShell, RequireRole } from "@/components/app-shell";
import { FocusScreen } from "@/components/focus-screen";

export default function FocusPage() {
  return (
    <AppShell>
      <RequireRole>
        <Suspense fallback={<p className="text-muted">Loading focus…</p>}>
          <FocusScreen />
        </Suspense>
      </RequireRole>
    </AppShell>
  );
}
