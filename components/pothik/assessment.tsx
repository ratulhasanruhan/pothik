"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MAX_QUESTIONS } from "@/lib/pothik/prompts";
import type { AssessReply, Message, Result } from "@/lib/pothik/types";
import { useSession } from "./session";

type Status = "idle" | "asking" | "analysing";

/** Posts JSON and returns the parsed body, throwing the server's message on failure. */
async function postJson<T>(url: string, body: unknown, fallback: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(fallback);
  }
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? fallback);
  return data;
}

/** Chat-style assessment: the AI asks one adaptive question at a time. */
export function Assessment() {
  const { t, lang, chat, setMessages, savePlan } = useSession();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [distress, setDistress] = useState(false);
  const [draft, setDraft] = useState("");
  const started = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const mode = chat?.mode ?? "standard";
  const messages = useMemo(() => chat?.messages ?? [], [chat?.messages]);
  const focus = mode === "focus";
  const asked = messages.filter((m) => m.role === "model").length;
  const answered = messages.filter((m) => m.role === "user").length;
  const history = (list: Message[]) => list.map(({ role, text }) => ({ role, text }));

  // Builds the final review once the questions are done.
  const analyse = useCallback(
    async (list: Message[]) => {
      setStatus("analysing");
      setError(null);
      try {
        const result = await postJson<Result>(
          "/api/analyze",
          { mode, lang, history: history(list) },
          t.errorGeneric,
        );
        savePlan(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.errorGeneric);
        setStatus("idle");
      }
    },
    [mode, lang, savePlan, t.errorGeneric],
  );

  // Asks the AI for the next question given the conversation so far.
  const ask = useCallback(
    async (list: Message[]) => {
      setStatus("asking");
      setError(null);
      setSuggestions([]);
      try {
        const reply = await postJson<AssessReply>(
          "/api/assess",
          { mode, lang, history: history(list) },
          t.errorGeneric,
        );
        const next: Message[] = [...list, { role: "model", text: reply.message }];
        setDistress(reply.distress);
        setSuggestions(reply.suggestions);
        setMessages(next, reply.done);
        setStatus("idle");
        // Do not rush into the plan if the user just shared serious distress.
        if (reply.done && !reply.distress) void analyse(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.errorGeneric);
        setStatus("idle");
      }
    },
    [mode, lang, setMessages, analyse, t.errorGeneric],
  );

  // First question on a fresh chat; resume analysis after a reload.
  useEffect(() => {
    if (started.current || !chat) return;
    started.current = true;
    const messages = chat.messages;
    // Deferred so the first request starts after this render commits.
    void Promise.resolve().then(() => {
      if (messages.length === 0) void ask([]);
      else if (chat.finished) void analyse(messages);
    });
  }, [chat, ask, analyse]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
    if (status === "idle") inputRef.current?.focus();
  }, [messages.length, status]);

  function send(text: string, quick?: Message["quick"]) {
    const clean = text.trim();
    if (!clean || status !== "idle" || chat?.finished) return;
    const next: Message[] = [...messages, { role: "user", text: clean, quick }];
    setMessages(next);
    setDraft("");
    void ask(next);
  }

  // Retry whatever failed last.
  function retry() {
    if (chat?.finished) void analyse(messages);
    else void ask(messages);
  }

  if (status === "analysing") {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center" role="status" aria-live="polite">
        <span className="calm-hide size-10 animate-spin rounded-full border-4 border-accent-soft border-t-accent" />
        <p className="font-display text-2xl">{t.analysing}</p>
        {focus ? <p className="text-muted">{t.analysingFocus}</p> : null}
      </div>
    );
  }

  const progress = Math.min(asked / MAX_QUESTIONS, 1);
  const textSize = focus ? "text-lg leading-8" : "leading-7";

  return (
    <div className="flex flex-col gap-4">
      {/* Progress indicator */}
      <div>
        <div className="flex justify-between text-sm text-muted">
          <span>{t.question(Math.max(asked, 1), MAX_QUESTIONS)}</span>
          <span>{t.answeredOf(answered)}</span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-accent-soft"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={MAX_QUESTIONS}
          aria-valuenow={asked}
        >
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      {/* Conversation */}
      <ol className="flex flex-col gap-3" aria-live="polite">
        {messages.map((message, index) => (
          <li
            key={index}
            className={`max-w-[85%] rounded-3xl px-4 py-3 ${textSize} ${
              message.role === "model"
                ? "self-start rounded-bl-md border border-line bg-surface"
                : "self-end rounded-br-md bg-accent text-white dark:text-background"
            }`}
          >
            {message.quick === "skip" ? t.skip : message.quick === "unsure" ? t.unsure : message.text}
          </li>
        ))}
        {status === "asking" ? (
          <li className="self-start rounded-3xl rounded-bl-md border border-line bg-surface px-4 py-3 text-muted">
            {t.thinking}
          </li>
        ) : null}
      </ol>

      {distress ? (
        <aside className="rounded-3xl border border-line bg-accent-soft px-5 py-4" role="note">
          <p className="font-medium">{t.distressTitle}</p>
          <p className="mt-2 leading-7 text-muted">{t.distressBody}</p>
        </aside>
      ) : null}

      {error ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gap px-4 py-3" role="alert">
          <p className="flex-1 text-gap">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="inline-flex min-h-10 items-center rounded-full bg-accent px-4 text-white dark:text-background"
          >
            {t.retry}
          </button>
        </div>
      ) : null}

      {/* The user may continue after a distress reply; the plan starts when they are ready. */}
      {chat?.finished && distress && !error ? (
        <button
          type="button"
          onClick={() => void analyse(messages)}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-5 text-white dark:text-background"
        >
          {t.start}
        </button>
      ) : null}

      {!chat?.finished && messages.length > 0 ? (
        <div className="flex flex-col gap-3">
          {suggestions.length > 0 && status === "idle" ? (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="min-h-10 rounded-full border border-line bg-surface px-4 text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(draft);
            }}
            className="flex flex-col gap-2 rounded-3xl border border-line bg-surface p-3"
          >
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send(draft);
                }
              }}
              rows={focus ? 3 : 2}
              maxLength={1500}
              placeholder={t.typeAnswer}
              aria-label={t.typeAnswer}
              disabled={status !== "idle"}
              className={`w-full resize-none bg-transparent px-2 py-1 outline-none ${textSize}`}
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={status !== "idle"}
                onClick={() => send(t.skipText, "skip")}
                className="min-h-10 rounded-full border border-line px-4 text-sm disabled:opacity-50"
              >
                {t.skip}
              </button>
              <button
                type="button"
                disabled={status !== "idle"}
                onClick={() => send(t.unsureText, "unsure")}
                className="min-h-10 rounded-full border border-line px-4 text-sm disabled:opacity-50"
              >
                {t.unsure}
              </button>
              <button
                type="submit"
                disabled={status !== "idle" || !draft.trim()}
                className="ml-auto min-h-10 rounded-full bg-accent px-5 text-white disabled:opacity-50 dark:text-background"
              >
                {t.send}
              </button>
            </div>
          </form>
        </div>
      ) : null}
      <div ref={bottomRef} />
    </div>
  );
}
