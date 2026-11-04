import { esc, loadBank, missedCount, missedIds, pick, subjectStats, unlimitedMath, type QuizSet } from "../bank";
import { SUBTEST_NAMES, type Subtest } from "../scoring";
import { accuracy, AFQT_PRACTICE, CAREER_PRACTICE } from "../stats";
import { load } from "../store";
import { app, icon, page, plural, section, tile } from "../ui";
import { begin, guardActive } from "./runner";
import { startSubjectReview } from "./tests";

export const SUBJECT_INFO: Record<string, { about: string; lesson: string }> = {
  WK: { about: "Vocabulary: choose the word that means the same.", lesson: "word-knowledge" },
  PC: { about: "Read short passages and answer questions about them.", lesson: "paragraph-comprehension" },
  AR: { about: "Math word problems, solved by hand.", lesson: "arithmetic-reasoning" },
  MK: { about: "Algebra, geometry and number rules.", lesson: "mathematics-knowledge" },
  MF: { about: "Fractions, decimals, percents and the skills behind AR and MK.", lesson: "math-foundations" },
  GS: { about: "Life, earth, space and physical science.", lesson: "general-science" },
  EI: { about: "Circuits, current, voltage and electronic parts.", lesson: "electronics-information" },
  AI: { about: "How cars and their systems work.", lesson: "auto-information" },
  SI: { about: "Tools, fasteners, materials and shop practice.", lesson: "shop-information" },
  MC: { about: "Levers, gears, pulleys, forces and fluids.", lesson: "mechanical-comprehension" },
  AO: { about: "Spatial puzzles: how shapes connect and fit together.", lesson: "assembling-objects" },
};

function subjectRow(k: string) {
  const st = subjectStats(k, load().qstats);
  const acc = accuracy(load().attempts, k);
  const seenPct = st.total ? Math.round((st.seen / st.total) * 100) : 0;
  return `<a class="row" href="#/practice/${k}">
    ${badge(k)}
    <span class="row-main">
      <strong>${SUBTEST_NAMES[k as Subtest | "MF"]}</strong>
      <small>${st.total}${k === "AR" || k === "MK" ? "+" : ""} questions, ${seenPct}% seen</small>
      <span class="meter" aria-hidden="true"><span style="width:${seenPct}%"></span></span>
    </span>
    <span class="row-data"><b>${acc ? `${acc.pct}%` : "–"}</b>recent</span>
    ${icon("next", "chev")}
  </a>`;
}

export async function practice() {
  await loadBank();
  const missed = missedCount(load().qstats);
  page(
    "practice",
    `<div class="page-head"><h1>Practice</h1><p class="lead">Pick a subtest. You see the right answer and a full explanation after every question.</p></div>
    ${missed ? `<a class="notice warn" href="#/start/review">${icon("redo")}<span><strong>Review ${plural(missed, "missed question")}</strong><br>Fixing mistakes is the fastest way to gain points.</span>${icon("next", "chev")}</a>` : ""}
    <section class="panel" aria-labelledby="afqt-h">
      <header class="panel-head"><h2 id="afqt-h">AFQT subtests</h2><span class="meta">Decide whether you can enlist</span></header>
      <div class="rows">${[...AFQT_PRACTICE, "MF"].map(subjectRow).join("")}</div>
    </section>
    <section class="panel" aria-labelledby="career-h">
      <header class="panel-head"><h2 id="career-h">Career subtests</h2><span class="meta">Decide which jobs you qualify for</span></header>
      <div class="rows">${CAREER_PRACTICE.map(subjectRow).join("")}</div>
    </section>`,
    "Practice",
    { narrow: true },
  );
}

function setRow(s: QuizSet) {
  return `<a class="row" href="#/practice/set/${esc(s.id)}"><span class="row-main"><strong>${esc(s.title)}</strong><small>${esc(s.source)}</small></span><span class="row-data"><b>${s.count}</b>items</span>${icon("next", "chev")}</a>`;
}

export async function practiceSubject(k: string) {
  const b = await loadBank();
  if (!(k in SUBJECT_INFO)) {
    location.replace("#/practice");
    return;
  }
  const name = SUBTEST_NAMES[k as Subtest | "MF"];
  const st = subjectStats(k, load().qstats);
  const acc = accuracy(load().attempts, k);
  const subjectMissed = missedIds(load().qstats, k).length;
  const sets = b.sets.filter((s) => s.subtest === k);
  const gen = k === "AR" || k === "MK";
  page(
    "practice",
    `<a class="back" href="#/practice">${icon("back")}Practice</a>
    <div class="subject-head">${badge(k, true)}<div class="page-head"><h1>${name}</h1><p class="lead">${SUBJECT_INFO[k].about}</p></div></div>
    <section class="panel" aria-labelledby="rec-h">
      <header class="panel-head"><h2 id="rec-h">Your record</h2></header>
      <dl class="kv">
        <div><dt>Questions</dt><dd>${st.total}${gen ? "+" : ""}</dd></div>
        <div><dt>Seen</dt><dd>${st.seen}</dd></div>
        <div><dt>Recent accuracy</dt><dd>${acc ? `${acc.pct}%` : "–"}</dd></div>
        <div><dt>To review</dt><dd>${subjectMissed}</dd></div>
      </dl>
    </section>
    <section class="panel form" aria-labelledby="quick-h">
      <header class="panel-head"><h2 id="quick-h">Quick practice</h2><span class="meta">Unseen and missed first</span></header>
      <div class="panel-body">
        <p class="field-label" id="count-label">How many questions?</p>
        <div class="seg" role="radiogroup" aria-labelledby="count-label">
          ${[10, 20, 30].map((n, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-n="${n}" class="${i === 0 ? "on" : ""}" ${n > st.total && !gen ? "disabled" : ""}>${n}</button>`).join("")}
        </div>
        <button class="btn signal wide" id="go" type="button">Start practice</button>
        ${gen ? `<button class="btn wide" id="gen" type="button">Unlimited new ${k === "AR" ? "word problems" : "math problems"}</button>` : ""}
        ${subjectMissed ? `<button class="btn wide" id="review" type="button">Review ${plural(subjectMissed, "missed question")}</button>` : ""}
      </div>
    </section>
    <section class="panel" aria-labelledby="study-h">
      <header class="panel-head"><h2 id="study-h">Study material</h2></header>
      <div class="rows">
        <a class="row" href="#/learn/${SUBJECT_INFO[k].lesson}">${icon("book")}<span class="row-main"><strong>${name} lesson</strong><small>Plain-English explanations, examples and tips</small></span>${icon("next", "chev")}</a>
        ${sets.map(setRow).join("")}
      </div>
    </section>`,
    `${name} practice`,
    { narrow: true },
  );
  let n = 10;
  app.querySelectorAll<HTMLButtonElement>(".seg button").forEach((btn) =>
    btn.addEventListener("click", () => {
      n = +btn.dataset.n!;
      app.querySelectorAll<HTMLButtonElement>(".seg button").forEach((x) => {
        x.classList.toggle("on", x === btn);
        x.setAttribute("aria-checked", String(x === btn));
      });
    }),
  );
  document.getElementById("go")!.addEventListener("click", async () => {
    if (!(await guardActive())) return;
    begin("practice", `${name} practice`, [{ subtest: k as Subtest, minutes: null, qids: pick(k, n, load().qstats) }], { strict: false, timed: false, instant: true });
  });
  document.getElementById("gen")?.addEventListener("click", async () => {
    if (!(await guardActive())) return;
    begin("practice", `${name}: new problems`, [{ subtest: k as Subtest, minutes: null, qids: unlimitedMath(k as "AR" | "MK", n) }], { strict: false, timed: false, instant: true });
  });
  document.getElementById("review")?.addEventListener("click", () => void startSubjectReview(k));
}

export async function practiceSet(id: string) {
  const b = await loadBank();
  const s = b.sets.find((x) => x.id === id);
  if (!s) {
    location.replace("#/practice");
    return;
  }
  const minutes = s.time ? parseInt(s.time, 10) : null;
  page(
    "practice",
    `<a class="back" href="#/practice/${esc(s.subtest)}">${icon("back")}${SUBTEST_NAMES[s.subtest as Subtest | "MF"]}</a>
    <div class="subject-head">${badge(s.subtest, true)}<div class="page-head"><h1>${esc(s.title)}</h1><p class="lead">${esc(s.source)}</p></div></div>
    <section class="panel" aria-labelledby="facts-h">
      <header class="panel-head"><h2 id="facts-h">Set details</h2></header>
      <dl class="kv"><div><dt>Items</dt><dd>${s.count}</dd></div><div><dt>Suggested time</dt><dd>${minutes ? `${minutes} min` : "–"}</dd></div></dl>
    </section>
    <section class="panel form" aria-labelledby="mode-h">
      <header class="panel-head"><h2 id="mode-h">Mode</h2></header>
      <div class="panel-body">
        <label class="switch"><input type="radio" name="mode" value="learn" checked><span><strong>Learn mode</strong><small>See the answer and explanation after each question</small></span></label>
        <label class="switch"><input type="radio" name="mode" value="test"><span><strong>Test mode</strong><small>${minutes ? `Timed at ${minutes} minutes, ` : ""}answers at the end</small></span></label>
        <button class="btn signal wide" id="go" type="button">Start</button>
      </div>
    </section>`,
    s.title,
    { narrow: true },
  );
  document.getElementById("go")!.addEventListener("click", async () => {
    const test = (app.querySelector('input[name="mode"]:checked') as HTMLInputElement).value === "test";
    if (!(await guardActive())) return;
    begin("set", s.title, [{ subtest: s.subtest as Subtest, minutes: test ? minutes : null, qids: s.ids }], { strict: false, timed: test, instant: !test });
  });
}
