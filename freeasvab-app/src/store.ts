import { mirrorNative } from "./native";
import type { Raw, Scores, Subtest } from "./scoring";

export type Kind = "full" | "afqt" | "practice" | "review" | "set";

export type Section = { subtest: Subtest | "MF"; minutes: number | null; qids: string[] };

export type ActiveTest = {
  id: string;
  kind: Kind;
  title: string;
  strict: boolean;
  timed: boolean;
  instant: boolean;
  sections: Section[];
  section: number;
  index: number;
  answers: Record<string, number | null>;
  times: Record<string, number>;
  sectionUsedMs: number[];
  resumedAt: number;
  startedAt: number;
  timedOut?: string[];
  hinted?: string[];
};

export type AttemptItem = { qid: string; subtest: string; choice: number | null; correct: boolean; ms: number; hinted?: boolean };

export type Attempt = {
  id: string;
  kind: Kind;
  title: string;
  startedAt: number;
  finishedAt: number;
  items: AttemptItem[];
  raw: Raw;
  scores: Scores | null;
  timedOut: string[];
};

export type QStat = { seen: number; correct: number; last: number; lastCorrect: boolean };

export type Settings = {
  theme: "system" | "light" | "dark";
  textSize: "normal" | "large" | "larger";
  target: number;
  education: "diploma" | "ged";
  strict: boolean;
  timed: boolean;
};

export type State = {
  v: 1;
  settings: Settings;
  attempts: Attempt[];
  qstats: Record<string, QStat>;
  active: ActiveTest | null;
};

const KEY = "freeasvab:v1";

export const defaultSettings: Settings = {
  theme: "system",
  textSize: "normal",
  target: 50,
  education: "diploma",
  strict: true,
  timed: true,
};

function fresh(): State {
  return { v: 1, settings: { ...defaultSettings }, attempts: [], qstats: {}, active: null };
}

let memory: State | null = null;
let storageOk = true;

export function load(): State {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(KEY);
    memory = raw ? sanitize(JSON.parse(raw)) : fresh();
  } catch {
    storageOk = false;
    memory = fresh();
  }
  return memory;
}

export function save() {
  if (!memory) return;
  try {
    const json = JSON.stringify(memory);
    mirrorNative(json);
    localStorage.setItem(KEY, json);
    storageOk = true;
  } catch {
    storageOk = false;
  }
}

export function storageWorks() {
  return storageOk;
}

export function update(fn: (s: State) => void) {
  const s = load();
  fn(s);
  save();
}

function isObj(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

export function sanitize(input: unknown): State {
  const s = fresh();
  if (!isObj(input) || input.v !== 1) throw new Error("This is not a FreeASVAB backup file.");
  if (isObj(input.settings)) {
    const t = input.settings;
    if (t.theme === "light" || t.theme === "dark" || t.theme === "system") s.settings.theme = t.theme;
    if (t.textSize === "normal" || t.textSize === "large" || t.textSize === "larger") s.settings.textSize = t.textSize;
    if (typeof t.target === "number" && t.target >= 1 && t.target <= 99) s.settings.target = Math.round(t.target);
    if (t.education === "diploma" || t.education === "ged") s.settings.education = t.education;
    if (typeof t.strict === "boolean") s.settings.strict = t.strict;
    if (typeof t.timed === "boolean") s.settings.timed = t.timed;
  }
  if (Array.isArray(input.attempts)) {
    s.attempts = input.attempts.filter(
      (a): a is Attempt =>
        isObj(a) && typeof a.id === "string" && typeof a.title === "string" && typeof a.finishedAt === "number" && Array.isArray(a.items) && isObj(a.raw),
    );
  }
  if (isObj(input.qstats)) {
    for (const [k, v] of Object.entries(input.qstats)) {
      if (isObj(v) && typeof v.seen === "number" && typeof v.correct === "number") {
        s.qstats[k] = { seen: v.seen, correct: v.correct, last: Number(v.last) || 0, lastCorrect: !!v.lastCorrect };
      }
    }
  }
  if (isObj(input.active) && Array.isArray(input.active.sections) && isObj(input.active.answers)) s.active = input.active as ActiveTest;
  return s;
}

export function exportBackup(): string {
  return JSON.stringify(load());
}

export function importBackup(text: string) {
  memory = sanitize(JSON.parse(text));
  save();
}

export function resetAll() {
  memory = fresh();
  save();
}

export async function askPersistence() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    return;
  }
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
