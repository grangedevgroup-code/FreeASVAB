import { esc, loadBank, missedCount, missedIds, pick, subjectStats, unlimitedMath, type QuizSet } from "../bank";
import { SUBTEST_NAMES, type Subtest } from "../scoring";
import { accuracy, AFQT_PRACTICE, CAREER_PRACTICE } from "../stats";
import { load } from "../store";
import { app, badge, icon, page, plural } from "../ui";
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

function subjectItem(k: string) {
  const st = subjectStats(k, load().qstats);
  const acc = accuracy(load().attempts, k);
  const seenPct = st.total ? Math.round((st.seen / st.total) * 100) : 0;
  return `<a class="item subject" href="#/practice/${k}">
    ${badge(k)}
    <span class="item-body">
      <strong>${SUBTEST_NAMES[k as Subtest | "MF"]}</strong>
      <small>${st.total} questions${k === "AR" || k === "MK" ? " + unlimited new ones" : ""} · ${seenPct}% seen</small>
      <span class="meter thin" aria-hidden="true"><span style="width:${seenPct}%"></span></span>
    </span>
    ${acc ? `<span class="pill" title="Correct in your last ${acc.n} answers">${acc.pct}%</span>` : ""}
    ${icon("next", "chev")}
  </a>`;
}

export async function practice() {
  await loadBank();
  const missed = missedCount(load().qstats);
  page(
    "practice",
    `<h1>Practice</h1>
    <p class="lead">Pick a subject. You see the right answer and a full explanation after every question.</p>
    ${missed ? `<a class="alert info link" href="#/start/review">${icon("redo")}<span><strong>Review ${plural(missed, "missed question")}</strong><br>Fixing mistakes is the fastest way to gain points.</span>${icon("next", "chev")}</a>` : ""}
    <section aria-labelledby="afqt-h">
      <h2 id="afqt-h" class="section-title">AFQT subjects<small>These decide whether you can enlist</small></h2>
      <div class="list">${[...AFQT_PRACTICE, "MF"].map(subjectItem).join("")}</div>
    </section>
    <section aria-labelledby="career-h">
      <h2 id="career-h" class="section-title">Career subjects<small>These decide which jobs you qualify for</small></h2>
      <div class="list">${CAREER_PRACTICE.map(subjectItem).join("")}</div>
    </section>`,
    "Practice",
  );
}

function setItem(s: QuizSet) {
  return `<a class="item" href="#/practice/set/${esc(s.id)}"><span class="item-body"><strong>${esc(s.title)}</strong><small>${esc(s.source)} · ${s.count} questions</small></span>${icon("next", "chev")}</a>`;
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
    <div class="subject-head">${badge(k)}<div><h1>${name}</h1><p class="lead">${SUBJECT_INFO[k].about}</p></div></div>
    <dl class="stats">
      <div><dt>Questions</dt><dd>${st.total}${gen ? "+" : ""}</dd></div>
      <div><dt>Seen</dt><dd>${st.seen}</dd></div>
      <div><dt>Recent accuracy</dt><dd>${acc ? `${acc.pct}%` : "–"}</dd></div>
      <div><dt>To review</dt><dd>${subjectMissed}</dd></div>
    </dl>
    <section class="card form" aria-labelledby="quick-h">
      <h2 id="quick-h">Quick practice</h2>
      <p class="hint">Mixes questions you have not seen with ones you missed before.</p>
      <div class="seg" role="radiogroup" aria-label="Number of questions">
        ${[10, 20, 30].map((n, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-n="${n}" class="${i === 0 ? "on" : ""}" ${n > st.total && !gen ? "disabled" : ""}>${n} questions</button>`).join("")}
      </div>
      <button class="btn primary wide" id="go" type="button">Start practice</button>
      ${gen ? `<button class="btn wide" id="gen" type="button">Unlimited new ${k === "AR" ? "word problems" : "math problems"}</button>` : ""}
      ${subjectMissed ? `<button class="btn wide" id="review" type="button">Review ${plural(subjectMissed, "missed question")}</button>` : ""}
    </section>
    <a class="item lesson-link" href="#/learn/${SUBJECT_INFO[k].lesson}">${icon("book")}<span class="item-body"><strong>Read the ${name} lesson</strong><small>Plain-English explanations, examples and tips</small></span>${icon("next", "chev")}</a>
    ${sets.length ? `<h2 class="section-title">Practice sets<small>Fixed sets from the study guide</small></h2><div class="list">${sets.map(setItem).join("")}</div>` : ""}`,
    `${name} practice`,
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
    <h1>${esc(s.title)}</h1>
    <p class="lead">${esc(s.source)} · ${s.count} questions${minutes ? ` · suggested time ${minutes} minutes` : ""}</p>
    <section class="card form" aria-labelledby="mode-h">
      <h2 id="mode-h">How do you want to work?</h2>
      <label class="switch radio"><input type="radio" name="mode" value="learn" checked><span><strong>Learn mode</strong><small>See the answer and explanation after each question</small></span></label>
      <label class="switch radio"><input type="radio" name="mode" value="test"><span><strong>Test mode</strong><small>${minutes ? `Timed at ${minutes} minutes, ` : ""}answers at the end</small></span></label>
      <button class="btn primary wide" id="go" type="button">Start</button>
    </section>`,
    s.title,
  );
  document.getElementById("go")!.addEventListener("click", async () => {
    const test = (app.querySelector('input[name="mode"]:checked') as HTMLInputElement).value === "test";
    if (!(await guardActive())) return;
    begin("set", s.title, [{ subtest: s.subtest as Subtest, minutes: test ? minutes : null, qids: s.ids }], { strict: false, timed: test, instant: !test });
  });
}
