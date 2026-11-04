import "./style.css";
import { esc, fullSections, loadBank, loadIndex, loadLesson, missedIds, passage, pick, poolSize, question, unlimitedMath, type QuizSet } from "./bank";
import { AFQT_SUBTESTS, BRANCH_MINIMUMS, CAT_ORDER, SUBTEST_NAMES, score, type Raw, type Subtest } from "./scoring";
import { askPersistence, exportBackup, importBackup, load, resetAll, save, storageWorks, uid, update, type ActiveTest, type Attempt, type Kind, type Section } from "./store";
import { trendChart } from "./chart";

const app = document.getElementById("app")!;
let tick: number | undefined;

const PRACTICE_SUBTESTS: (Subtest | "MF")[] = ["WK", "PC", "AR", "MK", "MF", "GS", "EI", "AI", "SI", "MC", "AO"];

function applySettings() {
  const s = load().settings;
  const root = document.documentElement;
  if (s.theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", s.theme);
  root.dataset.text = s.textSize;
}

function nav(active: string) {
  const items = [
    ["#/", "Home", "home"],
    ["#/practice", "Practice", "practice"],
    ["#/learn", "Learn", "learn"],
    ["#/progress", "Progress", "progress"],
    ["#/settings", "Settings", "settings"],
  ];
  return `<nav class="tabs" aria-label="Main">${items
    .map(([href, label, key]) => `<a href="${href}" class="${active === key ? "on" : ""}" ${active === key ? 'aria-current="page"' : ""}>${icon(key)}<span>${label}</span></a>`)
    .join("")}</nav>`;
}

function icon(name: string) {
  const paths: Record<string, string> = {
    home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
    practice: "M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9",
    learn: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM20 17v4H6.5A2.5 2.5 0 0 1 4 18.5",
    progress: "M4 20V10M10 20V4M16 20v-7M22 20H2",
    settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]}"/></svg>`;
}

function page(active: string, body: string) {
  clearInterval(tick);
  app.innerHTML = `<main class="page" id="main">${body}</main>${nav(active)}`;
  window.scrollTo(0, 0);
  const h = app.querySelector("h1");
  if (h) {
    h.setAttribute("tabindex", "-1");
    h.focus({ preventScroll: true });
  }
}

function fmtDate(t: number) {
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function lastAfqt() {
  return load().attempts.filter((a) => a.scores?.afqt != null).at(-1);
}

function home() {
  const s = load();
  const last = lastAfqt();
  const missed = missedIds(s.qstats).length;
  const target = s.settings.target;
  const active = s.active;
  page(
    "home",
    `<header class="hero">
      <h1>Free ASVAB Practice</h1>
      <p>Take as many practice tests as you want, get an estimated AFQT score, and learn every subject. No account. Everything stays on this device.</p>
    </header>
    ${
      active
        ? `<section class="card resume"><div><h2>Test in progress</h2><p>${esc(active.title)}: question ${answeredCount(active) + 1} of ${totalCount(active)}</p></div><div class="row"><a class="btn primary" href="#/run">Resume</a><button class="btn" data-act="discard">Discard</button></div></section>`
        : ""
    }
    <section class="score-strip card">
      ${
        last
          ? `<div class="big"><span class="num">${last.scores!.afqt}</span><span class="lbl">Latest AFQT estimate</span></div>
             <div class="meta"><p>Category ${last.scores!.category} · ${fmtDate(last.finishedAt)}</p><p>Your goal: <strong>${target}</strong>${last.scores!.afqt! >= target ? " · reached" : ` · ${target - last.scores!.afqt!} to go`}</p><a href="#/results/${last.id}">See full results</a></div>`
          : `<div class="meta"><h2>Find your starting point</h2><p>Take the quick AFQT test first. It covers the four subjects that decide whether you can enlist.</p></div>`
      }
    </section>
    <section class="grid">
      <a class="tile primary" href="#/start/afqt"><strong>Quick AFQT test</strong><span>55 questions · about 2 hours · the score that decides enlistment</span></a>
      <a class="tile" href="#/start/full"><strong>Full practice ASVAB</strong><span>135 questions · all 10 subjects · same order and time limits as the computer test</span></a>
      <a class="tile" href="#/practice"><strong>Practice a subject</strong><span>Short sets with the answer explained right away</span></a>
      ${missed ? `<a class="tile" href="#/start/review"><strong>Review mistakes</strong><span>${missed} question${missed === 1 ? "" : "s"} you missed last time</span></a>` : `<a class="tile" href="#/learn"><strong>Learn</strong><span>Plain-English lessons for every subject</span></a>`}
    </section>
    ${installHint()}
    ${storageWorks() ? "" : `<p class="warn card">This browser is blocking storage, so your results will be lost when you close the page. Private browsing often causes this.</p>`}
    <footer class="foot"><a href="#/about">About these scores</a> · Not affiliated with the Department of Defense</footer>`,
  );
  app.querySelector('[data-act="discard"]')?.addEventListener("click", () => {
    if (confirm("Discard the test in progress? Your answers in it will be lost.")) {
      update((st) => (st.active = null));
      home();
    }
  });
}

function installHint() {
  const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
  if (standalone || (window as unknown as { Capacitor?: unknown }).Capacitor) return "";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return `<details class="card install"><summary>Install it as an app</summary>
    <p>${
      ios
        ? "In Safari, tap the Share button, then <strong>Add to Home Screen</strong>. On iPhone and iPad this also keeps your progress safe: Safari can erase saved data for websites you have not opened in 7 days, but not for apps on your Home Screen."
        : "Open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>. It then works offline like any other app."
    }</p></details>`;
}

function answeredCount(t: ActiveTest) {
  let n = 0;
  for (let i = 0; i < t.section; i++) n += t.sections[i].qids.length;
  return n + t.index;
}

function totalCount(t: ActiveTest) {
  return t.sections.reduce((n, s) => n + s.qids.length, 0);
}

function startScreen(kind: string) {
  const s = load();
  if (kind === "review") {
    const ids = missedIds(s.qstats).slice(0, 25);
    if (!ids.length) return (location.hash = "#/");
    return begin("review", "Review mistakes", [{ subtest: "MF", minutes: null, qids: ids }], { strict: false, timed: false, instant: true });
  }
  const afqt = kind === "afqt";
  const order = CAT_ORDER.filter((c) => !afqt || AFQT_SUBTESTS.includes(c.subtest));
  const qs = order.reduce((n, c) => n + c.count, 0);
  const mins = order.reduce((n, c) => n + c.minutes, 0);
  page(
    "home",
    `<a class="back" href="#/">Back</a>
    <h1>${afqt ? "Quick AFQT test" : "Full practice ASVAB"}</h1>
    <p class="lead">${qs} questions, up to ${Math.floor(mins / 60)} h ${mins % 60} min. ${afqt ? "These four subjects make up your AFQT score." : "All ten subjects, in the same order as the computer ASVAB (CAT-ASVAB)."}</p>
    <div class="card"><table class="plain"><thead><tr><th>Subject</th><th>Questions</th><th>Time</th></tr></thead><tbody>
      ${order.map((c) => `<tr><td>${SUBTEST_NAMES[c.subtest]}</td><td>${c.count}</td><td>${c.minutes} min</td></tr>`).join("")}
    </tbody></table></div>
    <div class="card form">
      <label class="switch"><input type="checkbox" id="timed" ${s.settings.timed ? "checked" : ""}><span>Use the real time limits</span></label>
      <label class="switch"><input type="checkbox" id="strict" ${s.settings.strict ? "checked" : ""}><span>No going back to change answers, like the real computer test</span></label>
    </div>
    <p class="hint">Have scratch paper and a pencil ready. No calculator: the real test does not allow one. You can stop at any time and pick up where you left off.</p>
    <button class="btn primary wide" id="go">Start test</button>`,
  );
  document.getElementById("go")!.addEventListener("click", async () => {
    const timed = (document.getElementById("timed") as HTMLInputElement).checked;
    const strict = (document.getElementById("strict") as HTMLInputElement).checked;
    update((st) => {
      st.settings.timed = timed;
      st.settings.strict = strict;
    });
    await loadBank();
    begin(afqt ? "afqt" : "full", afqt ? "Quick AFQT test" : "Full practice ASVAB", fullSections(load().qstats, afqt), { strict, timed, instant: false });
  });
}

function begin(kind: Kind, title: string, sections: Section[], o: { strict: boolean; timed: boolean; instant: boolean }) {
  update((s) => {
    s.active = {
      id: uid(),
      kind,
      title,
      ...o,
      sections,
      section: 0,
      index: 0,
      answers: {},
      times: {},
      sectionUsedMs: sections.map(() => 0),
      resumedAt: 0,
      startedAt: Date.now(),
    };
  });
  askPersistence();
  location.hash = "#/run";
}

let introShown = -1;
let checked = false;
let qStart = 0;

async function run() {
  await loadBank();
  const t = load().active;
  if (!t) return (location.hash = "#/");
  const sec = t.sections[t.section];
  const multi = t.sections.length > 1;
  if (multi && t.index === 0 && introShown !== t.section && !t.answers[sec.qids[0]] && t.sectionUsedMs[t.section] === 0) {
    return sectionIntro(t);
  }
  renderQuestion(t);
}

function sectionIntro(t: ActiveTest) {
  const sec = t.sections[t.section];
  page(
    "home",
    `<div class="intro">
      <p class="step">Part ${t.section + 1} of ${t.sections.length}</p>
      <h1>${SUBTEST_NAMES[sec.subtest]}</h1>
      <p class="lead">${sec.qids.length} questions${t.timed && sec.minutes ? ` · ${sec.minutes} minutes` : ""}</p>
      <p>${sectionTip(sec.subtest)}</p>
      <button class="btn primary wide" id="go">Start part ${t.section + 1}</button>
      <button class="btn ghost wide" id="exit">Save and exit</button>
    </div>`,
  );
  document.getElementById("go")!.addEventListener("click", () => {
    introShown = t.section;
    renderQuestion(load().active!);
  });
  document.getElementById("exit")!.addEventListener("click", () => (location.hash = "#/"));
}

function sectionTip(s: string) {
  const tips: Record<string, string> = {
    GS: "Basic life, earth, space and physical science.",
    AR: "Word problems. Write down what the question asks for before you calculate.",
    WK: "Pick the word that means most nearly the same. Watch the time: it is short.",
    PC: "Answer only from what the passage says, not from what you already know.",
    MK: "Algebra, geometry and number rules. There is no formula sheet.",
    EI: "Circuits, current, voltage and components.",
    AI: "How cars and their systems work.",
    SI: "Tools, fasteners and shop practice.",
    MC: "Levers, gears, pulleys, forces and fluids.",
    AO: "Picture how the pieces fit or where the line connects.",
  };
  return tips[s] ?? "";
}

function remainingMs(t: ActiveTest) {
  const sec = t.sections[t.section];
  if (!t.timed || !sec.minutes) return null;
  const used = t.sectionUsedMs[t.section] + (t.resumedAt ? Date.now() - t.resumedAt : 0);
  return Math.max(0, sec.minutes * 60000 - used);
}

function pauseClock() {
  const t = load().active;
  if (!t || !t.resumedAt) return;
  const now = Date.now();
  update((s) => {
    const a = s.active!;
    a.sectionUsedMs[a.section] += now - a.resumedAt;
    a.resumedAt = 0;
    const qid = a.sections[a.section].qids[a.index];
    if (qid && qStart) a.times[qid] = (a.times[qid] ?? 0) + (now - qStart);
  });
  qStart = 0;
}

function resumeClock() {
  update((s) => {
    if (s.active && !s.active.resumedAt) s.active.resumedAt = Date.now();
  });
  qStart = Date.now();
}

function fmtClock(ms: number) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function renderQuestion(t: ActiveTest) {
  const sec = t.sections[t.section];
  const qid = sec.qids[t.index];
  const q = question(qid);
  if (!q) {
    update((s) => {
      s.active!.answers[qid] = null;
    });
    return advance();
  }
  checked = t.instant && t.answers[qid] !== undefined;
  const chosen = t.answers[qid];
  const p = passage(q.passage);
  const n = sec.qids.length;
  const label = t.sections.length > 1 ? SUBTEST_NAMES[sec.subtest] : t.title;
  page(
    "",
    `<div class="runner">
      <header class="run-head">
        <button class="icon-btn" id="exit" aria-label="Save and exit">✕</button>
        <div class="run-title"><strong>${esc(label)}</strong><span>Question ${t.index + 1} of ${n}</span></div>
        <div class="clock" id="clock" role="timer" aria-live="off"></div>
      </header>
      <div class="bar"><span style="width:${(t.index / n) * 100}%"></span></div>
      ${p ? `<article class="passage">${p}</article>` : ""}
      ${q.instr && t.index === 0 ? `<p class="instr">${q.instr}</p>` : ""}
      <div class="qtext" id="qtext">${q.text}</div>
      <div class="choices ${q.figChoices ? "figs" : ""}" role="radiogroup" aria-labelledby="qtext">
        ${q.choices
          .map((c, i) => {
            let cls = chosen === i ? "sel" : "";
            if (checked) cls += i === q.answer ? " right" : chosen === i ? " wrong" : "";
            return `<button class="choice ${cls}" role="radio" aria-checked="${chosen === i}" data-i="${i}" ${checked ? "disabled" : ""}><span class="letter">${"ABCD"[i]}</span><span class="ctext">${c}</span></button>`;
          })
          .join("")}
      </div>
      ${checked ? `<div class="explain ${chosen === q.answer ? "ok" : "bad"}" role="status"><strong>${chosen === q.answer ? "Correct." : `Not quite. The answer is ${"ABCD"[q.answer]}.`}</strong>${q.explain}<p class="src">${esc(q.source)}</p></div>` : ""}
      <div class="run-foot">
        ${!t.strict && !t.instant && t.index > 0 ? `<button class="btn" id="prev">Back</button>` : "<span></span>"}
        <button class="btn primary" id="next" ${chosen === undefined && (t.instant || t.strict) ? "disabled" : ""}>${nextLabel(t, checked)}</button>
      </div>
      ${!t.strict && !t.instant ? `<button class="btn ghost small" id="skip">${t.index === n - 1 ? "Finish part with blanks" : "Skip for now"}</button>` : ""}
    </div>`,
  );
  resumeClock();
  const clock = document.getElementById("clock")!;
  const draw = () => {
    const r = remainingMs(load().active!);
    if (r === null) {
      clock.textContent = "";
      return;
    }
    clock.textContent = fmtClock(r);
    clock.classList.toggle("low", r < 60000);
    if (r <= 0) {
      clearInterval(tick);
      timeUp();
    }
  };
  draw();
  tick = window.setInterval(draw, 1000);

  app.querySelectorAll<HTMLButtonElement>(".choice").forEach((b) =>
    b.addEventListener("click", () => {
      const i = +b.dataset.i!;
      update((s) => {
        s.active!.answers[qid] = i;
      });
      app.querySelectorAll(".choice").forEach((x) => {
        x.classList.toggle("sel", x === b);
        x.setAttribute("aria-checked", String(x === b));
      });
      (document.getElementById("next") as HTMLButtonElement).disabled = false;
    }),
  );
  document.getElementById("next")!.addEventListener("click", () => {
    if (t.instant && !checked) {
      pauseClock();
      renderQuestion(load().active!);
      document.querySelector(".explain")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    advance();
  });
  document.getElementById("prev")?.addEventListener("click", () => {
    pauseClock();
    update((s) => {
      s.active!.index--;
    });
    renderQuestion(load().active!);
  });
  document.getElementById("skip")?.addEventListener("click", () => advance());
  document.getElementById("exit")!.addEventListener("click", () => {
    pauseClock();
    location.hash = "#/";
  });
}

function nextLabel(t: ActiveTest, isChecked: boolean) {
  if (t.instant && !isChecked) return "Check answer";
  const sec = t.sections[t.section];
  if (t.index < sec.qids.length - 1) return "Next";
  if (t.section < t.sections.length - 1) return "Finish part";
  return "See my score";
}

function advance() {
  pauseClock();
  let done = false;
  update((s) => {
    const a = s.active!;
    const sec = a.sections[a.section];
    if (a.index < sec.qids.length - 1) {
      a.index++;
      return;
    }
    if (!a.strict && !a.instant) {
      const blank = sec.qids.findIndex((id) => a.answers[id] === undefined);
      if (blank !== -1 && blank !== a.index && !confirm("You skipped some questions in this part. Finish it anyway? Blank answers count as wrong.")) {
        a.index = blank;
        return;
      }
    }
    if (a.section < a.sections.length - 1) {
      a.section++;
      a.index = 0;
      return;
    }
    done = true;
  });
  if (done) return finish();
  run();
}

function timeUp() {
  const t = load().active!;
  const name = SUBTEST_NAMES[t.sections[t.section].subtest];
  pauseClock();
  const last = t.section >= t.sections.length - 1;
  update((s) => {
    const a = s.active!;
    a.timedOut = [...(a.timedOut ?? []), a.sections[a.section].subtest];
    if (!last) {
      a.section++;
      a.index = 0;
    }
  });
  alert(`Time is up for ${name}. Unanswered questions in that part count as wrong.`);
  if (last) return finish();
  run();
}

function finish() {
  const t = load().active!;
  const items = t.sections.flatMap((sec) =>
    sec.qids.map((qid) => {
      const q = question(qid);
      const choice = t.answers[qid] ?? null;
      return { qid, subtest: q?.subtest ?? sec.subtest, choice, correct: !!q && choice === q.answer, ms: t.times[qid] ?? 0 };
    }),
  );
  const raw: Raw = {};
  for (const it of items) {
    if (it.subtest === "MF") continue;
    const r = (raw[it.subtest as Subtest] ??= { correct: 0, total: 0 });
    r.total++;
    if (it.correct) r.correct++;
  }
  const scored = t.kind === "full" || t.kind === "afqt";
  const attempt: Attempt = {
    id: t.id,
    kind: t.kind,
    title: t.title,
    startedAt: t.startedAt,
    finishedAt: Date.now(),
    items,
    raw,
    scores: scored ? score(raw) : null,
    timedOut: t.timedOut ?? [],
  };
  update((s) => {
    const now = Date.now();
    for (const it of items) {
      if (t.kind === "full" || t.kind === "afqt" || it.choice !== null) {
        const st = (s.qstats[it.qid] ??= { seen: 0, correct: 0, last: 0, lastCorrect: false });
        st.seen++;
        if (it.correct) st.correct++;
        st.last = now;
        st.lastCorrect = it.correct;
      }
    }
    s.attempts.push(attempt);
    s.active = null;
  });
  introShown = -1;
  location.hash = `#/results/${attempt.id}`;
}

function results(id: string) {
  const a = load().attempts.find((x) => x.id === id);
  if (!a) return (location.hash = "#/progress");
  const right = a.items.filter((i) => i.correct).length;
  const s = a.scores;
  const settings = load().settings;
  const subs = Object.entries(a.raw) as [Subtest, { correct: number; total: number }][];
  const order = CAT_ORDER.map((c) => c.subtest).filter((k) => a.raw[k]);
  const weakest = subs.length ? subs.slice().sort((x, y) => x[1].correct / x[1].total - y[1].correct / y[1].total)[0][0] : null;
  page(
    "progress",
    `<a class="back" href="#/progress">All results</a>
    <h1>${esc(a.title)}</h1>
    <p class="lead">${fmtDate(a.finishedAt)} · ${right} of ${a.items.length} correct (${Math.round((right / Math.max(1, a.items.length)) * 100)}%)</p>
    ${
      s && s.afqt !== null
        ? `<section class="card afqt">
            <div class="big"><span class="num">${s.afqt}</span><span class="lbl">Estimated AFQT</span></div>
            <div class="meta"><p><strong>Category ${s.category}</strong>. ${categoryText(s.afqt)}</p>
            <p>Your goal is ${settings.target}. ${s.afqt >= settings.target ? "You reached it." : `You are ${settings.target - s.afqt} points away.`}</p></div>
          </section>
          <section class="card"><h2>Can I enlist with this score?</h2>
            <p class="hint">Minimums for applicants with a ${settings.education === "diploma" ? "high school diploma" : "GED"}. Change this in Settings. Branches change minimums often, so confirm with a recruiter.</p>
            <ul class="branches">${BRANCH_MINIMUMS.map((b) => {
              const min = settings.education === "diploma" ? b.diploma : b.ged;
              const ok = s.afqt! >= min;
              return `<li class="${ok ? "ok" : "no"}"><span>${b.branch}</span><span>${ok ? "Meets" : "Below"} minimum ${min}${settings.education === "ged" ? " (usually)" : ""}</span></li>`;
            }).join("")}</ul>
          </section>`
        : ""
    }
    ${a.timedOut?.length ? `<p class="warn card">Time ran out in ${a.timedOut.map((k) => SUBTEST_NAMES[k as Subtest] ?? k).join(", ")}. Blank answers counted as wrong.</p>` : ""}
    <section class="card"><h2>By subject</h2>
      <div class="bars">${order
        .map((k) => {
          const r = a.raw[k]!;
          const pct = Math.round((r.correct / r.total) * 100);
          const ss = s?.standard[k];
          return `<div class="barrow"><span class="name">${SUBTEST_NAMES[k]}</span><span class="track"><span style="width:${pct}%"></span></span><span class="val">${r.correct}/${r.total}${ss ? ` · <abbr title="Estimated standard score (average is 50)">${ss}</abbr>` : ""}</span></div>`;
        })
        .join("")}</div>
      ${s ? `<p class="hint">The second number is an estimated standard score. On the real test, 50 is average and 60 is better than about 84% of people.</p>` : ""}
    </section>
    ${
      s && s.army.length
        ? `<section class="card"><h2>Job scores (estimated)</h2>
            <p class="hint">Each branch uses its own combinations of subjects to decide which jobs you qualify for.</p>
            <h3>Army line scores</h3><div class="chips">${s.army.map((x) => `<span class="chip" title="${x.name}"><b>${x.code}</b> ${x.value}</span>`).join("")}</div>
            ${s.mage.length ? `<h3>Air Force and Space Force (percentiles)</h3><div class="chips">${s.mage.map((x) => `<span class="chip" title="${x.name}"><b>${x.code}</b> ${x.value}</span>`).join("")}</div>` : ""}
          </section>`
        : ""
    }
    <div class="row wrap">
      ${weakest ? `<a class="btn primary" href="#/practice/${weakest}">Practice ${SUBTEST_NAMES[weakest]}</a>` : ""}
      <a class="btn" href="#/review/${a.id}">Review every answer</a>
    </div>
    ${s ? `<p class="hint">These scores are estimates. The real ASVAB adapts to your answers and uses official tables, so treat this as a guide to your progress, not a promise. <a href="#/about">How we estimate</a>.</p>` : ""}`,
  );
}

function categoryText(afqt: number) {
  if (afqt >= 93) return "Top of the scale.";
  if (afqt >= 65) return "Well above average.";
  if (afqt >= 50) return "Above average. Many enlistment bonuses start here.";
  if (afqt >= 31) return "Meets the usual minimum to enlist with a diploma.";
  if (afqt >= 21) return "Below most branch minimums. Keep practicing: this is very fixable.";
  return "Well below the minimums. Start with the lessons and short practice sets.";
}

function review(id: string) {
  const a = load().attempts.find((x) => x.id === id);
  if (!a) return (location.hash = "#/progress");
  const filter = sessionStorageGet("reviewFilter") ?? "wrong";
  const items = a.items.filter((i) => filter === "all" || !i.correct);
  page(
    "progress",
    `<a class="back" href="#/results/${a.id}">Back to results</a>
    <h1>Review answers</h1>
    <div class="seg" role="group" aria-label="Show">
      <button class="${filter === "wrong" ? "on" : ""}" data-f="wrong">Missed (${a.items.filter((i) => !i.correct).length})</button>
      <button class="${filter === "all" ? "on" : ""}" data-f="all">All (${a.items.length})</button>
    </div>
    ${items.length ? "" : `<p class="card">Nothing missed. Well done.</p>`}
    ${items
      .map((it) => {
        const q = question(it.qid);
        if (!q) return "";
        const p = passage(q.passage);
        return `<article class="card rev ${it.correct ? "ok" : "bad"}">
          <p class="step">${SUBTEST_NAMES[q.subtest as Subtest] ?? q.subtest} · ${it.correct ? "Correct" : it.choice === null ? "Not answered" : "Missed"}</p>
          ${p ? `<details class="passage"><summary>Show passage</summary>${p}</details>` : ""}
          <div class="qtext">${q.text}</div>
          <ol class="opts ${q.figChoices ? "figs" : ""}">${q.choices
            .map((c, i) => `<li class="${i === q.answer ? "right" : i === it.choice ? "wrong" : ""}"><span class="letter">${"ABCD"[i]}</span><span class="ctext">${c}</span>${i === q.answer ? '<span class="tag">Answer</span>' : i === it.choice ? '<span class="tag">You</span>' : ""}</li>`)
            .join("")}</ol>
          <div class="explain">${q.explain}</div>
        </article>`;
      })
      .join("")}`,
  );
  app.querySelectorAll<HTMLButtonElement>(".seg button").forEach((b) =>
    b.addEventListener("click", () => {
      sessionStorageSet("reviewFilter", b.dataset.f!);
      review(id);
    }),
  );
}

function sessionStorageGet(k: string) {
  try {
    return sessionStorage.getItem(k);
  } catch {
    return null;
  }
}

function sessionStorageSet(k: string, v: string) {
  try {
    sessionStorage.setItem(k, v);
  } catch {
    return;
  }
}

async function practice() {
  const b = await loadBank();
  const stats = load().qstats;
  page(
    "practice",
    `<h1>Practice</h1>
    <p class="lead">Pick a subject. You see the right answer and an explanation after every question.</p>
    <div class="list">${PRACTICE_SUBTESTS.map((k) => {
      const all = b.questions.filter((q) => q.subtest === k);
      const seen = all.filter((q) => stats[q.id]).length;
      const acc = accuracy(k);
      return `<a class="item" href="#/practice/${k}"><span><strong>${SUBTEST_NAMES[k]}</strong><small>${all.length} questions${k === "AR" || k === "MK" ? " + unlimited generated" : ""} · ${seen} seen</small></span>${acc !== null ? `<span class="pill">${acc}%</span>` : ""}</a>`;
    }).join("")}</div>`,
  );
}

function accuracy(subtest: string) {
  const items = load()
    .attempts.flatMap((a) => a.items)
    .filter((i) => i.subtest === subtest && i.choice !== null)
    .slice(-60);
  if (items.length < 5) return null;
  return Math.round((items.filter((i) => i.correct).length / items.length) * 100);
}

async function practiceSubject(k: string) {
  const b = await loadBank();
  if (!(k in SUBTEST_NAMES)) return (location.hash = "#/practice");
  const sets = b.sets.filter((s) => s.subtest === k);
  const total = poolSize(k);
  const gen = k === "AR" || k === "MK";
  page(
    "practice",
    `<a class="back" href="#/practice">Practice</a>
    <h1>${SUBTEST_NAMES[k as Subtest]}</h1>
    <div class="card form">
      <h2>Quick practice</h2>
      <p class="hint">Mixes questions you have not seen with ones you missed before.</p>
      <div class="seg" role="group" aria-label="Number of questions">
        ${[10, 20, 30].map((n, i) => `<button data-n="${n}" class="${i === 0 ? "on" : ""}" ${n > total && !gen ? "disabled" : ""}>${n}</button>`).join("")}
      </div>
      <button class="btn primary wide" id="go">Start</button>
      ${gen ? `<button class="btn wide" id="gen">Unlimited new ${k === "AR" ? "word problems" : "math problems"}</button>` : ""}
      <a class="btn ghost wide" href="#/learn/${lessonFor(k)}">Read the lesson first</a>
    </div>
    <h2>Practice sets from the study guide</h2>
    <div class="list">${sets.map((s) => setItem(s)).join("")}</div>`,
  );
  let n = 10;
  app.querySelectorAll<HTMLButtonElement>(".seg button").forEach((btn) =>
    btn.addEventListener("click", () => {
      n = +btn.dataset.n!;
      app.querySelectorAll(".seg button").forEach((x) => x.classList.toggle("on", x === btn));
    }),
  );
  document.getElementById("go")!.addEventListener("click", () => {
    const ids = pick(k, n, load().qstats);
    begin("practice", `${SUBTEST_NAMES[k as Subtest]} practice`, [{ subtest: k as Subtest, minutes: null, qids: ids }], { strict: false, timed: false, instant: true });
  });
  document.getElementById("gen")?.addEventListener("click", () => {
    begin("practice", `${SUBTEST_NAMES[k as Subtest]}: generated`, [{ subtest: k as Subtest, minutes: null, qids: unlimitedMath(k as "AR" | "MK", n) }], {
      strict: false,
      timed: false,
      instant: true,
    });
  });
}

function setItem(s: QuizSet) {
  return `<a class="item" href="#/practice/set/${s.id}"><span><strong>${esc(s.title)}</strong><small>${esc(s.source)} · ${s.count} questions</small></span></a>`;
}

function lessonFor(k: string) {
  const map: Record<string, string> = {
    WK: "word-knowledge",
    PC: "paragraph-comprehension",
    AR: "arithmetic-reasoning",
    MK: "mathematics-knowledge",
    MF: "math-foundations",
    GS: "general-science",
    EI: "electronics-information",
    AI: "auto-information",
    SI: "shop-information",
    MC: "mechanical-comprehension",
    AO: "assembling-objects",
  };
  return map[k] ?? "";
}

async function practiceSet(id: string) {
  const b = await loadBank();
  const s = b.sets.find((x) => x.id === id);
  if (!s) return (location.hash = "#/practice");
  const minutes = s.time ? parseInt(s.time) : null;
  page(
    "practice",
    `<a class="back" href="#/practice/${s.subtest}">${SUBTEST_NAMES[s.subtest as Subtest]}</a>
    <h1>${esc(s.title)}</h1>
    <p class="lead">${esc(s.source)} · ${s.count} questions${minutes ? ` · suggested time ${minutes} minutes` : ""}</p>
    <div class="card form">
      <label class="switch"><input type="radio" name="mode" value="learn" checked><span>Learn mode: see each answer right away</span></label>
      <label class="switch"><input type="radio" name="mode" value="test"><span>Test mode: timed, answers at the end</span></label>
      <button class="btn primary wide" id="go">Start</button>
    </div>`,
  );
  document.getElementById("go")!.addEventListener("click", () => {
    const test = (app.querySelector('input[name="mode"]:checked') as HTMLInputElement).value === "test";
    begin("set", s.title, [{ subtest: s.subtest as Subtest, minutes: test ? minutes : null, qids: s.ids }], { strict: false, timed: test, instant: !test });
  });
}

async function learn() {
  const idx = await loadIndex();
  page(
    "learn",
    `<h1>Learn</h1>
    <p class="lead">Short, plain-English lessons with worked examples and practice sets.</p>
    <div class="list">${idx.learn
      .map((l) => `<a class="item" href="#/learn/${l.id}"><span><strong>${esc(l.title)}</strong><small>${esc(l.sub)}</small></span></a>`)
      .join("")}</div>`,
  );
}

async function lesson(id: string) {
  try {
    const l = await loadLesson(id);
    page(
      "learn",
      `<a class="back" href="#/learn">Learn</a>
      <article class="lesson"><h1>${esc(l.title)}</h1>${l.sub ? `<p class="lead">${esc(l.sub)}</p>` : ""}${l.html}</article>`,
    );
  } catch {
    page("learn", `<a class="back" href="#/learn">Learn</a><h1>Lesson unavailable</h1><p>This lesson could not be loaded. If you are offline, open it once while online so it is saved for later.</p>`);
  }
}

function progress() {
  const s = load();
  const scored = s.attempts.filter((a) => a.scores?.afqt != null);
  const list = s.attempts.slice().reverse();
  page(
    "progress",
    `<h1>Progress</h1>
    ${
      scored.length
        ? `<section class="card"><h2>AFQT estimates over time</h2>${trendChart(
            scored.map((a) => ({ t: a.finishedAt, v: a.scores!.afqt! })),
            s.settings.target,
          )}</section>`
        : `<p class="card">Take a quick AFQT test or a full practice test to start tracking your score.</p>`
    }
    <section class="card"><h2>Accuracy by subject</h2><p class="hint">Your last 60 answers in each subject.</p>
      <div class="bars">${PRACTICE_SUBTESTS.map((k) => {
        const acc = accuracy(k);
        return `<div class="barrow"><span class="name">${SUBTEST_NAMES[k]}</span><span class="track"><span style="width:${acc ?? 0}%"></span></span><span class="val">${acc === null ? "Not enough yet" : acc + "%"}</span></div>`;
      }).join("")}</div>
    </section>
    <section><h2>History</h2>
      ${list.length ? `<div class="list">${list
        .map((a) => {
          const right = a.items.filter((i) => i.correct).length;
          return `<a class="item" href="#/results/${esc(a.id)}"><span><strong>${esc(a.title)}</strong><small>${fmtDate(a.finishedAt)} · ${right}/${a.items.length} correct</small></span>${a.scores?.afqt != null ? `<span class="pill">AFQT ${a.scores.afqt}</span>` : ""}</a>`;
        })
        .join("")}</div>` : `<p class="hint">Nothing here yet.</p>`}
    </section>`,
  );
}

function settings() {
  const s = load().settings;
  page(
    "settings",
    `<h1>Settings</h1>
    <section class="card form">
      <label>Your AFQT goal <input type="number" id="target" min="1" max="99" value="${s.target}" inputmode="numeric"></label>
      <label>Education <select id="education"><option value="diploma" ${s.education === "diploma" ? "selected" : ""}>High school diploma</option><option value="ged" ${s.education === "ged" ? "selected" : ""}>GED or other credential</option></select></label>
      <label>Theme <select id="theme"><option value="system" ${s.theme === "system" ? "selected" : ""}>Match my device</option><option value="light" ${s.theme === "light" ? "selected" : ""}>Light</option><option value="dark" ${s.theme === "dark" ? "selected" : ""}>Dark</option></select></label>
      <label>Text size <select id="textSize"><option value="normal" ${s.textSize === "normal" ? "selected" : ""}>Normal</option><option value="large" ${s.textSize === "large" ? "selected" : ""}>Large</option><option value="larger" ${s.textSize === "larger" ? "selected" : ""}>Larger</option></select></label>
    </section>
    <section class="card form">
      <h2>Your data</h2>
      <p class="hint">Your results are saved only on this device. Nothing is sent anywhere. Save a backup file to move your progress to another device or keep it safe.</p>
      <button class="btn" id="export">Save backup file</button>
      <label class="btn file">Restore from backup file<input type="file" id="import" accept="application/json,.json"></label>
      <button class="btn danger" id="reset">Erase all my results</button>
    </section>
    <p class="foot"><a href="#/about">About FreeASVAB</a></p>`,
  );
  const bind = (id: string, fn: (v: string) => void) =>
    document.getElementById(id)!.addEventListener("change", (e) => {
      fn((e.target as HTMLInputElement).value);
      applySettings();
    });
  bind("target", (v) => update((st) => (st.settings.target = Math.min(99, Math.max(1, Math.round(+v) || 50)))));
  bind("education", (v) => update((st) => (st.settings.education = v as "diploma" | "ged")));
  bind("theme", (v) => update((st) => (st.settings.theme = v as "system" | "light" | "dark")));
  bind("textSize", (v) => update((st) => (st.settings.textSize = v as "normal" | "large" | "larger")));
  document.getElementById("export")!.addEventListener("click", () => {
    const blob = new Blob([exportBackup()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `freeasvab-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  document.getElementById("import")!.addEventListener("change", async (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    try {
      if (!confirm("Replace the results on this device with the ones in this backup?")) return;
      importBackup(await f.text());
      applySettings();
      alert("Backup restored.");
      settings();
    } catch (err) {
      alert(err instanceof Error && err.message.includes("FreeASVAB") ? err.message : "That file could not be read as a FreeASVAB backup.");
    }
  });
  document.getElementById("reset")!.addEventListener("click", () => {
    if (confirm("Erase every test result and setting on this device? This cannot be undone.")) {
      resetAll();
      applySettings();
      location.hash = "#/";
    }
  });
}

function about() {
  page(
    "settings",
    `<a class="back" href="#/settings">Settings</a>
    <article class="lesson">
    <h1>About FreeASVAB</h1>
    <p>FreeASVAB is a free, open-source practice app for the Armed Services Vocational Aptitude Battery. There are no accounts, ads or payments, and your results never leave your device.</p>
    <h2>How scores are estimated</h2>
    <p>The real computer ASVAB is adaptive: each question is picked based on your earlier answers, and your score comes from official tables built from a 1997 national sample of 18 to 23 year olds. Those tables and question difficulties are not public, so no practice app can give an exact score.</p>
    <p>This app estimates your score in three steps. First it takes your percent correct in each subject, adjusts for lucky guesses on four-choice questions, and turns it into a standard score where 50 is average and each 10 points is one standard deviation. Next it combines your Word Knowledge and Paragraph Comprehension answers into a verbal score (VE). Finally it uses the published AFQT formula, 2 × VE + AR + MK, and converts the result into a percentile from 1 to 99. Army line scores and Air Force composites are built from the same standard scores.</p>
    <p>Use the estimate to see whether you are improving and which subjects need work. Only the real test gives an official score.</p>
    <h2>Enlistment minimums</h2>
    <p>The branch minimums shown are the published figures for applicants with a high school diploma, with 50 as the common figure for GED holders. Branches change these often and can ask for more, so always confirm with a recruiter.</p>
    <h2>Open source</h2>
    <p>The app and all its questions are MIT licensed. Source code and the printable study guide: <a href="https://github.com/grangedevgroup-code/FreeASVAB" rel="noopener">github.com/grangedevgroup-code/FreeASVAB</a>.</p>
    <p>FreeASVAB is not affiliated with or endorsed by the U.S. Department of Defense or any military branch. ASVAB is a registered trademark of the U.S. Department of Defense.</p>
    </article>`,
  );
}

function route() {
  const h = location.hash.replace(/^#\/?/, "");
  const [a, b, c] = h.split("/");
  if (a !== "run") pauseClock();
  if (a === "") return home();
  if (a === "start") return startScreen(b);
  if (a === "run") return run();
  if (a === "results") return results(b);
  if (a === "review") return loadBank().then(() => review(b));
  if (a === "practice" && b === "set") return practiceSet(c);
  if (a === "practice" && b) return practiceSubject(b);
  if (a === "practice") return practice();
  if (a === "learn" && b) return lesson(b);
  if (a === "learn") return learn();
  if (a === "progress") return progress();
  if (a === "settings") return settings();
  if (a === "about") return about();
  home();
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    pauseClock();
    save();
  } else if (location.hash === "#/run" && load().active && document.querySelector(".runner")) {
    resumeClock();
  }
});

window.addEventListener("hashchange", route);
applySettings();
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applySettings);
route();

if ("serviceWorker" in navigator && import.meta.env.PROD && !(window as unknown as { Capacitor?: unknown }).Capacitor) {
  navigator.serviceWorker.register("sw.js").catch(() => undefined);
}
