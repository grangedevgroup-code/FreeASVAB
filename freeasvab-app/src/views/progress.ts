import { esc } from "../bank";
import { trendChart } from "../chart";
import { SUBTEST_NAMES, type Subtest } from "../scoring";
import { accuracy, AFQT_PRACTICE, CAREER_PRACTICE, scoredAttempts, summary } from "../stats";
import { load } from "../store";
import { app, badge, fmtDate, icon, page } from "../ui";

function accuracyRows(codes: readonly string[]) {
  const attempts = load().attempts;
  return codes
    .map((k) => {
      const acc = accuracy(attempts, k);
      return `<tr><th scope="row"><a class="subject-cell" href="#/practice/${k}">${badge(k)}${SUBTEST_NAMES[k as Subtest | "MF"]}</a></th><td class="bar-cell"><span class="track"><span style="width:${acc?.pct ?? 0}%"></span></span></td><td class="num">${acc ? `${acc.pct}%` : `<span class="muted">–</span>`}</td></tr>`;
    })
    .join("");
}

export function progress(showAll = false) {
  const s = load();
  const scored = scoredAttempts(s.attempts);
  const sum = summary(s.attempts);
  const list = s.attempts.slice().reverse();
  const shown = showAll ? list : list.slice(0, 15);
  page(
    "progress",
    `<div class="page-head"><h1>Progress</h1></div>
    <section class="panel" aria-labelledby="sum-h">
      <header class="panel-head"><h2 id="sum-h">Summary</h2><span class="meta">Stored on this device</span></header>
      <dl class="kv">
        <div><dt>Practice tests</dt><dd>${sum.tests}</dd></div>
        <div><dt>Questions answered</dt><dd>${sum.answered.toLocaleString()}</dd></div>
        <div><dt>Accuracy</dt><dd>${sum.accuracy === null ? "–" : `${sum.accuracy}%`}</dd></div>
        <div><dt>Days practiced</dt><dd>${sum.days}</dd></div>
      </dl>
    </section>
    ${
      scored.length
        ? `<section class="panel" aria-labelledby="trend-h"><header class="panel-head"><h2 id="trend-h">AFQT estimates over time</h2><span class="meta">Goal ${s.settings.target}</span></header><div class="panel-body">${trendChart(
            scored.map((a) => ({ t: a.finishedAt, v: a.scores!.afqt! })),
            s.settings.target,
          )}</div></section>`
        : `<section class="panel stripe" aria-labelledby="trend-h"><header class="panel-head"><h2 id="trend-h">No scores yet</h2></header><div class="panel-body"><p>Take the quick check or a practice test to start your score chart.</p><a class="btn primary" href="#/start/quick">Take the quick check</a></div></section>`
    }
    <section class="panel" aria-labelledby="acc-h">
      <header class="panel-head"><h2 id="acc-h">Accuracy by subtest</h2><span class="meta">Last 60 answers each</span></header>
      <div class="table-wrap"><table class="data">
        <thead><tr><th scope="col">Subtest</th><th aria-hidden="true"></th><th scope="col" class="num">Correct</th></tr></thead>
        <tbody>
          <tr class="group-row"><th scope="colgroup" colspan="3">AFQT subtests</th></tr>
          ${accuracyRows([...AFQT_PRACTICE, "MF"])}
          <tr class="group-row"><th scope="colgroup" colspan="3">Career subtests</th></tr>
          ${accuracyRows(CAREER_PRACTICE)}
        </tbody>
      </table></div>
    </section>
    <section class="panel" aria-labelledby="hist-h">
      <header class="panel-head"><h2 id="hist-h">History</h2><span class="meta">${list.length} sessions</span></header>
      ${
        list.length
          ? `<div class="rows">${shown
              .map((a) => {
                const right = a.items.filter((i) => i.correct).length;
                return `<a class="row" href="#/results/${esc(a.id)}"><span class="row-main"><strong>${esc(a.title)}</strong><small>${fmtDate(a.finishedAt)}, ${right} of ${a.items.length} correct</small></span>${
                  a.scores?.afqt != null ? `<span class="row-data"><b>${a.scores.afqt}</b>AFQT</span>` : ""
                }${icon("next", "chev")}</a>`;
              })
              .join("")}</div>${list.length > shown.length ? `<div class="panel-body"><button class="btn wide" id="all" type="button">Show all ${list.length}</button></div>` : ""}`
          : `<div class="panel-body"><p class="hint">Finished tests and practice sessions show up here.</p></div>`
      }
    </section>`,
    "Progress",
    { narrow: true },
  );
  app.querySelector("#all")?.addEventListener("click", () => progress(true));
}
