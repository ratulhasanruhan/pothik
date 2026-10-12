"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { FocusScore } from "@/components/focus-score";
import { useProgress } from "@/components/progress-context";
import { nextOpenStep, pickActiveNode } from "@/lib/focus";
import {
  companionLines,
  followUpMessage,
  followUpPeople,
  formatMinute,
  maxShrink,
  smallerStep,
  starterTasks,
  type FollowUpId,
} from "@/lib/focus-desk";
import { dropThought, getPark, parkThought, serverPark, subscribePark } from "@/lib/park-notes";

const SESSION_SECONDS = 120;
const subscribeNever = () => () => {};

export function FocusRoom() {
  const { hydrated, role, progress, toggleStep, setStatus } = useProgress();
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  const parked = useSyncExternalStore(subscribePark, getPark, serverPark);
  const notes = mounted ? parked : serverPark();
  const [draft, setDraft] = useState<string | null>(null);
  const [shrink, setShrink] = useState(0);
  const [phase, setPhase] = useState<"idle" | "running">("idle");
  const [left, setLeft] = useState(SESSION_SECONDS);
  const [line, setLine] = useState(0);
  const [parkDraft, setParkDraft] = useState("");
  const [who, setWho] = useState<FollowUpId>("hr");
  const [asked, setAsked] = useState("");
  const timer = useRef<number | null>(null);
  const companion = useRef<number | null>(null);
  const leftRef = useRef(SESSION_SECONDS);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearInterval(timer.current);
      if (companion.current) window.clearInterval(companion.current);
    };
  }, []);

  if (!hydrated) return <p className="text-muted">Loading the focus room…</p>;

  const node = role && progress ? pickActiveNode(role, progress.nodeStatus, null) : null;
  const step = node && progress ? nextOpenStep(node, progress.completedSteps) : null;
  const base = (draft ?? step?.label ?? "").trim();
  const visible = smallerStep(base, shrink);
  const canMark = Boolean(step && node && shrink === 0 && base === step.label);
  const showing = phase === "running" && left === 0 ? "done" : phase;
  const running = showing !== "idle";
  const progressRatio = left / SESSION_SECONDS;

  function clearTimers() {
    if (timer.current) window.clearInterval(timer.current);
    if (companion.current) window.clearInterval(companion.current);
    timer.current = null;
    companion.current = null;
  }

  function begin() {
    if (!base) return;
    clearTimers();
    leftRef.current = SESSION_SECONDS;
    setLeft(SESSION_SECONDS);
    setLine(0);
    setPhase("running");
    timer.current = window.setInterval(() => {
      leftRef.current = Math.max(0, leftRef.current - 1);
      setLeft(leftRef.current);
      if (leftRef.current === 0) clearTimers();
    }, 1000);
    companion.current = window.setInterval(() => {
      setLine((value) => (value + 1) % companionLines.length);
    }, 15000);
  }

  function finishEarly() {
    clearTimers();
    leftRef.current = 0;
    setLeft(0);
    setPhase("running");
  }

  function resetRoom() {
    clearTimers();
    leftRef.current = SESSION_SECONDS;
    setPhase("idle");
    setLeft(SESSION_SECONDS);
    setShrink(0);
  }

  function markDone() {
    if (!node || !step) return;
    if (progress && progress.nodeStatus[node.id] === "gap") setStatus(node.id, "in_progress");
    toggleStep(node.id, step.id, true);
    resetRoom();
    setDraft(null);
  }

  function savePark() {
    parkThought(parkDraft);
    setParkDraft("");
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <div>
        <p className="text-sm font-medium text-accent">ADHD focus</p>
        <h1 className="mt-2 font-display text-4xl leading-tight">The 2-minute room</h1>
        <p className="mt-3 max-w-xl leading-7 text-muted">
          One sentence stays on screen. Extra thoughts go to the parking lot. After a call, you can write the follow-up while it is still fresh.
        </p>
      </div>

      <section className="rounded-[2rem] border-2 border-accent bg-surface px-6 py-8 sm:px-10">
        <div className="flex flex-col items-center text-center">
          {running ? <Ring seconds={left} ratio={progressRatio} /> : null}
          <p className="text-sm font-medium text-accent">
            {showing === "running" ? "Stay with this" : showing === "done" ? "Two minutes" : "One thing"}
          </p>
          {showing === "idle" ? (
            <textarea
              value={draft ?? step?.label ?? ""}
              onChange={(event) => {
                setDraft(event.target.value);
                setShrink(0);
              }}
              rows={3}
              placeholder="Name the one thing you will touch."
              className="mt-4 w-full resize-none bg-transparent text-center font-display text-3xl leading-snug outline-none"
            />
          ) : (
            <p className="mt-4 font-display text-4xl leading-tight">{visible}</p>
          )}
          {showing === "running" ? <p className="mt-4 leading-7 text-muted">{companionLines[line]}</p> : null}
          {showing === "done" ? (
            <p className="mt-4 leading-7 text-muted">
              {canMark
                ? "If this skill step is finished, mark it. The same sentence can also have two more minutes."
                : "If it is finished, leave the room. The same sentence can also have two more minutes."}
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {showing === "idle" ? (
              <>
                <button
                  type="button"
                  onClick={begin}
                  disabled={!base}
                  className="inline-flex min-h-12 items-center rounded-full bg-accent px-5 text-white disabled:opacity-70"
                >
                  Start 2 minutes
                </button>
                <button
                  type="button"
                  onClick={() => setShrink((value) => Math.min(maxShrink, value + 1))}
                  disabled={!base || shrink >= maxShrink}
                  className="inline-flex min-h-12 items-center rounded-full border border-line px-5 disabled:opacity-70"
                >
                  {shrink >= maxShrink ? "This is the smallest step" : "Make it smaller"}
                </button>
              </>
            ) : null}
            {showing === "running" ? (
              <>
                <button
                  type="button"
                  onClick={() => setShrink((value) => Math.min(maxShrink, value + 1))}
                  disabled={shrink >= maxShrink}
                  className="inline-flex min-h-12 items-center rounded-full border border-line bg-background px-5 disabled:opacity-70"
                >
                  Make it smaller
                </button>
                <button
                  type="button"
                  onClick={finishEarly}
                  className="inline-flex min-h-12 items-center rounded-full bg-accent px-5 text-white"
                >
                  I finished
                </button>
              </>
            ) : null}
            {showing === "done" ? (
              <>
                {canMark ? (
                  <button
                    type="button"
                    onClick={markDone}
                    className="inline-flex min-h-12 items-center rounded-full bg-accent px-5 text-white"
                  >
                    Mark this step done
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={begin}
                  className="inline-flex min-h-12 items-center rounded-full border border-line bg-background px-5"
                >
                  Two more minutes
                </button>
                <button type="button" onClick={resetRoom} className="inline-flex min-h-12 items-center px-3 text-sm text-accent">
                  Leave the room
                </button>
              </>
            ) : null}
          </div>
          {showing === "idle" && shrink > 0 ? (
            <p className="mt-6 max-w-md leading-7 text-muted">{visible}</p>
          ) : null}
        </div>
        {showing === "idle" ? (
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {step ? (
              <button
                type="button"
                onClick={() => {
                  setDraft(null);
                  setShrink(0);
                }}
                className="rounded-full bg-accent-soft px-4 py-2 text-sm text-accent"
              >
                Use my next skill step
              </button>
            ) : null}
            {starterTasks.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setDraft(item.task);
                  setShrink(0);
                }}
                className="rounded-full bg-accent-soft px-4 py-2 text-sm text-accent"
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
        <form
          className="mx-auto mt-8 flex max-w-lg flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            savePark();
          }}
        >
          <label className="sr-only" htmlFor="park-thought">
            Park a thought
          </label>
          <input
            id="park-thought"
            value={parkDraft}
            onChange={(event) => setParkDraft(event.target.value)}
            placeholder="Park a thought so it can leave your head"
            className="min-h-12 flex-1 rounded-full border border-line bg-background px-4"
          />
          <button type="submit" className="inline-flex min-h-12 items-center justify-center rounded-full border border-line px-5">
            Park it
          </button>
        </form>
      </section>

      {running ? null : (
        <>
          <section>
            <h2 className="font-display text-2xl">Parking lot</h2>
            <p className="mt-2 max-w-xl leading-7 text-muted">
              Thoughts you set down stay here. Bring one back when it is the only thing on the screen.
            </p>
            {notes.length ? (
              <ul className="mt-4 flex flex-col gap-2">
                {notes.map((note) => (
                  <li key={note} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
                    <p className="leading-7">{note}</p>
                    <span className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDraft(note);
                          setShrink(0);
                        }}
                        className="text-sm text-accent"
                      >
                        Bring it back
                      </button>
                      <button type="button" onClick={() => dropThought(note)} className="text-sm text-muted">
                        Drop
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-muted">The lot is empty.</p>
            )}
          </section>

          <AfterCall who={who} asked={asked} onWho={setWho} onAsked={setAsked} />

          <section>
            <h2 className="font-display text-2xl">Focus support score</h2>
            <p className="mt-2 max-w-xl leading-7 text-muted">
              Six questions about how work feels, when you want them. You choose the answers.
            </p>
            <div className="mt-4">
              <FocusScore embedded />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Ring({ seconds, ratio }: { seconds: number; ratio: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative mb-6 grid size-36 place-items-center" aria-hidden>
      <svg viewBox="0 0 120 120" className="size-36 -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--line)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
        />
      </svg>
      <p className="absolute font-display text-3xl">{formatMinute(seconds)}</p>
    </div>
  );
}

function AfterCall({
  who,
  asked,
  onWho,
  onAsked,
}: {
  who: FollowUpId;
  asked: string;
  onWho: (id: FollowUpId) => void;
  onAsked: (value: string) => void;
}) {
  const message = followUpMessage(who, asked);
  return (
    <section className="rounded-3xl border border-line bg-surface px-6 py-6">
      <h2 className="font-display text-2xl">After the call</h2>
      <p className="mt-2 leading-7 text-muted">
        Pick who you just spoke with. Add what they asked, if you still have it. Then copy the note.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {followUpPeople.map((person) => (
          <button
            key={person.id}
            type="button"
            aria-pressed={who === person.id}
            onClick={() => onWho(person.id)}
            className={`min-h-11 rounded-full px-4 text-sm ${
              who === person.id ? "bg-accent text-white" : "bg-accent-soft text-accent"
            }`}
          >
            {person.label}
          </button>
        ))}
      </div>
      <label className="mt-4 flex flex-col gap-2">
        <span className="text-sm text-muted">What they asked</span>
        <input
          value={asked}
          onChange={(event) => onAsked(event.target.value)}
          placeholder="Send the portfolio by Friday"
          className="min-h-12 rounded-2xl border border-line bg-background px-4"
        />
      </label>
      <p className="mt-4 leading-7">{message}</p>
      <CopyLine text={message} />
    </section>
  );
}

function CopyLine({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="mt-4 inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm"
      onClick={() => {
        const fallback = () => {
          const area = document.createElement("textarea");
          area.value = text;
          area.setAttribute("readonly", "");
          area.style.position = "fixed";
          area.style.left = "-9999px";
          document.body.appendChild(area);
          area.select();
          document.execCommand("copy");
          area.remove();
        };
        if (navigator.clipboard?.writeText) {
          void navigator.clipboard.writeText(text).catch(fallback);
        } else {
          fallback();
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied" : "Copy message"}
    </button>
  );
}
