import { describe, expect, it } from "vitest";
import { applyAliases, sanitize, type State } from "./store";

function state(): State {
  return {
    v: 1,
    settings: { theme: "system", textSize: "normal", target: 50, goalSet: false, education: "diploma", strict: true, timed: true, hints: true },
    attempts: [
      {
        id: "a1",
        kind: "afqt",
        title: "Test",
        startedAt: 1,
        finishedAt: 2,
        items: [
          { qid: "ar1-1", subtest: "AR", choice: 1, correct: true, ms: 10 },
          { qid: "g:AR:1:5", subtest: "AR", choice: 0, correct: false, ms: 10 },
        ],
        raw: { AR: { correct: 1, total: 2 } },
        scores: null,
        timedOut: [],
      },
    ],
    qstats: {
      "ar1-1": { seen: 2, correct: 1, last: 100, lastCorrect: true },
      "ar1-abcd1234": { seen: 1, correct: 0, last: 200, lastCorrect: false },
      "g:AR:1:5": { seen: 1, correct: 0, last: 50, lastCorrect: false },
    },
    active: {
      id: "t",
      kind: "practice",
      title: "Practice",
      strict: false,
      timed: false,
      instant: true,
      sections: [{ subtest: "AR", minutes: null, qids: ["ar1-2", "g:AR:1:5"] }],
      section: 0,
      index: 0,
      answers: { "ar1-2": 3 },
      times: { "ar1-2": 1000 },
      sectionUsedMs: [0],
      resumedAt: 0,
      startedAt: 0,
      hinted: ["ar1-2"],
    },
  };
}

const aliases = { "ar1-1": "ar1-abcd1234", "ar1-2": "ar1-ffff0000" };

describe("applyAliases", () => {
  it("moves history from old question IDs to new ones", () => {
    const s = state();
    expect(applyAliases(s, aliases)).toBe(true);
    expect(s.qstats["ar1-1"]).toBeUndefined();
    expect(s.qstats["ar1-abcd1234"]).toEqual({ seen: 3, correct: 1, last: 200, lastCorrect: false });
    expect(s.qstats["g:AR:1:5"]).toBeDefined();
    expect(s.attempts[0].items.map((i) => i.qid)).toEqual(["ar1-abcd1234", "g:AR:1:5"]);
    expect(s.active!.sections[0].qids).toEqual(["ar1-ffff0000", "g:AR:1:5"]);
    expect(s.active!.answers).toEqual({ "ar1-ffff0000": 3 });
    expect(s.active!.times).toEqual({ "ar1-ffff0000": 1000 });
    expect(s.active!.hinted).toEqual(["ar1-ffff0000"]);
  });

  it("does nothing the second time", () => {
    const s = state();
    applyAliases(s, aliases);
    const snapshot = JSON.stringify(s);
    expect(applyAliases(s, aliases)).toBe(false);
    expect(JSON.stringify(s)).toBe(snapshot);
  });
});

describe("sanitize", () => {
  it("rejects files that are not backups", () => {
    expect(() => sanitize({ hello: 1 })).toThrow(/not a FreeASVAB backup/);
    expect(() => sanitize(null)).toThrow();
  });

  it("keeps valid data and drops broken records", () => {
    const s = sanitize({
      v: 1,
      settings: { theme: "dark", target: 150, goalSet: true, hints: false, education: "elsewhere" },
      attempts: [{ id: "x", title: "T", finishedAt: 1, items: [{ qid: "a" }, "junk"], raw: {} }, { id: 5 }],
      qstats: { a: { seen: 1, correct: 1 }, b: "bad" },
      lastLesson: "word-knowledge",
    });
    expect(s.settings.theme).toBe("dark");
    expect(s.settings.target).toBe(50);
    expect(s.settings.goalSet).toBe(true);
    expect(s.settings.hints).toBe(false);
    expect(s.settings.education).toBe("diploma");
    expect(s.attempts).toHaveLength(1);
    expect(s.attempts[0].items).toHaveLength(1);
    expect(s.attempts[0].timedOut).toEqual([]);
    expect(Object.keys(s.qstats)).toEqual(["a"]);
    expect(s.lastLesson).toBe("word-knowledge");
  });
});
