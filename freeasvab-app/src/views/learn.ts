import { esc, loadIndex, loadLesson, type Lesson, type LessonGroup } from "../bank";
import { SUBTEST_NAMES, type Subtest } from "../scoring";
import { load, update } from "../store";
import { app, icon, page, section, tile } from "../ui";

const GROUPS: { key: LessonGroup; title: string; note: string }[] = [
  { key: "start", title: "Start here", note: "How the test works and how it is scored." },
  { key: "afqt", title: "AFQT subtests", note: "These decide whether you can enlist." },
  { key: "career", title: "Career subtests", note: "These open up jobs." },
  { key: "reference", title: "Quick reference", note: "Formulas, checklists and terms." },
];

function lessonRow(l: Lesson) {
  return `<a class="item" href="#/learn/${esc(l.id)}">${tile(l.subtest ?? null)}<span class="item-main"><strong>${esc(l.title)}</strong><small>${esc(l.sub)}</small></span>${icon("next", "chev")}</a>`;
}

export async function learn() {
  const idx = await loadIndex();
  const lastId = load().lastLesson;
  const last = idx.learn.find((l) => l.id === lastId);
  page(
    "learn",
    `<div class="page-head"><h1>Learn</h1><p class="lead">Plain-English lessons with worked examples, memory tricks and practice sets.</p></div>
    ${last ? `<a class="notice" href="#/learn/${esc(last.id)}">${icon("book")}<span><strong>Continue reading</strong><br>${esc(last.title)}</span>${icon("next", "chev")}</a>` : ""}
    ${GROUPS.map((g) => {
      const items = idx.learn.filter((l) => l.group === g.key);
      if (!items.length) return "";
      return `<section class="panel" aria-labelledby="g-${g.key}"><header class="panel-head"><h2 id="g-${g.key}">${g.title}</h2><span class="meta">${g.note}</span></header><div class="rows">${items.map(lessonRow).join("")}</div></section>`;
    }).join("")}`,
    "Learn",
    { narrow: true },
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
      `<a class="back" href="#/learn">${icon("back")}Learn</a><div class="page-head"><h1>Lesson unavailable</h1></div><div class="notice warn">${icon("warn")}<p>This lesson could not be loaded. If you are offline, open it once while online so it is saved for later.</p></div>`,
      "Lesson unavailable",
      { narrow: true },
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
        ${l.subtest ? badge(l.subtest, true) : ""}
        <div class="page-head"><h1>${esc(l.title)}</h1>${l.sub ? `<p class="lead">${esc(l.sub)}</p>` : ""}</div>
      </header>
      ${subject ? `<div class="actions"><a class="btn primary" href="#/practice/${esc(l.subtest!)}">Practice ${esc(subject)}</a></div>` : ""}
      ${l.toc.length > 2 ? `<details class="toc"><summary>On this page: ${l.toc.length} sections</summary><ol></ol></details>` : ""}
      <div class="lesson-body">${l.html}</div>
      <footer class="lesson-foot">
        ${subject ? `<a class="btn signal" href="#/practice/${esc(l.subtest!)}">Practice ${esc(subject)} now</a>` : ""}
        ${
          nextLesson
            ? `<section class="panel"><header class="panel-head"><h2>Next lesson</h2></header><div class="rows">${lessonRow(nextLesson)}</div></section>`
            : ""
        }
      </footer>
    </article>`,
    l.title,
    { narrow: true },
  );
  const toc = app.querySelector<HTMLDetailsElement>(".toc");
  toc?.addEventListener("toggle", () => {
    const list = toc.querySelector("ol")!;
    if (!toc.open || list.childElementCount) return;
    list.innerHTML = l.toc.map((t) => `<li><button type="button" class="linkish" data-to="${esc(t.id)}">${esc(t.text)}</button></li>`).join("");
  });
  toc?.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-to]");
    const target = b && document.getElementById(b.dataset.to!);
    if (!target) return;
    target.setAttribute("tabindex", "-1");
    target.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    target.focus({ preventScroll: true });
  });
}
