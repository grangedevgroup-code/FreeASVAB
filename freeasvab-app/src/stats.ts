import type { Attempt } from "./store";

export const AFQT_PRACTICE = ["WK", "PC", "AR", "MK"] as const;
export const CAREER_PRACTICE = ["GS", "EI", "AI", "SI", "MC", "AO"] as const;

export function accuracy(attempts: Attempt[], subtest: string, window = 60): { pct: number; n: number } | null {
  const items: boolean[] = [];
  for (let a = attempts.length - 1; a >= 0 && items.length < window; a--) {
    const list = attempts[a].items;
    for (let i = list.length - 1; i >= 0 && items.length < window; i--) {
      const it = list[i];
      if (it.subtest === subtest && it.choice !== null) items.push(it.correct);
    }
  }
  if (items.length < 5) return null;
  return { pct: Math.round((items.filter(Boolean).length / items.length) * 100), n: items.length };
}

export function summary(attempts: Attempt[]) {
  let answered = 0;
  let correct = 0;
  const days = new Set<string>();
  let tests = 0;
  for (const a of attempts) {
    if (a.scores?.afqt != null) tests++;
    const d = new Date(a.finishedAt);
    days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    for (const it of a.items) {
      if (it.choice === null) continue;
      answered++;
      if (it.correct) correct++;
    }
  }
  return { tests, sessions: attempts.length, answered, accuracy: answered ? Math.round((correct / answered) * 100) : null, days: days.size };
}

export function scoredAttempts(attempts: Attempt[]) {
  return attempts.filter((a) => a.scores?.afqt != null);
}

export type Step = { kind: "quick" | "afqt" | "practice" | "review"; subtest?: string; reason: string };

export function nextSteps(attempts: Attempt[], missed: number, now = Date.now()): Step[] {
  if (!attempts.length) return [{ kind: "quick", reason: "A 15-minute check gives you a first AFQT estimate and shows where to start." }];
  const steps: Step[] = [];
  const ranked = AFQT_PRACTICE.map((k) => ({ k, acc: accuracy(attempts, k) }))
    .filter((x) => x.acc)
    .sort((a, b) => a.acc!.pct - b.acc!.pct);
  const weakest = ranked[0];
  if (weakest && weakest.acc!.pct < 90) {
    const verbal = weakest.k === "WK" || weakest.k === "PC";
    steps.push({
      kind: "practice",
      subtest: weakest.k,
      reason: `${weakest.acc!.pct}% correct lately. ${verbal ? "Verbal answers count double in your AFQT." : "Math makes up half of your AFQT."}`,
    });
  } else if (!ranked.length) {
    steps.push({ kind: "practice", subtest: "WK", reason: "Word Knowledge is the fastest way to raise your AFQT: verbal counts double." });
  }
  if (missed >= 5) steps.push({ kind: "review", reason: `${missed} questions you missed are waiting. Fixing mistakes is the quickest gain.` });
  const scored = scoredAttempts(attempts);
  const last = scored[scored.length - 1];
  if (!last) steps.push({ kind: "afqt", reason: "Take a full AFQT practice test to get a solid estimate." });
  else if (now - last.finishedAt > 7 * 864e5) steps.push({ kind: "afqt", reason: "It has been over a week since your last test. Measure your progress." });
  return steps.slice(0, 2);
}

export function trend(attempts: Attempt[]): number | null {
  const s = scoredAttempts(attempts);
  if (s.length < 2) return null;
  return s[s.length - 1].scores!.afqt! - s[s.length - 2].scores!.afqt!;
}
