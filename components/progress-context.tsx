"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { getRole } from "@/lib/roles";
import {
  emptyStore,
  initialRoleProgress,
  loadStore,
  saveStore,
  touchStreak,
} from "@/lib/storage";
import type { Role, RoleId, RoleProgress, SkillStatus, Store } from "@/lib/types";

const serverStore = emptyStore();
const listeners = new Set<() => void>();
let clientStore: Store | null = null;

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getClientStore() {
  clientStore ??= loadStore();
  return clientStore;
}

function commit(next: Store) {
  clientStore = next;
  saveStore(next);
  listeners.forEach((listener) => listener());
}

function updateSelected(recipe: (current: RoleProgress, role: Role) => RoleProgress) {
  const current = getClientStore();
  if (!current.selectedRoleId) return;
  const selected = getRole(current.selectedRoleId);
  const existing = current.roles[current.selectedRoleId] ?? initialRoleProgress(selected);
  commit({
    ...current,
    roles: {
      ...current.roles,
      [current.selectedRoleId]: recipe(existing, selected),
    },
  });
}

interface ProgressValue {
  hydrated: boolean;
  store: Store;
  role: Role | null;
  progress: RoleProgress | null;
  selectRole: (id: RoleId) => void;
  setStatus: (nodeId: string, status: SkillStatus) => void;
  toggleStep: (nodeId: string, stepId: string, done: boolean) => void;
  resetRole: (id: RoleId) => void;
  applyGuide: (roleId: RoleId, statuses: Record<string, SkillStatus>, note: string) => void;
}

const ProgressContext = createContext<ProgressValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const store = useSyncExternalStore(subscribe, getClientStore, () => serverStore);

  const value = useMemo<ProgressValue>(() => {
    const role = store.selectedRoleId ? getRole(store.selectedRoleId) : null;
    const progress = store.selectedRoleId ? (store.roles[store.selectedRoleId] ?? null) : null;
    return {
      hydrated: store !== serverStore,
      store,
      role,
      progress,
      selectRole: (id) => {
        const current = getClientStore();
        commit({
          ...current,
          selectedRoleId: id,
          note: null,
          roles: {
            ...current.roles,
            [id]: current.roles[id] ?? initialRoleProgress(getRole(id)),
          },
        });
      },
      applyGuide: (roleId, statuses, note) => {
        const role = getRole(roleId);
        const progress = initialRoleProgress(role);
        for (const node of role.nodes) {
          const status = statuses[node.id];
          if (status === "mastered" || status === "in_progress" || status === "gap") {
            progress.nodeStatus[node.id] = status;
          }
        }
        const current = getClientStore();
        commit({
          ...current,
          selectedRoleId: roleId,
          note,
          roles: { ...current.roles, [roleId]: progress },
        });
      },
      setStatus: (nodeId, status) => {
        updateSelected((current) => ({
          ...current,
          nodeStatus: { ...current.nodeStatus, [nodeId]: status },
        }));
      },
      toggleStep: (nodeId, stepId, done) => {
        updateSelected((current, selected) => {
          const node = selected.nodes.find((item) => item.id === nodeId);
          const completed = new Set(current.completedSteps);
          if (done) completed.add(stepId);
          else completed.delete(stepId);
          const allDone = node?.microSteps.every((item) => completed.has(item.id)) ?? false;
          return {
            nodeStatus: allDone
              ? { ...current.nodeStatus, [nodeId]: "mastered" }
              : current.nodeStatus,
            completedSteps: [...completed],
          };
        });
        if (done) {
          const current = getClientStore();
          commit({ ...current, streak: touchStreak(current.streak) });
        }
      },
      resetRole: (id) => {
        const current = getClientStore();
        commit({
          ...current,
          note: current.selectedRoleId === id ? null : current.note,
          roles: { ...current.roles, [id]: initialRoleProgress(getRole(id)) },
        });
      },
    };
  }, [store]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const value = useContext(ProgressContext);
  if (!value) throw new Error("useProgress must be used within ProgressProvider");
  return value;
}
