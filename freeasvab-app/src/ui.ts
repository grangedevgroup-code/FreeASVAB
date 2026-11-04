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
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  practice: "M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9",
  learn: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM20 17v4H6.5A2.5 2.5 0 0 1 4 18.5",
  progress: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  close: "M6 6l12 12M18 6L6 18",
  next: "M9 6l6 6-6 6",
  back: "M15 6l-6 6 6 6",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01",
  warn: "M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01",
  check: "M20 6L9 17l-5-5",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  book: "M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z",
  redo: "M1 4v6h6M3.5 15a9 9 0 1 0 2.1-9.4L1 10",
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
      <a class="brand" href="#/"><img src="icons/icon-192.png" alt="" width="32" height="32"><span>FreeASVAB</span></a>
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

export function page(tab: Tab | null, body: string, title: string, opts: { chrome?: boolean; keepScroll?: boolean } = {}) {
  runLeave();
  const chrome = opts.chrome ?? true;
  document.title = title ? `${title} · FreeASVAB` : "FreeASVAB: Free ASVAB Practice Tests";
  app.innerHTML = `${chrome ? header(tab) : ""}<main class="page${chrome ? "" : " bare"}" id="main" tabindex="-1">${body}</main>${chrome ? tabs(tab) : ""}`;
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

export function badge(code: string) {
  return `<span class="badge ${AFQT_CODES.has(code) ? "b-afqt" : "b-career"}" aria-hidden="true">${code === "MF" ? "MB" : esc(code)}</span>`;
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
    `<div class="alert error" role="alert">${icon("warn")}<div><h1>Questions could not be loaded</h1>
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
