const KEY = "focuscareer-park-v1";
const emptyNotes: string[] = [];
let notes: string[] | null = null;
const listeners = new Set<() => void>();

export function subscribePark(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getPark() {
  notes ??= readPark();
  return notes;
}

export function serverPark() {
  return emptyNotes;
}

export function parkThought(text: string) {
  const clean = text.trim().slice(0, 180);
  if (!clean) return;
  const next = [clean, ...getPark().filter((item) => item !== clean)].slice(0, 8);
  writePark(next);
}

export function dropThought(text: string) {
  writePark(getPark().filter((item) => item !== text));
}

function readPark() {
  if (typeof window === "undefined") return emptyNotes;
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as unknown;
    if (!Array.isArray(raw)) return emptyNotes;
    return raw.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 8);
  } catch {
    return emptyNotes;
  }
}

function writePark(next: string[]) {
  notes = next;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}
