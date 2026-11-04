import { esc, loadIndex, loadLesson, type Lesson, type LessonGroup } from "../bank";
import { SUBTEST_NAMES, type Subtest } from "../scoring";
import { load, update } from "../store";
import { app, badge, icon, page } from "../ui";

const GROUPS: { key: LessonGroup; title: string; note: string }[] = [
  { key: "start", title: "Start here", note: "How the test works and how it is scored" },
  { key: "afqt", title: "AFQT subjects", note: "The four subjects that decide whether you can enlist" },
  { key: "career", title: "Career subjects", note: "The subjects that open up jobs" },
  { key: "reference", title: "Quick reference", note: "Formulas, checklists and terms" },
];

function lessonItem(l: Lesson) {
  return `<a class="item" href="#/learn/${esc(l.id)}">${l.subtest ? badge(l.subtest) : `<span class="badge b-plain" aria-hidden="true">${icon("book")}</span>`}<span class="item-body"><strong>${esc(l.title)}</strong><small>${esc(l.sub)}</small></span>${icon("next", "chev")}</a>`;
}

export async function learn() {
  const idx = await loadIndex();
  const lastId = load().lastLesson;
  const last = idx.learn.find((l) => l.id === lastId);
  page(
    "learn",
    `<h1>Learn</h1>
    <p class="lead">Plain-English lessons with worked examples, memory tricks and practice sets.</p>
    ${last ? `<a class="alert info link" href="#/learn/${esc(last.id)}">${icon("book")}<span><strong>Continue reading</strong><br>${esc(last.title)}</span>${icon("next", "chev")}</a>` : ""}
    ${GROUPS.map((g) => {
      const items = idx.learn.filter((l) => l.group === g.key);
      if (!items.length) return "";
      return `<section aria-labelledby="g-${g.key}"><h2 id="g-${g.key}" class="section-title">${g.title}<small>${g.note}</small></h2><div class="list">${items.map(lessonItem).join("")}</div></section>`;
    }).join("")}`,
    "Learn",
  );
}

export async function lesson(id: string) {
  let l;
  let idx;
  try {
    [l, idx] = await Promise.all([loadLesson(id), loadIndex()]);
  } catch {
    page(
      "learn",
      `<a class="back" href="#/learn">${icon("back")}Learn</a><h1>Lesson unavailable</h1><div class="alert warn">${icon("warn")}<p>This lesson could not be loaded. If you are offline, open it once while online so it is saved for later.</p></div>`,
      "Lesson unavailable",
    );
    return;
  }
  update((s) => {
    s.lastLesson = id;
  });
  const pos = idx.learn.findIndex((x) => x.id === id);
  const nextLesson = pos >= 0 ? idx.learn[pos + 1] : undefined;
  const subject = l.subtest ? SUBTEST_NAMES[l.subtest as Subtest | "MF"] : null;
  page(
    "learn",
    `<a class="back" href="#/learn">${icon("back")}Learn</a>
    <article class="lesson">
      <header class="lesson-head">
        ${l.subtest ? badge(l.subtest) : ""}
        <div><h1>${esc(l.title)}</h1>${l.sub ? `<p class="lead">${esc(l.sub)}</p>` : ""}</div>
      </header>
      ${subject ? `<div class="row wrap"><a class="btn primary" href="#/practice/${esc(l.subtest!)}">Practice ${esc(subject)}</a></div>` : ""}
      ${l.toc.length > 2 ? `<details class="toc card"><summary>On this page (${l.toc.length} sections)</summary><ol></ol></details>` : ""}
      <div class="lesson-body">${l.html}</div>
      <footer class="lesson-foot">
        ${subject ? `<a class="btn primary" href="#/practice/${esc(l.subtest!)}">Practice ${esc(subject)} now</a>` : ""}
        ${nextLesson ? `<a class="item" href="#/learn/${esc(nextLesson.id)}"><span class="item-body"><small>Next lesson</small><strong>${esc(nextLesson.title)}</strong></span>${icon("next", "chev")}</a>` : ""}
      </footer>
    </article>`,
    l.title,
  );
  app.querySelectorAll<HTMLButtonElement>("[data-to]").forEach((b) =>
    b.addEventListener("click", () => {
      const target = document.getElementById(b.dataset.to!);
      if (!target) return;
      target.setAttribute("tabindex", "-1");
      target.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      target.focus({ preventScroll: true });
    }),
  );
}
