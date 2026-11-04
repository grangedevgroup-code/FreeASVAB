import { esc } from "./bank";

export const app = document.getElementById("app")!;

export type Tab = "home" | "practice" | "learn" | "progress" | "settings";

const NAV: [Tab, string, string][] = [
  ["home", "#/", "Home"],
  ["practice", "#/practice", "Practice"],
  ["learn", "#/learn", "Learn"],
  ["progress", "#/progress", "Progress"],
  ["settings", "#/settings", "Settings"],
];

const PATHS: Record<string, string> = {
  home: "M4 10.6 12 4l8 6.6V20h-5.5v-5.5h-5V20H4z",
  practice: "M6.5 3.5h11a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1zM9 8h6M9 13l2 2 4-4.5",
  learn: "M12 6.5C10.3 5.2 7.7 4.6 4 5v13.5c3.7-.4 6.3.2 8 1.5 1.7-1.3 4.3-1.9 8-1.5V5c-3.7-.4-6.3.2-8 1.5zM12 6.5V20",
  progress: "M4 4v16h16M7.5 15.5l3.5-4 3 2.5 5-6",
  settings: "M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1M13 7a2 2 0 1 0 4 0 2 2 0 1 0-4 0M7 12a2 2 0 1 0 4 0 2 2 0 1 0-4 0M15 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0",
  close: "M6.5 6.5l11 11M17.5 6.5l-11 11",
  next: "M9.5 6l6 6-6 6",
  back: "M14.5 6l-6 6 6 6",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.8v.01",
  warn: "M12 3.8 2.8 19.5h18.4zM12 10v4.5M12 17.2v.01",
  check: "M5 12.5l4.5 4.5L19 7.5",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3 2",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 12v.01",
  book: "M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3",
  redo: "M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4",
  bulb: "M9.5 18h5M10.5 21h3M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2v.2h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z",
  GS: "M9.5 3.5h5M10.5 3.5v6L5.2 18.2A1.5 1.5 0 0 0 6.5 20.5h11a1.5 1.5 0 0 0 1.3-2.3L13.5 9.5v-6M7.8 14.5h8.4",
  AR: "M7 4.5v5M4.5 7h5M14.5 7h5M5 15l4 4M9 15l-4 4M14.5 15.5h5M14.5 18.5h5",
  WK: "M3.5 18.5 8 6l4.5 12.5M5.2 14h5.6M15 9.5h5.5M15 13.5h5.5M15 17.5h3.5",
  PC: "M6.5 3.5h7.5l4.5 4.5v12.5h-12zM14 3.5V8h4.5M9 12h6.5M9 15h6.5M9 18h4",
  MK: "M5 19.5h14.5L5 5zM5 15.5h4v4",
  MF: "M18.5 5.5 5.5 18.5M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM16 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  EI: "M2.5 12h4l1.5-4 3 8 3-8 3 8 1.5-4h4",
  AI: "M3.5 16.5V13l2.2-4.5h8.6l3.4 4.5 2.8.9v2.6h-1M9.5 16.5h5M6 13h12M7.5 18.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM16.5 18.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  SI: "M12.25 4.75l7 7-2.5 2.5-7-7zM13.25 10.75 4.5 19.5",
  MC: "M3 8.5l18 5M12 11.5l-3.5 8h7zM6.3 8.9a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2zM19 4.5v5.5M17.2 8.3 19 10.1l1.8-1.8",
  AO: "M12 3.5l7.5 4.2v8.6L12 20.5l-7.5-4.2V7.7zM12 12l7.5-4.3M12 12v8.5M12 12 4.5 7.7",
};

export function icon(name: string, cls = "") {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${PATHS[name]}"/></svg>`;
}

let leaving: (() => void)[] = [];

export function onLeave(fn: () => void) {
  leaving.push(fn);
}

function runLeave() {
  const list = leaving;
  leaving = [];
  for (const fn of list) {
    try {
      fn();
    } catch {
      continue;
    }
  }
}

function header(tab: Tab | null) {
  const links = NAV.map(
    ([key, href, label]) => `<a href="${href}" class="${tab === key ? "on" : ""}" ${tab === key ? 'aria-current="page"' : ""}>${label}</a>`,
  ).join("");
  return `<header class="appbar">
    <div class="appbar-inner">
      <a class="brand" href="#/" aria-label="FreeASVAB home"><img src="icons/icon-192.png" alt="" width="28" height="28"><span class="brand-mark" aria-hidden="true"><span>FREE</span>ASVAB</span></a>
      <nav class="topnav" aria-label="Main">${links}</nav>
    </div>
  </header>`;
}

function tabs(tab: Tab | null) {
  return `<nav class="tabs" aria-label="Main">${NAV.map(
    ([key, href, label]) =>
      `<a href="${href}" class="${tab === key ? "on" : ""}" ${tab === key ? 'aria-current="page"' : ""}>${icon(key)}<span>${label}</span></a>`,
  ).join("")}</nav>`;
}

export function page(
  tab: Tab | null,
  body: string,
  title: string,
  opts: { chrome?: boolean; keepScroll?: boolean; narrow?: boolean; masthead?: string } = {},
) {
  runLeave();
  const chrome = opts.chrome ?? true;
  document.title = title ? `${title} | FreeASVAB` : "FreeASVAB: Free ASVAB Practice Tests";
  const cls = ["page", chrome ? "" : "bare", opts.narrow ? "narrow" : ""].filter(Boolean).join(" ");
  const mast = opts.masthead ? `<div class="masthead"><div class="masthead-inner${opts.narrow ? " narrow" : ""}">${opts.masthead}</div></div>` : "";
  app.innerHTML = `${chrome ? header(tab) : ""}<main class="${cls}" id="main" tabindex="-1">${mast}<div class="page-inner">${body}</div></main>${chrome ? tabs(tab) : ""}`;
  if (!opts.keepScroll) window.scrollTo(0, 0);
  const h = app.querySelector<HTMLElement>("main h1");
  if (h) {
    h.tabIndex = -1;
    h.focus({ preventScroll: true });
  }
}

export function ask(o: { title: string; body?: string; ok: string; cancel?: string | null; danger?: boolean }): Promise<boolean> {
  const text = `${o.title}${o.body ? `\n\n${o.body}` : ""}`;
  if (typeof HTMLDialogElement === "undefined" || typeof HTMLDialogElement.prototype.showModal !== "function") {
    if (o.cancel === null) {
      alert(text);
      return Promise.resolve(true);
    }
    return Promise.resolve(confirm(text));
  }
  return new Promise((resolve) => {
    const d = document.createElement("dialog");
    d.className = "dialog";
    d.setAttribute("aria-labelledby", "dialog-title");
    d.innerHTML = `<h2 id="dialog-title">${esc(o.title)}</h2>${o.body ? `<p>${esc(o.body)}</p>` : ""}
      <div class="dialog-actions">
        ${o.cancel === null ? "" : `<button class="btn" type="button" value="cancel">${esc(o.cancel ?? "Cancel")}</button>`}
        <button class="btn ${o.danger ? "danger-fill" : "primary"}" type="button" value="ok">${esc(o.ok)}</button>
      </div>`;
    let result = false;
    d.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest("button");
      if (!b) return;
      result = b.value === "ok";
      d.close();
    });
    d.addEventListener("close", () => {
      d.remove();
      resolve(result);
    });
    document.body.append(d);
    d.showModal();
    d.querySelector<HTMLButtonElement>(`button[value="${o.danger && o.cancel !== null ? "cancel" : "ok"}"]`)?.focus();
  });
}

export function notice(title: string, body?: string, ok = "OK") {
  return ask({ title, body, ok, cancel: null });
}

export function toast(message: string, action?: { label: string; run: () => void }) {
  document.querySelector(".toast")?.remove();
  const t = document.createElement("div");
  t.className = "toast";
  t.setAttribute("role", "status");
  t.innerHTML = `<span>${esc(message)}</span>${action ? `<button class="btn small" type="button">${esc(action.label)}</button>` : ""}`;
  t.querySelector("button")?.addEventListener("click", () => {
    t.remove();
    action!.run();
  });
  document.body.append(t);
  window.setTimeout(() => t.remove(), 10000);
}

const AFQT_CODES = new Set(["WK", "PC", "AR", "MK", "MF"]);

export function badge(code: string, large = false) {
  return `<span class="code${AFQT_CODES.has(code) ? "" : " career"}${large ? " lg" : ""}" aria-hidden="true">${code === "MF" ? "MB" : esc(code)}</span>`;
}

export function chip(text: string) {
  return `<span class="code plain" aria-hidden="true">${text}</span>`;
}

export function fmtDate(t: number) {
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function fmtMinutes(mins: number) {
  if (mins < 60) return `${Math.max(1, Math.round(mins))} min`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function fmtClock(ms: number) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function plural(n: number, word: string, many = `${word}s`) {
  return `${n.toLocaleString()} ${n === 1 ? word : many}`;
}

export function errorPage(retry: () => void) {
  page(
    null,
    `<div class="notice error" role="alert">${icon("warn")}<div><h1>Questions could not be loaded</h1>
      <p>FreeASVAB needs to download its questions once. Check your internet connection and try again. After that it works offline.</p>
      <button class="btn primary" id="retry" type="button">Try again</button></div></div>`,
    "Could not load",
  );
  document.getElementById("retry")!.addEventListener("click", retry);
}

export function sessionGet(k: string) {
  try {
    return sessionStorage.getItem(k);
  } catch {
    return null;
  }
}

export function sessionSet(k: string, v: string) {
  try {
    sessionStorage.setItem(k, v);
  } catch {
    return;
  }
}
