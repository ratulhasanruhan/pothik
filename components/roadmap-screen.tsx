"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { NodeDrawer } from "@/components/node-drawer";
import { StatusMark } from "@/components/status-mark";
import { useProgress } from "@/components/progress-context";
import { contentFor } from "@/lib/node-content";
import type { SkillNode } from "@/lib/types";

export function RoadmapScreen() {
  const { role, progress, store } = useProgress();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paths, setPaths] = useState<string[]>([]);
  const [narrow, setNarrow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const selected = role?.nodes.find((node) => node.id === selectedId) ?? null;

  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root || !role) return;

    const measure = () => {
      const isNarrow = window.matchMedia("(max-width: 767px)").matches;
      setNarrow(isNarrow);
      if (isNarrow) {
        setPaths([]);
        return;
      }
      const bounds = root.getBoundingClientRect();
      const next: string[] = [];
      for (const node of role.nodes) {
        for (const prerequisiteId of node.prerequisites) {
          const from = nodeRefs.current[prerequisiteId];
          const to = nodeRefs.current[node.id];
          if (!from || !to) continue;
          const fromBox = from.getBoundingClientRect();
          const toBox = to.getBoundingClientRect();
          const x1 = fromBox.left + fromBox.width / 2 - bounds.left;
          const y1 = fromBox.bottom - bounds.top;
          const x2 = toBox.left + toBox.width / 2 - bounds.left;
          const y2 = toBox.top - bounds.top;
          const mid = (y1 + y2) / 2;
          next.push(`M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`);
        }
      }
      setPaths(next);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [role, selectedId]);

  if (!role || !progress) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      {store.guide ? (
        <div className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm leading-6 text-muted lg:col-span-2">
          {store.guide.analysis}{" "}
          <Link href="/guide" className="text-accent">
            LinkedIn profile and AI notes
          </Link>
        </div>
      ) : null}
      <div ref={containerRef} className="relative flex flex-col gap-12">
        {paths.length > 0 ? (
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
            {paths.map((path) => (
              <path key={path} d={path} fill="none" stroke="#d6cfc3" strokeWidth="1.5" />
            ))}
          </svg>
        ) : null}
        {role.sections.map((section) => (
          <section
            key={section}
            className={narrow ? "border-l-2 border-line pl-4" : undefined}
          >
            <h2 className="mb-3 text-sm tracking-wide text-muted">{section}</h2>
            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
              {role.nodes
                .filter((node) => node.section === section)
                .map((node) => (
                  <SkillButton
                    key={node.id}
                    node={node}
                    status={progress.nodeStatus[node.id] ?? node.defaultStatus}
                    selected={selectedId === node.id}
                    buttonRef={(element) => {
                      nodeRefs.current[node.id] = element;
                    }}
                    onSelect={() => setSelectedId(node.id)}
                  />
                ))}
            </div>
          </section>
        ))}
      </div>
      <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-7rem)]">
        {selected ? (
          <div className="h-full overflow-hidden rounded-3xl border border-line">
            <NodeDrawer node={selected} onClose={() => setSelectedId(null)} />
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-line bg-surface px-5 py-8 text-muted">
            Select a skill to open the lesson, resources, and 2-minute steps.
          </div>
        )}
      </div>
    </div>
  );
}

function SkillButton({
  node,
  status,
  selected,
  onSelect,
  buttonRef,
}: {
  node: SkillNode;
  status: SkillNode["defaultStatus"];
  selected: boolean;
  onSelect: () => void;
  buttonRef: (element: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`relative min-h-24 w-full rounded-2xl border bg-surface px-4 py-3 text-left md:w-56 ${
        selected ? "border-accent" : "border-line"
      }`}
    >
      <StatusMark status={status} />
      <span className="mt-2 block font-medium leading-6">{node.title}</span>
      <span className="mt-1 block text-sm text-muted">
        {contentFor(node).resources.length === 1
          ? "1 resource"
          : `${contentFor(node).resources.length} resources`}
      </span>
    </button>
  );
}
