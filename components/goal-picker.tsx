"use client";

import { useRouter } from "next/navigation";
import { useProgress } from "@/components/progress-context";
import { roles } from "@/lib/roles";
import type { RoleId } from "@/lib/types";

export function GoalPicker({ selected }: { selected?: RoleId | null }) {
  const router = useRouter();
  const { setGoal } = useProgress();

  function choose(id: RoleId) {
    setGoal(id);
    router.push("/profile");
  }

  return (
    <div>
      <h2 className="font-display text-2xl">Set a goal</h2>
      <p className="mt-2 text-muted">The profile workbench fills in for the goal you choose.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {roles.map((role) => {
          const active = selected === role.id;
          return (
            <button
              key={role.id}
              type="button"
              aria-pressed={active}
              onClick={() => choose(role.id)}
              className={`flex min-h-36 flex-col rounded-3xl border p-5 text-left ${
                active ? "border-accent bg-accent-soft" : "border-line bg-surface"
              }`}
            >
              <span className="font-display text-xl leading-snug">{role.title}</span>
              <span className="mt-2 flex-1 text-sm leading-6 text-muted">{role.summary}</span>
              <span className="mt-3 text-sm text-accent">{active ? "Current goal" : "Set this goal"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
