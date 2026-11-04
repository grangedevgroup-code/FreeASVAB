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
      return `<tr><th scope="row"><a class="subject-cell" href="#/practice/${k}">${badge(k)}${SUBTEST_NAMES[k as Subtest | "MF"]}</a></th><td class="bar-cell"><span class="track"><span style="width:${acc?.pct ?? 0}%"></span></span></td><td class="num">${acc ? `${acc.pct}%` : `<span class="muted">Not enough yet</span>`}</td></tr>`;
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
    `<h1>Progress</h1>
    <dl class="stats">
      <div><dt>Practice tests</dt><dd>${sum.tests}</dd></div>
      <div><dt>Questions answered</dt><dd>${sum.answered.toLocaleString()}</dd></div>
      <div><dt>Accuracy</dt><dd>${sum.accuracy === null ? "–" : `${sum.accuracy}%`}</dd></div>
      <div><dt>Days practiced</dt><dd>${sum.days}</dd></div>
    </dl>
    ${
      scored.length
        ? `<section class="card" aria-labelledby="trend-h"><h2 id="trend-h">AFQT estimates over time</h2>${trendChart(
            scored.map((a) => ({ t: a.finishedAt, v: a.scores!.afqt! })),
            s.settings.target,
          )}</section>`
        : `<section class="summary-box"><h2>Track your score</h2><p>Take the quick check or a practice test to start your score chart.</p><a class="btn primary" href="#/start/quick">Take the quick check</a></section>`
    }
    <section class="card" aria-labelledby="acc-h"><h2 id="acc-h">Accuracy by subject</h2>
      <p class="hint">Based on your last 60 answers in each subject.</p>
      <div class="table-wrap"><table class="subject-table">
        <thead><tr><th scope="col">Subject</th><th aria-hidden="true"></th><th scope="col" class="num">Correct</th></tr></thead>
        <tbody>
          <tr class="group-row"><th scope="colgroup" colspan="3">AFQT subjects</th></tr>
          ${accuracyRows([...AFQT_PRACTICE, "MF"])}
          <tr class="group-row"><th scope="colgroup" colspan="3">Career subjects</th></tr>
          ${accuracyRows(CAREER_PRACTICE)}
        </tbody>
      </table></div>
    </section>
    <section aria-labelledby="hist-h"><h2 id="hist-h" class="section-title">History</h2>
      ${
        list.length
          ? `<div class="list">${shown
              .map((a) => {
                const right = a.items.filter((i) => i.correct).length;
                return `<a class="item" href="#/results/${esc(a.id)}"><span class="item-body"><strong>${esc(a.title)}</strong><small>${fmtDate(a.finishedAt)} · ${right} of ${a.items.length} correct</small></span>${
                  a.scores?.afqt != null ? `<span class="pill">AFQT ${a.scores.afqt}</span>` : ""
                }${icon("next", "chev")}</a>`;
              })
              .join("")}</div>${list.length > shown.length ? `<button class="btn wide" id="all" type="button">Show all ${list.length}</button>` : ""}`
          : `<p class="hint">Nothing here yet. Finished tests and practice sessions show up here.</p>`
      }
    </section>`,
    "Progress",
  );
  app.querySelector("#all")?.addEventListener("click", () => progress(true));
}
