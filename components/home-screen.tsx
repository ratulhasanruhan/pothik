"use client";

import { useRouter } from "next/navigation";
import { useProgress } from "@/components/progress-context";
import { roles } from "@/lib/roles";
import { readinessPercent } from "@/lib/readiness";
import type { RoleId } from "@/lib/types";

export function HomeScreen() {
  const router = useRouter();
  const { store, selectRole, resetRole } = useProgress();
  const saved = store.selectedRoleId ? roles.find((role) => role.id === store.selectedRoleId) : null;
  const savedProgress = saved ? store.roles[saved.id] : null;
  const percent = saved && savedProgress ? readinessPercent(saved, savedProgress.nodeStatus) : 0;

  function start(id: RoleId) {
    selectRole(id);
    router.push("/roadmap");
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 py-10">
      <p className="text-sm tracking-wide text-accent">FocusCareer</p>
      <h1 className="mt-3 max-w-xl font-display text-5xl leading-tight">
        A career map you can start in two minutes.
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-8 text-muted">
        Pick a role. The map shows what is mastered, in progress, and still missing. No chat.
      </p>
      {saved && savedProgress ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-line bg-surface px-5 py-5">
          <div>
            <p className="text-sm text-muted">Continue</p>
            <p className="mt-1 text-lg">{saved.title}</p>
            <p className="text-sm text-muted">
              {percent}% ready
              {store.streak.count > 0
                ? ` · ${store.streak.count}-day streak`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push("/roadmap")}
              className="inline-flex min-h-12 items-center rounded-full bg-accent px-5 text-white"
            >
              Open map
            </button>
            <button
              type="button"
              onClick={() => resetRole(saved.id)}
              className="inline-flex min-h-12 items-center rounded-full border border-line px-5"
            >
              Reset this role
            </button>
          </div>
        </div>
      ) : null}
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {roles.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => start(role.id)}
            className="flex min-h-48 flex-col rounded-3xl border border-line bg-surface p-5 text-left"
          >
            <span className="font-display text-2xl leading-snug">{role.title}</span>
            <span className="mt-3 flex-1 leading-7 text-muted">{role.summary}</span>
            <span className="mt-4 text-sm text-accent">Open roadmap</span>
          </button>
        ))}
      </div>
    </div>
  );
}
