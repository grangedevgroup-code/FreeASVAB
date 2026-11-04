import { describe, expect, it } from "vitest";
import { accuracy, nextSteps, summary, trend } from "./stats";
import type { Attempt } from "./store";

function attempt(id: string, day: number, items: [string, boolean][], afqt: number | null = null): Attempt {
  return {
    id,
    kind: afqt === null ? "practice" : "afqt",
    title: id,
    startedAt: day * 864e5,
    finishedAt: day * 864e5 + 1000,
    items: items.map(([subtest, correct], i) => ({ qid: `${id}-${i}`, subtest, choice: 0, correct, ms: 0 })),
    raw: {},
    scores: afqt === null ? null : { standard: {}, afqt, category: "IIIB", army: [], mage: [] },
    timedOut: [],
  };
}

const many = (subtest: string, right: number, wrong: number) => [
  ...Array.from({ length: right }, () => [subtest, true] as [string, boolean]),
  ...Array.from({ length: wrong }, () => [subtest, false] as [string, boolean]),
];

describe("accuracy", () => {
  it("needs at least five answers", () => {
    expect(accuracy([attempt("a", 1, many("WK", 2, 2))], "WK")).toBeNull();
  });
  it("uses the most recent answers", () => {
    const list = [attempt("old", 1, many("WK", 0, 60)), attempt("new", 2, many("WK", 60, 0))];
    expect(accuracy(list, "WK")!.pct).toBe(100);
  });
});

describe("summary and trend", () => {
  it("counts tests, answers and study days", () => {
    const list = [attempt("a", 1, many("AR", 3, 1), 40), attempt("b", 1, many("WK", 1, 1)), attempt("c", 3, many("MK", 2, 0), 48)];
    const s = summary(list);
    expect(s).toEqual({ tests: 2, sessions: 3, answered: 8, accuracy: 75, days: 2 });
    expect(trend(list)).toBe(8);
  });
});

describe("nextSteps", () => {
  it("starts new users with the quick check", () => {
    expect(nextSteps([], 0)[0].kind).toBe("quick");
  });
  it("points at the weakest AFQT subject and explains why", () => {
    const list = [attempt("a", 1, [...many("WK", 9, 1), ...many("AR", 3, 7), ...many("MK", 8, 2), ...many("PC", 8, 2)], 45)];
    const steps = nextSteps(list, 0, 2 * 864e5);
    expect(steps[0]).toMatchObject({ kind: "practice", subtest: "AR" });
    expect(steps[0].reason).toMatch(/half of your AFQT/);
  });
  it("suggests reviewing mistakes when many are waiting", () => {
    const list = [attempt("a", 1, [...many("WK", 9, 1), ...many("AR", 9, 1), ...many("MK", 9, 1), ...many("PC", 9, 1)], 80)];
    expect(nextSteps(list, 12, 2 * 864e5).some((s) => s.kind === "review")).toBe(true);
  });
  it("asks for a new test when the last one is old", () => {
    const list = [attempt("a", 1, [...many("WK", 10, 0), ...many("AR", 10, 0), ...many("MK", 10, 0), ...many("PC", 10, 0)], 90)];
    expect(nextSteps(list, 0, 20 * 864e5).some((s) => s.kind === "afqt")).toBe(true);
  });
});
