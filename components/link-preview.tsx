"use client";

import { useState } from "react";
import { resourceForUrl } from "@/lib/node-content";

export function LinkPreview({ url }: { url: string }) {
  const [icon, setIcon] = useState(false);
  const known = resourceForUrl(url);
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    host = url;
  }
  const title = known?.title ?? host;
  const summary = known?.summary ?? "";

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-2 flex overflow-hidden rounded-2xl border border-line bg-background no-underline"
    >
      {known ? (
        <span className="grid h-24 w-28 shrink-0 place-items-center bg-accent-soft">
          <img
            src={`/api/link-preview?url=${encodeURIComponent(url)}&v=2`}
            alt=""
            onLoad={(event) => {
              const width = event.currentTarget.naturalWidth;
              if (width > 0 && width < 160) setIcon(true);
            }}
            className={icon ? "size-12 object-contain" : "h-24 w-28 object-cover"}
          />
        </span>
      ) : null}
      <span className="flex min-w-0 flex-col justify-center px-3 py-3">
        <span className="text-xs text-muted">{known ? `${known.kind} · ${host}` : host}</span>
        <span className="mt-1 font-medium leading-6 text-foreground">{title}</span>
        {summary ? <span className="mt-1 line-clamp-2 text-sm leading-5 text-muted">{summary}</span> : null}
      </span>
    </a>
  );
}
