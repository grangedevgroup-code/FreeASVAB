import { esc, missedCount } from "../bank";
import { scoreScale } from "../chart";
import { isNative } from "../native";
import { afqtRange, SUBTEST_NAMES } from "../scoring";
import { nextSteps, scoredAttempts, trend, type Step } from "../stats";
import { load, storageWorks, update } from "../store";
import { app, ask, badge, chip, fmtDate, icon, page, plural } from "../ui";
import { categoryText } from "./results";
import { answeredCount, totalCount } from "./runner";
import { testMeta, TESTS, type TestKind } from "./tests";

export const GOAL_PRESETS = [
  { v: 31, label: "Minimum to enlist" },
  { v: 50, label: "Bonus range" },
  { v: 65, label: "Category II" },
  { v: 80, label: "Top scores" },
];

export function siteFooter() {
  return `<footer class="site-foot">
    <p><strong>FreeASVAB</strong> is free and open source. No accounts, no ads, and your results stay on this device.</p>
    <p><a href="#/about">How scores are estimated</a> &nbsp;|&nbsp; <a href="https://github.com/grangedevgroup-code/FreeASVAB" target="_blank" rel="noopener">Source code</a></p>
    <p class="fine">Not affiliated with or endorsed by the U.S. Department of Defense or any military branch. ASVAB is a registered trademark of the U.S. Department of Defense.</p>
  </footer>`;
}

const TEST_CODES: Record<TestKind, string> = { quick: "QC", afqt: "AFQT", full: "FULL" };
const TEST_BLURB: Record<TestKind, string> = {
  quick: "A short first estimate of your AFQT",
  afqt: "The four subjects that decide enlistment",
  full: "All ten subtests, in test-day order",
};

function stepLink(s: Step) {
  if (s.kind === "practice") return { href: `#/practice/${s.subtest}`, title: `Practice ${SUBTEST_NAMES[s.subtest as keyof typeof SUBTEST_NAMES]}`, cta: "Practice", code: s.subtest! };
  if (s.kind === "review") return { href: "#/start/review", title: "Review your mistakes", cta: "Review", code: "" };
  if (s.kind === "afqt") return { href: "#/start/afqt", title: "Take an AFQT practice test", cta: "Start", code: "" };
  return { href: "#/start/quick", title: "Take the quick check", cta: "Start", code: "" };
}

function installHint() {
  const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
  if (standalone || isNative) return "";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  return `<details class="panel install"><summary class="panel-head">Install as an app</summary>
    <div class="panel-body"><p>${
      ios
        ? "In Safari, tap the Share button, then <strong>Add to Home Screen</strong>. This also keeps your progress safe: Safari can erase saved data for websites you have not opened in 7 days, but not for apps on your Home Screen."
        : "Open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>. It then opens like any other app and works offline."
    }</p></div></details>`;
}

export function home() {
  const s = load();
  const scored = scoredAttempts(s.attempts);
  const last = scored[scored.length - 1];
  const missed = missedCount(s.qstats);
  const target = s.settings.target;
  const active = s.active;
  const fresh = !s.attempts.length;

  const resume = active
    ? `<section class="panel stripe" aria-labelledby="resume-h">
        <header class="panel-head"><h2 id="resume-h">Test in progress</h2><span class="meta">Item ${answeredCount(active) + 1} of ${totalCount(active)}</span></header>
        <div class="panel-body">
          <p><strong>${esc(active.title)}</strong></p>
          <span class="meter" aria-hidden="true"><span style="width:${(answeredCount(active) / totalCount(active)) * 100}%"></span></span>
          <div class="actions"><a class="btn primary" href="#/run">Resume</a><button class="btn" type="button" data-act="discard">Discard</button></div>
        </div>
      </section>`
    : "";

  const goal = !s.settings.goalSet
    ? `<section class="panel" aria-labelledby="goal-h">
        <header class="panel-head"><h2 id="goal-h">Set your target score</h2><span class="meta">AFQT 1 to 99</span></header>
        <div class="panel-body">
          <p class="hint">Pick the AFQT score you are working toward. It sets the goal line on your charts, and you can change it in Settings.</p>
          <div class="presets">${GOAL_PRESETS.map((g) => `<button type="button" class="preset" data-goal="${g.v}"><strong>${g.v}</strong><span>${g.label}</span></button>`).join("")}</div>
          <button type="button" class="btn ghost" data-goal="skip">Not sure yet</button>
        </div>
      </section>`
    : "";

  let standing = "";
  if (last) {
    const sc = last.scores!;
    const range = afqtRange(last.raw);
    const delta = trend(s.attempts);
    const toGo = target - sc.afqt!;
    standing = `<section class="panel" aria-labelledby="status-h">
      <header class="panel-head"><h2 id="status-h">Current standing</h2><span class="meta">${fmtDate(last.finishedAt)}</span></header>
      <div class="panel-body">
        <div class="score-top">
          <div class="score-block"><span class="score-num">${sc.afqt}</span><span class="score-label">AFQT estimate</span></div>
          <dl class="kv">
            <div><dt>Category</dt><dd>${sc.category}</dd></div>
            <div><dt>Likely range</dt><dd>${range ? `${range.low}–${range.high}` : "–"}</dd></div>
            <div><dt>Since last test</dt><dd class="${delta && delta > 0 ? "up" : delta && delta < 0 ? "down" : ""}">${delta === null ? "–" : `${delta > 0 ? "+" : ""}${delta}`}</dd></div>
            <div><dt>Goal ${target}</dt><dd>${toGo <= 0 ? "Reached" : `${toGo} <small>to go</small>`}</dd></div>
          </dl>
        </div>
        <p>${categoryText(sc.afqt!)}</p>
        ${scoreScale({ score: sc.afqt!, low: range?.low, high: range?.high, goal: target, min: 31, category: sc.category! })}
      </div>
      <a class="row" href="#/results/${esc(last.id)}"><span class="row-main"><strong>Open the full score report</strong><small>${esc(last.title)}</small></span>${icon("next", "chev")}</a>
    </section>`;
  } else if (!fresh) {
    standing = `<section class="panel stripe" aria-labelledby="first-h">
      <header class="panel-head"><h2 id="first-h">No AFQT estimate yet</h2></header>
      <div class="panel-body"><p>You have been practicing. A quick check turns that work into a score you can track.</p><a class="btn primary" href="#/start/quick">Take the quick check</a></div>
    </section>`;
  }

  const welcome = fresh
    ? `<section class="panel welcome" aria-labelledby="welcome-h">
        <header class="panel-head"><span>Start here</span><span class="meta">No account needed</span></header>
        <div class="panel-body">
          <h1 id="welcome-h">Find your starting point</h1>
          <p class="lead">Take the 18-question quick check for an estimated AFQT score. Then practice the subjects that will raise it the most.</p>
          <a class="btn signal big" href="#/start/quick">Start the quick check</a>
          <p class="hint">About 15 minutes. Your results stay on this device.</p>
        </div>
      </section>`
    : `<div class="page-head"><h1>Welcome back</h1></div>`;

  const tests = `<section class="panel" aria-labelledby="tests-h">
    <header class="panel-head"><h2 id="tests-h">Practice tests</h2><span class="meta">CAT-ASVAB format</span></header>
    <div class="rows">${(["quick", "afqt", "full"] as TestKind[])
      .map((k) => {
        const m = testMeta(k);
        return `<a class="row" href="#/start/${k}">${chip(TEST_CODES[k])}<span class="row-main"><strong>${TESTS[k].title}</strong><small>${TEST_BLURB[k]}</small></span><span class="row-data"><b>${m.questions} items</b>${k === "quick" ? "about 15 min" : `up to ${Math.round(m.minutes)} min`}</span>${icon("next", "chev")}</a>`;
      })
      .join("")}</div>
  </section>`;

  const steps = fresh ? [] : nextSteps(s.attempts, missed);
  const next = steps.length
    ? `<section class="panel" aria-labelledby="next-h"><header class="panel-head"><h2 id="next-h">Your next step</h2></header><ul class="next-list">${steps
        .map((st) => {
          const l = stepLink(st);
          return `<li><div><strong>${l.code ? badge(l.code) : ""}${l.title}</strong><p>${esc(st.reason)}</p></div><a class="btn primary" href="${l.href}">${l.cta}</a></li>`;
        })
        .join("")}</ul></section>`
    : "";

  const study = `<section class="panel" aria-labelledby="study-h">
    <header class="panel-head"><h2 id="study-h">Study</h2></header>
    <div class="rows">
      <a class="row" href="#/practice">${icon("practice")}<span class="row-main"><strong>Practice by subject</strong><small>The answer is explained after every question</small></span>${icon("next", "chev")}</a>
      ${missed ? `<a class="row" href="#/start/review">${icon("redo")}<span class="row-main"><strong>Review mistakes</strong><small>${plural(missed, "question")} to fix</small></span>${icon("next", "chev")}</a>` : ""}
      <a class="row" href="#/learn">${icon("book")}<span class="row-main"><strong>Lessons</strong><small>Every subject in plain English</small></span>${icon("next", "chev")}</a>
    </div>
  </section>`;

  page(
    "home",
    `${welcome}
    ${resume}
    ${goal}
    <div class="dash">
      <div class="dash-col">${standing}${tests}</div>
      <div class="dash-col">${next}${study}</div>
    </div>
    ${installHint()}
    ${storageWorks() ? "" : `<div class="notice warn">${icon("warn")}<p>This browser is blocking storage, so your results will be lost when you close the page. Private browsing often causes this.</p></div>`}
    ${siteFooter()}`,
    fresh ? "Free ASVAB practice" : "Home",
  );

  app.querySelector('[data-act="discard"]')?.addEventListener("click", async () => {
    const ok = await ask({ title: "Discard the test in progress?", body: "Your answers in it will be lost.", ok: "Discard", cancel: "Keep it", danger: true });
    if (!ok) return;
    update((st) => {
      st.active = null;
    });
    home();
  });
  app.querySelectorAll<HTMLButtonElement>("[data-goal]").forEach((b) =>
    b.addEventListener("click", () => {
      const v = b.dataset.goal!;
      update((st) => {
        if (v !== "skip") st.settings.target = +v;
        st.settings.goalSet = true;
      });
      home();
    }),
  );
}
