import { describe, expect, it } from "vitest";
import { afqtCategory, afqtRange, normCdf, normInv, score, standardScore } from "./scoring";

describe("normal distribution helpers", () => {
  it("round-trips", () => {
    for (const p of [0.01, 0.1, 0.25, 0.5, 0.8, 0.975, 0.999]) expect(normCdf(normInv(p))).toBeCloseTo(p, 4);
  });
});

describe("standardScore", () => {
  it("is monotonic in correct answers", () => {
    let last = -Infinity;
    for (let c = 0; c <= 15; c++) {
      const s = standardScore(c, 15);
      expect(s).toBeGreaterThanOrEqual(last);
      last = s;
    }
  });
  it("puts guessing near the bottom and a perfect run near the top", () => {
    expect(standardScore(4, 15)).toBeLessThan(35);
    expect(standardScore(15, 15)).toBeGreaterThan(68);
    expect(standardScore(0, 15)).toBeGreaterThanOrEqual(20);
  });
  it("stays within 20 to 80", () => {
    expect(standardScore(1000, 1000)).toBeLessThanOrEqual(80);
    expect(standardScore(0, 1000)).toBeGreaterThanOrEqual(20);
  });
});

describe("score", () => {
  const all = (correct: number, total: number) =>
    Object.fromEntries(["GS", "AR", "WK", "PC", "MK", "EI", "AI", "SI", "MC", "AO"].map((k) => [k, { correct, total }]));

  it("computes AFQT only when all four AFQT subtests are present", () => {
    expect(score({ AR: { correct: 10, total: 15 }, MK: { correct: 10, total: 15 } }).afqt).toBeNull();
    expect(score(all(10, 15)).afqt).not.toBeNull();
  });
  it("ranks a perfect test at 99 and a blind guess below enlistment minimums", () => {
    expect(score(all(15, 15)).afqt).toBe(99);
    expect(score(all(4, 15)).afqt!).toBeLessThan(31);
  });
  it("rises as answers improve", () => {
    let last = 0;
    for (let c = 3; c <= 15; c++) {
      const a = score(all(c, 15)).afqt!;
      expect(a).toBeGreaterThanOrEqual(last);
      last = a;
    }
  });
  it("gives all Army line scores and MAGE for a full test", () => {
    const s = score(all(11, 15));
    expect(s.army.map((a) => a.code)).toEqual(["GT", "CL", "CO", "EL", "FA", "GM", "MM", "OF", "SC", "ST"]);
    expect(s.mage).toHaveLength(4);
    expect(s.standard.AS).toBeDefined();
  });
  it("puts an average performance near the middle", () => {
    const s = score(all(9, 15));
    expect(s.afqt!).toBeGreaterThan(30);
    expect(s.afqt!).toBeLessThan(70);
    expect(s.army.find((a) => a.code === "GT")!.value).toBeGreaterThan(80);
    expect(s.army.find((a) => a.code === "GT")!.value).toBeLessThan(120);
  });
});

describe("afqtRange", () => {
  const afqtOnly = (correct: number, total: number) => ({
    AR: { correct, total },
    WK: { correct, total },
    PC: { correct, total },
    MK: { correct, total },
  });
  it("brackets the estimate", () => {
    for (let c = 2; c <= 14; c++) {
      const raw = afqtOnly(c, 15);
      const est = score(raw).afqt!;
      const r = afqtRange(raw)!;
      expect(r.low).toBeLessThanOrEqual(est);
      expect(r.high).toBeGreaterThanOrEqual(est);
    }
  });
  it("narrows as the test gets longer", () => {
    const short = afqtRange(afqtOnly(3, 5))!;
    const long = afqtRange(afqtOnly(30, 50))!;
    expect(long.high - long.low).toBeLessThan(short.high - short.low);
  });
  it("needs every AFQT subject", () => {
    expect(afqtRange({ AR: { correct: 5, total: 10 } })).toBeNull();
  });
});

describe("afqtCategory", () => {
  it("matches the official bands", () => {
    expect([99, 93, 92, 65, 64, 50, 49, 31, 30, 21, 20, 16, 15, 10, 9, 1].map(afqtCategory)).toEqual([
      "I", "I", "II", "II", "IIIA", "IIIA", "IIIB", "IIIB", "IVA", "IVA", "IVB", "IVB", "IVC", "IVC", "V", "V",
    ]);
  });
});
