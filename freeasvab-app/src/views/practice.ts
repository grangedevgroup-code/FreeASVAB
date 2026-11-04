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
  return `<a class="item" href="#/practice/${k}">
    ${tile(k)}
    <span class="item-main">
      <strong>${SUBTEST_NAMES[k as Subtest | "MF"]}</strong>
      <small>${st.total}${k === "AR" || k === "MK" ? "+" : ""} questions, ${seenPct}% seen</small>
      <span class="meter" aria-hidden="true"><span style="width:${seenPct}%"></span></span>
    </span>
    ${acc ? `<span class="item-meta"><b>${acc.pct}%</b>correct</span>` : ""}
    ${icon("next", "chev")}
  </a>`;
}

export async function practice() {
  await loadBank();
  const missed = missedCount(load().qstats);
  page(
    "practice",
    `<div class="page-head"><h1>Practice</h1><p class="lead">Pick a subtest. You see the right answer and a worked explanation after every question.</p></div>
    ${
      missed
        ? `<div class="list"><a class="item" href="#/start/review"><span class="tile" aria-hidden="true">${icon("redo")}</span><span class="item-main"><strong>Review ${plural(missed, "missed question")}</strong><small>Fixing mistakes is the fastest way to gain points</small></span>${icon("next", "chev")}</a></div>`
        : ""
    }
    ${section("afqt-h", "AFQT subtests", `<div class="list">${[...AFQT_PRACTICE, "MF"].map(subjectRow).join("")}</div>`, "These decide whether you can enlist.")}
    ${section("career-h", "Career subtests", `<div class="list">${CAREER_PRACTICE.map(subjectRow).join("")}</div>`, "These decide which jobs you qualify for.")}`,
    "Practice",
    { narrow: true },
  );
}

function setRow(s: QuizSet) {
  return `<a class="item" href="#/practice/set/${esc(s.id)}"><span class="item-main"><strong>${esc(s.title)}</strong><small>${esc(s.source)}</small></span><span class="item-meta"><b>${s.count}</b>questions</span>${icon("next", "chev")}</a>`;
}

function record(seen: number, total: number, gen: boolean, acc: { pct: number } | null, toReview: number) {
  const parts = [`You have seen ${seen} of ${total}${gen ? "+" : ""} questions.`];
  if (acc) parts.push(`${acc.pct}% of your recent answers were right.`);
  if (toReview) parts.push(`${plural(toReview, "question is", "questions are")} waiting for review.`);
  return parts.join(" ");
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
    <div class="page-head with-tile">${tile(k, true)}<div><h1>${name}</h1><p class="lead">${SUBJECT_INFO[k].about}</p></div></div>
    <p class="record">${record(st.seen, st.total, gen, acc, subjectMissed)}</p>
    ${section(
      "quick-h",
      "Practice now",
      `<div class="sheet form">
        <p class="field-label" id="count-label">How many questions?</p>
        <div class="seg" role="radiogroup" aria-labelledby="count-label">
          ${[10, 20, 30].map((n, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-n="${n}" class="${i === 0 ? "on" : ""}" ${n > st.total && !gen ? "disabled" : ""}>${n}</button>`).join("")}
        </div>
        <button class="btn primary wide" id="go" type="button">Start practice</button>
        ${gen ? `<button class="btn wide" id="gen" type="button">Unlimited new ${k === "AR" ? "word problems" : "math problems"}</button>` : ""}
        ${subjectMissed ? `<button class="btn wide" id="review" type="button">Review ${plural(subjectMissed, "missed question")}</button>` : ""}
      </div>`,
      "Questions you have not seen or got wrong come first.",
    )}
    ${section(
      "study-h",
      "Study material",
      `<div class="list">
        <a class="item" href="#/learn/${SUBJECT_INFO[k].lesson}"><span class="tile" aria-hidden="true">${icon("learn")}</span><span class="item-main"><strong>${name} lesson</strong><small>Plain-English explanations, examples and tips</small></span>${icon("next", "chev")}</a>
        ${sets.map(setRow).join("")}
      </div>`,
    )}`,
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
    <div class="page-head with-tile">${tile(s.subtest, true)}<div><h1>${esc(s.title)}</h1><p class="lead">${esc(s.source)}</p></div></div>
    <p class="record">${plural(s.count, "question")}${minutes ? `, with a suggested time of ${minutes} minutes` : ""}.</p>
    ${section(
      "mode-h",
      "How do you want to take it?",
      `<div class="list" role="radiogroup" aria-labelledby="mode-h">
        <label class="item choice-item"><input type="radio" name="mode" value="learn" checked><span class="bubble" aria-hidden="true"></span><span class="item-main"><strong>Learn mode</strong><small>See the answer and explanation after each question</small></span></label>
        <label class="item choice-item"><input type="radio" name="mode" value="test"><span class="bubble" aria-hidden="true"></span><span class="item-main"><strong>Test mode</strong><small>${minutes ? `Timed at ${minutes} minutes, ` : ""}answers at the end</small></span></label>
      </div>
      <button class="btn primary wide" id="go" type="button">Start</button>`,
    )}`,
    s.title,
    { narrow: true },
  );
  document.getElementById("go")!.addEventListener("click", async () => {
    const test = (app.querySelector('input[name="mode"]:checked') as HTMLInputElement).value === "test";
    if (!(await guardActive())) return;
    begin("set", s.title, [{ subtest: s.subtest as Subtest, minutes: test ? minutes : null, qids: s.ids }], { strict: false, timed: test, instant: !test });
  });
}
