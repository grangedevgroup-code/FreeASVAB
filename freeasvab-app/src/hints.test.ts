import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { hintFor, isFallback } from "./hints";

type Q = { id: string; subtest: string; text: string };
const bank: { questions: Q[] } = JSON.parse(readFileSync(new URL("../public/content/bank.json", import.meta.url), "utf8"));

describe("hints across the question bank", () => {
  it("gives a specific hint to almost every question", () => {
    for (const subtest of ["AR", "MK", "EI", "MC", "GS", "AI", "SI", "PC"]) {
      const qs = bank.questions.filter((q) => q.subtest === subtest);
      const generic = qs.filter((q) => isFallback(hintFor(q.subtest, q.text)));
      expect(generic.length / qs.length, `${subtest}: ${generic.length} of ${qs.length} generic`).toBeLessThan(0.05);
    }
  });

  it("never sends component or unit questions to Ohm's law", () => {
    for (const q of bank.questions.filter((x) => x.subtest === "EI")) {
      if (/diode|capacitor|fuse|transformer|unit of|measured in|color/i.test(q.text)) {
        expect(hintFor("EI", q.text).title, q.text).not.toBe("Ohm's law");
      }
    }
  });
});

describe("hint rules", () => {
  const cases: [string, string, string][] = [
    ["EI", "<p>Which component allows current to flow in only one direction?</p>", "Components and what they do"],
    ["EI", "<p>A 12-volt battery is connected to a 6-ohm resistor. How much current flows?</p>", "Ohm's law"],
    ["EI", "<p>Two 10-ohm resistors are connected in parallel. What is the total resistance?</p>", "Series and parallel"],
    ["EI", "<p>A resistor has the color bands brown, black, red. What is its resistance?</p>", "Resistor color code"],
    ["AR", "<p>A patrol leaves at 0945 and returns at 1520. How long was the patrol gone?</p>", "Elapsed time (military time)"],
    ["AR", "<p>One alarm sounds every 8 minutes and another sounds every 12 minutes. Both sound at 0900. When will they next sound together?</p>", "When things line up again"],
    ["AR", "<p>Two standard dice are rolled. What is the probability that both show an even number?</p>", "Probability"],
    ["AR", "<p>The sum of three consecutive integers is 96. What is the largest of the three?</p>", "Consecutive numbers"],
    ["AR", "<p>A 13-foot ladder leans against a wall with its base 5 feet from the wall.</p>", "Right triangles (Pythagorean theorem)"],
    ["AR", "<p>A jacket costs $80. It is on sale for 25% off. What is the sale price?</p>", "Discounts and tax"],
    ["MK", "<p>Solve: <em>x</em><sup>2</sup> − 2<em>x</em> − 15 = 0</p>", "Quadratic equations"],
    ["MK", "<p>Solve the inequality: 2<em>x</em> + 3 &gt; 11</p>", "Inequalities"],
    ["MK", "<p>What is the value of 3<em>a</em> + 2<em>b</em> when <em>a</em> = 4 and <em>b</em> = −5?</p>", "Substituting values"],
    ["MK", "<p>Simplify: <em>x</em><sup>3</sup> · <em>x</em><sup>4</sup></p>", "Exponent rules"],
    ["MC", "<p>Which change will make a pendulum swing more slowly?</p>", "Pendulums"],
    ["AI", "<p>A squealing noise when braking usually means:</p>", "Brakes"],
    ["SI", "<p>Which sandpaper grit should be used first on a rough board?</p>", "Sandpaper"],
    ["WK", "<p><em>Abundant</em> most nearly means:</p>", "Vocabulary strategy"],
    ["WK", "<p>The sergeant gave a <em>terse</em> reply.</p>", "Words in context"],
    ["AO", "<p>Which figure shows the two shapes correctly connected at points A and B?</p>", "Connection questions"],
    ["PC", "<p>The main point of the passage is that:</p>", "Main idea questions"],
  ];
  for (const [subtest, html, title] of cases) {
    it(`${subtest}: ${title}`, () => expect(hintFor(subtest, html).title).toBe(title));
  }
});
