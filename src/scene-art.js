// Чистые генераторы SVG для hero «Порт Хабаровск» (слои L1–L9). Без DOM, чтобы собирать и постер.
import { TIGER } from './graphics.js';
import { ICONS } from './icons.js';

export const VB = '-100 0 1800 760';
export const SUN = { x: 1090, y: 225 };
export const SHIP = { x: 1170, y: 650 };

const rng = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const f = (n) => Math.round(n * 10) / 10;

function wave(x0, width, y, amp, period, bottom = 780) {
  let d = `M${x0} ${y}`;
  for (let x = x0; x < x0 + width; x += period) d += ` Q${x + period / 4} ${y - amp * 2} ${x + period / 2} ${y} T${x + period} ${y}`;
  return `${d}V${bottom}H${x0}Z`;
}

// --- L1 небо ---
function sky(mobile) {
  const r = rng(11);
  let stars = '';
  for (let i = 0; i < (mobile ? 24 : 40); i++) {
    const x = f(-80 + r() * 1760), y = f(20 + r() * 330), s = f(0.75 + r() * 0.75);
    stars += `<g class="star" style="transition-delay:${i * 20}ms"><circle class="tw" style="animation-delay:-${f(r() * 5)}s;animation-duration:${f(2 + r() * 3)}s" cx="${x}" cy="${y}" r="${s}" fill="#fff"/></g>`;
  }
  let cirrus = '';
  [[120, 90, 420], [900, 70, 520], [560, 150, 360], [1300, 130, 300]].forEach(([x, y, w]) => { cirrus += `<rect x="${x}" y="${y}" width="${w}" height="3" rx="1.5" fill="#fff" class="cir"/>`; });
  return `<defs><linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sk-a"/><stop offset="1" class="sk-b"/></linearGradient></defs>
    <rect x="-100" y="0" width="1800" height="760" fill="url(#skyg)"/>${cirrus}<g class="stars">${stars}</g>`;
}

// --- L2 солнце, луна, облака ---
function cloud(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 40H190V34C190 20 178 14 166 18C162 0 134 -8 118 8C106 -6 76 -4 68 16C46 10 30 22 34 36C14 36 0 40 0 40Z" fill="var(--c-cloud)" opacity="var(--cloud-o)"/></g>`;
}
function sunMoon() {
  return `<g class="sun">
    <circle cx="${SUN.x}" cy="${SUN.y}" r="190" fill="var(--sun)" opacity=".12"/><circle cx="${SUN.x}" cy="${SUN.y}" r="130" fill="var(--sun)" opacity=".25"/><circle cx="${SUN.x}" cy="${SUN.y}" r="80" fill="var(--sun)"/></g>
    <g class="moon"><circle cx="${SUN.x}" cy="${SUN.y}" r="130" fill="var(--sand-100)" opacity=".1"/><circle cx="${SUN.x}" cy="${SUN.y}" r="100" fill="var(--sand-100)" opacity=".2"/><circle cx="${SUN.x}" cy="${SUN.y}" r="70" fill="var(--sand-100)"/>
    <circle cx="${SUN.x - 20}" cy="${SUN.y - 14}" r="12" fill="#d8cfbd"/><circle cx="${SUN.x + 22}" cy="${SUN.y + 18}" r="8" fill="#d8cfbd"/></g>`;
}
function gullShape() {
  return `<g class="gull"><path class="g-shadow" d="M0 7Q-14 -3 -28 5Q-14 3 0 9Q14 3 28 5Q14 -3 0 7Z" fill="rgba(14,42,59,.18)"/>
    <path class="gw gw1" d="M0 0Q-14 -10 -28 -2Q-14 -4 0 2Q14 -4 28 -2Q14 -10 0 0Z" fill="#fff"/><path class="gw gw2" d="M0 0Q-14 6 -28 8Q-14 2 0 2Q14 2 28 8Q14 6 0 0Z" fill="#fff"/></g>`;
}
function skyObjects(opts) {
  const clouds = [[-60, 150, 1.1, 90], [380, 80, .8, 120], [820, 190, .95, 150]]
    .map(([x, y, s, dur], i) => `<g class="drift" style="animation-duration:${dur}s;animation-delay:-${i * 37}s">${cloud(x, y, s)}</g>`).join('');
  const gulls = opts.mobile ? '' : [0, 1, 2].map((i) => `<g class="gull-wrap" data-gull="${i}" transform="translate(-200 ${150 + i * 50})">${gullShape()}</g>`).join('');
  return `${sunMoon()}${clouds}${gulls}`;
}

// --- L3 дальний берег + тигр ---
function farShore(mobile) {
  const r = rng(7);
  const base = (x) => 470 + 8 * Math.sin(x / 130);
  let top = `M-100 ${base(-100)}`;
  let x = -100;
  while (x < 1700) {
    const w = 8 + r() * 9, h = 14 + r() * 30, y = base(x);
    top += r() < 0.3 ? ` Q${f(x + w / 2)} ${f(y - h * 0.8)} ${f(x + w)} ${f(base(x + w))}` : ` L${f(x + w / 2)} ${f(y - h)} L${f(x + w)} ${f(base(x + w))}`;
    x += w;
  }
  const tiger = `<g class="tiger" transform="translate(1566 424) scale(.667)"><g class="tiger-flip"><g fill="none" stroke="var(--sea-700)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity=".45">${TIGER.replace(/<g [^>]*>/, '').replace('</g>', '')}</g>
    <g class="eyes"><circle cx="85" cy="25" r="1.7" fill="var(--sun)"/><circle cx="89" cy="25.5" r="1.7" fill="var(--sun)"/></g></g></g>`;
  return `<path d="${top}" fill="none" stroke="rgba(14,42,59,.10)" stroke-width="8" transform="translate(0 -2)"/>
    <path d="${top}V540H-100Z" fill="var(--c-far)" class="fl"/><path d="${top}" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.6"/>${tiger}`;
}

// --- L4 уступ, город, собор ---
const ledgeY = (x) => {
  if (x < 900) return 478 + 6 * Math.sin(x / 90);
  if (x < 1180) { const u = (x - 900) / 280, e = u * u * (3 - 2 * u); return 478 - e * 108; }
  return 370 + 3 * Math.sin(x / 70);
};
function ledge(mobile) {
  const r = rng(23);
  let top = `M-100 ${f(ledgeY(-100))}`;
  for (let x = -80; x <= 1700; x += 20) top += ` L${x} ${f(ledgeY(x))}`;
  let bld = '', win = '';
  const addB = (x, w, h) => {
    const y = ledgeY(x + w / 2) - h + 3;
    bld += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="var(--c-ledge-d)"/>`;
    if (r() < 0.55) for (let k = 0; k < 2; k++) win += `<circle class="cwin" cx="${f(x + 6 + r() * (w - 12))}" cy="${f(y + 8 + r() * (h - 14))}" r="1.8" fill="var(--lamp)"/>`;
  };
  for (let x = -60; x < 880; x += 30 + r() * 14) addB(x, 24 + r() * 20, 16 + r() * 30);
  for (let x = 1190; x < 1700; x += 30 + r() * 14) { if (x > 1262 && x < 1410) continue; addB(x, 24 + r() * 22, 22 + r() * 36); }
  let trees = '';
  for (let x = -80; x < 1700; x += 26 + r() * 30) { if (x > 1250 && x < 1420) continue; const y = ledgeY(x); trees += `<circle cx="${f(x)}" cy="${f(y - 2)}" r="${f(5 + r() * 6)}" fill="var(--c-ledge-d)"/>`; }
  const cx = 1336, y0 = ledgeY(cx);
  const dome = (x, yb, rx, ry, cross) => `<ellipse cx="${x}" cy="${yb - ry}" rx="${rx}" ry="${ry}" fill="var(--sand-300)"/><path d="M${x} ${yb - 2 * ry}V${yb - 2 * ry - cross}M${x - cross / 3} ${yb - 2 * ry - cross * .6}H${x + cross / 3}" stroke="var(--sand-300)" stroke-width="1.6" stroke-linecap="round" fill="none"/>`;
  const cath = `<rect x="${cx - 52}" y="${y0 - 62}" width="104" height="66" fill="var(--c-ledge-d)"/><rect x="${cx - 17}" y="${y0 - 94}" width="34" height="34" fill="var(--c-ledge-d)"/>
    ${dome(cx, y0 - 94, 21, 28, 18)}${[-42, 42].map((dx) => `<rect x="${cx + dx - 7}" y="${y0 - 80}" width="14" height="20" fill="var(--c-ledge-d)"/>${dome(cx + dx, y0 - 80, 11, 15, 10)}`).join('')}
    ${[-22, 22].map((dx) => `<rect x="${cx + dx - 6}" y="${y0 - 78}" width="12" height="16" fill="var(--c-ledge-d)"/>${dome(cx + dx, y0 - 78, 9, 12, 8)}`).join('')}`;
  return `<path d="${top}" fill="none" stroke="rgba(14,42,59,.12)" stroke-width="9" transform="translate(0 -2)"/>
    <path d="${top}V560H-100Z" fill="var(--c-ledge)"/>${trees}${bld}${cath}<g class="cwins">${win}</g><path d="${top}" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.6"/>`;
}

// --- L5 Амурский мост + поезд ---
export const TRAIN_Y = 506;
function bridge(mobile) {
  const deck = 520, span = 260, x0 = -140, panels = 12;
  let lines = '', piers = '';
  for (let k = 0; k < 8; k++) {
    const xs = x0 + k * span;
    const top = (i) => { const u = i / panels; return deck - (22 + 78 * (1 - Math.pow(2 * u - 1, 2))); };
    let chord = `M${xs} ${deck}`;
    for (let i = 0; i <= panels; i++) chord += ` L${f(xs + (span / panels) * i)} ${f(top(i))}`;
    lines += chord + ` L${xs + span} ${deck}`;
    for (let i = 0; i < panels; i++) {
      const xa = f(xs + (span / panels) * i), xb = f(xs + (span / panels) * (i + 1));
      lines += `M${xa} ${deck}L${xb} ${f(top(i + 1))}M${xa} ${f(top(i))}L${xb} ${deck}M${xa} ${deck}V${f(top(i))}`;
    }
    piers += `<path d="M${xs - 20} ${deck + 10}L${xs - 28} 650H${xs + 28}L${xs + 20} ${deck + 10}Z" fill="var(--c-bridge)" opacity=".85"/>`;
  }
  const lamps = `<line x1="-100" y1="${deck - 8}" x2="1700" y2="${deck - 8}" stroke="var(--sand-300)" stroke-width="4" stroke-linecap="round" stroke-dasharray="0 24" class="lamps"/>`;
  return `<path d="${lines}" fill="none" stroke="rgba(11,53,82,.12)" stroke-width="3" transform="translate(0 7)"/>
    <path d="${lines}" fill="none" stroke="var(--c-bridge)" stroke-width="2.2" stroke-linejoin="round"/>
    ${piers}<rect x="-100" y="${deck}" width="1800" height="12" fill="var(--c-bridge)"/><rect x="-100" y="${deck + 12}" width="1800" height="5" fill="rgba(11,53,82,.12)"/>
    <line x1="-100" y1="${deck - 3}" x2="1700" y2="${deck - 3}" stroke="var(--sea-900)" opacity=".5" stroke-width="1.5"/>${lamps}
    <g class="train" transform="translate(1900 0)" visibility="hidden"><g transform="translate(0 ${TRAIN_Y})"><rect x="0" y="-22" width="58" height="22" rx="3" fill="var(--sea-900)"/><rect x="38" y="-30" width="20" height="10" fill="var(--sea-900)"/>
      ${Array.from({ length: 9 }, (_, i) => { const x = 62 + i * 50; return `<rect x="${x}" y="-18" width="46" height="18" rx="2" fill="var(--sand-300)"/>${[8, 20, 32].map((w) => `<rect class="twin" x="${x + w}" y="-14" width="6" height="5" rx="1" fill="var(--lamp)"/>`).join('')}`; }).join('')}
      <rect x="0" y="0" width="520" height="4" fill="rgba(14,42,59,.15)"/></g></g>`;
}

// --- L6 дальняя река, отражение, блики ---
function riverFar(mobile) {
  const r = rng(41);
  let refl = '';
  for (let i = 0; i < 7; i++) { const w = 80 - i * 7 + (i % 2) * 6, y = 560 + i * 11; refl += `<rect class="refl" style="animation-delay:-${f(r() * 2.4)}s" x="${SUN.x - w / 2}" y="${y}" width="${w}" height="3" rx="1.5" fill="var(--sun)" opacity=".5"/>`; }
  let glints = '';
  for (let i = 0; i < (mobile ? 10 : 24); i++) { const x = f(-80 + r() * 1760), y = f(556 + r() * 90); glints += `<path class="glint" style="animation-delay:${f(r() * 3)}s;animation-duration:${f(2.5 + r() * 3)}s" d="M${x} ${y - 3}l4 3-4 3-4-3z" fill="#fff"/>`; }
  return `<g class="strip drift-l" style="animation-duration:40s"><path d="${wave(-100, 3600, 548, 5, 150)}" fill="var(--c-river1)"/></g>
    <g class="strip drift-r" style="animation-duration:28s"><path d="${wave(-100, 3600, 584, 6, 180)}" fill="var(--c-river2)"/></g>${refl}${glints}`;
}

// --- L7 корабль (вид сбоку, нос слева) ---
export function shipArt(opts = {}) {
  const hullD = 'M-350 -86L-300 0H310L340 -86Z';
  let wins = '', i = 0;
  [-220, -80, 60, 200].forEach((x) => { wins += `<circle class="win" style="--i:${i++}" cx="${x}" cy="-52" r="9" fill="var(--c-window)" stroke="var(--sea-700)" stroke-width="2"/>`; });
  for (let k = 0; k < 6; k++) wins += `<rect class="win" style="--i:${i++}" x="${-250 + k * 90 - 15}" y="-136" width="30" height="22" rx="4" fill="var(--c-window)" stroke="var(--sea-700)" stroke-width="1.5"/>`;
  [-84, -22, 40].forEach((x) => { wins += `<rect class="win" style="--i:${i++}" x="${x}" y="-206" width="44" height="30" rx="5" fill="var(--c-window)" stroke="var(--sea-700)" stroke-width="1.5"/>`; });
  const glow = [-220, -80, 60, 200].map((x) => `<circle class="glow" cx="${x}" cy="-52" r="18" fill="rgba(255,233,176,.45)"/>`).join('') + [-235, -145, -55, 35, 125, 215].map((x) => `<circle class="glow" cx="${x}" cy="-125" r="18" fill="rgba(255,233,176,.45)"/>`).join('');
  const compass = `<g transform="translate(-14 -352) scale(1.1667)" fill="none" stroke="var(--sea-700)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS.compass}</g>`;
  return `<g class="ship-scale"><g class="ship-arrive"><g class="ship-bob">
    <g class="wake"><path class="v v1" d="M345 4L440 -8M345 4L440 16" stroke="#fff" stroke-width="3.5" stroke-linecap="round" fill="none"/><path class="v v2" d="M345 4L440 -8M345 4L440 16" stroke="#fff" stroke-width="3.5" stroke-linecap="round" fill="none" style="animation-delay:1s"/><path class="v v3" d="M345 4L440 -8M345 4L440 16" stroke="#fff" stroke-width="3.5" stroke-linecap="round" fill="none" style="animation-delay:2s"/></g>
    <line x1="0" y1="-226" x2="0" y2="-314" stroke="var(--sea-700)" stroke-width="2.5" stroke-linecap="round"/>${compass}
    <circle class="mast-lamp" cx="0" cy="-318" r="4" fill="var(--lamp)" opacity="0"/>
    <g class="flag"><path d="M2 -308L62 -302V-282L2 -278Z" fill="#fff" stroke="var(--sea-700)" stroke-width="1.5" stroke-linejoin="round"/><g transform="translate(10 -306) scale(.4)" fill="none" stroke="var(--sea-700)" stroke-width="2.6" stroke-linecap="round">${TIGER.replace(/<g [^>]*>/, '').replace('</g>', '')}</g></g>
    <path d="${hullD}" fill="var(--c-hull)" stroke="var(--sea-700)" stroke-width="2" stroke-linejoin="round"/>
    <clipPath id="hc"><path d="${hullD}"/></clipPath><rect x="-360" y="-18" width="720" height="22" fill="var(--sea-900)" clip-path="url(#hc)"/>
    <rect x="-300" y="-150" width="600" height="64" rx="6" fill="var(--c-hull)" stroke="var(--sea-700)" stroke-width="2"/>
    <rect x="-132" y="-224" width="264" height="10" rx="5" fill="var(--c-hull)" stroke="var(--sea-700)" stroke-width="2"/><rect x="-120" y="-216" width="240" height="66" rx="6" fill="var(--c-hull)" stroke="var(--sea-700)" stroke-width="2"/>
    <rect x="94" y="-196" width="18" height="46" rx="3" fill="var(--c-hull)" stroke="var(--sea-700)" stroke-width="1.5"/>
    ${glow}${wins}<text x="-150" y="-26" font-family="var(--font-mono)" font-weight="500" font-size="12" letter-spacing="2.4" fill="var(--sea-700)">КАЮТ-КОМПАНИЯ</text></g></g></g>`;
}

// --- L8 ближняя вода, L9 край ---
function riverNear() {
  const foam = Array.from({ length: 14 }, (_, i) => `<path d="M${-60 + i * 130} 676q18 -8 36 0" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".8"/>`).join('');
  return `<g class="strip drift-l" style="animation-duration:22s"><path d="${wave(-100, 3600, 664, 6, 150)}" fill="var(--c-near)" opacity=".35"/>${foam}</g>
    <g class="strip drift-r" style="animation-duration:16s"><path d="${wave(-100, 3600, 702, 7, 200)}" fill="var(--c-near)" opacity=".45"/></g>`;
}
function edge() {
  return `<path d="${wave(-100, 1800, 736, 5, 225, 780)}" fill="var(--paper)"/><path d="M-100 736" />`;
}

export function layers(opts = {}) {
  const m = !!opts.mobile;
  const L = [
    { id: 'L1', d: 0, svg: sky(m) },
    { id: 'L2', d: 0.05, svg: skyObjects(opts) },
    { id: 'L3', d: 0.12, svg: farShore(m), tiger: true },
    { id: 'L4', d: 0.22, svg: ledge(m) },
    { id: 'L5', d: 0.34, svg: bridge(m) },
    { id: 'L6', d: 0.46, svg: riverFar(m) },
    { id: 'L7', d: 0.7, svg: `<g transform="translate(${SHIP.x} ${SHIP.y})">${shipArt(opts)}</g>`, ship: true },
    { id: 'L8', d: 0.9, svg: riverNear() },
    { id: 'L9', d: 1, svg: edge() },
  ];
  if (!m) return L;
  // мобильный: 5 слоёв (L2+L3 и L5+L6 объединены)
  const by = Object.fromEntries(L.map((l) => [l.id, l]));
  return [by.L1, { id: 'L23', d: 0.1, svg: by.L2.svg + by.L3.svg, tiger: true }, by.L4, { id: 'L56', d: 0.4, svg: by.L5.svg + by.L6.svg }, by.L7, by.L8, by.L9];
}

export const wrapSvg = (inner) => `<svg viewBox="${VB}" preserveAspectRatio="xMidYMax meet" role="presentation" focusable="false">${inner}</svg>`;

export const PALETTE_CSS = `
.scene{--sun:#F4C95D;--sk-a:#EAF4F9;--sk-b:#FBF9F4;--c-cloud:#fff;--cloud-o:.92;--c-far:#CFE4EF;--c-ledge:#9CC4DA;--c-ledge-d:#8AB6CF;--c-bridge:#5E96B5;--c-river1:#BFDCEB;--c-river2:#7FB3CF;--c-hull:#fff;--c-window:#fff;--c-near:#2A86B3;--paper:#FBF9F4;--lamp:#FFE9B0;--sand-100:#F6EFE3;--sand-300:#E6D5B8;--sea-700:#145A82;--sea-900:#0B3552}`;
