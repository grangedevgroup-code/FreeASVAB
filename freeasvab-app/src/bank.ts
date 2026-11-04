import { generate, generatedId, type Question } from "./generators";
import { CAT_ORDER, type Subtest } from "./scoring";
import { migrateIds, type QStat, type Section } from "./store";

export type { Question };

export type QuizSet = { id: string; title: string; subtest: string; source: string; time: string | null; count: number; ids: string[] };
export type LessonGroup = "start" | "afqt" | "career" | "reference";
export type Lesson = { id: string; title: string; sub: string; group: LessonGroup; subtest: string | null };
export type LessonPage = Lesson & { html: string; toc: { id: string; text: string }[] };
export type Bank = { questions: Question[]; passages: Record<string, string>; sets: QuizSet[]; aliases: Record<string, string> };
export type Index = { version: string; questionCount: number; learn: Lesson[] };

let bank: Bank | null = null;
let byId = new Map<string, Question>();
let index: Index | null = null;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function loadIndex(): Promise<Index> {
  if (!index) index = await getJson<Index>("content/index.json");
  return index;
}

export async function loadBank(): Promise<Bank> {
  if (bank) return bank;
  const b = await getJson<Bank>("content/bank.json");
  b.aliases ??= {};
  bank = b;
  byId = new Map(b.questions.map((q) => [q.id, q]));
  migrateIds(b.aliases);
  return b;
}

export function bankLoaded() {
  return bank;
}

export async function loadLesson(id: string): Promise<LessonPage> {
  return getJson<LessonPage>(`content/learn/${encodeURIComponent(id)}.json`);
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
  const q = byId.get(id) ?? (bank?.aliases[id] ? byId.get(bank.aliases[id]) : undefined);
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

export function subjectStats(subtest: string, stats: Record<string, QStat>) {
  const all = bank ? bank.questions.filter((q) => q.subtest === subtest) : [];
  let seen = 0;
  let missed = 0;
  for (const q of all) {
    const s = stats[q.id];
    if (!s) continue;
    seen++;
    if (!s.lastCorrect) missed++;
  }
  return { total: all.length, seen, missed };
}

type Rand = () => number;

function shuffle<T>(xs: T[], rand: Rand): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
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

function ranked(ids: string[], stats: Record<string, QStat>, rand: Rand) {
  return shuffle(ids, rand).sort((a, b) => {
    const d = priority(a, stats) - priority(b, stats);
    if (d) return d;
    return (stats[a]?.last ?? 0) - (stats[b]?.last ?? 0);
  });
}

export function choose(
  questions: Question[],
  subtest: string,
  count: number,
  stats: Record<string, QStat>,
  rand: Rand = Math.random,
  makeGenerated: (s: "AR" | "MK") => string = (s) => generatedId(s, Math.floor(rand() * 2 ** 31)),
): string[] {
  const pool = questions.filter((q) => q.subtest === subtest);
  if (subtest === "PC") return choosePassages(pool, count, stats, rand);
  const order = ranked(
    pool.map((q) => q.id),
    stats,
    rand,
  );
  const fresh = order.filter((id) => !stats[id]);
  if ((subtest === "AR" || subtest === "MK") && fresh.length < count) {
    const out = [...fresh];
    const gen = Math.min(count - out.length, Math.ceil(count / 2));
    for (let i = 0; i < gen; i++) out.push(makeGenerated(subtest));
    for (const id of order) if (out.length < count && !out.includes(id)) out.push(id);
    return shuffle(out, rand);
  }
  return order.slice(0, count);
}

function choosePassages(pool: Question[], count: number, stats: Record<string, QStat>, rand: Rand) {
  const groups = new Map<string, string[]>();
  for (const q of pool) {
    const k = q.passage ?? q.id;
    groups.set(k, [...(groups.get(k) ?? []), q.id]);
  }
  const score = (ids: string[]) => ids.reduce((s, id) => s + priority(id, stats), 0) / ids.length;
  const order = shuffle([...groups.values()], rand).sort((a, b) => score(a) - score(b));
  const out: string[] = [];
  for (const g of order) {
    if (out.length >= count) break;
    if (out.length + g.length <= count + 1) out.push(...g);
  }
  return out;
}

export function pick(subtest: string, count: number, stats: Record<string, QStat>): string[] {
  return choose(bank!.questions, subtest, count, stats);
}

export function fullSections(stats: Record<string, QStat>, afqtOnly: boolean): Section[] {
  return CAT_ORDER.filter((s) => !afqtOnly || ["AR", "WK", "PC", "MK"].includes(s.subtest)).map((s) => ({
    subtest: s.subtest,
    minutes: s.minutes,
    qids: pick(s.subtest, s.count, stats),
  }));
}

export const QUICK_CHECK: { subtest: Subtest; count: number; minutes: number }[] = [
  { subtest: "AR", count: 4, minutes: 8 },
  { subtest: "WK", count: 6, minutes: 3 },
  { subtest: "PC", count: 4, minutes: 6 },
  { subtest: "MK", count: 4, minutes: 6 },
];

export function quickSections(stats: Record<string, QStat>): Section[] {
  return QUICK_CHECK.map((s) => ({ subtest: s.subtest, minutes: s.minutes, qids: pick(s.subtest, s.count, stats) }));
}

export function unlimitedMath(subtest: "AR" | "MK", count: number): string[] {
  return Array.from({ length: count }, () => generatedId(subtest, Math.floor(Math.random() * 2 ** 31)));
}

export function missedIds(stats: Record<string, QStat>, subtest?: string): string[] {
  return Object.entries(stats)
    .filter(([id, s]) => !s.lastCorrect && (byId.has(id) || id.startsWith("g:")))
    .filter(([id]) => !subtest || question(id)?.subtest === subtest)
    .sort((a, b) => b[1].last - a[1].last)
    .map(([id]) => id);
}

export function missedCount(stats: Record<string, QStat>) {
  let n = 0;
  for (const s of Object.values(stats)) if (!s.lastCorrect) n++;
  return n;
}
