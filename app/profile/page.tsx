"use client";

import { AppShell, RequireRole } from "@/components/app-shell";
import { ProfileScreen } from "@/components/profile-screen";

export default function ProfilePage() {
  return (
    <AppShell>
      <RequireRole>
        <ProfileScreen />
      </RequireRole>
    </AppShell>
  );
}
