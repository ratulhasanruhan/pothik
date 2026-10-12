"use client";

import { useRef } from "react";
import { useSession } from "./session";

const PHOTO_SIZE = 160;

/** Shrinks a chosen image to a small square JPEG data URL (kept in the tab only). */
function resizePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const side = Math.min(image.width, image.height);
      const canvas = document.createElement("canvas");
      canvas.width = PHOTO_SIZE;
      canvas.height = PHOTO_SIZE;
      const context = canvas.getContext("2d");
      if (!context) return reject(new Error("canvas"));
      // Centre-crop to a square, then scale down.
      context.drawImage(
        image,
        (image.width - side) / 2,
        (image.height - side) / 2,
        side,
        side,
        0,
        0,
        PHOTO_SIZE,
        PHOTO_SIZE,
      );
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    image.src = url;
  });
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "");
}

/** "Hi, Name" header built from the CV, with an optional photo. Hidden without a CV or target role. */
export function ProfileBadge() {
  const { t, chat, photo, setPhoto } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const profile = chat?.scan?.profile;
  const targetRole = chat?.context.targetRole ?? "";
  if (!profile && !targetRole) return null;

  const name = profile?.name ?? "";
  const subtitle = [profile?.headline || profile?.currentTitle, targetRole && `${t.applyingFor}: ${targetRole}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-4">
      <div className="relative shrink-0">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- local data URL, not an optimisable asset
          <img src={photo} alt="" className="size-16 rounded-full object-cover" />
        ) : (
          <span
            aria-hidden
            className="grid size-16 place-items-center rounded-full bg-accent font-display text-2xl text-white uppercase dark:text-background"
          >
            {initials(name) || "🙂"}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-xl">{name ? t.hi(name) : t.hiNoName}</p>
        {subtitle ? <p className="text-sm leading-6 text-muted">{subtitle}</p> : null}
        <div className="no-print mt-1 flex flex-wrap items-center gap-x-3 text-sm">
          <button type="button" onClick={() => inputRef.current?.click()} className="text-accent underline underline-offset-4">
            {photo ? t.changePhoto : t.addPhoto}
          </button>
          {photo ? (
            <button type="button" onClick={() => setPhoto(null)} className="text-muted underline underline-offset-4">
              {t.removePhoto}
            </button>
          ) : null}
          <span className="text-muted">{t.photoNote}</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            try {
              setPhoto(await resizePhoto(file));
            } catch {
              // An unreadable image is simply ignored; the initials stay.
            }
          }}
        />
      </div>
    </section>
  );
}
