"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { strings, type Strings } from "@/lib/pothik/i18n";
import type { Lang, Message, Mode, Result } from "@/lib/pothik/types";

// Privacy model:
// - Preferences (language, theme, reduce distractions) live in localStorage.
// - The conversation lives in sessionStorage only, so it disappears with the tab.
// - The finished plan and its checklist live in localStorage so progress can be
//   tracked across days. "Start over" wipes both.
const PREFS_KEY = "pothik-prefs-v1";
const CHAT_KEY = "pothik-chat-v1";
const PLAN_KEY = "pothik-plan-v1";

export type Theme = "light" | "dark";

interface Prefs {
  lang: Lang;
  theme: Theme;
  calm: boolean;
}

interface Plan {
  mode: Mode;
  lang: Lang;
  result: Result;
  doneTasks: string[];
}

interface Chat {
  mode: Mode;
  messages: Message[];
  finished: boolean;
}

interface SessionValue extends Prefs {
  ready: boolean;
  t: Strings;
  chat: Chat | null;
  plan: Plan | null;
  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;
  setCalm: (calm: boolean) => void;
  startChat: (mode: Mode) => void;
  setMessages: (messages: Message[], finished?: boolean) => void;
  savePlan: (result: Result) => void;
  toggleTask: (key: string) => void;
  reset: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

function read<T>(storage: () => Storage, key: string): T | null {
  try {
    const raw = storage().getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(storage: () => Storage, key: string, value: unknown) {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode); the app still works in memory.
  }
}

const local = () => window.localStorage;
const session = () => window.sessionStorage;

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({ lang: "en", theme: "light", calm: false });
  const [chat, setChat] = useState<Chat | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);

  // Load saved state once on mount (storage is not available during SSR).
  useEffect(() => {
    const saved = read<Partial<Prefs>>(local, PREFS_KEY);
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from storage */
    setPrefs({
      lang: saved?.lang === "bn" ? "bn" : "en",
      theme: saved?.theme === "dark" || (!saved?.theme && systemDark) ? "dark" : "light",
      calm: saved?.calm === true,
    });
    setChat(read<Chat>(session, CHAT_KEY));
    setPlan(read<Plan>(local, PLAN_KEY));
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Reflect theme and calm mode on <html> so the whole page follows them.
  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.classList.toggle("dark", prefs.theme === "dark");
    root.toggleAttribute("data-calm", prefs.calm);
    root.lang = prefs.lang;
    write(local, PREFS_KEY, prefs);
  }, [prefs, ready]);

  const updateChat = useCallback((next: Chat | null) => {
    setChat(next);
    write(session, CHAT_KEY, next);
  }, []);

  const updatePlan = useCallback((next: Plan | null) => {
    setPlan(next);
    write(local, PLAN_KEY, next);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      ...prefs,
      ready,
      t: strings[prefs.lang],
      chat,
      plan,
      setLang: (lang) => setPrefs((p) => ({ ...p, lang })),
      setTheme: (theme) => setPrefs((p) => ({ ...p, theme })),
      setCalm: (calm) => setPrefs((p) => ({ ...p, calm })),
      startChat: (mode) => {
        updatePlan(null);
        updateChat({ mode, messages: [], finished: false });
      },
      setMessages: (messages, finished = false) => {
        if (chat) updateChat({ ...chat, messages, finished });
      },
      savePlan: (result) => {
        if (chat) updatePlan({ mode: chat.mode, lang: prefs.lang, result, doneTasks: [] });
      },
      toggleTask: (key) => {
        if (!plan) return;
        const done = new Set(plan.doneTasks);
        if (done.has(key)) done.delete(key);
        else done.add(key);
        updatePlan({ ...plan, doneTasks: [...done] });
      },
      reset: () => {
        updateChat(null);
        updatePlan(null);
      },
    }),
    [prefs, ready, chat, plan, updateChat, updatePlan],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used within SessionProvider");
  return value;
}
