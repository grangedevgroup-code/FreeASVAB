import { esc } from "../bank";
import { trendChart } from "../chart";
import { SUBTEST_NAMES, type Subtest } from "../scoring";
import { accuracy, AFQT_PRACTICE, CAREER_PRACTICE, scoredAttempts, summary } from "../stats";
import { load } from "../store";
import { app, fmtDate, icon, page, plural, section, tile } from "../ui";

function accuracyRows(codes: readonly string[]) {
  const attempts = load().attempts;
  return codes
    .map((k) => {
      const acc = accuracy(attempts, k);
      return `<tr><th scope="row"><a class="subject-cell" href="#/practice/${k}">${tile(k)}<span>${SUBTEST_NAMES[k as Subtest | "MF"]}</span></a></th><td class="bar-cell"><span class="track"><span style="width:${acc?.pct ?? 0}%"></span></span></td><td class="num strong">${acc ? `${acc.pct}%` : `<span class="muted">–</span>`}</td></tr>`;
    })
    .join("");
}

function summaryText(sum: ReturnType<typeof summary>) {
  if (!sum.answered) return "Nothing here yet. Finished tests and practice sessions show up here, stored only on this device.";
  const tests = sum.tests ? `taken ${plural(sum.tests, "practice test")} and ` : "";
  const acc = sum.accuracy === null ? "" : `, ${sum.accuracy}% of them right,`;
  return `You have ${tests}answered ${plural(sum.answered, "question")}${acc} on ${plural(sum.days, "day")}. Everything is stored only on this device.`;
}

export function progress(showAll = false) {
  const s = load();
  const scored = scoredAttempts(s.attempts);
  const sum = summary(s.attempts);
  const list = s.attempts.slice().reverse();
  const shown = showAll ? list : list.slice(0, 15);
  page(
    "progress",
    `<div class="page-head"><h1>Progress</h1><p class="lead">${summaryText(sum)}</p></div>
    ${
      scored.length
        ? section(
            "trend-h",
            "AFQT estimates over time",
            `<div class="sheet">${trendChart(
              scored.map((a) => ({ t: a.finishedAt, v: a.scores!.afqt! })),
              s.settings.target,
            )}</div>`,
            `The dashed line is your goal of ${s.settings.target}.`,
          )
        : section(
            "trend-h",
            "No scores yet",
            `<div class="sheet empty"><p>Take the quick check or a practice test to start your score chart.</p><a class="btn primary" href="#/start/quick">Take the quick check</a></div>`,
          )
    }
    ${section(
      "acc-h",
      "Accuracy by subtest",
      `<div class="list table-wrap"><table class="data">
        <thead><tr><th scope="col">Subtest</th><th aria-hidden="true"></th><th scope="col" class="num">Correct</th></tr></thead>
        <tbody>
          <tr class="group-row"><th scope="colgroup" colspan="3">AFQT subtests</th></tr>
          ${accuracyRows([...AFQT_PRACTICE, "MF"])}
          <tr class="group-row"><th scope="colgroup" colspan="3">Career subtests</th></tr>
          ${accuracyRows(CAREER_PRACTICE)}
        </tbody>
      </table></div>`,
      "Based on your last 60 answers in each subtest.",
    )}
    ${section(
      "hist-h",
      "History",
      list.length
        ? `<div class="list">${shown
            .map((a) => {
              const right = a.items.filter((i) => i.correct).length;
              return `<a class="item" href="#/results/${esc(a.id)}"><span class="item-main"><strong>${esc(a.title)}</strong><small>${fmtDate(a.finishedAt)}, ${right} of ${a.items.length} correct</small></span>${
                a.scores?.afqt != null ? `<span class="item-meta"><b>${a.scores.afqt}</b>AFQT</span>` : ""
              }${icon("next", "chev")}</a>`;
            })
            .join("")}</div>${list.length > shown.length ? `<button class="btn wide" id="all" type="button">Show all ${list.length}</button>` : ""}`
        : `<div class="sheet empty"><p>Finished tests and practice sessions show up here.</p></div>`,
      list.length ? plural(list.length, "session") : "",
    )}`,
    "Progress",
    { narrow: true },
  );
  app.querySelector("#all")?.addEventListener("click", () => progress(true));
}
