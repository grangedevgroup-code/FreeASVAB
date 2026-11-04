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

  const report =
    s && s.afqt !== null
      ? `<section class="panel" aria-labelledby="rep-h">
          <header class="panel-head"><h2 id="rep-h">Practice score report</h2><span class="meta">${fmtDate(a.finishedAt)}</span></header>
          <div class="panel-body">
            <div class="score-top">
              <div class="score-block"><span class="score-num">${s.afqt}</span><span class="score-label">AFQT estimate</span></div>
              <dl class="kv">
                <div><dt>Category</dt><dd>${s.category}</dd></div>
                <div><dt>Likely range</dt><dd>${range ? `${range.low}–${range.high}` : "–"}</dd></div>
                <div><dt>Correct</dt><dd>${right}<small>/${a.items.length}</small></dd></div>
                <div><dt>Time used</dt><dd>${activeMs > 60000 ? fmtMinutes(activeMs / 60000) : "–"}</dd></div>
              </dl>
            </div>
            <p>${categoryText(s.afqt)}</p>
            ${scoreScale({ score: s.afqt, low: range?.low, high: range?.high, goal: settings.target, min: 31, category: s.category! })}
            ${range ? `<p class="hint">The likely range shows how far luck alone could move the estimate. A ${a.kind === "quick" ? "short check" : "practice test"} can only narrow it down so far.</p>` : ""}
          </div>
        </section>
        <section class="panel" aria-labelledby="enlist-h">
          <header class="panel-head"><h2 id="enlist-h">Enlistment eligibility</h2><span class="meta">${diploma ? "High school diploma" : "GED"}</span></header>
          <div class="rows">${BRANCH_MINIMUMS.map((b) => {
            const min = diploma ? b.diploma : b.ged;
            const ok = s.afqt! >= min;
            return `<div class="row"><span class="row-main"><strong>${b.branch}</strong><small>Minimum AFQT ${min}</small></span><span class="tag ${ok ? "go" : "nogo"}">${icon(ok ? "check" : "close")}${ok ? "Go" : "No-go"}</span></div>`;
          }).join("")}</div>
          <div class="panel-body"><p class="hint">Published minimums for applicants with a ${diploma ? "high school diploma" : "GED (usually 50)"}. Change this in Settings. Branches change minimums often, so confirm with a recruiter.</p></div>
        </section>`
      : `<section class="panel" aria-labelledby="rep-h">
          <header class="panel-head"><h2 id="rep-h">Practice summary</h2><span class="meta">${fmtDate(a.finishedAt)}</span></header>
          <div class="panel-body">
            <dl class="kv">
              <div><dt>Correct</dt><dd>${right}<small>/${a.items.length}</small></dd></div>
              <div><dt>Score</dt><dd>${Math.round((right / Math.max(1, a.items.length)) * 100)}%</dd></div>
              <div><dt>Time used</dt><dd>${activeMs > 60000 ? fmtMinutes(activeMs / 60000) : "–"}</dd></div>
            </dl>
            <p class="hint">Practice sessions do not produce an AFQT estimate. Take a practice test for that.</p>
          </div>
        </section>`;

  const focus = areas.length
    ? `<section class="panel stripe" aria-labelledby="focus-h"><header class="panel-head"><h2 id="focus-h">What to work on next</h2></header><ul class="next-list">${areas
        .map(
          (x) =>
            `<li><div><strong>${badge(x.k)}${SUBTEST_NAMES[x.k]}: ${x.pct}% correct</strong><p>${why(x.k)}</p></div><a class="btn primary" href="#/practice/${x.k}">Practice</a></li>`,
        )
        .join("")}</ul></section>`
    : "";

  const jobsList = (title: string, list: { code: string; name: string; value: number }[]) =>
    `<p class="jobs-head">${title}</p><ul class="jobs">${list.map((x) => `<li><span class="code-txt">${x.code}</span><span class="name">${x.name}</span><span class="val">${x.value}</span></li>`).join("")}</ul>`;

  page(
    "progress",
    `<a class="back" href="#/progress">${icon("back")}All results</a>
    <div class="page-head"><h1>${esc(a.title)}</h1>${hinted ? `<p class="lead">How to solve opened on ${plural(hinted, "question")}.</p>` : ""}</div>
    ${report}
    ${a.timedOut?.length ? `<div class="notice warn">${icon("warn")}<p>Time ran out in ${a.timedOut.map((k) => SUBTEST_NAMES[k as Subtest] ?? k).join(", ")}. Blank answers counted as wrong.</p></div>` : ""}
    ${focus}
    <section class="panel" aria-labelledby="subj-h">
      <header class="panel-head"><h2 id="subj-h">Subtest results</h2>${s ? `<span class="meta">Score: 50 is average</span>` : ""}</header>
      <div class="table-wrap"><table class="data">
        <thead><tr><th scope="col">Subtest</th><th scope="col" class="num">Correct</th><th aria-hidden="true"></th>${s ? `<th scope="col" class="num">Score</th>` : ""}</tr></thead>
        <tbody>${order
          .map((k) => {
            const r = a.raw[k]!;
            const pct = Math.round((r.correct / r.total) * 100);
            return `<tr><th scope="row"><span class="subject-cell">${badge(k)}${SUBTEST_NAMES[k]}</span></th><td class="num">${r.correct}/${r.total}</td><td class="bar-cell"><span class="track"><span style="width:${pct}%"></span></span></td>${s ? `<td class="num">${s.standard[k] ?? "–"}</td>` : ""}</tr>`;
          })
          .join("")}</tbody>
      </table></div>
    </section>
    ${
      s && s.army.length
        ? `<section class="panel" aria-labelledby="jobs-h">
            <header class="panel-head"><h2 id="jobs-h">Job scores (estimated)</h2></header>
            <div class="panel-body"><p class="hint">Each branch combines subtests into its own job scores.${a.kind === "full" ? "" : " Take the full practice ASVAB to see all of them."}</p></div>
            ${jobsList("Army line scores", s.army)}
            ${s.mage.length ? jobsList("Air Force and Space Force (percentiles)", s.mage) : ""}
          </section>`
        : ""
    }
    <div class="actions">
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
        const status = it.correct ? "Correct" : it.choice === null ? "Blank" : "Missed";
        return `<article class="panel rev ${it.correct ? "ok" : "bad"}" aria-labelledby="rv-${n}">
          <header class="panel-head"><h2 id="rv-${n}">Item ${n + 1}</h2><span class="tag ${it.correct ? "go" : "nogo"}">${status}</span></header>
          <div class="panel-body">
            <p class="rev-head">${badge(q.subtest)}<span>${SUBTEST_NAMES[q.subtest as Subtest] ?? "Math basics"}</span></p>
            ${p ? `<details class="passage"><summary>Show the passage</summary>${p}</details>` : ""}
            <div class="qtext">${q.text}</div>
            <ol class="opts ${q.figChoices ? "figs" : ""}">${q.choices
              .map(
                (c, i) =>
                  `<li class="${i === q.answer ? "right" : i === it.choice ? "wrong" : ""}"><span class="key" aria-hidden="true">${"ABCD"[i]}</span><span class="ctext">${c}</span>${
                    i === q.answer ? '<span class="tag go">Answer</span>' : i === it.choice ? '<span class="tag nogo">Yours</span>' : ""
                  }</li>`,
              )
              .join("")}</ol>
            <div class="explain">${q.explain}</div>
            ${howTo(q.subtest, q.text, false)}
          </div>
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
