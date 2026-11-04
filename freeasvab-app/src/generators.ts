export type Question = {
  id: string;
  subtest: string;
  source: string;
  text: string;
  choices: string[];
  answer: number;
  explain: string;
  instr?: string;
  passage?: string;
  figChoices?: boolean;
};

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type R = () => number;
const int = (r: R, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
const pick = <T>(r: R, xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
const money = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
const num = (n: number) => (Number.isInteger(n) ? n.toLocaleString("en-US") : String(+n.toFixed(2)));
const round2 = (n: number) => Math.round(n * 100) / 100;

type Made = { text: string; answer: number; wrong: number[]; explain: string; fmt?: (n: number) => string };

function build(r: R, made: Made): { choices: string[]; answer: number } {
  const fmt = made.fmt ?? num;
  const seen = new Set([fmt(made.answer)]);
  const wrong: string[] = [];
  const candidates = [...made.wrong];
  for (let k = 1; candidates.length < 12; k++) {
    const step = Math.max(1, Math.round(Math.abs(made.answer) * 0.1));
    candidates.push(made.answer + k * step, made.answer - k * step);
  }
  for (const w of candidates) {
    const f = fmt(round2(w));
    if (wrong.length < 3 && !seen.has(f) && !(w < 0 && made.answer >= 0)) {
      seen.add(f);
      wrong.push(f);
    }
  }
  const choices = [fmt(made.answer), ...wrong];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return { choices, answer: choices.indexOf(fmt(made.answer)) };
}

const NAMES = ["Alex", "Jordan", "Sam", "Taylor", "Chris", "Morgan", "Riley", "Casey", "Jamie", "Avery"];

const AR: ((r: R) => Made)[] = [
  (r) => {
    const rate = pick(r, [12.5, 14, 15.25, 16, 17.5, 18, 19.5, 21, 22.75, 24]);
    const hours = int(r, 18, 45);
    const pay = rate * hours;
    return {
      text: `${pick(r, NAMES)} earns ${money(rate)} per hour and works ${hours} hours this week. How much does ${pick(r, ["they", "this worker"])} earn?`,
      answer: pay,
      wrong: [pay + rate, pay - rate, rate * (hours - 10) + 10],
      explain: `Multiply the hourly rate by the hours: ${money(rate)} × ${hours} = **${money(pay)}**.`,
      fmt: money,
    };
  },
  (r) => {
    const price = int(r, 4, 30) * 5;
    const pct = pick(r, [10, 15, 20, 25, 30, 40]);
    const sale = price * (1 - pct / 100);
    return {
      text: `A jacket costs ${money(price)}. It is on sale for ${pct}% off. What is the sale price?`,
      answer: sale,
      wrong: [price * (pct / 100), price - pct, price * (1 + pct / 100)],
      explain: `${pct}% of ${money(price)} is ${money(price * pct / 100)}. Subtract it: ${money(price)} − ${money(price * pct / 100)} = **${money(sale)}**.`,
      fmt: money,
    };
  },
  (r) => {
    const speed = int(r, 4, 14) * 5;
    const hours = pick(r, [1.5, 2, 2.5, 3, 3.5, 4, 5, 6]);
    const d = speed * hours;
    return {
      text: `A convoy travels at ${speed} miles per hour for ${num(hours)} hours. How far does it travel?`,
      answer: d,
      wrong: [speed + hours, d + speed, d - speed / 2],
      explain: `Distance = rate × time = ${speed} × ${num(hours)} = **${num(d)} miles**.`,
      fmt: (n) => `${num(n)} miles`,
    };
  },
  (r) => {
    const scores = [int(r, 70, 95), int(r, 70, 95), int(r, 70, 95)];
    const target = int(r, 80, 90);
    const need = target * 4 - scores.reduce((a, b) => a + b, 0);
    if (need < 60 || need > 100) return AR[3](r);
    return {
      text: `A student scored ${scores.join(", ")} on three tests. What score is needed on the fourth test for an average of exactly ${target}?`,
      answer: need,
      wrong: [target, Math.round((scores.reduce((a, b) => a + b, 0) + target) / 4), need + 4],
      explain: `An average of ${target} over 4 tests needs a total of ${target} × 4 = ${target * 4}. The first three add to ${scores.reduce((a, b) => a + b, 0)}, so the fourth must be ${target * 4} − ${scores.reduce((a, b) => a + b, 0)} = **${need}**.`,
    };
  },
  (r) => {
    const a = int(r, 1, 5);
    const b = int(r, 2, 7);
    if (a === b) return AR[4](r);
    const unit = int(r, 3, 15);
    const total = (a + b) * unit;
    return {
      text: `${total} supply crates are split between two units in the ratio ${a}:${b}. How many crates does the second unit get?`,
      answer: b * unit,
      wrong: [a * unit, total / 2, total - a],
      explain: `The ratio has ${a} + ${b} = ${a + b} parts, so each part is ${total} ÷ ${a + b} = ${unit}. The second unit gets ${b} × ${unit} = **${b * unit}**.`,
    };
  },
  (r) => {
    const p = int(r, 4, 40) * 100;
    const rate = pick(r, [2, 3, 4, 5, 6, 8]);
    const years = int(r, 2, 5);
    const i = (p * rate * years) / 100;
    return {
      text: `How much simple interest does ${money(p)} earn at ${rate}% per year for ${years} years?`,
      answer: i,
      wrong: [(p * rate) / 100, i + p, (p * rate * (years + 1)) / 100],
      explain: `Interest = principal × rate × time = ${money(p)} × ${rate / 100} × ${years} = **${money(i)}**.`,
      fmt: money,
    };
  },
  (r) => {
    const [x, y, t] = pick(r, [
      [3, 6, 2],
      [4, 12, 3],
      [6, 12, 4],
      [10, 15, 6],
      [12, 24, 8],
      [20, 30, 12],
      [6, 3, 2],
      [12, 6, 4],
    ] as const);
    return {
      text: `One crew can paint a barracks in ${x} hours. Another crew can do it in ${y} hours. How many hours will it take if they work together?`,
      answer: t,
      wrong: [(x + y) / 2, x + y, Math.min(x, y) - 1 > 0 ? Math.min(x, y) - 1 : t + 1],
      explain: `Together they finish 1/${x} + 1/${y} of the job per hour, which is 1/${t}. So the job takes **${t} hours**. Shortcut: (${x} × ${y}) ÷ (${x} + ${y}) = ${t}.`,
      fmt: (n) => `${num(n)} hours`,
    };
  },
  (r) => {
    const old = int(r, 4, 20) * 10;
    const pct = pick(r, [10, 20, 25, 30, 50]);
    const now = old * (1 + pct / 100);
    return {
      text: `A unit had ${old} members last year and ${num(now)} this year. By what percent did it grow?`,
      answer: pct,
      wrong: [now - old, Math.round(((now - old) / now) * 100), pct * 2],
      explain: `Growth is ${num(now)} − ${old} = ${num(now - old)}. Divide by the starting amount: ${num(now - old)} ÷ ${old} = ${pct / 100}, which is **${pct}%**.`,
      fmt: (n) => `${num(n)}%`,
    };
  },
  (r) => {
    const items = pick(r, [6, 8, 10, 12, 15, 20, 24]);
    const each = pick(r, [0.75, 1.25, 1.5, 2.25, 3.5, 4.25]);
    const total = items * each;
    return {
      text: `${items} batteries cost ${money(total)}. How much does one battery cost?`,
      answer: each,
      wrong: [each + 0.25, each * 2, total - items].filter((w) => w > 0),
      explain: `Divide the total by the number of items: ${money(total)} ÷ ${items} = **${money(each)}**.`,
      fmt: money,
    };
  },
  (r) => {
    const total = int(r, 4, 12) * 12;
    const f1 = pick(r, [
      [1, 3],
      [1, 4],
      [1, 2],
      [1, 6],
    ] as const);
    const spent1 = (total * f1[0]) / f1[1];
    const left1 = total - spent1;
    const spent2 = left1 / 2;
    const left = left1 - spent2;
    return {
      text: `${pick(r, NAMES)} has ${money(total)}. They spend ${f1[0]}/${f1[1]} of it on gas, then half of what is left on food. How much money is left?`,
      answer: left,
      wrong: [total - spent1 - total / 2, spent1, left1],
      explain: `${f1[0]}/${f1[1]} of ${money(total)} is ${money(spent1)}, leaving ${money(left1)}. Half of that is ${money(spent2)}, leaving **${money(left)}**.`,
      fmt: money,
    };
  },
];

const MK: ((r: R) => Made)[] = [
  (r) => {
    const x = int(r, -9, 12);
    const a = pick(r, [2, 3, 4, 5, 6, 7]);
    const b = int(r, -15, 20);
    const c = a * x + b;
    const sign = b < 0 ? `− ${-b}` : `+ ${b}`;
    return {
      text: `Solve for *x*: ${a}*x* ${sign} = ${c}`,
      answer: x,
      wrong: [(c + b) / a, c - b, -x === x ? x + 2 : -x].map((w) => Math.round(w)),
      explain: `Subtract ${b} from both sides: ${a}*x* = ${c - b}. Divide by ${a}: *x* = **${x}**.`,
      fmt: (n) => (n < 0 ? `−${-n}` : String(n)),
    };
  },
  (r) => {
    const x = int(r, -4, 5);
    const a = int(r, 1, 4);
    const b = int(r, -6, 6);
    const c = int(r, -9, 9);
    const v = a * x * x + b * x + c;
    const term = (k: number, s: string, first = false) => (k === 0 ? "" : `${k < 0 ? (first ? "−" : " − ") : first ? "" : " + "}${Math.abs(k) === 1 && s ? "" : Math.abs(k)}${s}`);
    return {
      text: `If *x* = ${x < 0 ? "−" + -x : x}, what is the value of ${term(a, "*x*^2", true)}${term(b, "*x*")}${term(c, "")}?`,
      answer: v,
      wrong: [a * 2 * x + b * x + c, -a * x * x + b * x + c, a * x * x - b * x + c],
      explain: `Substitute: ${a} × (${x})² + ${b} × (${x}) + ${c} = ${a * x * x} + ${b * x} + ${c} = **${v}**. Remember that a negative number squared is positive.`,
      fmt: (n) => (n < 0 ? `−${-n}` : String(n)),
    };
  },
  (r) => {
    const [a, b, c] = pick(r, [
      [3, 4, 5],
      [5, 12, 13],
      [6, 8, 10],
      [8, 15, 17],
      [9, 12, 15],
      [7, 24, 25],
      [12, 16, 20],
    ] as const);
    return {
      text: `A right triangle has legs of ${a} and ${b}. How long is the hypotenuse?`,
      answer: c,
      wrong: [a + b, c + 1, Math.abs(b - a) + c / 2].map((w) => Math.round(w)),
      explain: `Use *a*^2 + *b*^2 = *c*^2: ${a * a} + ${b * b} = ${c * c}, and the square root of ${c * c} is **${c}**.`,
    };
  },
  (r) => {
    const l = int(r, 3, 15);
    const w = int(r, 2, 12);
    const shape = pick(r, ["rectangle", "triangle"] as const);
    const area = shape === "rectangle" ? l * w : (l * w) / 2;
    return {
      text:
        shape === "rectangle"
          ? `What is the area of a rectangle that is ${l} feet long and ${w} feet wide?`
          : `What is the area of a triangle with a base of ${l} inches and a height of ${w} inches?`,
      answer: area,
      wrong: shape === "rectangle" ? [2 * (l + w), l + w, l * w * 2] : [l * w, l + w, (l * w) / 4],
      explain:
        shape === "rectangle"
          ? `Area = length × width = ${l} × ${w} = **${area} square feet**.`
          : `Area = ½ × base × height = ½ × ${l} × ${w} = **${num(area)} square inches**.`,
      fmt: (n) => `${num(n)} sq ${shape === "rectangle" ? "ft" : "in"}`,
    };
  },
  (r) => {
    const rad = int(r, 2, 10);
    const ask = pick(r, ["area", "circumference"] as const);
    const k = ask === "area" ? rad * rad : 2 * rad;
    return {
      text: `What is the ${ask} of a circle with a radius of ${rad}?`,
      answer: k,
      wrong: ask === "area" ? [2 * rad, rad, 4 * rad * rad] : [rad * rad, rad, 4 * rad],
      explain:
        ask === "area"
          ? `Area = π*r*^2 = π × ${rad}^2 = **${k}π**.`
          : `Circumference = 2π*r* = 2 × π × ${rad} = **${k}π**.`,
      fmt: (n) => `${num(n)}π`,
    };
  },
  (r) => {
    const a = int(r, 2, 9);
    const b = int(r, 2, 9);
    const op = pick(r, ["mul", "div", "pow"] as const);
    const ans = op === "mul" ? a + b : op === "div" ? a + b - b : a * b;
    const text =
      op === "mul"
        ? `Simplify: *x*^${a} · *x*^${b}`
        : op === "div"
          ? `Simplify: *x*^{${a + b}} ÷ *x*^${b}`
          : `Simplify: (*x*^${a})^${b}`;
    const wrong = op === "mul" ? [a * b, a + b + 1, Math.abs(a - b) || a + 1] : op === "div" ? [(a + b) * b, a + b, a + 1] : [a + b, a * b + 1, a * b - 1];
    return {
      text,
      answer: ans,
      wrong,
      explain:
        op === "mul"
          ? `When you multiply powers with the same base, add the exponents: ${a} + ${b} = ${a + b}, so the answer is ***x*^${a + b}**.`
          : op === "div"
            ? `When you divide powers with the same base, subtract the exponents: ${a + b} − ${b} = ${a}, so the answer is ***x*^${a}**.`
            : `A power raised to a power multiplies the exponents: ${a} × ${b} = ${a * b}, so the answer is ***x*^{${a * b}}**.`,
      fmt: (n) => `*x*^{${n}}`,
    };
  },
  (r) => {
    const x1 = int(r, -5, 5);
    const y1 = int(r, -5, 5);
    const m = pick(r, [-3, -2, -1, 1, 2, 3, 4]);
    const dx = int(r, 1, 4);
    const x2 = x1 + dx;
    const y2 = y1 + m * dx;
    const p = (a: number, b: number) => `(${a < 0 ? "−" + -a : a}, ${b < 0 ? "−" + -b : b})`;
    return {
      text: `What is the slope of the line through the points ${p(x1, y1)} and ${p(x2, y2)}?`,
      answer: m,
      wrong: [-m, m === 1 || m === -1 ? m * 2 : 1 / m, dx === 1 ? m + 1 : dx / (m * dx)].map((w) => round2(w)),
      explain: `Slope = (change in *y*) ÷ (change in *x*) = (${y2} − ${y1 < 0 ? `(${y1})` : y1}) ÷ (${x2} − ${x1 < 0 ? `(${x1})` : x1}) = ${m * dx} ÷ ${dx} = **${m}**.`,
      fmt: (n) => (n < 0 ? `−${num(-n)}` : num(n)),
    };
  },
  (r) => {
    const a = int(r, 25, 80);
    const b = int(r, 30, 95);
    if (a + b >= 170) return MK[7](r);
    const c = 180 - a - b;
    return {
      text: `Two angles of a triangle measure ${a}° and ${b}°. What is the measure of the third angle?`,
      answer: c,
      wrong: [360 - a - b, 90 - a > 0 ? 90 - a : c + 10, a + b],
      explain: `The angles of a triangle add to 180°: 180 − ${a} − ${b} = **${c}°**.`,
      fmt: (n) => `${n}°`,
    };
  },
  (r) => {
    const a = int(r, 1, 9);
    const b = int(r, 1, 9);
    const s = pick(r, [1, -1]);
    const bb = s * b;
    if (bb === -a) return MK[8](r);
    const mid = a + bb;
    const end = a * bb;
    const t = (n: number) => (n < 0 ? `− ${-n}` : `+ ${n}`);
    return {
      text: `Multiply: (*x* + ${a})(*x* ${t(bb)})`,
      answer: 0,
      wrong: [],
      explain: `Use FOIL: *x*^2 + ${bb}*x* + ${a}*x* ${t(end)} = ***x*^2 ${t(mid)}*x* ${t(end)}**.`,
    };
  },
  (r) => {
    const n = int(r, 4, 25);
    return {
      text: `What is the square root of ${n * n}?`,
      answer: n,
      wrong: [(n * n) / 2, n + 1, n - 1],
      explain: `${n} × ${n} = ${n * n}, so the square root of ${n * n} is **${n}**.`,
    };
  },
];

function foil(r: R, made: Made): { choices: string[]; answer: number } {
  const m = made.text.match(/\(\*x\* \+ (\d+)\)\(\*x\* ([+−]) (\d+)\)/)!;
  const a = +m[1];
  const b = (m[2] === "−" ? -1 : 1) * +m[3];
  const t = (n: number) => (n < 0 ? `− ${-n}` : `+ ${n}`);
  const opt = (mid: number, end: number) => `*x*^2 ${mid === 0 ? "" : `${t(mid)}*x* `}${t(end)}`.replace(/ {2}/g, " ");
  const right = opt(a + b, a * b);
  const pool = [opt(a * b, a + b), opt(a - b, a * b), opt(a + b, -(a * b)), opt(a + b, a + b), opt(-(a + b), a * b)];
  const choices = [right];
  for (const p of pool) if (!choices.includes(p) && choices.length < 4) choices.push(p);
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return { choices, answer: choices.indexOf(right) };
}

export const GENERATED = { AR: AR.length, MK: MK.length };

export function generatedId(subtest: "AR" | "MK", seed: number) {
  const n = subtest === "AR" ? AR.length : MK.length;
  return `g:${subtest}:${seed % n}:${seed}`;
}

export function generate(id: string): Question | null {
  const m = id.match(/^g:(AR|MK):(\d+):(\d+)$/);
  if (!m) return null;
  const subtest = m[1] as "AR" | "MK";
  const list = subtest === "AR" ? AR : MK;
  const tpl = list[+m[2]];
  if (!tpl) return null;
  const r = rng(+m[3]);
  const made = tpl(r);
  const isFoil = made.text.startsWith("Multiply: (*x*");
  const { choices, answer } = isFoil ? foil(r, made) : build(r, made);
  return {
    id,
    subtest,
    source: "Generated practice",
    text: made.text,
    choices,
    answer,
    explain: made.explain,
  };
}
