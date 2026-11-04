import { esc, loadBank, passage, question } from "../bank";
import { scoreScale } from "../chart";
import { afqtRange, BRANCH_MINIMUMS, CAT_ORDER, SUBTEST_NAMES, type Subtest } from "../scoring";
import { load, type Attempt } from "../store";
import { app, fmtDate, fmtMinutes, icon, page, plural, section, sessionGet, sessionSet, tile } from "../ui";
import { howTo } from "./runner";

export function categoryText(afqt: number) {
  if (afqt >= 93) return "Top of the scale. Almost every job is open to you.";
  if (afqt >= 65) return "Well above average. This clears every branch's minimum with room to spare.";
  if (afqt >= 50) return "Above average. Many enlistment bonuses start at 50.";
  if (afqt >= 31) return "Meets the usual minimum to enlist with a high school diploma.";
  if (afqt >= 21) return "Below most branch minimums. Keep practicing: this is very fixable.";
  return "Well below the minimums. Start with the lessons and short practice sets.";
}

const AFQT_ORDER: Subtest[] = ["WK", "PC", "AR", "MK"];

function focusAreas(a: Attempt) {
  return (Object.entries(a.raw) as [Subtest, { correct: number; total: number }][])
    .filter(([, r]) => r.total > 0)
    .map(([k, r]) => ({ k, pct: Math.round((r.correct / r.total) * 100), afqt: AFQT_ORDER.includes(k) }))
    .filter((x) => x.pct < 85)
    .sort((x, y) => Number(y.afqt) - Number(x.afqt) || x.pct - y.pct)
    .slice(0, 2);
}

function why(k: Subtest) {
  if (k === "WK" || k === "PC") return "Verbal answers count double in your AFQT.";
  if (k === "AR" || k === "MK") return "Math makes up half of your AFQT.";
  return "It feeds the job scores for several careers.";
}

export function results(id: string) {
  const a = load().attempts.find((x) => x.id === id);
  if (!a) {
    location.replace("#/progress");
    return;
  }
  const right = a.items.filter((i) => i.correct).length;
  const s = a.scores;
  const settings = load().settings;
  const order = CAT_ORDER.map((c) => c.subtest).filter((k) => a.raw[k]);
  const activeMs = a.items.reduce((n, i) => n + (i.ms || 0), 0);
  const hinted = a.items.filter((i) => i.hinted).length;
  const missed = a.items.filter((i) => !i.correct).length;
  const range = s?.afqt != null ? afqtRange(a.raw) : null;
  const areas = focusAreas(a);
  const diploma = settings.education === "diploma";
  const facts = `Taken ${fmtDate(a.finishedAt)}. ${right} of ${a.items.length} correct${activeMs > 60000 ? ` in ${fmtMinutes(activeMs / 60000)}` : ""}.${hinted ? ` You opened how to solve on ${plural(hinted, "question")}.` : ""}`;

  const masthead =
    s && s.afqt !== null
      ? `<a class="back" href="#/progress">${icon("back")}All results</a>
        <h1>${esc(a.title)}</h1>
        <p class="mast-lead">${facts}</p>
        <div class="mast-score">
          <span class="score-num">${s.afqt}</span>
          <div class="score-side"><p class="score-cat">Category ${s.category}</p>${range ? `<p>Likely between ${range.low} and ${range.high} on the real test</p>` : ""}</div>
        </div>
        ${scoreScale({ score: s.afqt, low: range?.low, high: range?.high, goal: settings.target, min: 31, category: s.category! })}
        <p class="mast-facts">${categoryText(s.afqt)}${range ? ` The likely range is how far luck alone could move this estimate; a ${a.kind === "quick" ? "short check" : "practice test"} can only narrow it so far.` : ""}</p>`
      : `<a class="back" href="#/progress">${icon("back")}All results</a>
        <h1>${esc(a.title)}</h1>
        <p class="mast-lead">${facts}</p>
        <p class="mast-facts">${Math.round((right / Math.max(1, a.items.length)) * 100)}% correct. Practice sessions do not produce an AFQT estimate; take a practice test for that.</p>`;

  const focus = areas.length
    ? section(
        "focus-h",
        "What to work on next",
        `<div class="list">${areas
          .map((x) => `<a class="item" href="#/practice/${x.k}">${tile(x.k)}<span class="item-main"><strong>${SUBTEST_NAMES[x.k]}, ${x.pct}% correct</strong><small>${why(x.k)}</small></span>${icon("next", "chev")}</a>`)
          .join("")}</div>`,
      )
    : "";

  const enlist =
    s && s.afqt !== null
      ? section(
          "enlist-h",
          "Enlistment minimums",
          `<div class="list table-wrap"><table class="data">
            <thead><tr><th scope="col">Branch</th><th scope="col" class="num">Minimum AFQT</th><th scope="col">This estimate</th></tr></thead>
            <tbody>${BRANCH_MINIMUMS.map((b) => {
              const min = diploma ? b.diploma : b.ged;
              const gap = min - s.afqt!;
              return `<tr><th scope="row">${b.branch}</th><td class="num">${min}</td><td>${
                gap <= 0 ? `<span class="status go">${icon("check")}Meets it</span>` : `<span class="status nogo">${icon("close")}${plural(gap, "point")} short</span>`
              }</td></tr>`;
            }).join("")}</tbody>
          </table></div>`,
          `Published minimums for applicants with a ${diploma ? "high school diploma" : "GED, usually 50"}. You can change this in Settings. Branches change minimums often, so confirm with a recruiter.`,
        )
      : "";

  const subtests = section(
    "subj-h",
    s ? "Subtest scores" : "Results by subtest",
    `<div class="list table-wrap"><table class="data">
      <thead><tr><th scope="col">Subtest</th><th scope="col" class="num">Correct</th><th aria-hidden="true"></th>${s ? `<th scope="col" class="num">Standard score</th>` : ""}</tr></thead>
      <tbody>${order
        .map((k) => {
          const r = a.raw[k]!;
          const pct = Math.round((r.correct / r.total) * 100);
          return `<tr><th scope="row"><span class="subject-cell">${tile(k)}<span>${SUBTEST_NAMES[k]}<small>${k}</small></span></span></th><td class="num">${r.correct} of ${r.total}</td><td class="bar-cell"><span class="track"><span style="width:${pct}%"></span></span></td>${s ? `<td class="num strong">${s.standard[k] ?? "–"}</td>` : ""}</tr>`;
        })
        .join("")}</tbody>
    </table></div>`,
    s ? "Standard scores put 50 at average. Most people score between 40 and 60." : "",
  );

  const jobsTable = (caption: string, list: { code: string; name: string; value: number }[]) =>
    `<div class="list table-wrap"><table class="data">
      <caption>${caption}</caption>
      <thead><tr><th scope="col">Score</th><th scope="col">What it covers</th><th scope="col" class="num">Estimate</th></tr></thead>
      <tbody>${list.map((x) => `<tr><th scope="row">${x.code}</th><td>${x.name}</td><td class="num strong">${x.value}</td></tr>`).join("")}</tbody>
    </table></div>`;

  const jobs =
    s && s.army.length
      ? section(
          "jobs-h",
          "Job scores",
          `${jobsTable("Army line scores", s.army)}${s.mage.length ? jobsTable("Air Force and Space Force, as percentiles", s.mage) : ""}`,
          `Each branch combines subtests into its own job scores. These are estimates.${a.kind === "full" ? "" : " Take the full practice ASVAB to see all of them."}`,
        )
      : "";

  page(
    "progress",
    `${a.timedOut?.length ? `<div class="notice warn">${icon("warn")}<p>Time ran out in ${a.timedOut.map((k) => SUBTEST_NAMES[k as Subtest] ?? k).join(", ")}. Blank answers counted as wrong.</p></div>` : ""}
    ${focus}
    ${enlist}
    ${subtests}
    ${jobs}
    <div class="actions">
      <a class="btn primary" href="#/review/${esc(a.id)}">${missed ? `Review ${plural(missed, "missed question")}` : "Review answers"}</a>
      <a class="btn" href="#/">Back to home</a>
    </div>
    ${s ? `<p class="hint">These scores are estimates. The real ASVAB adapts to your answers and uses official tables, so treat this as a guide to your progress, not a promise. <a href="#/about">How we estimate</a>.</p>` : ""}`,
    `${a.title} results`,
    { masthead, narrow: true },
  );
}

export async function review(id: string) {
  await loadBank();
  const a = load().attempts.find((x) => x.id === id);
  if (!a) {
    location.replace("#/progress");
    return;
  }
  const missedCount = a.items.filter((i) => !i.correct).length;
  const filter = sessionGet("reviewFilter") ?? (missedCount ? "wrong" : "all");
  const items = a.items.map((it, n) => ({ it, n })).filter(({ it }) => filter === "all" || !it.correct);
  page(
    "progress",
    `<a class="back" href="#/results/${esc(a.id)}">${icon("back")}Score report</a>
    <div class="page-head"><h1>Answer review</h1><p class="lead">${esc(a.title)}, ${fmtDate(a.finishedAt)}</p></div>
    <div class="seg" role="group" aria-label="Show">
      <button type="button" class="${filter === "wrong" ? "on" : ""}" aria-pressed="${filter === "wrong"}" data-f="wrong">Missed (${missedCount})</button>
      <button type="button" class="${filter === "all" ? "on" : ""}" aria-pressed="${filter === "all"}" data-f="all">All (${a.items.length})</button>
    </div>
    ${items.length ? "" : `<div class="notice ok">${icon("check")}<p>Nothing missed. Well done.</p></div>`}
    ${items
      .map(({ it, n }) => {
        const q = question(it.qid);
        if (!q) return "";
        const p = passage(q.passage);
        const status = it.correct ? "Correct" : it.choice === null ? "Left blank" : "Missed";
        return `<article class="sheet review-item" aria-labelledby="rv-${n}">
          <header class="review-head"><h2 id="rv-${n}">Question ${n + 1}</h2><span class="status ${it.correct ? "go" : "nogo"}">${icon(it.correct ? "check" : "close")}${status}</span></header>
          <p class="review-subject">${tile(q.subtest)}<span>${SUBTEST_NAMES[q.subtest as Subtest] ?? "Math basics"}</span></p>
          ${p ? `<details class="passage-toggle"><summary>Show the passage</summary><div class="passage">${p}</div></details>` : ""}
          <div class="qtext">${q.text}</div>
          <ol class="opts ${q.figChoices ? "figs" : ""}">${q.choices
            .map(
              (c, i) =>
                `<li class="${i === q.answer ? "right" : i === it.choice ? "wrong" : ""}"><span class="bubble" aria-hidden="true">${"ABCD"[i]}</span><span class="ctext">${c}</span>${
                  i === q.answer ? '<span class="mark go">Correct answer</span>' : i === it.choice ? '<span class="mark nogo">Your answer</span>' : ""
                }</li>`,
            )
            .join("")}</ol>
          <div class="explain">${q.explain}</div>
          ${howTo(q.subtest, q.text, false)}
        </article>`;
      })
      .join("")}`,
    "Answer review",
    { narrow: true },
  );
  app.querySelectorAll<HTMLButtonElement>(".seg button").forEach((b) =>
    b.addEventListener("click", () => {
      sessionSet("reviewFilter", b.dataset.f!);
      void review(id);
    }),
  );
}
