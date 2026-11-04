import { isNative, shareBackup } from "../native";
import { exportBackup, importBackup, load, resetAll, update } from "../store";
import { app, ask, icon, notice, page } from "../ui";
import { GOAL_PRESETS, siteFooter } from "./home";

export function applySettings() {
  const s = load().settings;
  const root = document.documentElement;
  if (s.theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", s.theme);
  root.dataset.text = s.textSize;
  void syncSystemBars(s.theme === "dark" || (s.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches));
}

const opt = (v: string, label: string, cur: string) => `<option value="${v}" ${v === cur ? "selected" : ""}>${label}</option>`;

export function settings() {
  const s = load().settings;
  page(
    "settings",
    `<h1>Settings</h1>
    <section class="card form" aria-labelledby="goal-h">
      <h2 id="goal-h">Your goal</h2>
      <div class="presets compact" role="radiogroup" aria-label="Goal presets">${GOAL_PRESETS.map(
        (g) => `<button type="button" class="preset ${s.target === g.v ? "on" : ""}" role="radio" aria-checked="${s.target === g.v}" data-goal="${g.v}"><strong>${g.v}</strong><span>${g.label}</span></button>`,
      ).join("")}</div>
      <label>Or type any AFQT goal from 1 to 99 <input type="number" id="target" min="1" max="99" value="${s.target}" inputmode="numeric"></label>
      <label>Education <select id="education">${opt("diploma", "High school diploma", s.education)}${opt("ged", "GED or other credential", s.education)}</select></label>
      <p class="hint">Education changes which enlistment minimums your results are compared with.</p>
    </section>
    <section class="card form" aria-labelledby="test-h">
      <h2 id="test-h">Practice test defaults</h2>
      <label class="switch"><input type="checkbox" id="timed" ${s.timed ? "checked" : ""}><span><strong>Use time limits</strong><small>The same limits as the computer ASVAB</small></span></label>
      <label class="switch"><input type="checkbox" id="strict" ${s.strict ? "checked" : ""}><span><strong>No going back</strong><small>Answers are final once you move on</small></span></label>
      <label class="switch"><input type="checkbox" id="hints" ${s.hints ? "checked" : ""}><span><strong>Show "How to solve this"</strong><small>Available on every question during tests</small></span></label>
    </section>
    <section class="card form" aria-labelledby="disp-h">
      <h2 id="disp-h">Display</h2>
      <label>Theme <select id="theme">${opt("system", "Match my device", s.theme)}${opt("light", "Light", s.theme)}${opt("dark", "Dark", s.theme)}</select></label>
      <label>Text size <select id="textSize">${opt("normal", "Normal", s.textSize)}${opt("large", "Large", s.textSize)}${opt("larger", "Larger", s.textSize)}</select></label>
    </section>
    <section class="card form" aria-labelledby="data-h">
      <h2 id="data-h">Your data</h2>
      <p class="hint">Your results are saved only on this device. Nothing is sent anywhere. Save a backup file to keep your progress safe or move it to another device.</p>
      <button class="btn" id="export" type="button">Save a backup file</button>
      <label class="btn file">Restore from a backup file<input type="file" id="import" accept="application/json,.json"></label>
      <button class="btn danger" id="reset" type="button">Erase all my results</button>
    </section>
    <a class="item" href="#/about">${icon("info")}<span class="item-body"><strong>About FreeASVAB</strong><small>How scores are estimated, version ${__APP_VERSION__}</small></span>${icon("next", "chev")}</a>
    ${siteFooter()}`,
    "Settings",
  );
  const bind = (id: string, fn: (el: HTMLInputElement) => void) =>
    document.getElementById(id)!.addEventListener("change", (e) => {
      fn(e.target as HTMLInputElement);
      applySettings();
    });
  bind("target", (el) =>
    update((st) => {
      st.settings.target = Math.min(99, Math.max(1, Math.round(+el.value) || 50));
      st.settings.goalSet = true;
    }),
  );
  bind("education", (el) => update((st) => (st.settings.education = el.value as "diploma" | "ged")));
  bind("theme", (el) => update((st) => (st.settings.theme = el.value as "system" | "light" | "dark")));
  bind("textSize", (el) => update((st) => (st.settings.textSize = el.value as "normal" | "large" | "larger")));
  bind("timed", (el) => update((st) => (st.settings.timed = el.checked)));
  bind("strict", (el) => update((st) => (st.settings.strict = el.checked)));
  bind("hints", (el) => update((st) => (st.settings.hints = el.checked)));
  app.querySelectorAll<HTMLButtonElement>("[data-goal]").forEach((b) =>
    b.addEventListener("click", () => {
      update((st) => {
        st.settings.target = +b.dataset.goal!;
        st.settings.goalSet = true;
      });
      settings();
    }),
  );
  document.getElementById("export")!.addEventListener("click", async () => {
    const name = `freeasvab-backup-${new Date().toISOString().slice(0, 10)}.json`;
    if (isNative) {
      try {
        await shareBackup(name, exportBackup());
      } catch {
        await notice("The backup could not be shared", "Try again, or free up some storage on this device.");
      }
      return;
    }
    const blob = new Blob([exportBackup()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  document.getElementById("import")!.addEventListener("change", async (e) => {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    input.value = "";
    if (!f) return;
    const ok = await ask({ title: "Restore this backup?", body: "The results on this device will be replaced by the ones in the file.", ok: "Restore", cancel: "Cancel", danger: true });
    if (!ok) return;
    try {
      importBackup(await f.text());
      applySettings();
      await notice("Backup restored", "Your results and settings are back.");
      settings();
    } catch (err) {
      await notice("That file could not be restored", err instanceof Error && err.message.includes("FreeASVAB") ? err.message : "It does not look like a FreeASVAB backup file.");
    }
  });
  document.getElementById("reset")!.addEventListener("click", async () => {
    const ok = await ask({ title: "Erase all your results?", body: "Every test result, practice history and setting on this device will be deleted. This cannot be undone.", ok: "Erase everything", cancel: "Cancel", danger: true });
    if (!ok) return;
    resetAll();
    applySettings();
    location.hash = "#/";
  });
}

export function about() {
  page(
    "settings",
    `<a class="back" href="#/settings">${icon("back")}Settings</a>
    <article class="lesson">
      <h1>About FreeASVAB</h1>
      <p>FreeASVAB is a free, open-source practice app for the Armed Services Vocational Aptitude Battery. There are no accounts, ads or payments, and your results never leave your device.</p>
      <h2>How scores are estimated</h2>
      <p>The real computer ASVAB is adaptive: each question is picked based on your earlier answers, and your score comes from official tables built from a 1997 national sample of 18 to 23 year olds. Those tables and question difficulties are not public, so no practice app can give an exact score.</p>
      <p>This app estimates your score in three steps. First it takes your percent correct in each subject, adjusts for lucky guesses on four-choice questions, and turns it into a standard score where 50 is average and each 10 points is one standard deviation. Next it combines your Word Knowledge and Paragraph Comprehension answers into a verbal score (VE). Finally it uses the published AFQT formula, 2 × VE + AR + MK, and converts the result into a percentile from 1 to 99. Army line scores and Air Force composites are built from the same standard scores.</p>
      <p>The likely range shows how much the estimate could move from luck alone: it is wider for short tests and narrows as you answer more questions. Use the estimate to see whether you are improving and which subjects need work. Only the real test gives an official score.</p>
      <h2>Enlistment minimums</h2>
      <p>The branch minimums shown are the published figures for applicants with a high school diploma, with 50 as the common figure for GED holders. Branches change these often and can ask for more, so always confirm with a recruiter.</p>
      <h2>Questions</h2>
      <p>Every question was written for FreeASVAB to match the subjects, style and difficulty of the ASVAB. Real ASVAB questions are kept secure by the Department of Defense and are never published.</p>
      <h2>Open source</h2>
      <p>The app and all its questions are MIT licensed. Source code and the printable study guide: <a href="https://github.com/grangedevgroup-code/FreeASVAB" target="_blank" rel="noopener">github.com/grangedevgroup-code/FreeASVAB</a>. Version ${__APP_VERSION__}.</p>
    </article>
    ${siteFooter()}`,
    "About",
  );
}
