import { gsap, ScrollTrigger } from './gsap-setup.js';
import { ROOMS, DECKS, roomById, roomName, roomLabel, roomPass, lit, priceText, priceHtml, picture, badgeText } from './rooms.js';
import { state } from './state.js';
import { t, tn } from './i18n.js';
import { icon, ICONS } from './icons.js';
import { TIGER, wavePath } from './graphics.js';
import { openCabin } from './drawer.js';
import { $, $$, esc, mqMobile, mqFine, reduced, store } from './util.js';

const GAP = 12, CH = 120;
const DECK_Y = { top: 104, main: 252, lower: 400 };
const DECK_LABEL = { top: ['ship.deckTop', 'ВЕРХНЯЯ ПАЛУБА'], main: ['ship.deckMain', 'ГЛАВНАЯ ПАЛУБА'], lower: ['ship.deckLower', 'НИЖНЯЯ ПАЛУБА'] };
const HULL = 'M40 386H1160L1119 556Q1117 562 1110 562H90Q83 562 81 556Z';

let host, stage, tipEl, arrived = false, tipTimer, closeTimer, current = null;
const rowRooms = (deck) => ROOMS.filter((r) => r.deck === deck).sort((a, b) => a.order - b.order);
const guestsTxt = (r) => `${r.capacity} ${tn('guestsN', r.capacity, 'гость|гостя|гостей')}`;

function ariaFor(r) {
  const fit = lit(r, state) ? t('ship.fits', 'подходит вам') : t('ship.notfit', 'не подходит по запросу');
  return `${roomName(r)}, ${guestsTxt(r)}, ${priceText(r)}, ${fit}`;
}

function bedsSvg(r, x, y) {
  const bed = (bx) => `<g transform="translate(${bx} ${y})"><rect class="cell-bed" width="16" height="10" rx="2.5"/><rect class="cell-bed" x="2" y="2" width="5" height="3.5" rx="1"/></g>`;
  if (r.beds > 6) return `<text class="cell-bed-n" x="${x}" y="${y + 9}">${r.beds}×</text>${bed(x + 24)}`;
  return Array.from({ length: r.beds }, (_, i) => bed(x + i * 20)).join('');
}

function labelSvg(r, x, y, avail) {
  const label = roomLabel(r);
  const est = (s) => s.length * 7.5;
  let lines = [label];
  if (est(label) > avail && label.includes(' ')) { const i = label.indexOf(' '); lines = [label.slice(0, i), label.slice(i + 1)]; }
  return lines.map((l, i) => `<text class="cell-label" x="${x}" y="${y + i * 14}">${esc(l)}</text>`).join('');
}

function cellSvg(r, x, y) {
  const w = r.cellWidth;
  return `<g class="cell" data-id="${r.id}" role="button" tabindex="-1" aria-label="${esc(ariaFor(r))}">
    <rect class="cell-bg" x="${x}" y="${y}" width="${w}" height="${CH}" rx="10"/>
    ${labelSvg(r, x + 12, y + 24, w - 12 - 40)}
    <circle class="cell-port" cx="${x + w - 23}" cy="${y + 23}" r="11"/>
    ${bedsSvg(r, x + 12, y + CH - 24)}
  </g>`;
}

function buildDesktop() {
  let cells = '';
  DECKS.forEach((deck) => {
    const list = rowRooms(deck);
    const total = list.reduce((s, r) => s + r.cellWidth, 0) + GAP * (list.length - 1);
    let x = 600 - total / 2;
    list.forEach((r) => { cells += cellSvg(r, x, DECK_Y[deck]); x += r.cellWidth + GAP; });
  });
  const lab = (deck, cy) => `<text class="deck-label" transform="translate(20 ${cy}) rotate(-90)" text-anchor="middle">${esc(t(...DECK_LABEL[deck]))}</text>`;
  const compass = `<g transform="translate(580 4) scale(1.6667)" fill="none" stroke="var(--sea-700)" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round">${ICONS.compass}</g>`;
  const mk = (p, w) => `<g class="ship-wave" style="transform-box:fill-box">${p}</g>`;
  return `<svg class="hull" viewBox="0 0 1200 600" role="group" aria-label="${esc(t('ship.aria', 'Схема корабля с каютами'))}">
    <defs><clipPath id="hullClip"><path d="${HULL}"/></clipPath></defs>
    <g id="shipArrive"><g class="ship__bob">
      <line x1="600" y1="90" x2="600" y2="44" stroke="var(--sea-700)" stroke-width="2" stroke-linecap="round"/>
      ${compass}
      <g class="ship__flag"><path d="M602 52L668 56V78L602 82Z" fill="var(--white)" stroke="var(--sea-700)" stroke-width="1.5" stroke-linejoin="round"/>
        <g transform="translate(615 56) scale(.5)" fill="none" stroke="var(--sea-700)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity=".85">${TIGER}</g></g>
      <path class="hull-line" d="${HULL}"/>
      <g clip-path="url(#hullClip)"><rect class="hull-under" x="0" y="534" width="1200" height="40"/></g>
      <rect class="hull-line" x="90" y="238" width="1020" height="148" rx="12"/>
      <rect class="hull-line" x="326" y="82" width="548" height="12" rx="6"/>
      <rect class="hull-line" x="340" y="94" width="520" height="144" rx="12"/>
      <path d="M34 164H334M34 312H84M24 474H34" stroke="var(--sea-200)" stroke-width="1" stroke-dasharray="3 4"/>
      ${lab('top', 164)}${lab('main', 312)}${lab('lower', 474)}
      ${cells}
    </g></g>
    <svg x="0" y="520" width="1200" height="80" viewBox="0 0 1200 80" overflow="hidden" aria-hidden="true">
      <g class="ship-wave" style="transform-box:fill-box"><path fill="var(--sea-200)" opacity=".6" d="${wavePath(80, 8, 400, 24)}"/></g>
      <g class="ship-wave ship-wave--2" style="transform-box:fill-box"><path fill="var(--sea-500)" opacity=".22" d="${wavePath(80, 9, 300, 30)}"/></g>
      <g class="ship-wave" style="transform-box:fill-box;animation-duration:22s"><path fill="var(--paper)" d="${wavePath(80, 6, 240, 54)}"/></g>
    </svg>
  </svg>`;
}

function vcell(r) {
  const beds = r.beds > 6 ? `<span>${r.beds}×</span>${icon('bed-single', 16)}` : Array.from({ length: r.beds }, () => icon('bed-single', 16)).join('');
  return `<button type="button" class="vcell" data-id="${r.id}" tabindex="-1" aria-label="${esc(ariaFor(r))}">
    <span class="cell-label">${esc(roomLabel(r))}</span><i class="vcell__port"></i><span class="vcell__beds">${beds}</span></button>`;
}
function buildVertical() {
  const nose = `<svg class="vship__nose" viewBox="0 0 400 96" aria-hidden="true" fill="none" stroke="var(--sea-700)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="200" y1="92" x2="200" y2="30"/><g transform="translate(180 -4) scale(1.667)" stroke-width="1">${ICONS.compass}</g>
    <path d="M202 36L250 40V58L202 62Z" fill="var(--white)" class="ship__flag"/><path d="M20 94L60 70H340L380 94" fill="var(--white)"/></svg>`;
  return nose + DECKS.map((d) => `<div class="deck-strip"><span class="mono">${esc(t(...DECK_LABEL[d]))}</span><div class="deck-grid">${rowRooms(d).map(vcell).join('')}</div></div>`).join('') + '<div class="vwater" aria-hidden="true"></div>';
}

export function renderShip() {
  const mobile = mqMobile.matches;
  const sr = `<ul class="sr-only">${ROOMS.map((r) => `<li>${esc(roomName(r))}: ${esc(roomPass(r).join(', '))}</li>`).join('')}</ul>`;
  host.innerHTML = `<div class="ship__stage" id="shipStage">${buildDesktop()}</div><div class="vship">${buildVertical()}</div>${sr}`;
  stage = $('#shipStage', host);
  tipEl = document.createElement('div');
  tipEl.className = 'tip'; tipEl.id = 'shipTip';
  stage.append(tipEl);
  const first = $$('[data-id]', host).find((e) => e.offsetParent !== null || e.getBoundingClientRect().width) || $('[data-id]', host);
  $$('[data-id]', host).forEach((e) => e.setAttribute('tabindex', '-1'));
  first?.setAttribute('tabindex', '0');
  if (!arrived) $$('.cell,.vcell', host).forEach((e) => e.classList.remove('lit'));
  applySelection();
  update({ animate: false });
  return mobile;
}

// ---- подсветка (A23) ----
export function update({ animate = true } = {}) {
  if (!host) return 0;
  let n = 0, idx = 0;
  const order = DECKS.slice().reverse().flatMap((d) => rowRooms(d)); // снизу вверх
  order.forEach((r) => {
    const on = arrived && lit(r, state);
    if (on) n++;
    const els = $$(`[data-id="${r.id}"]`, host);
    const turningOn = on && !els[0]?.classList.contains('lit');
    const delay = turningOn && animate && !reduced() ? `${idx++ * 90}ms` : '0ms';
    els.forEach((el) => {
      el.style.setProperty('--d', delay);
      el.classList.toggle('lit', on);
      el.setAttribute('aria-label', ariaFor(r));
    });
  });
  setTimeout(() => $$('[data-id]', host).forEach((e) => e.style.removeProperty('--d')), idx * 90 + 500);
  return n;
}
export const litTotal = () => ROOMS.filter((r) => lit(r, state)).length;

export function setSelected(id) { current = id; applySelection(); }
function applySelection() { $$('[data-id]', host).forEach((e) => e.classList.toggle('is-selected', e.dataset.id === String(current))); }

// ---- подсказка ----
function showTip(el) {
  clearTimeout(closeTimer);
  const r = roomById(el.dataset.id);
  tipEl.innerHTML = `<div class="tip__img">${picture(r.photos[0], { alt: '', sizes: '280px' })}</div>
    <div class="tip__body"><p class="mono muted">${esc(roomPass(r).join(' · '))}</p><h3>${esc(roomName(r))}</h3>
    <div class="tip__foot">${priceHtml(r)}<button type="button" class="btn btn--secondary btn--sm" data-tip-open="${r.id}">${esc(t('cta.more', 'Подробнее'))}</button></div></div>`;
  const cr = el.getBoundingClientRect(), sr = stage.getBoundingClientRect();
  const th = tipEl.offsetHeight || 260;
  let top = cr.top - sr.top - th - 8;
  if (cr.top - th - 8 < 90) top = cr.bottom - sr.top + 8;
  let left = cr.left - sr.left + cr.width / 2 - 140;
  left = Math.max(0, Math.min(sr.width - 280, left));
  tipEl.style.left = `${left}px`; tipEl.style.top = `${top}px`;
  tipEl.classList.remove('is-off'); tipEl.classList.add('is-on');
  el.setAttribute('aria-describedby', 'shipTip');
}
function hideTip(el) {
  clearTimeout(tipTimer);
  closeTimer = setTimeout(() => { tipEl.classList.add('is-off'); tipEl.classList.remove('is-on'); $$('[aria-describedby="shipTip"]', host).forEach((e) => e.removeAttribute('aria-describedby')); }, 150);
}

// ---- клавиатура ----
function move(from, key) {
  const cells = $$('[data-id]', host).filter((e) => e.getBoundingClientRect().width);
  const c = (e) => { const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; };
  const [fx, fy] = c(from);
  let pool;
  if (key === 'ArrowLeft' || key === 'ArrowRight') {
    pool = cells.filter((e) => e !== from && Math.abs(c(e)[1] - fy) < 30 && (key === 'ArrowLeft' ? c(e)[0] < fx : c(e)[0] > fx));
    pool.sort((a, b) => Math.abs(c(a)[0] - fx) - Math.abs(c(b)[0] - fx));
  } else {
    pool = cells.filter((e) => (key === 'ArrowUp' ? c(e)[1] < fy - 30 : c(e)[1] > fy + 30));
    pool.sort((a, b) => (Math.abs(c(a)[1] - fy) - Math.abs(c(b)[1] - fy)) || (Math.abs(c(a)[0] - fx) - Math.abs(c(b)[0] - fx)));
  }
  return pool[0];
}

function activate(el) {
  hideInstant();
  store.set('kk.hint', '1'); $('#shipHint')?.setAttribute('hidden', '');
  openCabin(el.dataset.id, el);
}
function hideInstant() { tipEl?.classList.remove('is-on'); }

function bind() {
  host.addEventListener('click', (e) => {
    const open = e.target.closest('[data-tip-open]');
    if (open) return activate($(`[data-id="${open.dataset.tipOpen}"]`, host));
    const el = e.target.closest('[data-id]');
    if (el) activate(el);
  });
  host.addEventListener('keydown', (e) => {
    const el = e.target.closest('[data-id]'); if (!el) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(el); }
    else if (e.key.startsWith('Arrow')) {
      e.preventDefault();
      const nx = move(el, e.key);
      if (nx) { el.setAttribute('tabindex', '-1'); nx.setAttribute('tabindex', '0'); nx.focus(); }
    }
  });
  host.addEventListener('focusin', (e) => {
    const el = e.target.closest('.cell,.vcell'); if (!el) return;
    $$('[data-id]', host).forEach((x) => x.setAttribute('tabindex', x === el ? '0' : '-1'));
    if (el.matches(':focus-visible') && mqFine.matches && !mqMobile.matches) showTip(el);
  });
  host.addEventListener('focusout', (e) => { if (e.target.closest('.cell')) hideTip(); });
  host.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse' || mqMobile.matches) return;
    const el = e.target.closest('.cell');
    if (el) { clearTimeout(tipTimer); clearTimeout(closeTimer); tipTimer = setTimeout(() => showTip(el), 120); }
    else if (e.target.closest('.tip')) clearTimeout(closeTimer);
  });
  host.addEventListener('pointerout', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (e.target.closest('.cell') || e.target.closest('.tip')) {
      const to = e.relatedTarget;
      if (to && (to.closest?.('.tip') || to.closest?.('.cell'))) { clearTimeout(tipTimer); if (to.closest('.tip')) clearTimeout(closeTimer); return; }
      clearTimeout(tipTimer); hideTip();
    }
  });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideInstant(); });
}

function arrive() {
  const finish = () => { arrived = true; update({ animate: true }); };
  const target = mqMobile.matches ? $('.vship', host) : $('#shipArrive', host);
  if (reduced() || !target) { arrived = true; update({ animate: false }); return; }
  gsap.fromTo(target, { x: mqMobile.matches ? 0 : -160, y: mqMobile.matches ? 16 : 0, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 1.2, ease: 'power2.out', onComplete: finish, clearProps: mqMobile.matches ? 'transform' : '' });
}

export function initShip() {
  host = $('#ship');
  if (!host) return;
  if (store.get('kk.hint')) $('#shipHint')?.setAttribute('hidden', '');
  renderShip();
  bind();
  // пока корабль не приплыл, он невидим (A22)
  const prepare = () => { if (!arrived && !reduced()) { const t0 = mqMobile.matches ? $('.vship', host) : $('#shipArrive', host); if (t0) gsap.set(t0, { opacity: 0 }); } };
  prepare();
  const mql = () => { renderShip(); if (!arrived) prepare(); };
  mqMobile.addEventListener('change', mql);
  ScrollTrigger.create({ trigger: host, start: 'top 80%', once: true, onEnter: arrive });
  // пауза бесконечных анимаций вне экрана
  new IntersectionObserver(([en]) => host.classList.toggle('is-offscreen', !en.isIntersecting), { rootMargin: '100px' }).observe(host);
}
export const shipArrived = () => arrived;
export function relayout() { if (host) { renderShip(); } }
