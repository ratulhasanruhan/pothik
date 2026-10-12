"use client";

import { useState } from "react";
import { workMessages } from "@/lib/work-messages";

export function CommunicationHelp() {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {workMessages.map((item) => (
        <li key={item.id} className="flex flex-col rounded-3xl border border-line bg-surface px-5 py-5">
          <p className="text-sm font-medium text-accent">{item.who}</p>
          <p className="mt-1 text-sm text-muted">{item.when}</p>
          <p className="mt-3 flex-1 leading-7">{item.message}</p>
          <CopyLine text={item.message} />
        </li>
      ))}
    </ul>
  );
}

function CopyLine({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="mt-4 inline-flex min-h-11 items-center self-start rounded-full border border-line px-4 text-sm"
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
