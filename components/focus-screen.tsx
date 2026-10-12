"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useProgress } from "@/components/progress-context";
import { nextOpenStep, pickActiveNode } from "@/lib/focus";
import { contentFor } from "@/lib/node-content";

export function FocusScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const { role, progress, store, toggleStep, setStatus, setAdhd } = useProgress();
  const [ack, setAck] = useState(false);
  if (!role || !progress) return null;

  const node = pickActiveNode(role, progress.nodeStatus, params.get("node"));
  if (!node) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-line bg-surface px-6 py-10">
        <p className="text-sm text-muted">Focus</p>
        <h1 className="mt-2 font-display text-3xl">This map is clear.</h1>
        <p className="mt-3 leading-7 text-muted">
          Every open skill is mastered. The profile workbench has the bullets you unlocked.
        </p>
        <Link
          href="/profile"
          className="mt-6 inline-flex min-h-12 items-center rounded-full bg-accent px-5 text-white"
        >
          Open profile
        </Link>
      </div>
    );
  }

  const step = nextOpenStep(node, progress.completedSteps);
  const resources = contentFor(node).resources;
  const doneCount = node.microSteps.filter((item) => progress.completedSteps.includes(item.id)).length;

  function finishStep() {
    if (!step || ack) return;
    setAck(true);
    const current = node;
    const currentStep = step;
    window.setTimeout(() => {
      if (!current || !currentStep) return;
      if (progress && progress.nodeStatus[current.id] === "gap") {
        setStatus(current.id, "in_progress");
      }
      toggleStep(current.id, currentStep.id, true);
      setAck(false);
    }, 650);
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <p className="text-sm text-muted">{store.adhdMode ? "ADHD focus" : "Only this skill"}</p>
        <h1 className="mt-2 font-display text-4xl leading-tight">{node.title}</h1>
        <p className="mt-3 leading-7 text-muted">{node.description}</p>
      </div>
      <div className="rounded-3xl border border-line bg-surface px-6 py-8">
        {step ? (
          <>
            <p className="text-sm text-muted">
              Step {Math.min(doneCount + 1, node.microSteps.length)} of {node.microSteps.length} · about 2 minutes
            </p>
            <p className="mt-4 font-display text-3xl leading-snug">{ack ? "Done" : step.label}</p>
            <button
              type="button"
              onClick={finishStep}
              disabled={ack}
              className="mt-8 inline-flex min-h-12 items-center rounded-full bg-accent px-5 text-white disabled:opacity-70"
            >
              {ack ? "Saved" : "Mark this step done"}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">Steps finished</p>
            <p className="mt-4 font-display text-3xl leading-snug">This skill is mastered.</p>
            <Link
              href="/focus"
              className="mt-8 inline-flex min-h-12 items-center rounded-full bg-accent px-5 text-white"
            >
              Next skill
            </Link>
          </>
        )}
      </div>
      {resources.length ? (
        <div>
          <h2 className="text-sm text-muted">Resources for this skill</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {resources.map((item) => (
              <li key={item.url}>
                <a href={item.url} target="_blank" rel="noreferrer" className="text-accent">
                  {item.title}
                </a>
                <p className="text-sm leading-6 text-muted">{item.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Link href={`/bot?skill=${node.id}`} className="text-sm text-accent">
        Ask the bot about this skill
      </Link>
      {store.adhdMode ? (
        <button
          type="button"
          onClick={() => {
            setAdhd(false);
            router.push("/roadmap");
          }}
          className="text-left text-sm text-accent"
        >
          Show the full map
        </button>
      ) : (
        <Link href="/roadmap" className="text-sm text-accent">
          Back to the roadmap
        </Link>
      )}
    </div>
  );
}
