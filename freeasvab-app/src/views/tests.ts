import { esc, fullSections, loadBank, missedIds, quickSections, QUICK_CHECK } from "../bank";
import { AFQT_SUBTESTS, CAT_ORDER, SUBTEST_NAMES } from "../scoring";
import { load, update } from "../store";
import { fmtMinutes, icon, page, section, tile } from "../ui";
import { answeredCount, begin, guardActive, totalCount } from "./runner";

export type TestKind = "quick" | "afqt" | "full";

export const TESTS: Record<TestKind, { title: string; blurb: string; rows: { subtest: string; count: number; minutes: number }[] }> = {
  quick: {
    title: "Quick check",
    blurb: "A short check of the four AFQT subjects. It gives a first estimate and shows where to start studying.",
    rows: QUICK_CHECK,
  },
  afqt: {
    title: "AFQT practice test",
    blurb: "The four subjects that decide whether you can enlist, with the same number of questions and time limits as the computer ASVAB.",
    rows: CAT_ORDER.filter((c) => AFQT_SUBTESTS.includes(c.subtest)),
  },
  full: {
    title: "Full practice ASVAB",
    blurb: "All ten subjects in the same order and with the same time limits as the computer ASVAB (CAT-ASVAB).",
    rows: CAT_ORDER,
  },
};

export function testMeta(kind: TestKind) {
  const t = TESTS[kind];
  const qs = t.rows.reduce((n, r) => n + r.count, 0);
  const mins = t.rows.reduce((n, r) => n + r.minutes, 0);
  return { questions: qs, minutes: mins, label: kind === "quick" ? `${qs} questions, about 15 minutes` : `${qs} questions, up to ${fmtMinutes(mins)}` };
}

export async function startScreen(kind: string) {
  if (kind === "review") return startReview();
  if (!(kind in TESTS)) {
    location.replace("#/");
    return;
  }
  const k = kind as TestKind;
  const t = TESTS[k];
  const meta = testMeta(k);
  const s = load();
  const active = s.active;
  const timedDefault = k === "quick" ? false : s.settings.timed;
  const total = `${meta.questions} questions, ${k === "quick" ? "about 15 minutes" : `up to ${fmtMinutes(meta.minutes)}`} in all.`;
  page(
    "home",
    `<a class="back" href="#/">${icon("back")}Home</a>
    <div class="page-head"><h1>${t.title}</h1><p class="lead">${t.blurb}</p></div>
    ${
      active
        ? `<div class="notice warn">${icon("warn")}<div><p><strong>You have a test in progress:</strong> ${esc(active.title)}, question ${answeredCount(active) + 1} of ${totalCount(active)}. Starting this test will discard it.</p><a class="btn" href="#/run">Resume that test instead</a></div></div>`
        : ""
    }
    ${section(
      "parts-h",
      "What is on the test",
      `<ol class="list" aria-label="Subtests in order">${t.rows
        .map(
          (r, i) =>
            `<li class="item">${tile(r.subtest)}<span class="item-main"><strong>${SUBTEST_NAMES[r.subtest as keyof typeof SUBTEST_NAMES]}</strong><small>Part ${i + 1}</small></span><span class="item-meta"><b>${r.count} questions</b>${r.minutes} min</span></li>`,
        )
        .join("")}</ol>`,
      total,
    )}
    ${section(
      "opt-h",
      "Options",
      `<div class="list">
        <label class="item switch"><span class="item-main"><strong>Use time limits</strong><small>${k === "quick" ? "Off by default for the quick check" : "The same limits as the computer ASVAB"}</small></span><input type="checkbox" role="switch" id="timed" ${timedDefault ? "checked" : ""}></label>
        <label class="item switch"><span class="item-main"><strong>No going back</strong><small>Like the real test, answers are final once you move on</small></span><input type="checkbox" role="switch" id="strict" ${s.settings.strict ? "checked" : ""}></label>
        <label class="item switch"><span class="item-main"><strong>Show how to solve each question</strong><small>A method you can open on any question. Turn it off for a test-day run.</small></span><input type="checkbox" role="switch" id="hints" ${s.settings.hints ? "checked" : ""}></label>
      </div>`,
    )}
    ${section(
      "ready-h",
      "Before you begin",
      `<ul class="prose-list">
        <li><strong>Have scratch paper and a pencil ready.</strong> No calculator: the real test does not allow one.</li>
        <li><strong>Answer every question.</strong> A blank always counts as wrong, so guess if you have to.</li>
        <li><strong>Stop whenever you need to.</strong> Your place is saved and the clock pauses while you are away.</li>
      </ul>`,
    )}
    <button class="btn primary big wide" id="go" type="button">Begin the test</button>`,
    t.title,
    { narrow: true },
  );
  document.getElementById("go")!.addEventListener("click", async () => {
    const timed = (document.getElementById("timed") as HTMLInputElement).checked;
    const strict = (document.getElementById("strict") as HTMLInputElement).checked;
    const hints = (document.getElementById("hints") as HTMLInputElement).checked;
    if (!(await guardActive())) return;
    update((st) => {
      if (k !== "quick") st.settings.timed = timed;
      st.settings.strict = strict;
      st.settings.hints = hints;
    });
    await loadBank();
    const stats = load().qstats;
    const sections = k === "quick" ? quickSections(stats) : fullSections(stats, k === "afqt");
    begin(k, t.title, sections, { strict, timed, instant: false, allowHints: hints });
  });
}

async function startReview(subtest?: string) {
  await loadBank();
  const ids = missedIds(load().qstats, subtest).slice(0, 25);
  if (!ids.length) {
    location.replace("#/");
    return;
  }
  if (!(await guardActive())) {
    history.back();
    return;
  }
  begin("review", subtest ? `Review: ${SUBTEST_NAMES[subtest as keyof typeof SUBTEST_NAMES]}` : "Review mistakes", [{ subtest: "MF", minutes: null, qids: ids }], {
    strict: false,
    timed: false,
    instant: true,
  });
}

export async function startSubjectReview(subtest: string) {
  return startReview(subtest);
}
