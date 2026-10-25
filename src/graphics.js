import { ICONS } from './icons.js';

// Единый стиль: линия 1.5, скруглённые концы. Цвет задаётся currentColor.
const STROKE = 'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';

export const TIGER = `<g ${STROKE}>
<path d="M20 30C20 20 34 16 50 17C62 17 70 19 76 22C82 18 90 20 92 26C93 31 90 35 85 36L80 38"/>
<path d="M20 30C22 40 32 42 46 41C58 41 66 40 74 38"/>
<path d="M70 39L68 54L73 56M62 40L58 52L63 56M30 38L24 52L29 56M40 41L38 54L43 57"/>
<path d="M20 30C10 28 6 20 10 12C12 8 16 8 17 11"/>
<path d="M80 20L82 14L86 19"/>
<path d="M36 18L38 28M44 17L46 29M52 17L53 28M60 18L60 27M68 20L67 27"/>
<path d="M86 25.5h.01"/></g>`;

export const ROPE = (() => {
  let d = 'M0 6';
  for (let x = 0; x < 1200; x += 24) d += ` q6 -6 12 0 t12 0`;
  let d2 = 'M0 6';
  for (let x = 0; x < 1200; x += 24) d2 += ` q6 6 12 0 t12 0`;
  return `<g ${STROKE}><path d="${d}"/><path d="${d2}"/></g>`;
})();

export function bridgePath() {
  // шесть пролётов по 200 px, ломаный верхний пояс, раскосы и опоры
  const segs = [];
  const deckY = 108;
  const top = (x) => { const u = (x % 200) / 200; return 36 + Math.abs(u - .5) * 2 * 40 - 0; };
  for (let s = 0; s < 6; s++) {
    const x0 = s * 200;
    const pts = [];
    for (let i = 0; i <= 8; i++) { const x = x0 + i * 25; pts.push([x, 32 + 46 * Math.pow(Math.abs(i / 8 - .5) * 2, 1.6)]); }
    let d = `M${x0} ${deckY}L${pts.map((p) => p.join(' ')).join('L')}L${x0 + 200} ${deckY}`;
    d += `M${x0} ${deckY}H${x0 + 200}`;
    pts.forEach((p, i) => { if (i > 0 && i < 8) d += `M${p[0]} ${deckY}V${p[1].toFixed(1)}`; });
    for (let i = 0; i < 8; i++) {
      const a = pts[i], b = pts[i + 1];
      d += i % 2 === 0 ? `M${a[0]} ${a[1].toFixed(1)}L${b[0]} ${deckY}` : `M${a[0]} ${deckY}L${b[0]} ${b[1].toFixed(1)}`;
    }
    d += `M${x0} ${deckY}V138`;
    segs.push(d);
  }
  segs.push(`M1200 ${108}V138`);
  return segs.join('');
}

export function wavePath(h, amp, period, base) {
  // бесшовная синусоида шириной 2400 (период делит 1200)
  let d = `M0 ${base}`;
  const n = 2400 / period;
  for (let i = 0; i < n; i++) {
    const x = i * period;
    d += ` Q${x + period / 4} ${base - amp * 2} ${x + period / 2} ${base} T${x + period} ${base}`;
  }
  d += ` V${h} H0 Z`;
  return d;
}

const lucide = (name) => `<g ${STROKE}>${ICONS[name] || ''}</g>`;

export function mountGraphics(root = document) {
  root.querySelectorAll('[data-graphic]').forEach((el) => {
    const k = el.dataset.graphic;
    if (el.firstChild) return;
    if (k === 'tiger') el.innerHTML = TIGER;
    else if (k === 'rope') el.innerHTML = ROPE;
    else if (k === 'lifebuoy') el.innerHTML = ICONS['life-buoy'];
  });
  const bridge = root.querySelector('#bridge');
  if (bridge && !bridge.firstChild) bridge.innerHTML = `<path id="bridgePath" d="${bridgePath()}"/>`;
  root.querySelectorAll('[data-wave]').forEach((el) => {
    if (el.firstChild) return;
    const n = el.dataset.wave;
    const cfg = { 1: [150, 10, 400, 40], 2: [120, 12, 300, 36], 3: [70, 8, 240, 24] }[n];
    el.innerHTML = `<div class="waves__strip"><svg viewBox="0 0 2400 ${cfg[0]}" preserveAspectRatio="none" aria-hidden="true"><path fill="currentColor" d="${wavePath(cfg[0], cfg[1], cfg[2], cfg[3])}"/></svg></div>`;
  });
}
export { lucide };
