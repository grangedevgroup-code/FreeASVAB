import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { Marked } from "marked";

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = resolve(APP, "..");
const SRC = join(ROOT, "src");
const FIGS = join(ROOT, "figs");
const OUT = join(APP, "public", "content");

const SUBTESTS = ["GS", "AR", "WK", "PC", "MK", "EI", "AI", "SI", "MC", "AO"];
const LEARN_SKIP = new Set(["00-intro.md", "04-plan.md", "16-pt1.md", "17-pt2.md", "18-pt3.md"]);
const LESSON_SUBTEST = { "05": "WK", "06": "PC", "07": "MF", "08": "AR", "09": "MK", "10": "GS", "11": "EI", "12": "AI", "13": "SI", "14": "MC", "15": "AO" };

function lessonGroup(file) {
  const n = +file.slice(0, 2);
  if (n <= 3) return "start";
  if (n <= 9) return "afqt";
  if (n <= 15) return "career";
  return "reference";
}
const BOX_LABEL = {
  key: "Key Idea",
  tip: "Tip",
  trap: "Watch Out",
  example: "Example",
  memory: "Memory Trick",
  formula: "Formulas",
  note: "Note",
  strategy: "Strategy",
  check: "Quick Check",
};

const marked = new Marked({ gfm: true, breaks: true });
const problems = [];
let figCount = 0;

const SUP_BRACE = /\^\{([^{}]*)\}/g;
const SUP_PLAIN = /\^([−-]?\d+(?:\.\d+)?|[a-zA-Z])/g;
const SUB_BRACE = /~\{([^{}]*)\}/g;
const FRAC = /\[\[([^\[\]|/]+?)\/([^\[\]|]+?)\]\]/g;

function fracs(text) {
  return text
    .replace(FRAC, (_, n, d) => `<span class="frac"><span class="fn">${n.trim()}</span><span class="fd">${d.trim()}</span></span>`)
    .replace(SUP_BRACE, "<sup>$1</sup>")
    .replace(SUP_PLAIN, "<sup>$1</sup>")
    .replace(SUB_BRACE, "<sub>$1</sub>");
}

function svg(name) {
  const p = join(FIGS, `${name}.svg`);
  if (!existsSync(p)) {
    problems.push(`missing figure: ${name}`);
    return `<span class="missing">[missing figure ${name}]</span>`;
  }
  let s = readFileSync(p, "utf8").replace(/<\?xml.*?\?>/s, "").trim();
  const k = `f${++figCount}`;
  for (const id of new Set([...s.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]))) {
    s = s.replaceAll(`id="${id}"`, `id="${k}${id}"`).replaceAll(`url(#${id})`, `url(#${k}${id})`).replaceAll(`href="#${id}"`, `href="#${k}${id}"`);
  }
  return s.replace("<svg ", '<svg role="img" aria-label="figure" ');
}

function figs(html) {
  html = html.replace(/<p>\s*\{\{fig:([^}|]+)(?:\|([^}]*))?\}\}\s*<\/p>/g, (_, n, cap) => {
    const c = cap ? `<figcaption>${cap.trim()}</figcaption>` : "";
    return `<figure class="fig">${svg(n.trim())}${c}</figure>`;
  });
  return html.replace(/\{\{fig:([^}|]+)(?:\|([^}]*))?\}\}/g, (_, n) => `<span class="figi">${svg(n.trim())}</span>`);
}

function md(text) {
  return figs(marked.parse(fracs(text)));
}

function mdInline(text) {
  const h = md(text).trim();
  const m = h.match(/^<p>([\s\S]*?)<\/p>$/);
  return m && !m[1].includes("<p>") ? m[1] : h;
}

function include(text, base) {
  return text.replace(/^\{\{include:(.+?)\}\}[ \t]*$/gm, (_, f) => {
    const p = join(base, f.trim());
    if (!existsSync(p)) {
      problems.push(`missing include ${p}`);
      return "";
    }
    return include(readFileSync(p, "utf8"), dirname(p));
  });
}

function evalCheck(expr) {
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
  const env = {
    gcd,
    lcm: (a, b) => Math.abs(a * b) / gcd(a, b),
    factorial,
    comb: (n, k) => factorial(n) / (factorial(k) * factorial(n - k)),
    perm: (n, k) => factorial(n) / factorial(n - k),
    sum: (xs) => xs.reduce((a, b) => a + b, 0),
    sqrt: Math.sqrt,
    pi: Math.PI,
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round,
    abs: Math.abs,
    min: Math.min,
    max: Math.max,
    log10: Math.log10,
    exp: Math.exp,
  };
  return Function(...Object.keys(env), `"use strict"; return (${expr});`)(...Object.values(env));
}

function numberOf(text) {
  let t = fracs(text).replace(/<span class="frac"><span class="fn">(.*?)<\/span><span class="fd">(.*?)<\/span><\/span>/g, " $1/$2");
  t = t.replace(/<[^>]+>/g, " ").replace(/−/g, "-").replace(/,/g, "").replace(/-\s+(\d)/g, "-$1");
  let m = t.match(/(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)/);
  if (m) {
    const v = +m[2] + +m[3] / +m[4];
    return m[1] ? -v : v;
  }
  m = t.match(/(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (m) return +m[1] / +m[2];
  m = t.match(/-?\d*\.?\d+/);
  return m ? +m[0] : null;
}

function subtestOf(id) {
  const k = id.replace(/^pt\d-/, "").replace(/\d+$/, "").toUpperCase();
  if (SUBTESTS.includes(k)) return k;
  if (k === "MF") return "MF";
  problems.push(`unknown subtest for quiz ${id}`);
  return k;
}

function sourceName(id, title, chapter) {
  const pt = id.match(/^pt(\d)-/);
  if (pt) return `Practice Test ${pt[1]}`;
  const set = title.match(/Practice Set(?: (\d+))?/);
  return set ? `${chapter} – Set ${set[1] || 1}` : chapter;
}

function parseQuiz(header, body, chapter) {
  const parts = header.split("|").map((p) => p.trim());
  const id = parts[0];
  const title = parts[1] || id;
  const opts = Object.fromEntries(parts.slice(2).filter((p) => p.includes("=")).map((p) => p.split("=").map((x) => x.trim())));
  const quiz = { id, title, group: opts.group || "now", time: opts.time || null, instr: null, items: [] };
  let cur = null;
  let passage = null;
  for (const raw of body.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    if (passage) {
      if (line.trim() === "[[/passage]]") {
        quiz.items.push({ kind: "passage", text: passage.join("\n") });
        passage = null;
      } else passage.push(line);
      continue;
    }
    if (line.trim().startsWith("[[passage")) {
      passage = [];
      const t = line.match(/\[\[passage\s*(.*?)\]\]/);
      if (t && t[1]) passage.push(`**${t[1]}**\n`);
      cur = null;
      continue;
    }
    if (line.startsWith("@instr:")) {
      quiz.instr = line.slice(7).trim();
      continue;
    }
    if (line.startsWith("@time:")) {
      quiz.time = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("? ")) {
      cur = { text: [line.slice(2)], choices: [], correct: [], expl: [], check: null };
      quiz.items.push({ kind: "q", q: cur });
      continue;
    }
    if (!cur) {
      if (line.trim()) problems.push(`${id}: stray line outside question: ${line.slice(0, 60)}`);
      continue;
    }
    if (line.startsWith("- ")) {
      let c = line.slice(2).replace(/\s+$/, "");
      if (c.endsWith(" *")) {
        cur.correct.push(cur.choices.length);
        c = c.slice(0, -2).replace(/\s+$/, "");
      }
      cur.choices.push(c);
      continue;
    }
    if (line.startsWith(">")) {
      cur.expl.push(line.slice(1).trim());
      continue;
    }
    if (line.startsWith("= ")) {
      cur.check = line.slice(2).trim();
      continue;
    }
    if (cur.choices.length) {
      if (line.trim()) problems.push(`${id}: unexpected line after choices: ${line.slice(0, 60)}`);
      continue;
    }
    cur.text.push(line);
  }
  validate(quiz);
  quiz.chapter = chapter;
  return quiz;
}

function validate(quiz) {
  let n = 0;
  for (const it of quiz.items) {
    if (it.kind !== "q") continue;
    const q = it.q;
    const where = `${quiz.id} Q${++n}`;
    if (q.choices.length !== 4) problems.push(`${where}: ${q.choices.length} choices`);
    if (q.correct.length !== 1) {
      problems.push(`${where}: ${q.correct.length} correct answers marked`);
      continue;
    }
    if (new Set(q.choices.map((c) => c.trim().toLowerCase())).size !== q.choices.length) problems.push(`${where}: duplicate choices`);
    if (!q.expl.length) problems.push(`${where}: no explanation`);
    if (q.check) {
      let [expr, tol] = q.check.includes(" ~ ") ? q.check.split(" ~ ") : [q.check, "1e-6"];
      tol = +tol;
      let val;
      try {
        val = evalCheck(expr);
      } catch (e) {
        problems.push(`${where}: check error ${e.message}: ${expr}`);
        continue;
      }
      const near = (x) => x !== null && Math.abs(val - x) <= tol * Math.max(1, Math.abs(val));
      if (!near(numberOf(q.choices[q.correct[0]]))) problems.push(`${where}: CHECK FAILED ${expr} -> ${val} vs '${q.choices[q.correct[0]]}'`);
      q.choices.forEach((c, i) => {
        if (i !== q.correct[0] && near(numberOf(c))) problems.push(`${where}: a distractor also equals the checked value`);
      });
    }
  }
}

function questionText(lines) {
  return md(lines.join("\n").trim().replace(/(\{\{fig:[^}]+\}\})[ \t]*\n(?!\n)/g, "$1\n\n"));
}

function headingInfo(line) {
  const m = line.match(/^#\s+(.*?)\s*(\{[^}]*\})?\s*$/);
  const attrs = m[2] || "";
  const sub = attrs.match(/data-sub="([^"]*)"/);
  const label = attrs.match(/data-label="([^"]*)"/);
  return { title: m[1], sub: sub ? sub[1] : "", label: label ? label[1] : "" };
}

function slug(s) {
  return s.toLowerCase().replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function stripTags(html) {
  let text = html;
  let prev;
  do {
    prev = text;
    text = text.replace(/<[^<>]*>/g, "");
  } while (text !== prev);
  return text.replace(/[<>]/g, "");
}

function headingText(html) {
  return stripTags(html).replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim();
}

function boxes(text) {
  return text.replace(/^(:{3,})[ \t]*([\w-]+)[ \t]*(.*?)\n([\s\S]*?)^\1[ \t]*$/gm, (_, colons, kind, title, body) => {
    const inner = md(boxes(body));
    if (kind === "div") return `\n\n<div class="${title.trim()}">${inner}</div>\n\n`;
    const label = title.trim() || BOX_LABEL[kind] || kind;
    return `\n\n<div class="box ${kind}"><div class="box-title">${mdInline(label)}</div>${inner}</div>\n\n`;
  });
}

function chapterHtml(body, quizIds, chapterLinks) {
  let t = body;
  t = t.replace(/ ?Answers and explanations are at the end of (the|this) chapter\./g, "");
  t = t.replace(/\bin this book\b/g, "in this app");
  t = t.replace(/(^|[(.!?]\s*|\s)Chapter (\d+)/gm, (all, pre, n, offset, whole) => {
    const target = chapterLinks.get(n.padStart(2, "0"));
    if (!target) return all;
    const close = whole.indexOf(")", offset);
    const parenSentence = pre.endsWith("(") && close !== -1 && /[.!?]$/.test(whole.slice(offset + all.length, close).trim());
    const cap = pre === "" || /[.!?]\s*$/.test(pre) || parenSentence;
    return `${pre}[${cap ? "The" : "the"} ${target.title} lesson](#/learn/${target.id})`;
  });
  t = t.replace(/^::: quiz (.+?)\n[\s\S]*?^:::[ \t]*$/gm, (_, header) => {
    const parts = header.split("|").map((p) => p.trim());
    const id = parts[0];
    const title = parts[1] || id;
    const count = quizIds.get(id) || 0;
    return `\n\n<div class="practice-link" data-quiz="${id}"><div><strong>${mdInline(title)}</strong><span>${count} questions</span></div><a class="btn" href="#/practice/set/${id}">Practice now</a></div>\n\n`;
  });
  t = t.replace(/^\{\{(pagebreak|answerkeys:.*?|part:.*?)\}\}[ \t]*$/gm, "");
  t = t.replace(/^#{2,}\s.*\{#pt\d-answers\}.*$/gm, "");
  t = t.replace(/^\{\.[\w -]+\}[ \t]*$/gm, "");
  t = t.replace(/\{\{blank\}\}/g, '<span class="blank"></span>');
  t = t.replace(/^(#{2,6}\s.*?)\s*\{[^}]*\}\s*$/gm, "$1");
  t = boxes(t);
  let h = md(t);
  h = h.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, "</table></div>");
  const toc = [];
  const used = new Set();
  h = h.replace(/<h2>([\s\S]*?)<\/h2>/g, (_, inner) => {
    const text = inner.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
    let id = `s-${slug(text) || "section"}`;
    while (used.has(id)) id += "-2";
    used.add(id);
    toc.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html: h, toc };
}

function main() {
  const BANK = join(SRC, "_bank");
  const bankFiles = existsSync(BANK) ? readdirSync(BANK).filter((f) => f.endsWith(".md")).sort().map((f) => `_bank/${f}`) : [];
  bankFiles.forEach((f) => LEARN_SKIP.add(f));
  const files = [...readdirSync(SRC).filter((f) => f.endsWith(".md") && !f.startsWith("_")).sort(), ...bankFiles];
  const quizzes = [];
  const chapters = [];
  for (const f of files) {
    const text = include(readFileSync(join(SRC, f), "utf8"), SRC).replace(/\r\n/g, "\n");
    const firstHead = text.split("\n").find((l) => l.startsWith("# "));
    const chapterTitle = firstHead ? headingInfo(firstHead).title : f;
    for (const m of text.matchAll(/^::: quiz (.+?)\n([\s\S]*?)^:::[ \t]*$/gm)) quizzes.push(parseQuiz(m[1], m[2], chapterTitle));
    if (LEARN_SKIP.has(f)) continue;
    const sections = text.split(/^(?=# )/m).filter((s) => s.startsWith("# "));
    for (const sec of sections) {
      const [head, ...rest] = sec.split("\n");
      const info = headingInfo(head);
      chapters.push({ file: f, ...info, body: rest.join("\n") });
    }
  }

  const passages = {};
  const questions = [];
  const sets = [];
  const aliases = {};
  for (const z of quizzes) {
    const subtest = subtestOf(z.id);
    const source = sourceName(z.id, z.title, z.chapter);
    let pid = null;
    let n = 0;
    const ids = [];
    for (const it of z.items) {
      if (it.kind === "passage") {
        pid = `${z.id}-p${Object.keys(passages).length}`;
        passages[pid] = md(it.text);
        continue;
      }
      const q = it.q;
      const legacy = `${z.id}-${++n}`;
      const fingerprint = q.text.join("\n").trim() + "\u0000" + q.choices.join("\u0001");
      const id = `${z.id}-${createHash("sha256").update(fingerprint).digest("hex").slice(0, 8)}`;
      if (ids.includes(id)) problems.push(`${z.id}: two questions have the same text and choices (${legacy})`);
      aliases[legacy] = id;
      ids.push(id);
      const entry = {
        id,
        subtest,
        source,
        text: questionText(q.text),
        choices: q.choices.map((c) => mdInline(c)),
        answer: q.correct[0],
        explain: md(q.expl.join("\n")),
      };
      if (z.instr) entry.instr = mdInline(z.instr);
      if (pid && subtest === "PC") entry.passage = pid;
      if (q.choices.some((c) => c.includes("{{fig:"))) entry.figChoices = true;
      questions.push(entry);
    }
    sets.push({ id: z.id, title: z.title.replace(/^Part \d+ – /, ""), subtest, source, time: z.time, count: ids.length, ids });
  }

  const quizCounts = new Map(sets.map((s) => [s.id, s.count]));
  const learn = chapters.map((c) => ({
    id: slug(c.title),
    title: c.title,
    sub: c.sub,
    group: lessonGroup(c.file),
    subtest: LESSON_SUBTEST[c.file.slice(0, 2)] ?? null,
    file: c.file,
  }));
  const chapterLinks = new Map();
  for (const l of learn) if (!chapterLinks.has(l.file.slice(0, 2))) chapterLinks.set(l.file.slice(0, 2), { id: l.id, title: l.title });
  const ids = new Set();
  for (const c of learn) {
    if (ids.has(c.id)) problems.push(`duplicate chapter id ${c.id}`);
    ids.add(c.id);
  }

  const lessons = chapters.map((c, i) => {
    const { html, toc } = chapterHtml(c.body, quizCounts, chapterLinks);
    if (/\bChapter \d+\b/.test(html.replace(/<[^>]+>/g, ""))) problems.push(`${c.file}: unresolved chapter reference`);
    const { file, ...meta } = learn[i];
    return { ...meta, html, toc };
  });
  if (problems.length) {
    console.error(`Content problems (${problems.length}):\n` + problems.map((p) => `  ${p}`).join("\n"));
    process.exit(1);
  }

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(join(OUT, "learn"), { recursive: true });
  const bank = JSON.stringify({ questions, passages, sets, aliases });
  const version = createHash("sha256").update(bank).digest("hex").slice(0, 12);
  writeFileSync(join(OUT, "bank.json"), bank);
  for (const l of lessons) writeFileSync(join(OUT, "learn", `${l.id}.json`), JSON.stringify(l));
  writeFileSync(join(OUT, "index.json"), JSON.stringify({ version, questionCount: questions.length, learn: learn.map(({ file, ...l }) => l) }));
  const by = {};
  for (const q of questions) by[q.subtest] = (by[q.subtest] || 0) + 1;
  console.log(`content ${version}: ${questions.length} questions, ${sets.length} sets, ${learn.length} lessons`, by);
}

main();
