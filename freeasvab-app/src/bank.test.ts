import { describe, expect, it } from "vitest";
import { choose, type Question } from "./bank";
import { rng } from "./generators";

function q(id: string, subtest: string, passage?: string): Question {
  return { id, subtest, source: "", text: "", choices: ["a", "b", "c", "d"], answer: 0, explain: "", passage };
}

const pool: Question[] = [
  ...Array.from({ length: 12 }, (_, i) => q(`gs-${i}`, "GS")),
  ...Array.from({ length: 10 }, (_, i) => q(`pc-${i}`, "PC", `p${Math.floor(i / 2)}`)),
  ...Array.from({ length: 6 }, (_, i) => q(`ar-${i}`, "AR")),
];

describe("choose", () => {
  it("returns the requested number from one subject", () => {
    const ids = choose(pool, "GS", 5, {}, rng(1));
    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
    expect(ids.every((id) => id.startsWith("gs-"))).toBe(true);
  });

  it("prefers unseen questions, then ones answered wrong", () => {
    const stats = Object.fromEntries(
      Array.from({ length: 10 }, (_, i) => [`gs-${i}`, { seen: 1, correct: i === 3 ? 0 : 1, last: i, lastCorrect: i !== 3 }]),
    );
    const ids = choose(pool, "GS", 3, stats, rng(2));
    expect(ids.slice(0, 2).sort()).toEqual(["gs-10", "gs-11"]);
    expect(ids[2]).toBe("gs-3");
  });

  it("keeps reading passages together", () => {
    const ids = choose(pool, "PC", 4, {}, rng(3));
    expect(ids).toHaveLength(4);
    const passages = ids.map((id) => pool.find((x) => x.id === id)!.passage);
    expect(passages[0]).toBe(passages[1]);
    expect(passages[2]).toBe(passages[3]);
  });

  it("tops up math with generated questions once the bank runs low", () => {
    const stats = Object.fromEntries(Array.from({ length: 6 }, (_, i) => [`ar-${i}`, { seen: 1, correct: 1, last: i, lastCorrect: true }]));
    let n = 0;
    const ids = choose(pool, "AR", 6, stats, rng(4), () => `g:AR:0:${n++}`);
    expect(ids).toHaveLength(6);
    expect(ids.filter((id) => id.startsWith("g:")).length).toBe(3);
  });
});
