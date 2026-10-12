"use client";

import Image from "next/image";
import Link from "next/link";
import { Assessment } from "./assessment";
import { Results } from "./results";
import { useSession } from "./session";
import { Welcome } from "./welcome";

/** Pothik guide: welcome → assessment chat → results, with shared header/footer. */
export function GuideApp() {
  const { ready, chat, plan, t } = useSession();

  let screen: React.ReactNode;
  if (!ready) screen = <p className="py-20 text-center text-muted">…</p>;
  else if (plan) screen = <Results />;
  else if (chat) screen = <Assessment key={chat.mode} />;
  else screen = <Welcome />;

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-10">{screen}</main>
      <footer className="border-t border-line px-4 py-4 text-center text-sm text-muted">
        {t.footer}
      </footer>
    </div>
  );
}

function Header() {
  const { t, lang, setLang, theme, setTheme, calm, setCalm, plan, chat, reset } = useSession();
  const inFlow = Boolean(plan || chat);

  return (
    <header className="no-print border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/guide" className="flex items-center gap-2" aria-label={t.appName}>
          <Image src="/pothik-logo.png" alt="" width={40} height={40} className="size-10 rounded-full dark:bg-white" />
          <span className="font-display text-xl">{t.appName}</span>
        </Link>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Segmented
            label={t.language}
            value={lang}
            options={[
              { value: "en", label: "EN" },
              { value: "bn", label: "বাং" },
            ]}
            onChange={(value) => setLang(value as typeof lang)}
          />
          <Segmented
            label={t.theme}
            value={theme}
            options={[
              { value: "light", label: t.light },
              { value: "dark", label: t.dark },
            ]}
            onChange={(value) => setTheme(value as typeof theme)}
          />
          <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-line px-3 text-sm">
            <input
              type="checkbox"
              checked={calm}
              onChange={(event) => setCalm(event.target.checked)}
              className="size-4 accent-accent"
            />
            {t.calm}
          </label>
          {inFlow ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t.startOverConfirm)) reset();
              }}
              className="inline-flex min-h-10 items-center rounded-full border border-line px-3 text-sm"
            >
              {t.startOver}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function Segmented({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-full border border-line p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`min-h-9 rounded-full px-3 text-sm ${
            value === option.value ? "bg-accent text-white dark:text-background" : "text-muted"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
