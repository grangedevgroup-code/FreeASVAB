import "@fontsource-variable/public-sans/wght.css";
import "./style.css";
import { flushNative, isNative, restoreNative } from "./native";
import { load, save } from "./store";
import { errorPage, toast } from "./ui";
import { home } from "./views/home";
import { learn, lesson } from "./views/learn";
import { practice, practiceSet, practiceSubject } from "./views/practice";
import { progress } from "./views/progress";
import { results, review } from "./views/results";
import { pauseClock, resumeClock, run, runnerVisible } from "./views/runner";
import { about, applySettings, settings } from "./views/settings";
import { startScreen } from "./views/tests";

async function route() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").map((p) => {
    try {
      return decodeURIComponent(p);
    } catch {
      return p;
    }
  });
  const [a, b, c] = parts;
  if (a !== "run") pauseClock();
  try {
    if (a === "") return home();
    if (a === "start") return await startScreen(b);
    if (a === "run") return await run();
    if (a === "results") return results(b);
    if (a === "review") return await review(b);
    if (a === "practice" && b === "set") return await practiceSet(c);
    if (a === "practice" && b) return await practiceSubject(b);
    if (a === "practice") return await practice();
    if (a === "learn" && b) return await lesson(b);
    if (a === "learn") return await learn();
    if (a === "progress") return progress();
    if (a === "settings") return settings();
    if (a === "about") return about();
    location.replace("#/");
  } catch {
    errorPage(() => void route());
  }
}

document.addEventListener("click", (e) => {
  if ((e.target as HTMLElement).closest("[data-skip]")) document.getElementById("main")?.focus();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    pauseClock();
    save();
    void flushNative();
  } else if (location.hash === "#/run" && load().active && runnerVisible()) {
    resumeClock();
  }
});

window.addEventListener("hashchange", () => void route());
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applySettings);
void restoreNative().then(() => {
  applySettings();
  void route();
});

if ("serviceWorker" in navigator && import.meta.env.PROD && !isNative) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register("sw.js").catch(() => undefined);
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || runnerVisible()) return;
    toast("FreeASVAB has been updated.", { label: "Reload", run: () => location.reload() });
  });
}
