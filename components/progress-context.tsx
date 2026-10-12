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
import type { CareerGuide, Role, RoleId, RoleProgress, SkillStatus, Store } from "@/lib/types";

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
  setGoal: (id: RoleId) => void;
  setStatus: (nodeId: string, status: SkillStatus) => void;
  toggleStep: (nodeId: string, stepId: string, done: boolean) => void;
  resetRole: (id: RoleId) => void;
  applyGuide: (guide: CareerGuide) => void;
  setAdhd: (on: boolean) => void;
  setFocusScore: (score: number) => void;
}

const ProgressContext = createContext<ProgressValue | null>(null);

const subscribeNever = () => () => {};

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const live = useSyncExternalStore(subscribe, getClientStore, () => serverStore);
  // False on the server and while hydrating, so saved progress cannot mismatch the HTML.
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  const store = mounted ? live : serverStore;

  const value = useMemo<ProgressValue>(() => {
    const role = store.selectedRoleId ? getRole(store.selectedRoleId) : null;
    const progress = store.selectedRoleId ? (store.roles[store.selectedRoleId] ?? null) : null;
    return {
      hydrated: mounted,
      store,
      role,
      progress,
      selectRole: (id) => {
        const current = getClientStore();
        commit({
          ...current,
          selectedRoleId: id,
          guide: null,
          roles: {
            ...current.roles,
            [id]: current.roles[id] ?? initialRoleProgress(getRole(id)),
          },
        });
      },
      setGoal: (id) => {
        const current = getClientStore();
        const selected = getRole(id);
        const progress = initialRoleProgress(selected);
        if (current.guide?.roleId === id) {
          for (const node of selected.nodes) {
            const status = current.guide.statuses[node.id];
            if (status === "mastered" || status === "in_progress" || status === "gap") {
              progress.nodeStatus[node.id] = status;
            }
          }
        } else if (current.roles[id]) {
          commit({ ...current, selectedRoleId: id });
          return;
        }
        commit({
          ...current,
          selectedRoleId: id,
          roles: { ...current.roles, [id]: progress },
        });
      },
      applyGuide: (guide) => {
        const current = getClientStore();
        if (current.selectedRoleId !== guide.roleId) {
          commit({ ...current, guide });
          return;
        }
        const selected = getRole(guide.roleId);
        const progress = initialRoleProgress(selected);
        for (const node of selected.nodes) {
          const status = guide.statuses[node.id];
          if (status === "mastered" || status === "in_progress" || status === "gap") {
            progress.nodeStatus[node.id] = status;
          }
        }
        commit({
          ...current,
          guide,
          roles: { ...current.roles, [guide.roleId]: progress },
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
      setAdhd: (on) => {
        const current = getClientStore();
        commit({ ...current, adhdMode: on });
      },
      setFocusScore: (score) => {
        const current = getClientStore();
        commit({ ...current, focusScore: Math.max(0, Math.min(12, Math.round(score))) });
      },
      resetRole: (id) => {
        const current = getClientStore();
        commit({
          ...current,
          guide: current.selectedRoleId === id ? null : current.guide,
          roles: { ...current.roles, [id]: initialRoleProgress(getRole(id)) },
        });
      },
    };
  }, [store, mounted]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const value = useContext(ProgressContext);
  if (!value) throw new Error("useProgress must be used within ProgressProvider");
  return value;
}
