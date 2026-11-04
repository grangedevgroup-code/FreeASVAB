export type Subtest = "GS" | "AR" | "WK" | "PC" | "MK" | "EI" | "AI" | "SI" | "MC" | "AO";
export type Raw = Partial<Record<Subtest, { correct: number; total: number }>>;

export const SUBTEST_NAMES: Record<Subtest | "MF", string> = {
  GS: "General Science",
  AR: "Arithmetic Reasoning",
  WK: "Word Knowledge",
  PC: "Paragraph Comprehension",
  MK: "Mathematics Knowledge",
  EI: "Electronics Information",
  AI: "Auto Information",
  SI: "Shop Information",
  MC: "Mechanical Comprehension",
  AO: "Assembling Objects",
  MF: "Math Basics",
};

export const CAT_ORDER: { subtest: Subtest; count: number; minutes: number }[] = [
  { subtest: "GS", count: 15, minutes: 12 },
  { subtest: "AR", count: 15, minutes: 55 },
  { subtest: "WK", count: 15, minutes: 9 },
  { subtest: "PC", count: 10, minutes: 27 },
  { subtest: "MK", count: 15, minutes: 31 },
  { subtest: "EI", count: 15, minutes: 10 },
  { subtest: "AI", count: 10, minutes: 7 },
  { subtest: "SI", count: 10, minutes: 6 },
  { subtest: "MC", count: 15, minutes: 22 },
  { subtest: "AO", count: 15, minutes: 18 },
];

export const AFQT_SUBTESTS: Subtest[] = ["AR", "WK", "PC", "MK"];

const CHANCE = 0.25;
const INTERCORRELATION = 0.6;

export function normCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}

export function normInv(p: number): number {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const lo = 0.02425;
  if (p < lo) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - lo) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

export function standardScore(correct: number, total: number): number {
  if (total <= 0) return 50;
  const smoothed = (correct + 0.25) / (total + 0.5);
  const known = Math.min(0.995, Math.max(0.005, (smoothed - CHANCE) / (1 - CHANCE)));
  return Math.round(Math.min(80, Math.max(20, 50 + 10 * normInv(known))));
}

function compositeZ(scores: number[], weights: number[]): number {
  const z = scores.reduce((s, x, i) => s + weights[i] * ((x - 50) / 10), 0);
  let variance = 0;
  for (let i = 0; i < weights.length; i++) {
    for (let j = 0; j < weights.length; j++) variance += weights[i] * weights[j] * (i === j ? 1 : INTERCORRELATION);
  }
  return z / Math.sqrt(variance);
}

export function percentile(z: number): number {
  return Math.min(99, Math.max(1, Math.round(normCdf(z) * 100)));
}

export type Scores = {
  standard: Partial<Record<Subtest | "VE" | "AS", number>>;
  afqt: number | null;
  category: string | null;
  army: { code: string; name: string; value: number }[];
  mage: { code: string; name: string; value: number }[];
};

function combine(raw: Raw, keys: Subtest[]) {
  let correct = 0;
  let total = 0;
  for (const k of keys) {
    correct += raw[k]?.correct ?? 0;
    total += raw[k]?.total ?? 0;
  }
  return total ? standardScore(correct, total) : undefined;
}

export function afqtCategory(afqt: number): string {
  if (afqt >= 93) return "I";
  if (afqt >= 65) return "II";
  if (afqt >= 50) return "IIIA";
  if (afqt >= 31) return "IIIB";
  if (afqt >= 21) return "IVA";
  if (afqt >= 16) return "IVB";
  if (afqt >= 10) return "IVC";
  return "V";
}

const ARMY: [string, string, string[]][] = [
  ["GT", "General Technical", ["VE", "AR"]],
  ["CL", "Clerical", ["VE", "AR", "MK"]],
  ["CO", "Combat", ["VE", "AS", "MC"]],
  ["EL", "Electronics", ["GS", "AR", "MK", "EI"]],
  ["FA", "Field Artillery", ["AR", "MK", "MC"]],
  ["GM", "General Maintenance", ["GS", "AS", "MK", "EI"]],
  ["MM", "Mechanical Maintenance", ["AS", "MC", "EI"]],
  ["OF", "Operators and Food", ["VE", "AS", "MC"]],
  ["SC", "Surveillance and Communications", ["VE", "AR", "AS", "MC"]],
  ["ST", "Skilled Technical", ["GS", "VE", "MK", "MC"]],
];

const MAGE: [string, string, string[]][] = [
  ["M", "Mechanical", ["AR", "AS", "MC", "VE"]],
  ["A", "Administrative", ["MK", "VE"]],
  ["G", "General", ["AR", "VE"]],
  ["E", "Electronics", ["AR", "EI", "GS", "MK"]],
];

export function score(raw: Raw): Scores {
  const standard: Scores["standard"] = {};
  for (const k of Object.keys(raw) as Subtest[]) {
    const r = raw[k];
    if (r && r.total > 0) standard[k] = standardScore(r.correct, r.total);
  }
  const ve = combine(raw, ["WK", "PC"]);
  if (ve !== undefined) standard.VE = ve;
  const as = combine(raw, ["AI", "SI"]);
  if (as !== undefined) standard.AS = as;

  let afqt: number | null = null;
  if (standard.VE !== undefined && standard.AR !== undefined && standard.MK !== undefined && raw.WK && raw.PC) {
    afqt = percentile(compositeZ([standard.VE, standard.AR, standard.MK], [2, 1, 1]));
  }

  const have = (keys: string[]) => keys.every((k) => standard[k as keyof Scores["standard"]] !== undefined);
  const vals = (keys: string[]) => keys.map((k) => standard[k as keyof Scores["standard"]] as number);
  const ones = (n: number) => Array(n).fill(1);
  const army = ARMY.filter(([, , k]) => have(k)).map(([code, name, k]) => ({
    code,
    name,
    value: Math.round(100 + 20 * compositeZ(vals(k), ones(k.length))),
  }));
  const mage = MAGE.filter(([, , k]) => have(k)).map(([code, name, k]) => ({
    code,
    name,
    value: percentile(compositeZ(vals(k), ones(k.length))),
  }));
  return { standard, afqt, category: afqt === null ? null : afqtCategory(afqt), army, mage };
}

export function afqtRange(raw: Raw): { low: number; high: number } | null {
  const shift = (dir: 1 | -1): Raw => {
    const out: Raw = {};
    for (const k of Object.keys(raw) as Subtest[]) {
      const r = raw[k];
      if (!r || r.total <= 0) continue;
      const p = (r.correct + 0.5) / (r.total + 1);
      const sd = Math.sqrt(r.total * p * (1 - p));
      out[k] = { correct: Math.min(r.total, Math.max(0, r.correct + dir * sd)), total: r.total };
    }
    return out;
  };
  const low = score(shift(-1)).afqt;
  const high = score(shift(1)).afqt;
  if (low === null || high === null) return null;
  return { low, high };
}

export const AFQT_BANDS: { label: string; from: number; to: number }[] = [
  { label: "Below 31", from: 1, to: 30 },
  { label: "IIIB", from: 31, to: 49 },
  { label: "IIIA", from: 50, to: 64 },
  { label: "II", from: 65, to: 92 },
  { label: "I", from: 93, to: 99 },
];

export const BRANCH_MINIMUMS: { branch: string; diploma: number; ged: number; note?: string }[] = [
  { branch: "Army", diploma: 31, ged: 50 },
  { branch: "Navy", diploma: 31, ged: 50 },
  { branch: "Air Force", diploma: 31, ged: 50, note: "65 with neither a diploma nor a GED" },
  { branch: "Space Force", diploma: 36, ged: 50, note: "published figures vary between 31 and 36" },
  { branch: "Marine Corps", diploma: 31, ged: 50 },
  { branch: "Coast Guard", diploma: 32, ged: 50 },
];
