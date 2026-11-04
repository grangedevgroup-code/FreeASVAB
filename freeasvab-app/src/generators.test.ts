import { describe, expect, it } from "vitest";
import { GENERATED, generate, generatedId } from "./generators";

function value(s: string) {
  const t = s.replace(/[$,%°π]|sq (ft|in)|miles|hours/g, "").replace(/−/g, "-").trim();
  return Number(t);
}

describe("generated questions", () => {
  for (const subtest of ["AR", "MK"] as const) {
    it(`${subtest}: every template makes four distinct choices with one valid answer`, () => {
      for (let seed = 0; seed < 4000; seed++) {
        const id = generatedId(subtest, seed);
        const q = generate(id)!;
        expect(q, id).toBeTruthy();
        expect(q.choices, id).toHaveLength(4);
        expect(new Set(q.choices).size, `${id} ${q.choices}`).toBe(4);
        expect(q.answer, id).toBeGreaterThanOrEqual(0);
        expect(q.choices.join(" "), id).not.toMatch(/NaN|Infinity|undefined/);
        expect(q.text + q.explain, id).not.toMatch(/NaN|Infinity|undefined/);
      }
    });
    it(`${subtest}: same id gives the same question`, () => {
      const id = generatedId(subtest, 12345);
      expect(generate(id)).toEqual(generate(id));
    });
  }

  it("states the marked answer in the explanation", () => {
    for (let seed = 0; seed < 2000; seed++) {
      for (const subtest of ["AR", "MK"] as const) {
        const q = generate(generatedId(subtest, seed))!;
        const right = q.choices[q.answer];
        const n = value(right);
        if (!Number.isNaN(n)) {
          const bold = [...q.explain.matchAll(/\*\*(.+?)\*\*/g)].map((m) => value(m[1].replace(/\*x\*\^?\{?|\}/g, "")));
          expect(bold.some((b) => Math.abs(b - n) < 1e-9), `${q.id}: ${right} vs ${q.explain}`).toBe(true);
        }
      }
    }
  });

  it("covers every template", () => {
    const seen = { AR: new Set<string>(), MK: new Set<string>() };
    for (let seed = 0; seed < 200; seed++) {
      for (const s of ["AR", "MK"] as const) seen[s].add(generatedId(s, seed).split(":")[2]);
    }
    expect(seen.AR.size).toBe(GENERATED.AR);
    expect(seen.MK.size).toBe(GENERATED.MK);
  });
});
