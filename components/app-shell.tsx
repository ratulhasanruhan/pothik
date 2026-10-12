"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/logo";
import { useProgress } from "@/components/progress-context";
import { readinessPercent } from "@/lib/readiness";

const links = [
  { href: "/roadmap", label: "Roadmap" },
  { href: "/focus", label: "Focus" },
  { href: "/profile", label: "Profile" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role, progress, store } = useProgress();
  const percent = role && progress ? readinessPercent(role, progress.nodeStatus) : 0;
  const streak = store.streak.count;

  return (
    <div className="min-h-full">
      <header className="no-print border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:gap-6">
          <Logo />
          <p className="text-sm text-muted sm:min-w-0 sm:flex-1">
            {role ? role.title : "Pick a role to begin"}
          </p>
          <div className="flex gap-4">
            <p className="text-sm text-foreground">
              <span className="text-muted">Readiness </span>
              {role ? `${percent}%` : "—"}
            </p>
            <p className="text-sm text-foreground">
              <span className="text-muted">Streak </span>
              {streak > 0 ? `${streak} day${streak === 1 ? "" : "s"}` : "Not started"}
            </p>
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-6xl gap-2 px-4 pb-4">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm ${
                  active ? "bg-accent text-white" : "bg-accent-soft text-accent"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

export function RequireRole({ children }: { children: React.ReactNode }) {
  const { hydrated, role } = useProgress();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !role) router.replace("/");
  }, [hydrated, role, router]);

  if (!hydrated || !role) {
    return <p className="text-muted">Loading your map…</p>;
  }

  return children;
}
