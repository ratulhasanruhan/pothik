"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdhdToggle } from "@/components/adhd-toggle";
import { Logo } from "@/components/logo";
import { useProgress } from "@/components/progress-context";
import { readinessPercent } from "@/lib/readiness";

const links = [
  { href: "/insights", label: "Guide" },
  { href: "/guide", label: "Chat" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/adhd", label: "ADHD" },
  { href: "/bot", label: "Bot" },
  { href: "/profile", label: "Profile" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role, progress, store } = useProgress();
  const percent = role && progress ? readinessPercent(role, progress.nodeStatus) : 0;
  const streak = store.streak.count;
  const visibleLinks = store.adhdMode ? links.filter((link) => link.href !== "/roadmap") : links;

  return (
    <div className="min-h-full">
      <header className="no-print border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:gap-6">
          <Logo />
          <p className="text-sm text-muted sm:min-w-0 sm:flex-1">
            {role ? role.title : "Set a goal"}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <AdhdToggle compact />
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
          {visibleLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm ${
                  link.href === "/adhd"
                    ? active
                      ? "bg-accent text-white ring-2 ring-accent"
                      : "bg-accent text-white"
                    : active
                      ? "bg-accent text-white"
                      : "bg-accent-soft text-accent"
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

export function QuietRoute({ children }: { children: React.ReactNode }) {
  const { hydrated, store } = useProgress();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && store.adhdMode) router.replace("/focus");
  }, [hydrated, store.adhdMode, router]);

  if (!hydrated || store.adhdMode) {
    return <p className="text-muted">Opening the one step…</p>;
  }

  return children;
}
