import { esc, loadBank, passage, question } from "../bank";
import { scoreScale } from "../chart";
import { afqtRange, BRANCH_MINIMUMS, CAT_ORDER, SUBTEST_NAMES, type Subtest } from "../scoring";
import { load, type Attempt } from "../store";
import { app, badge, fmtDate, fmtMinutes, icon, page, plural, sessionGet, sessionSet } from "../ui";
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
  const rows = (Object.entries(a.raw) as [Subtest, { correct: number; total: number }][])
    .filter(([, r]) => r.total > 0)
    .map(([k, r]) => ({ k, pct: Math.round((r.correct / r.total) * 100), afqt: AFQT_ORDER.includes(k) }))
    .filter((x) => x.pct < 85)
    .sort((x, y) => Number(y.afqt) - Number(x.afqt) || x.pct - y.pct);
  return rows.slice(0, 2);
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

  const scoreCard =
    s && s.afqt !== null
      ? `<section class="card score-card" aria-labelledby="score-h">
          <h2 id="score-h" class="card-label">Estimated AFQT</h2>
          <div class="score-top">
            <p class="hero-num">${s.afqt}</p>
            <div class="score-meta">
              <p><span class="tag">Category ${s.category}</span></p>
              <p>${categoryText(s.afqt)}</p>
              ${range ? `<p class="hint">Likely range ${range.low} to ${range.high}. A ${a.kind === "quick" ? "short check" : "practice test"} can only narrow it down so far.</p>` : ""}
            </div>
          </div>
          ${scoreScale({ score: s.afqt, low: range?.low, high: range?.high, goal: settings.target, min: 31, category: s.category! })}
        </section>
        <section class="card" aria-labelledby="enlist-h"><h2 id="enlist-h">Can I enlist with this score?</h2>
          <ul class="branches">${BRANCH_MINIMUMS.map((b) => {
            const min = settings.education === "diploma" ? b.diploma : b.ged;
            const ok = s.afqt! >= min;
            return `<li class="${ok ? "ok" : "no"}"><span>${b.branch}</span><span class="verdict">${icon(ok ? "check" : "close")}${ok ? "Meets" : "Below"} minimum of ${min}</span></li>`;
          }).join("")}</ul>
          <p class="hint">Published minimums for applicants with a ${settings.education === "diploma" ? "high school diploma" : "GED (usually 50)"}. Change this in Settings. Branches change minimums often, so confirm with a recruiter.</p>
        </section>`
      : `<section class="card score-card practice-score"><p class="hero-num">${Math.round((right / Math.max(1, a.items.length)) * 100)}%</p><div class="score-meta"><p><strong>${right} of ${a.items.length} correct</strong></p><p class="hint">Practice sessions do not produce an AFQT estimate. Take a practice test for that.</p></div></section>`;

  const focus = areas.length
    ? `<section class="summary-box" aria-labelledby="focus-h"><h2 id="focus-h">What to work on next</h2><ul class="next-list">${areas
        .map(
          (x) =>
            `<li><div><strong>${badge(x.k)} ${SUBTEST_NAMES[x.k]}: ${x.pct}% correct</strong><p>${why(x.k)}</p></div><a class="btn primary" href="#/practice/${x.k}">Practice</a></li>`,
        )
        .join("")}</ul></section>`
    : "";

  page(
    "progress",
    `<a class="back" href="#/progress">${icon("back")}All results</a>
    <h1>${esc(a.title)}</h1>
    <p class="lead">${fmtDate(a.finishedAt)} · ${right} of ${a.items.length} correct${activeMs > 60000 ? ` · ${fmtMinutes(activeMs / 60000)}` : ""}${hinted ? ` · How to solve opened on ${plural(hinted, "question")}` : ""}</p>
    ${scoreCard}
    ${a.timedOut?.length ? `<div class="alert warn">${icon("warn")}<p>Time ran out in ${a.timedOut.map((k) => SUBTEST_NAMES[k as Subtest] ?? k).join(", ")}. Blank answers counted as wrong.</p></div>` : ""}
    ${focus}
    <section class="card" aria-labelledby="subj-h"><h2 id="subj-h">By subject</h2>
      <div class="table-wrap"><table class="subject-table">
        <thead><tr><th scope="col">Subject</th><th scope="col" class="num">Correct</th><th aria-hidden="true"></th>${s ? `<th scope="col" class="num">Score</th>` : ""}</tr></thead>
        <tbody>${order
          .map((k) => {
            const r = a.raw[k]!;
            const pct = Math.round((r.correct / r.total) * 100);
            return `<tr><th scope="row"><span class="subject-cell">${badge(k)}${SUBTEST_NAMES[k]}</span></th><td class="num">${r.correct}/${r.total}</td><td class="bar-cell"><span class="track"><span style="width:${pct}%"></span></span></td>${s ? `<td class="num">${s.standard[k] ?? "–"}</td>` : ""}</tr>`;
          })
          .join("")}</tbody>
      </table></div>
      ${s ? `<p class="hint">Score is an estimated standard score. On the real test 50 is average, and 60 beats about 84% of people.</p>` : ""}
    </section>
    ${
      s && s.army.length
        ? `<section class="card" aria-labelledby="jobs-h"><h2 id="jobs-h">Job scores (estimated)</h2>
            <p class="hint">Each branch combines subjects into its own job scores. ${a.kind === "full" ? "" : "Take the full practice ASVAB to see all of them."}</p>
            <h3>Army line scores</h3>
            <ul class="jobs">${s.army.map((x) => `<li><span class="code">${x.code}</span><span class="name">${x.name}</span><span class="val">${x.value}</span></li>`).join("")}</ul>
            ${s.mage.length ? `<h3>Air Force and Space Force</h3><ul class="jobs">${s.mage.map((x) => `<li><span class="code">${x.code}</span><span class="name">${x.name}</span><span class="val">${x.value}</span></li>`).join("")}</ul><p class="hint">Air Force scores are percentiles from 1 to 99.</p>` : ""}
          </section>`
        : ""
    }
    <div class="row wrap actions">
      <a class="btn primary" href="#/review/${esc(a.id)}">${missed ? `Review ${plural(missed, "missed question")}` : "Review answers"}</a>
      <a class="btn" href="#/">Back to home</a>
    </div>
    ${s ? `<p class="hint">These scores are estimates. The real ASVAB adapts to your answers and uses official tables, so treat this as a guide to your progress, not a promise. <a href="#/about">How we estimate</a>.</p>` : ""}`,
    `${a.title} results`,
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
  const items = a.items.filter((i) => filter === "all" || !i.correct);
  page(
    "progress",
    `<a class="back" href="#/results/${esc(a.id)}">${icon("back")}Back to results</a>
    <h1>Review answers</h1>
    <div class="seg" role="group" aria-label="Show">
      <button type="button" class="${filter === "wrong" ? "on" : ""}" aria-pressed="${filter === "wrong"}" data-f="wrong">Missed (${missedCount})</button>
      <button type="button" class="${filter === "all" ? "on" : ""}" aria-pressed="${filter === "all"}" data-f="all">All (${a.items.length})</button>
    </div>
    ${items.length ? "" : `<div class="alert success">${icon("check")}<p>Nothing missed. Well done.</p></div>`}
    ${items
      .map((it, n) => {
        const q = question(it.qid);
        if (!q) return "";
        const p = passage(q.passage);
        const status = it.correct ? "Correct" : it.choice === null ? "Not answered" : "Missed";
        return `<article class="card rev ${it.correct ? "ok" : "bad"}" aria-label="Question ${n + 1}, ${status}">
          <p class="rev-head">${badge(q.subtest)}<span>${SUBTEST_NAMES[q.subtest as Subtest] ?? "Math basics"}</span><span class="tag ${it.correct ? "tag-ok" : "tag-bad"}">${status}</span></p>
          ${p ? `<details class="passage"><summary>Show the passage</summary>${p}</details>` : ""}
          <div class="qtext">${q.text}</div>
          <ol class="opts ${q.figChoices ? "figs" : ""}">${q.choices
            .map(
              (c, i) =>
                `<li class="${i === q.answer ? "right" : i === it.choice ? "wrong" : ""}"><span class="letter" aria-hidden="true">${"ABCD"[i]}</span><span class="ctext">${c}</span>${
                  i === q.answer ? '<span class="tag tag-ok">Answer</span>' : i === it.choice ? '<span class="tag tag-bad">Yours</span>' : ""
                }</li>`,
            )
            .join("")}</ol>
          <div class="explain">${q.explain}</div>
          ${howTo(q.subtest, q.text, false)}
        </article>`;
      })
      .join("")}`,
    "Review answers",
  );
  app.querySelectorAll<HTMLButtonElement>(".seg button").forEach((b) =>
    b.addEventListener("click", () => {
      sessionSet("reviewFilter", b.dataset.f!);
      void review(id);
    }),
  );
}
