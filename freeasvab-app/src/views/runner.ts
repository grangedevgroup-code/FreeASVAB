import { esc, loadBank, passage, question } from "../bank";
import { hintFor } from "../hints";
import { SUBTEST_NAMES, score, type Raw, type Subtest } from "../scoring";
import { askPersistence, load, uid, update, type ActiveTest, type Attempt, type Kind, type Section } from "../store";
import { app, ask, fmtClock, icon, notice, onLeave, page, tile } from "../ui";

const LETTERS = "ABCD";
let introSeen = "";
let qStart = 0;

export function begin(kind: Kind, title: string, sections: Section[], o: { strict: boolean; timed: boolean; instant: boolean; allowHints?: boolean }) {
  update((s) => {
    s.active = {
      id: uid(),
      kind,
      title,
      ...o,
      allowHints: o.allowHints ?? true,
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
  location.replace("#/run");
}

export async function guardActive(): Promise<boolean> {
  const a = load().active;
  if (!a) return true;
  return ask({
    title: "Discard the test in progress?",
    body: `You still have "${a.title}" in progress. Starting something new will discard your answers in it.`,
    ok: "Discard and start",
    cancel: "Keep it",
    danger: true,
  });
}

export function answeredCount(t: ActiveTest) {
  let n = 0;
  for (let i = 0; i < t.section; i++) n += t.sections[i].qids.length;
  return n + t.index;
}

export function totalCount(t: ActiveTest) {
  return t.sections.reduce((n, s) => n + s.qids.length, 0);
}

export async function run() {
  await loadBank();
  const t = load().active;
  if (!t) {
    location.replace("#/");
    return;
  }
  const sec = t.sections[t.section];
  const key = `${t.id}:${t.section}`;
  if (t.sections.length > 1 && t.index === 0 && introSeen !== key && t.answers[sec.qids[0]] === undefined && t.sectionUsedMs[t.section] === 0) {
    sectionIntro(t, key);
    return;
  }
  renderQuestion(t);
}

function strip(t: ActiveTest) {
  const sec = t.sections[t.section];
  const answered = sec.qids.filter((id) => t.answers[id] !== undefined && t.answers[id] !== null).length;
  return `<div class="strip" role="progressbar" aria-label="Questions answered in this part" aria-valuemin="0" aria-valuemax="${sec.qids.length}" aria-valuenow="${answered}">${sec.qids
    .map((id, i) => `<span class="${i === t.index ? "now" : t.answers[id] !== undefined && t.answers[id] !== null ? "done" : ""}"></span>`)
    .join("")}</div>`;
}

function examBar(title: string, sub: string, withClock: boolean, extra = "") {
  return `<header class="exam-bar">
    <div class="exam-bar-inner">
      <button class="exam-exit" id="exit" type="button" aria-label="Save and exit">${icon("close")}</button>
      <div class="exam-title"><strong>${title}</strong><span>${sub}</span></div>
      ${withClock ? `<div class="exam-clock" id="clock" role="timer" aria-label="Time remaining"></div>` : ""}
    </div>
    ${extra}
  </header>`;
}

const TIPS: Record<string, string> = {
  GS: "Life, earth, space and physical science. Read every choice before you pick.",
  AR: "Word problems. Write down what the question asks for before you calculate. Use scratch paper.",
  WK: "Pick the word that means the same. The time is short, so do not linger on one word.",
  PC: "Answer only from what the passage says, not from what you already know.",
  MK: "Algebra, geometry and number rules. There is no formula sheet on the real test.",
  EI: "Circuits, current, voltage and parts. Ohm's law (V = I × R) solves many of these.",
  AI: "How cars and their systems work. Think about which system each part belongs to.",
  SI: "Tools, fasteners and shop practice. Picture the job, then pick the tool made for it.",
  MC: "Levers, gears, pulleys, forces and fluids. Look closely at every diagram.",
  AO: "Picture how the pieces fit or where the line connects. Pieces turn but do not flip.",
};

function sectionIntro(t: ActiveTest, key: string) {
  const sec = t.sections[t.section];
  const next = t.sections[t.section + 1];
  const timed = t.timed && sec.minutes;
  page(
    null,
    `<div class="exam">
      ${examBar(esc(t.title), `Part ${t.section + 1} of ${t.sections.length}`, false)}
      <div class="exam-body"><div class="exam-sheet intro">
        ${tile(sec.subtest, true)}
        <h1>${SUBTEST_NAMES[sec.subtest]}</h1>
        <p class="intro-meta">${sec.qids.length} questions${timed ? ` in ${sec.minutes} minutes` : ", no time limit"}</p>
        <h2>Directions</h2>
        <p>${TIPS[sec.subtest] ?? ""}</p>
        ${t.strict ? `<p>Like the real computer test, you cannot go back to change an answer once you move on.</p>` : ""}
        ${next ? `<p class="hint">After this part: ${SUBTEST_NAMES[next.subtest]}</p>` : ""}
      </div></div>
      <footer class="exam-foot"><div class="exam-foot-inner">
        <div class="exam-foot-note"></div>
        <div class="exam-actions">
          <button class="btn" id="exit2" type="button">Save and exit</button>
          <button class="btn primary" id="go" type="button">Start part ${t.section + 1}</button>
        </div>
      </div></footer>
    </div>`,
    `Part ${t.section + 1}: ${SUBTEST_NAMES[sec.subtest]}`,
    { chrome: false },
  );
  document.getElementById("go")!.addEventListener("click", () => {
    introSeen = key;
    renderQuestion(load().active!);
  });
  for (const id of ["exit", "exit2"]) document.getElementById(id)!.addEventListener("click", () => (location.hash = "#/"));
}

function remainingMs(t: ActiveTest) {
  const sec = t.sections[t.section];
  if (!t.timed || !sec.minutes) return null;
  const used = t.sectionUsedMs[t.section] + (t.resumedAt ? Date.now() - t.resumedAt : 0);
  return Math.max(0, sec.minutes * 60000 - used);
}

export function pauseClock() {
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

export function resumeClock() {
  update((s) => {
    if (s.active && !s.active.resumedAt) s.active.resumedAt = Date.now();
  });
  qStart = Date.now();
}

export function runnerVisible() {
  return !!document.querySelector(".exam .choices");
}

export function howTo(subtest: string, text: string, open: boolean) {
  const h = hintFor(subtest, text);
  return `<details class="howto" ${open ? "open" : ""}><summary>${icon("bulb")}How to solve this</summary>
    <div class="howto-body"><p class="howto-title">${esc(h.title)}</p><ol>${h.steps.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>${
      h.trap ? `<p class="trap"><strong>Watch out:</strong> ${esc(h.trap)}</p>` : ""
    }</div></details>`;
}

function nextLabel(t: ActiveTest, isChecked: boolean, hasAnswer: boolean) {
  if (!hasAnswer && (t.instant || t.strict)) return "Choose an answer";
  if (t.instant && !isChecked) return "Check answer";
  const sec = t.sections[t.section];
  if (t.index < sec.qids.length - 1) return "Next";
  if (t.section < t.sections.length - 1) return "Finish part";
  return t.kind === "practice" || t.kind === "review" || t.kind === "set" ? "Finish" : "See my score";
}

function renderQuestion(t: ActiveTest) {
  const sec = t.sections[t.section];
  const qid = sec.qids[t.index];
  const q = question(qid);
  if (!q) {
    update((s) => {
      s.active!.answers[qid] = null;
    });
    void advance();
    return;
  }
  const chosen = t.answers[qid];
  const isChecked = t.instant && chosen !== undefined && chosen !== null;
  const p = passage(q.passage);
  const n = sec.qids.length;
  const multi = t.sections.length > 1;
  const done = answeredCount(t);
  const total = totalCount(t);
  const allowHints = t.allowHints ?? true;
  const hintOpen = !!t.hinted?.includes(qid);
  const title = multi ? esc(SUBTEST_NAMES[sec.subtest]) : esc(t.title);
  const sub = multi ? `Part ${t.section + 1} of ${t.sections.length}, question ${done + 1} of ${total} overall` : t.instant ? "Practice mode" : "Test mode";
  page(
    null,
    `<div class="exam">
      ${examBar(title, sub, true, strip(t))}
      <div class="exam-body"><div class="exam-sheet${p ? " has-passage" : ""}">
        ${p ? `<article class="passage" aria-label="Passage">${p}</article>` : ""}
        <div class="exam-q" role="group" aria-label="Question ${t.index + 1} of ${n}">
          <p class="q-count">Question ${t.index + 1} of ${n}</p>
          ${q.instr && t.index === 0 ? `<p class="instr">${q.instr}</p>` : ""}
          <div class="qtext" id="qtext">${q.text}</div>
          <fieldset class="choices ${q.figChoices ? "figs" : ""}" aria-label="Answer choices" ${isChecked ? "disabled" : ""}>
            ${q.choices
              .map((c, i) => {
                let cls = chosen === i ? "sel" : "";
                if (isChecked) cls += i === q.answer ? " right" : chosen === i ? " wrong" : "";
                const mark = isChecked && i === q.answer ? `<span class="mark go">Correct answer</span>` : isChecked && chosen === i ? `<span class="mark nogo">Your answer</span>` : "";
                return `<label class="choice ${cls}"><input type="radio" name="answer" value="${i}" ${chosen === i ? "checked" : ""}><span class="bubble" aria-hidden="true">${LETTERS[i]}</span><span class="ctext">${c}</span>${mark}</label>`;
              })
              .join("")}
          </fieldset>
          ${
            isChecked
              ? `<div class="explain ${chosen === q.answer ? "ok" : "bad"}" id="explain" tabindex="-1">
                  <p class="explain-head">${icon(chosen === q.answer ? "check" : "info")}<strong>${chosen === q.answer ? "Correct" : `Not quite. The answer is ${LETTERS[q.answer]}.`}</strong></p>
                  ${q.explain}<p class="src">${esc(q.source)}</p></div>`
              : ""
          }
          ${allowHints ? howTo(q.subtest, q.text, hintOpen) : ""}
        </div>
      </div></div>
      <footer class="exam-foot"><div class="exam-foot-inner">
        <p class="exam-foot-note">${t.strict && !t.instant ? "Answers are final once you move on." : ""}<span class="keys" aria-hidden="true">Press 1 to 4 or A to D to choose, then Enter.</span></p>
        <div class="exam-actions">
          ${!t.strict && !t.instant && t.index > 0 ? `<button class="btn" id="prev" type="button">${icon("back")}Back</button>` : ""}
          ${!t.strict && !t.instant && chosen === undefined ? `<button class="btn quiet" id="skip" type="button">Skip</button>` : ""}
          <button class="btn primary" id="next" type="button" ${chosen === undefined && (t.instant || t.strict) ? "disabled" : ""}>${nextLabel(t, isChecked, chosen !== undefined && chosen !== null)}</button>
        </div>
      </div></footer>
    </div>`,
    multi ? `${SUBTEST_NAMES[sec.subtest]}, question ${t.index + 1}` : `${t.title}, question ${t.index + 1}`,
    { chrome: false },
  );
  if (isChecked) {
    const ex = document.getElementById("explain")!;
    ex.focus({ preventScroll: true });
    ex.scrollIntoView({ block: "nearest" });
  } else {
    document.getElementById("qtext")!.setAttribute("tabindex", "-1");
    document.getElementById("qtext")!.focus({ preventScroll: true });
  }
  resumeClock();

  const clock = document.getElementById("clock")!;
  let tick = 0;
  const draw = () => {
    const a = load().active;
    if (!a) return;
    const r = remainingMs(a);
    if (r === null) {
      clock.textContent = "";
      return;
    }
    clock.innerHTML = `<span>Time left</span><b>${fmtClock(r)}</b>`;
    clock.classList.toggle("low", r < 60000);
    if (r <= 0) {
      window.clearInterval(tick);
      void timeUp();
    }
  };
  draw();
  tick = window.setInterval(draw, 1000);
  onLeave(() => window.clearInterval(tick));

  const next = document.getElementById("next") as HTMLButtonElement;
  const select = (i: number) => {
    if (isChecked) return;
    update((s) => {
      s.active!.answers[qid] = i;
    });
    app.querySelectorAll<HTMLLabelElement>(".choice").forEach((label, j) => {
      label.classList.toggle("sel", j === i);
      const input = label.querySelector("input")!;
      input.checked = j === i;
    });
    next.disabled = false;
    next.textContent = nextLabel(load().active!, false, true);
    document.getElementById("skip")?.remove();
  };
  app.querySelector(".choices")!.addEventListener("change", (e) => select(+(e.target as HTMLInputElement).value));

  app.querySelector<HTMLDetailsElement>(".howto")?.addEventListener("toggle", (e) => {
    if (!(e.target as HTMLDetailsElement).open) return;
    update((s) => {
      const a = s.active!;
      if (!(a.hinted ??= []).includes(qid)) a.hinted.push(qid);
    });
  });

  next.addEventListener("click", () => {
    if (t.instant && !isChecked) {
      pauseClock();
      renderQuestion(load().active!);
      return;
    }
    void advance();
  });
  document.getElementById("prev")?.addEventListener("click", () => {
    pauseClock();
    update((s) => {
      s.active!.index--;
    });
    renderQuestion(load().active!);
  });
  document.getElementById("skip")?.addEventListener("click", () => void advance());
  document.getElementById("exit")!.addEventListener("click", () => {
    pauseClock();
    location.hash = "#/";
  });

  const onKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey || document.querySelector("dialog[open]")) return;
    const el = document.activeElement as HTMLElement | null;
    const typing = el && (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && (el as HTMLInputElement).type !== "radio"));
    if (typing) return;
    const k = e.key.toLowerCase();
    const idx = "1234".includes(k) && k.length === 1 ? "1234".indexOf(k) : "abcd".includes(k) && k.length === 1 ? "abcd".indexOf(k) : -1;
    if (idx >= 0 && idx < q.choices.length && !isChecked) {
      e.preventDefault();
      select(idx);
      app.querySelectorAll<HTMLInputElement>(".choice input")[idx]?.focus();
      return;
    }
    if (e.key === "Enter" && el && !["BUTTON", "SUMMARY", "A"].includes(el.tagName) && !next.disabled) {
      e.preventDefault();
      next.click();
    }
  };
  document.addEventListener("keydown", onKey);
  onLeave(() => document.removeEventListener("keydown", onKey));
}

async function advance() {
  pauseClock();
  const a = load().active!;
  const sec = a.sections[a.section];
  if (a.index < sec.qids.length - 1) {
    update((s) => {
      s.active!.index++;
    });
    await run();
    return;
  }
  if (!a.strict && !a.instant) {
    const blank = sec.qids.findIndex((id) => a.answers[id] === undefined || a.answers[id] === null);
    if (blank !== -1) {
      const ok = await ask({
        title: "Finish this part with blanks?",
        body: "Some questions in this part have no answer. Blank answers count as wrong.",
        ok: "Finish part",
        cancel: "Go to the first blank",
      });
      if (!ok) {
        update((s) => {
          s.active!.index = blank;
        });
        await run();
        return;
      }
    }
  }
  if (a.section < a.sections.length - 1) {
    update((s) => {
      s.active!.section++;
      s.active!.index = 0;
    });
    await run();
    return;
  }
  finish();
}

async function timeUp() {
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
  await notice(`Time is up for ${name}`, `Unanswered questions in that part count as wrong.${last ? "" : " The next part starts when you are ready."}`, last ? "See my score" : "Continue");
  if (last) finish();
  else await run();
}

function finish() {
  const t = load().active!;
  const items = t.sections.flatMap((sec) =>
    sec.qids.map((qid) => {
      const q = question(qid);
      const choice = t.answers[qid] ?? null;
      return { qid, subtest: q?.subtest ?? sec.subtest, choice, correct: !!q && choice === q.answer, ms: t.times[qid] ?? 0, hinted: !!t.hinted?.includes(qid) };
    }),
  );
  const raw: Raw = {};
  for (const it of items) {
    if (it.subtest === "MF") continue;
    const r = (raw[it.subtest as Subtest] ??= { correct: 0, total: 0 });
    r.total++;
    if (it.correct) r.correct++;
  }
  const scored = t.kind === "full" || t.kind === "afqt" || t.kind === "quick";
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
      if (scored || it.choice !== null) {
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
  introSeen = "";
  location.replace(`#/results/${attempt.id}`);
}
