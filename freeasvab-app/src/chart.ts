import { AFQT_BANDS } from "./scoring";

export function scoreScale(o: { score: number; low?: number; high?: number; goal: number; min: number; category: string }) {
  const W = 320;
  const pad = 12;
  const w = W - pad * 2;
  const x = (v: number) => pad + ((Math.min(99, Math.max(1, v)) - 1) / 98) * w;
  const bands = AFQT_BANDS.map((b, i) => {
    const x0 = x(b.from - (i === 0 ? 0 : 0.5));
    const x1 = x(b.to + (i === AFQT_BANDS.length - 1 ? 0 : 0.5));
    const last = i === AFQT_BANDS.length - 1;
    const tx = last ? x1 : (x0 + x1) / 2;
    return `<rect class="band b${i}" x="${(x0 + (i ? 1 : 0)).toFixed(1)}" y="26" width="${(x1 - x0 - (i ? 1 : 0) - (last ? 0 : 1)).toFixed(1)}" height="14" rx="${i === 0 || last ? 4 : 0}"><title>${b.label === "Below 31" ? "Below 31" : `Category ${b.label}`}: ${b.from} to ${b.to}</title></rect>
      <text class="sc-muted" x="${tx.toFixed(1)}" y="56" text-anchor="${last ? "end" : "middle"}">${b.label}</text>`;
  }).join("");
  const sx = x(o.score);
  const labelX = Math.min(W - 24, Math.max(24, sx));
  const range =
    o.low !== undefined && o.high !== undefined && o.high > o.low
      ? `<path class="sc-range" d="M${x(o.low).toFixed(1)} 18v4M${x(o.low).toFixed(1)} 20H${x(o.high).toFixed(1)}M${x(o.high).toFixed(1)} 18v4"><title>Likely range ${o.low} to ${o.high}</title></path>`
      : "";
  const summary = `Estimated AFQT ${o.score} on a scale from 1 to 99, category ${o.category}${o.low !== undefined ? `, likely between ${o.low} and ${o.high}` : ""}. Goal ${o.goal}. Usual enlistment minimum ${o.min}.`;
  return `<figure class="scale">
    <svg viewBox="0 0 ${W} 62" role="img" aria-label="${summary}">
      ${bands}
      <line class="sc-min" x1="${x(o.min)}" x2="${x(o.min)}" y1="22" y2="44"><title>Minimum ${o.min}</title></line>
      <line class="sc-goal" x1="${x(o.goal)}" x2="${x(o.goal)}" y1="22" y2="44"><title>Goal ${o.goal}</title></line>
      ${range}
      <path class="sc-you" d="M${(sx - 6).toFixed(1)} 11h12l-6 8z"><title>You: ${o.score}</title></path>
      <text class="sc-label" x="${labelX.toFixed(1)}" y="9" text-anchor="middle">${o.score}</text>
    </svg>
    <figcaption class="scale-key">
      <span><i class="k-you" aria-hidden="true"></i>You${o.low !== undefined ? `, likely ${o.low} to ${o.high}` : ""}</span>
      <span><i class="k-goal" aria-hidden="true"></i>Goal ${o.goal}</span>
      <span><i class="k-min" aria-hidden="true"></i>Minimum ${o.min}</span>
    </figcaption>
  </figure>`;
}

export function answerSheet() {
  const marks = [2, 0, 3, 1, 1, -1, 2];
  const rows = marks
    .map((m, r) => {
      const y = 58 + r * 30;
      const bubbles = [0, 1, 2, 3]
        .map((c) => {
          const x = 74 + c * 40;
          return m === c
            ? `<circle class="as-fill" cx="${x}" cy="${y}" r="10.5"/>`
            : `<circle class="as-ring" cx="${x}" cy="${y}" r="10.5"/><text class="as-letter" x="${x}" y="${y + 4}" text-anchor="middle">${"ABCD"[c]}</text>`;
        })
        .join("");
      return `<text class="as-num" x="40" y="${y + 4}" text-anchor="end">${r + 1}</text>${bubbles}`;
    })
    .join("");
  return `<svg class="answer-sheet" viewBox="0 0 260 280" aria-hidden="true" focusable="false">
    <rect class="as-sheet" x="8" y="8" width="244" height="264" rx="6"/>
    <path class="as-rule" d="M24 32h120M24 40h70"/>
    ${rows}
  </svg>`;
}

export function trendChart(points: { t: number; v: number }[], target: number) {
  const W = 320;
  const H = 170;
  const pad = { l: 30, r: 16, t: 18, b: 28 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const x = (i: number) => pad.l + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v: number) => pad.t + ih - (v / 100) * ih;
  const date = (t: number) => new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const grid = [0, 25, 50, 75, 100]
    .map((g) => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(g)}" y2="${y(g)}" class="g"/><text x="${pad.l - 6}" y="${y(g) + 3.5}" class="ax" text-anchor="end">${g}</text>`)
    .join("");
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
  const dots = points
    .map((p, i) => `<g class="pt"><circle cx="${x(i)}" cy="${y(p.v)}" r="12" class="hit"/><circle cx="${x(i)}" cy="${y(p.v)}" r="4" class="d"/><title>${date(p.t)}: AFQT ${p.v}</title></g>`)
    .join("");
  const last = points[points.length - 1];
  const first = points[0];
  const summary = `AFQT estimates from ${points.length} test${points.length === 1 ? "" : "s"}, from ${first.v} to ${last.v}. Goal ${target}.`;
  const xlabels =
    points.length > 1
      ? `<text x="${x(0)}" y="${H - 8}" class="ax" text-anchor="start">${date(first.t)}</text><text x="${x(points.length - 1)}" y="${H - 8}" class="ax" text-anchor="end">${date(last.t)}</text>`
      : `<text x="${x(0)}" y="${H - 8}" class="ax" text-anchor="middle">${date(first.t)}</text>`;
  const goalY = y(target);
  return `<figure class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${summary}">
    ${grid}
    <line x1="${pad.l}" x2="${W - pad.r}" y1="${goalY}" y2="${goalY}" class="goal"/>
    <text x="${pad.l + 4}" y="${goalY - 5}" class="ax goal-t">Goal ${target}</text>
    <path d="${line}" class="ln"/>${dots}
    <text x="${x(points.length - 1)}" y="${y(last.v) - 10}" class="lab" text-anchor="${points.length === 1 ? "middle" : "end"}">${last.v}</text>
    ${xlabels}
  </svg>
  <details class="table-view"><summary>Show as a table</summary>
    <table class="plain"><thead><tr><th>Date</th><th>AFQT estimate</th></tr></thead><tbody>${points
      .slice()
      .reverse()
      .map((p) => `<tr><td>${date(p.t)}</td><td>${p.v}</td></tr>`)
      .join("")}</tbody></table>
  </details></figure>`;
}
