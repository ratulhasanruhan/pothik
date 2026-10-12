"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GoalPicker } from "@/components/goal-picker";
import { useProgress } from "@/components/progress-context";
import { contentFor } from "@/lib/node-content";

interface ChatLine {
  role: "user" | "assistant";
  content: string;
}

export function BotScreen() {
  const params = useSearchParams();
  const { role, progress, store } = useProgress();
  const [ready, setReady] = useState(false);
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [source, setSource] = useState<"map" | "ai" | null>(null);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return <p className="text-muted">Loading the bot…</p>;
  if (!role || !progress) {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="font-display text-4xl">Career bot</h1>
          <p className="mt-3 max-w-xl leading-7 text-muted">Set a goal and the bot can use that map.</p>
        </div>
        <GoalPicker selected={store.selectedRoleId} />
      </div>
    );
  }

  const skillId = params.get("skill");
  const node = role.nodes.find((item) => item.id === skillId) ?? role.nodes.find((item) => progress.nodeStatus[item.id] !== "mastered") ?? role.nodes[0];
  const content = contentFor(node);
  const prompts = [
    `What should I learn for ${node.title}?`,
    "Which resource should I open first?",
    "Give me the next 2-minute step.",
  ];

  async function ask(text: string) {
    const question = text.trim();
    if (!question || pending || !role || !progress) return;
    const next = [...lines, { role: "user" as const, content: question }];
    setLines(next);
    setDraft("");
    setPending(true);
    try {
      const response = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: role.id,
          skillId: node.id,
          statuses: progress.nodeStatus,
          messages: next,
        }),
      });
      const data = (await response.json()) as { reply?: string; source?: "map" | "ai"; error?: string };
      setSource(data.source ?? "map");
      setLines([...next, { role: "assistant", content: data.reply || data.error || "The bot could not answer." }]);
    } catch {
      setLines([...next, { role: "assistant", content: "The bot could not answer. Try again." }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="h-fit rounded-3xl border border-line bg-surface px-5 py-6">
        <p className="text-sm text-muted">{role.title}</p>
        <h1 className="mt-2 font-display text-3xl">{node.title}</h1>
        <p className="mt-3 leading-7">{content.lesson}</p>
        <ul className="mt-4 flex flex-col gap-3">
          {content.resources.map((item) => (
            <li key={item.url}>
              <a href={item.url} target="_blank" rel="noreferrer" className="text-accent">
                {item.title}
              </a>
              <p className="text-sm leading-6 text-muted">{item.kind}. {item.summary}</p>
            </li>
          ))}
        </ul>
      </aside>
      <section className="flex min-h-[32rem] flex-col rounded-3xl border border-line bg-surface">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-display text-2xl">Career bot</h2>
          <p className="mt-1 text-sm text-muted">
            {source === "ai" ? "Answered with your career guide." : "Answers use this skill's lesson and resources."}
          </p>
        </div>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-5">
          {lines.length === 0 ? (
            <div className="flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void ask(prompt)}
                  className="rounded-full border border-line px-4 py-2 text-left text-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          ) : (
            lines.map((line, index) => (
              <p
                key={`${line.role}-${index}`}
                className={`max-w-[40rem] whitespace-pre-wrap rounded-2xl px-4 py-3 leading-7 ${
                  line.role === "user" ? "ml-auto bg-accent-soft" : "bg-background"
                }`}
              >
                {line.content}
              </p>
            ))
          )}
          {pending ? <p className="text-sm text-muted">Reading the map…</p> : null}
        </div>
        <form
          className="flex gap-2 border-t border-line p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void ask(draft);
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`Ask about ${node.title}`}
            className="min-h-12 flex-1 rounded-2xl border border-line bg-background px-4"
          />
          <button
            type="submit"
            disabled={pending || !draft.trim()}
            className="inline-flex min-h-12 items-center rounded-full bg-accent px-5 text-white disabled:opacity-70"
          >
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
