export function trendChart(points: { t: number; v: number }[], target: number) {
  const W = 320;
  const H = 160;
  const pad = { l: 30, r: 12, t: 12, b: 22 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const x = (i: number) => pad.l + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v: number) => pad.t + ih - (v / 100) * ih;
  const grid = [0, 25, 50, 75, 100]
    .map((g) => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(g)}" y2="${y(g)}" class="g"/><text x="${pad.l - 6}" y="${y(g) + 4}" class="ax" text-anchor="end">${g}</text>`)
    .join("");
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
  const dots = points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.v)}" r="4" class="d"><title>${new Date(p.t).toLocaleDateString()}: ${p.v}</title></circle>`).join("");
  const last = points[points.length - 1];
  const summary = `AFQT estimates from ${points.length} test${points.length === 1 ? "" : "s"}. Latest ${last.v}, goal ${target}.`;
  return `<figure class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${summary}">
    ${grid}
    <line x1="${pad.l}" x2="${W - pad.r}" y1="${y(target)}" y2="${y(target)}" class="goal"/>
    <text x="${W - pad.r}" y="${y(target) - 5}" class="ax goal-t" text-anchor="end">Goal ${target}</text>
    <path d="${line}" class="ln"/>${dots}
    <text x="${x(points.length - 1)}" y="${y(last.v) - 9}" class="lab" text-anchor="${points.length === 1 ? "middle" : "end"}">${last.v}</text>
  </svg><figcaption>${summary}</figcaption></figure>`;
}
