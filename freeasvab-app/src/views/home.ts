import { esc, missedCount } from "../bank";
import { scoreScale } from "../chart";
import { isNative } from "../native";
import { afqtRange, SUBTEST_NAMES } from "../scoring";
import { nextSteps, scoredAttempts, trend, type Step } from "../stats";
import { load, storageWorks, update } from "../store";
import { app, ask, icon, page, plural } from "../ui";
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
    <p><a href="#/about">How scores are estimated</a> · <a href="https://github.com/grangedevgroup-code/FreeASVAB" target="_blank" rel="noopener">Source code</a></p>
    <p class="fine">Not affiliated with or endorsed by the U.S. Department of Defense or any military branch. ASVAB is a registered trademark of the U.S. Department of Defense.</p>
  </footer>`;
}

function stepLink(s: Step) {
  if (s.kind === "practice") return { href: `#/practice/${s.subtest}`, title: `Practice ${SUBTEST_NAMES[s.subtest as keyof typeof SUBTEST_NAMES]}`, cta: "Practice" };
  if (s.kind === "review") return { href: "#/start/review", title: "Review your mistakes", cta: "Review" };
  if (s.kind === "afqt") return { href: "#/start/afqt", title: "Take an AFQT practice test", cta: "Start" };
  return { href: "#/start/quick", title: "Take the quick check", cta: "Start" };
}

function installHint() {
  const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
  if (standalone || isNative) return "";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  return `<details class="card install"><summary>${icon("info")}Install FreeASVAB as an app</summary>
    <p>${
      ios
        ? "In Safari, tap the Share button, then <strong>Add to Home Screen</strong>. This also keeps your progress safe: Safari can erase saved data for websites you have not opened in 7 days, but not for apps on your Home Screen."
        : "Open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>. It then opens like any other app and works offline."
    }</p></details>`;
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
    ? `<section class="summary-box resume" aria-labelledby="resume-h">
        <h2 id="resume-h">Test in progress</h2>
        <p>${esc(active.title)}: question ${answeredCount(active) + 1} of ${totalCount(active)}</p>
        <div class="meter" aria-hidden="true"><span style="width:${(answeredCount(active) / totalCount(active)) * 100}%"></span></div>
        <div class="row"><a class="btn primary" href="#/run">Resume</a><button class="btn" type="button" data-act="discard">Discard</button></div>
      </section>`
    : "";

  const goal = !s.settings.goalSet
    ? `<section class="card goal-card" aria-labelledby="goal-h">
        <h2 id="goal-h">${icon("target")}What AFQT score are you aiming for?</h2>
        <p class="hint">It sets the goal line on your charts. You can change it any time in Settings.</p>
        <div class="presets">${GOAL_PRESETS.map((g) => `<button type="button" class="preset" data-goal="${g.v}"><strong>${g.v}</strong><span>${g.label}</span></button>`).join("")}</div>
        <button type="button" class="btn ghost small" data-goal="skip">Not sure yet</button>
      </section>`
    : "";

  let scoreCard = "";
  if (last) {
    const sc = last.scores!;
    const range = afqtRange(last.raw);
    const delta = trend(s.attempts);
    scoreCard = `<section class="card score-card" aria-labelledby="score-h">
      <h2 id="score-h" class="card-label">Latest AFQT estimate</h2>
      <div class="score-top">
        <p class="hero-num">${sc.afqt}</p>
        <div class="score-meta">
          <p><span class="tag">Category ${sc.category}</span>${
            delta !== null && delta !== 0 ? ` <span class="delta ${delta > 0 ? "up" : "down"}">${delta > 0 ? "▲" : "▼"} ${Math.abs(delta)} since last test</span>` : ""
          }</p>
          <p>${categoryText(sc.afqt!)}</p>
          <p>${sc.afqt! >= target ? `${icon("check")}You reached your goal of ${target}.` : `Goal ${target}: ${target - sc.afqt!} points to go.`}</p>
        </div>
      </div>
      ${scoreScale({ score: sc.afqt!, low: range?.low, high: range?.high, goal: target, min: 31, category: sc.category! })}
      <a class="more" href="#/results/${esc(last.id)}">See full results${icon("next")}</a>
    </section>`;
  } else if (!fresh) {
    scoreCard = `<section class="summary-box"><h2>Get your first AFQT estimate</h2><p>You have been practicing. A quick check turns that into a score you can track.</p><a class="btn primary" href="#/start/quick">Take the quick check</a></section>`;
  }

  const steps = fresh ? [] : nextSteps(s.attempts, missed);
  const next = steps.length
    ? `<section class="summary-box" aria-labelledby="next-h"><h2 id="next-h">Your next step</h2><ul class="next-list">${steps
        .map((st) => {
          const l = stepLink(st);
          return `<li><div><strong>${l.title}</strong><p>${esc(st.reason)}</p></div><a class="btn primary" href="${l.href}">${l.cta}</a></li>`;
        })
        .join("")}</ul></section>`
    : "";

  const welcome = fresh
    ? `<section class="welcome">
        <h1>Find your starting point</h1>
        <p class="lead">Take a short quick check to get an estimated AFQT score, then practice the subjects that will raise it the most. No account needed.</p>
        <a class="btn primary big" href="#/start/quick">Start the quick check</a>
        <p class="hint">${testMeta("quick").label}. Everything stays on this device.</p>
      </section>`
    : `<h1 class="sr-only">Home</h1>`;

  const tests = (["quick", "afqt", "full"] as TestKind[])
    .map((k) => {
      const m = testMeta(k);
      const desc = k === "quick" ? "A fast estimate of your AFQT" : k === "afqt" ? "The score that decides enlistment" : "All ten subjects, like test day";
      return `<a class="test-card" href="#/start/${k}"><span class="test-ic">${icon(k === "quick" ? "clock" : k === "afqt" ? "target" : "practice")}</span><span class="test-body"><strong>${TESTS[k].title}</strong><span>${desc}</span><small>${m.label}</small></span>${icon("next", "chev")}</a>`;
    })
    .join("");

  page(
    "home",
    `${welcome}
    ${resume}
    ${goal}
    ${scoreCard}
    ${next}
    <section aria-labelledby="tests-h"><h2 id="tests-h" class="section-title">Practice tests</h2><div class="test-list">${tests}</div></section>
    <section aria-labelledby="more-h"><h2 id="more-h" class="section-title">Study</h2>
      <div class="shortcut-grid">
        <a class="shortcut" href="#/practice">${icon("practice")}<strong>Practice by subject</strong><span>Answers explained right away</span></a>
        ${missed ? `<a class="shortcut" href="#/start/review">${icon("redo")}<strong>Review mistakes</strong><span>${plural(missed, "question")} to fix</span></a>` : ""}
        <a class="shortcut" href="#/learn">${icon("book")}<strong>Lessons</strong><span>Every subject in plain English</span></a>
      </div>
    </section>
    ${installHint()}
    ${storageWorks() ? "" : `<div class="alert warn">${icon("warn")}<p>This browser is blocking storage, so your results will be lost when you close the page. Private browsing often causes this.</p></div>`}
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
