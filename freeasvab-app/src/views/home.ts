import { esc, missedCount } from "../bank";
import { answerSheet, scoreScale } from "../chart";
import { isNative } from "../native";
import { afqtRange, SUBTEST_NAMES } from "../scoring";
import { nextSteps, scoredAttempts, trend, type Step } from "../stats";
import { load, storageWorks, update } from "../store";
import { app, ask, fmtDate, icon, page, plural, section, tile } from "../ui";
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
    <p class="foot-links"><a href="#/about">How scores are estimated</a><a href="https://github.com/grangedevgroup-code/FreeASVAB" target="_blank" rel="noopener">Source code</a></p>
    <p class="fine">Not affiliated with or endorsed by the U.S. Department of Defense or any military branch. ASVAB is a registered trademark of the U.S. Department of Defense.</p>
  </footer>`;
}

const TEST_BLURB: Record<TestKind, string> = {
  quick: "A short first estimate of your AFQT",
  afqt: "The four subjects that decide enlistment",
  full: "All ten subtests in test-day order",
};

export function testItems() {
  return `<div class="list">${(["quick", "afqt", "full"] as TestKind[])
    .map((k) => {
      const m = testMeta(k);
      return `<a class="item" href="#/start/${k}"><span class="item-main"><strong>${TESTS[k].title}</strong><small>${TEST_BLURB[k]}</small></span><span class="item-meta"><b>${m.questions} questions</b>${k === "quick" ? "about 15 min" : `up to ${Math.round(m.minutes)} min`}</span>${icon("next", "chev")}</a>`;
    })
    .join("")}</div>`;
}

function stepItem(s: Step) {
  const name = s.subtest ? SUBTEST_NAMES[s.subtest as keyof typeof SUBTEST_NAMES] : "";
  const l =
    s.kind === "practice"
      ? { href: `#/practice/${s.subtest}`, title: `Practice ${name}`, lead: tile(s.subtest!) }
      : s.kind === "review"
        ? { href: "#/start/review", title: "Review your mistakes", lead: `<span class="tile" aria-hidden="true">${icon("redo")}</span>` }
        : s.kind === "afqt"
          ? { href: "#/start/afqt", title: "Take an AFQT practice test", lead: `<span class="tile" aria-hidden="true">${icon("target")}</span>` }
          : { href: "#/start/quick", title: "Take the quick check", lead: `<span class="tile" aria-hidden="true">${icon("clock")}</span>` };
  return `<a class="item" href="${l.href}">${l.lead}<span class="item-main"><strong>${l.title}</strong><small>${esc(s.reason)}</small></span>${icon("next", "chev")}</a>`;
}

function installHint() {
  const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
  if (standalone || isNative) return "";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  return `<details class="list disclosure install"><summary class="item"><span class="item-main"><strong>Install as an app</strong><small>Works offline and opens from your home screen</small></span></summary>
    <div class="disclosure-body"><p>${
      ios
        ? "In Safari, tap the Share button, then <strong>Add to Home Screen</strong>. This also keeps your progress safe: Safari can erase saved data for websites you have not opened in 7 days, but not for apps on your Home Screen."
        : "Open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>. It then opens like any other app and works offline."
    }</p></div></details>`;
}

function goalLine(afqt: number, target: number) {
  const gap = target - afqt;
  if (gap <= 0) return `That meets your goal of ${target}.`;
  return `${plural(gap, "point")} short of your goal of ${target}.`;
}

function deltaLine(delta: number | null) {
  if (delta === null) return "";
  if (delta === 0) return "The same as your previous test.";
  return `${delta > 0 ? "Up" : "Down"} ${plural(Math.abs(delta), "point")} since your previous test.`;
}

export function home() {
  const s = load();
  const scored = scoredAttempts(s.attempts);
  const last = scored[scored.length - 1];
  const missed = missedCount(s.qstats);
  const target = s.settings.target;
  const active = s.active;
  const fresh = !s.attempts.length;

  let masthead: string;
  if (last) {
    const sc = last.scores!;
    const range = afqtRange(last.raw);
    masthead = `<h1 class="mast-label">Your estimated AFQT score</h1>
      <div class="mast-score">
        <span class="score-num">${sc.afqt}</span>
        <div class="score-side">
          <p class="score-cat">Category ${sc.category}</p>
          ${range ? `<p>Likely between ${range.low} and ${range.high} on the real test</p>` : ""}
        </div>
      </div>
      ${scoreScale({ score: sc.afqt!, low: range?.low, high: range?.high, goal: target, min: 31, category: sc.category! })}
      <p class="mast-facts">${goalLine(sc.afqt!, target)} ${deltaLine(trend(s.attempts))}</p>
      <div class="mast-actions"><a class="btn on-dark" href="#/results/${esc(last.id)}">Open the score report</a><span>${esc(last.title)}, ${fmtDate(last.finishedAt)}</span></div>`;
  } else if (fresh) {
    masthead = `<div class="hero">
        <div class="hero-text">
          <h1>Practice for the ASVAB and know your score before test day</h1>
          <p class="mast-lead">Practice tests scored the way the real test is scored, with a worked explanation for every question. Free, with no account.</p>
          <div class="mast-actions"><a class="btn accent big" href="#/start/quick">Take the quick check</a><span>18 questions, about 15 minutes</span></div>
        </div>
        ${answerSheet()}
      </div>`;
  } else {
    masthead = `<h1>No score yet</h1>
      <p class="mast-lead">You have been practicing. The quick check turns that work into an estimated AFQT score you can track.</p>
      <div class="mast-actions"><a class="btn accent" href="#/start/quick">Take the quick check</a><span>About 15 minutes</span></div>`;
  }

  const resume = active
    ? section(
        "resume-h",
        "Test in progress",
        `<div class="list"><div class="item resume">
          <span class="item-main"><strong>${esc(active.title)}</strong><small>Question ${answeredCount(active) + 1} of ${totalCount(active)}</small>
            <span class="meter" aria-hidden="true"><span style="width:${(answeredCount(active) / totalCount(active)) * 100}%"></span></span></span>
          <span class="item-actions"><button class="btn quiet" type="button" data-act="discard">Discard</button><a class="btn primary" href="#/run">Resume</a></span>
        </div></div>`,
      )
    : "";

  const goal = !s.settings.goalSet
    ? section(
        "goal-h",
        "Set your target score",
        `<div class="list" role="group" aria-labelledby="goal-h">${GOAL_PRESETS.map(
          (g) => `<button type="button" class="item choice-item" data-goal="${g.v}"><span class="bubble" aria-hidden="true"></span><span class="item-main"><strong>${g.v}</strong><small>${g.label}</small></span></button>`,
        ).join("")}</div>
        <button type="button" class="btn quiet" data-goal="skip">Not sure yet</button>`,
        "The AFQT score you are working toward. It sets the goal line on your charts.",
      )
    : "";

  const steps = fresh ? [] : nextSteps(s.attempts, missed);
  const next = steps.length ? section("next-h", "Work on next", `<div class="list">${steps.map(stepItem).join("")}</div>`) : "";

  const study = section(
    "study-h",
    "Study",
    `<div class="list">
      <a class="item" href="#/practice"><span class="tile" aria-hidden="true">${icon("practice")}</span><span class="item-main"><strong>Practice by subject</strong><small>An explanation after every answer</small></span>${icon("next", "chev")}</a>
      ${missed ? `<a class="item" href="#/start/review"><span class="tile" aria-hidden="true">${icon("redo")}</span><span class="item-main"><strong>Review mistakes</strong><small>${plural(missed, "question")} to fix</small></span>${icon("next", "chev")}</a>` : ""}
      <a class="item" href="#/learn"><span class="tile" aria-hidden="true">${icon("learn")}</span><span class="item-main"><strong>Lessons</strong><small>Every subject in plain English</small></span>${icon("next", "chev")}</a>
    </div>`,
  );

  page(
    "home",
    `${resume}
    ${goal}
    <div class="dash">
      <div class="dash-col">${section("tests-h", "Practice tests", testItems())}</div>
      <div class="dash-col">${next}${study}</div>
    </div>
    ${installHint()}
    ${storageWorks() ? "" : `<div class="notice warn">${icon("warn")}<p>This browser is blocking storage, so your results will be lost when you close the page. Private browsing often causes this.</p></div>`}
    ${siteFooter()}`,
    fresh ? "Free ASVAB practice" : "Home",
    { masthead },
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
