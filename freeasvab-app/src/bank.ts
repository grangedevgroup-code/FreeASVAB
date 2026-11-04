import { generate, generatedId, type Question } from "./generators";
import { CAT_ORDER, type Subtest } from "./scoring";
import type { QStat, Section } from "./store";

export type { Question };

export type QuizSet = { id: string; title: string; subtest: string; source: string; time: string | null; count: number; ids: string[] };
export type Lesson = { id: string; title: string; sub: string; label: string };
export type Bank = { questions: Question[]; passages: Record<string, string>; sets: QuizSet[] };
export type Index = { version: string; questionCount: number; learn: Lesson[] };

let bank: Bank | null = null;
let byId = new Map<string, Question>();
let index: Index | null = null;

export async function loadIndex(): Promise<Index> {
  if (!index) index = await (await fetch("content/index.json")).json();
  return index!;
}

export async function loadBank(): Promise<Bank> {
  if (bank) return bank;
  const b: Bank = await (await fetch("content/bank.json")).json();
  bank = b;
  byId = new Map(b.questions.map((q) => [q.id, q]));
  return b;
}

export async function loadLesson(id: string): Promise<Lesson & { html: string }> {
  const res = await fetch(`content/learn/${encodeURIComponent(id)}.json`);
  if (!res.ok) throw new Error("Lesson not found");
  return res.json();
}

export function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function mini(src: string) {
  return esc(src)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\^\{([^{}]*)\}/g, "<sup>$1</sup>")
    .replace(/\^(−?\d+|[a-z])/g, "<sup>$1</sup>")
    .replace(/(\d+)\/(\d+)/g, '<span class="frac"><span class="fn">$1</span><span class="fd">$2</span></span>');
}

const rendered = new Map<string, Question>();

export function question(id: string): Question | undefined {
  const q = byId.get(id);
  if (q) return q;
  if (rendered.has(id)) return rendered.get(id);
  const g = generate(id);
  if (!g) return undefined;
  const out = { ...g, text: `<p>${mini(g.text)}</p>`, choices: g.choices.map(mini), explain: `<p>${mini(g.explain)}</p>` };
  rendered.set(id, out);
  return out;
}

export function passage(id: string | undefined) {
  return id && bank ? bank.passages[id] : undefined;
}

export function poolSize(subtest: string) {
  return bank ? bank.questions.filter((q) => q.subtest === subtest).length : 0;
}

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function priority(id: string, stats: Record<string, QStat>) {
  const s = stats[id];
  if (!s) return 0;
  if (!s.lastCorrect) return 1;
  return 2 + s.correct / Math.max(1, s.seen);
}

function ranked(ids: string[], stats: Record<string, QStat>) {
  return shuffle(ids).sort((a, b) => {
    const d = priority(a, stats) - priority(b, stats);
    if (d) return d;
    return (stats[a]?.last ?? 0) - (stats[b]?.last ?? 0);
  });
}

function seed() {
  return Math.floor(Math.random() * 2 ** 31);
}

export function pick(subtest: string, count: number, stats: Record<string, QStat>, exclude = new Set<string>()): string[] {
  const all = bank!.questions.filter((q) => q.subtest === subtest && !exclude.has(q.id));
  if (subtest === "PC") return pickPassages(all, count, stats);
  const order = ranked(
    all.map((q) => q.id),
    stats,
  );
  const fresh = order.filter((id) => !stats[id]);
  const out: string[] = [];
  if ((subtest === "AR" || subtest === "MK") && fresh.length < count) {
    out.push(...fresh);
    const gen = Math.min(count - out.length, Math.ceil(count / 2));
    for (let i = 0; i < gen; i++) out.push(generatedId(subtest, seed()));
    for (const id of order) if (out.length < count && !out.includes(id)) out.push(id);
    return shuffle(out);
  }
  return order.slice(0, count);
}

function pickPassages(all: Question[], count: number, stats: Record<string, QStat>) {
  const groups = new Map<string, string[]>();
  for (const q of all) {
    const k = q.passage ?? q.id;
    groups.set(k, [...(groups.get(k) ?? []), q.id]);
  }
  const score = (ids: string[]) => ids.reduce((s, id) => s + priority(id, stats), 0) / ids.length;
  const order = shuffle([...groups.values()]).sort((a, b) => score(a) - score(b));
  const out: string[] = [];
  for (const g of order) {
    if (out.length >= count) break;
    if (out.length + g.length <= count + 1) out.push(...g);
  }
  return out;
}

export function fullSections(stats: Record<string, QStat>, afqtOnly: boolean): Section[] {
  return CAT_ORDER.filter((s) => !afqtOnly || ["AR", "WK", "PC", "MK"].includes(s.subtest)).map((s) => ({
    subtest: s.subtest,
    minutes: s.minutes,
    qids: pick(s.subtest, s.count, stats),
  }));
}

export function unlimitedMath(subtest: "AR" | "MK", count: number): string[] {
  return Array.from({ length: count }, () => generatedId(subtest, seed()));
}

export function missedIds(stats: Record<string, QStat>): string[] {
  return Object.entries(stats)
    .filter(([id, s]) => !s.lastCorrect && (byId.has(id) || id.startsWith("g:")))
    .sort((a, b) => b[1].last - a[1].last)
    .map(([id]) => id);
}

export function subtestOf(id: string): Subtest | "MF" {
  return (question(id)?.subtest ?? "MF") as Subtest | "MF";
}
