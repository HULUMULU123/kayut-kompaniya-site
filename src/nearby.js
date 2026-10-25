import { gsap, ScrollTrigger } from './gsap-setup.js';
import PLACES from '../data/nearby.json';
import { t, onLang } from './i18n.js';
import { icon, ICONS } from './icons.js';
import { toast } from './scroll.js';
import { $, $$, esc, reduced, mqMobile, store } from './util.js';

const C = 320, R_DISC = 312;
const RING_R = { 5: 104, 10: 208, 15: 268 };
const MOODS = [['all', 'Всё'], ['walk', 'Пройтись'], ['culture', 'Культура'], ['amur', 'Вид на Амур'], ['errands', 'По делам']];
const MAX_DAY = 6;

const sorted = PLACES.slice().sort((a, b) => a.angleDeg - b.angleDeg);
const pol = (deg, r) => [C + r * Math.sin((deg * Math.PI) / 180), C - r * Math.cos((deg * Math.PI) / 180)];
const place = (id) => PLACES.find((p) => p.id === id);
const pName = (p) => t(`nearby.${p.id}.n`, p.name);
const pTeaser = (p) => t(`nearby.${p.id}.d`, p.teaser);
const minText = (p) => (p.walkMin == null ? t('near.minNone', '— МИН ПЕШКОМ') : t('near.min', '{n} МИН ПЕШКОМ', { n: p.walkMin }));

const S = { mood: 'all', view: 'map', sel: null, day: [], awake: new Set(), visible: false, arrived: false };
try { const d = JSON.parse(store.get('kk-day') || '[]'); S.day = d.filter((id) => place(id)).slice(0, MAX_DAY); } catch { /* пусто */ }
const matches = (p) => S.mood === 'all' || p.categories.includes(S.mood);
const saveDay = () => store.set('kk-day', JSON.stringify(S.day));

let svg, beam, tipG, card, dayBody, list, chipsEl, segEl, radarEl;

function wedge(a0, a1) {
  const [x0, y0] = pol(a0, R_DISC), [x1, y1] = pol(a1, R_DISC);
  return `M${C} ${C}L${x0.toFixed(1)} ${y0.toFixed(1)}A${R_DISC} ${R_DISC} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}Z`;
}
function riverPath() {
  const a0 = 8, a1 = 112, inner = [], outer = [];
  for (let a = a0; a <= a1; a += 8) { inner.push(pol(a, 236 + 14 * Math.sin(a / 14))); outer.push(pol(a, 340)); }
  const p = (arr) => arr.map((q) => q.map((v) => v.toFixed(1)).join(' ')).join('L');
  return `M${p(inner)}L${p(outer.slice().reverse())}Z`;
}
const inner = (name, s = 16) => `<g transform="translate(${-s / 2} ${-s / 2}) scale(${s / 24})" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</g>`;

function radarSvg() {
  const ticks = Array.from({ length: 24 }, (_, i) => { const a = i * 15, long = a % 90 === 0; const [x0, y0] = pol(a, R_DISC), [x1, y1] = pol(a, R_DISC + (long ? 14 : 7)); return `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="var(--sea-700)" opacity=".5" stroke-width="${long ? 1.6 : 1}"/>`; }).join('');
  const letters = [['С', 0], ['В', 90], ['Ю', 180], ['З', 270]].map(([l, a]) => { const [x, y] = pol(a, R_DISC + 26); return `<text class="r-letter" x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle">${l}</text>`; }).join('');
  const rings = [5, 10, 15].map((m, i) => `<g class="ring-g"><circle class="ring" cx="${C}" cy="${C}" r="${[104, 208, 312][i]}" fill="none" stroke="var(--sea-200)" stroke-width="1"/><text class="r-lab" x="${C}" y="${C - [104, 208, 312][i] + 14}" text-anchor="middle">${m} ${t('near.m', 'МИН')}</text></g>`).join('');
  const [rx, ry] = pol(58, 292);
  const marks = sorted.map((p) => {
    const [x, y] = pol(p.angleDeg, RING_R[p.ringHint]);
    return `<g class="mark" data-id="${p.id}" role="button" tabindex="0" aria-pressed="false" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
      <circle class="m-hit" r="44" fill="transparent"/><g class="m-vis"><circle class="m-halo" r="22" fill="var(--sea-500)" opacity="0"/><circle class="m-ping" r="14" fill="none" stroke="var(--sea-500)" stroke-width="2" opacity="0"/>
      <g class="m-core"><circle class="m-body" r="14"/><g class="m-ic">${inner(p.icon, 16)}</g></g>
      <g class="m-badge"><circle r="8" cx="12" cy="-12" fill="var(--sea-900)"/><text x="12" y="-8.5" text-anchor="middle" class="m-n"></text></g></g></g>`;
  }).join('');
  return `<svg viewBox="-24 -24 688 688" role="group" aria-label="${esc(t('near.radarAria', 'Радар: места рядом с отелем'))}">
    <circle cx="${C}" cy="${C + 6}" r="${R_DISC}" fill="rgba(14,42,59,.08)"/>
    <circle cx="${C}" cy="${C}" r="${R_DISC}" fill="var(--white)" stroke="var(--line)" stroke-width="1.5"/>
    <clipPath id="discClip"><circle cx="${C}" cy="${C}" r="${R_DISC}"/></clipPath>
    <g clip-path="url(#discClip)" aria-hidden="true"><g class="river"><path d="${riverPath()}" fill="rgba(14,42,59,.14)" transform="translate(0 6)"/><path d="${riverPath()}" fill="#BFDCEB"/><path d="${riverPath()}" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.6"/>
      <text class="r-lab" x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" text-anchor="middle" transform="rotate(58 ${rx.toFixed(1)} ${ry.toFixed(1)})">${esc(t('near.amur', 'АМУР'))}</text></g></g>
    <g aria-hidden="true">${rings}${ticks}${letters}</g>
    <g class="beam" aria-hidden="true" clip-path="url(#discClip)"><path d="${wedge(-36, -24)}" fill="var(--sea-500)" opacity=".03"/><path d="${wedge(-24, -12)}" fill="var(--sea-500)" opacity=".06"/><path d="${wedge(-12, 0)}" fill="var(--sea-500)" opacity=".10"/><line x1="${C}" y1="${C}" x2="${C}" y2="${C - R_DISC}" stroke="var(--sea-500)" stroke-width="1.5"/></g>
    <g id="dayRoute" aria-hidden="true"></g>
    <g aria-hidden="true"><circle class="hotel-pulse" cx="${C}" cy="${C}" r="18" fill="var(--accent)"/><circle cx="${C}" cy="${C}" r="18" fill="var(--accent)"/><g transform="translate(${C} ${C})" style="color:#fff">${inner('anchor', 20)}</g></g>
    ${marks}
    <g class="tip" id="radarTip" visibility="hidden" aria-hidden="true"><rect rx="8" height="28" fill="var(--white)" stroke="var(--line)"/><text class="tip-t" y="18" x="10"></text></g>
  </svg>`;
}

// ---------- состояния ----------
function paint({ stagger = false } = {}) {
  let idx = 0;
  sorted.forEach((p) => {
    const g = $(`.mark[data-id="${p.id}"]`, radarEl); if (!g) return;
    const fits = matches(p), awake = S.awake.has(p.id);
    if (fits && awake && stagger) g.style.setProperty('--d', `${idx++ * 70}ms`); else g.style.setProperty('--d', '0ms');
    g.classList.toggle('is-lit', fits && awake);
    g.classList.toggle('is-dim', !fits);
    g.classList.toggle('is-sel', S.sel === p.id);
    const di = S.day.indexOf(p.id);
    g.classList.toggle('in-day', di >= 0);
    $('.m-n', g).textContent = di >= 0 ? di + 1 : '';
    g.setAttribute('aria-pressed', String(S.sel === p.id));
    const when = p.walkMin == null ? '' : `, ${t('near.about', 'около {n} минут пешком', { n: p.walkMin })}`;
    g.setAttribute('aria-label', `${pName(p)}${when}${fits ? '' : ', ' + t('near.notFit', 'не подходит под фильтр')}`);
  });
}
function wakeAll() { PLACES.forEach((p) => S.awake.add(p.id)); }

function drawRoute(animateLast) {
  const g = $('#dayRoute', radarEl); if (!g) return;
  let prev = [C, C], html = '', defs = '';
  S.day.forEach((id, i) => {
    const p = place(id), [x, y] = pol(p.angleDeg, RING_R[p.ringHint]);
    const d = `M${prev[0].toFixed(1)} ${prev[1].toFixed(1)}L${x.toFixed(1)} ${y.toFixed(1)}`;
    defs += `<mask id="rm-${i}" maskUnits="userSpaceOnUse" x="-24" y="-24" width="688" height="688"><path class="rm" d="${d}" pathLength="1" stroke="#fff" stroke-width="10" fill="none" stroke-dasharray="1" stroke-dashoffset="${animateLast && i === S.day.length - 1 && !reduced() ? 1 : 0}"/></mask>`;
    const len = Math.hypot(x - prev[0], y - prev[1]), ang = (Math.atan2(y - prev[1], x - prev[0]) * 180) / Math.PI;
    let crumbs = '';
    for (let l = 48; l < len - 20; l += 48) crumbs += `<path d="M-4 -4L2 0L-4 4" fill="none" stroke="var(--sea-700)" stroke-width="2" stroke-linecap="round" transform="translate(${(prev[0] + ((x - prev[0]) * l) / len).toFixed(1)} ${(prev[1] + ((y - prev[1]) * l) / len).toFixed(1)}) rotate(${ang.toFixed(1)})"/>`;
    html += `<g mask="url(#rm-${i})"><path d="${d}" fill="none" stroke="var(--sea-700)" stroke-width="2.5" stroke-dasharray="6 6" stroke-linecap="round"/>${crumbs}</g>`;
    prev = [x, y];
  });
  g.innerHTML = `<defs>${defs}</defs>${html}`;
  if (animateLast && S.day.length && !reduced()) gsap.to($(`#rm-${S.day.length - 1} .rm`, g), { strokeDashoffset: 0, duration: .5, ease: 'power1.inOut' });   // N6
}

// ---------- панель ----------
function cardHtml() {
  const p = S.sel && place(S.sel);
  if (!p) return `<div class="place-empty">${icon('compass', 40)}<p>${esc(t('near.pick', 'Нажмите на метку на радаре'))}</p></div>`;
  const inDay = S.day.includes(p.id);
  return `<div class="place-img">${p.photo ? `<img src="${esc(p.photo)}" alt="${esc(pName(p))}">` : icon(p.icon, 40)}</div>
    <p class="mono place-min">${esc(minText(p))}${p.distanceM ? ` · ${p.distanceM} М` : ''}</p><h3>${esc(pName(p))}</h3><p class="place-d">${esc(pTeaser(p))}</p>
    <div class="place-btns"><a class="btn btn--secondary btn--sm" href="${esc(p.mapUrl)}" target="_blank" rel="noopener">${esc(t('near.route', 'Построить маршрут'))}</a>
    <button type="button" class="btn-ghost" data-day="${p.id}" aria-pressed="${inDay}">${esc(inDay ? t('near.remove', 'Убрать из моего дня') : t('near.add', 'Добавить в мой день'))}</button></div>
    <p class="small muted place-limit" id="dayLimit" hidden>${esc(t('near.limit', 'Это уже целый день. Уберите одно место, чтобы добавить новое'))}</p>`;
}
function renderCard(animate) {
  const fill = () => { card.innerHTML = cardHtml(); };
  if (animate && !reduced()) gsap.to(card, { opacity: 0, duration: .12, onComplete: () => { fill(); gsap.fromTo(card, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .2, clearProps: 'all' }); } });   // N5
  else fill();
}
function totalText() {
  const ps = S.day.map(place);
  if (ps.some((p) => p.walkMin == null)) return t('near.totalNone', 'Пешком всего: время уточняется');
  return t('near.total', 'Пешком всего: ~{n} мин', { n: ps.reduce((s, p) => s + p.walkMin, 0) });
}
function renderDay() {
  if (!S.day.length) { dayBody.innerHTML = `<div class="place-empty">${icon('compass', 40)}<p>${esc(t('near.dayEmpty', 'Нажимайте «Добавить в мой день» у любого места, и мы сложим маршрут'))}</p></div>`; return; }
  dayBody.innerHTML = `<ol class="day__list">${S.day.map((id, i) => { const p = place(id); return `<li><span class="mono day__n">${String(i + 1).padStart(2, '0')}</span><span class="day__name">${esc(pName(p))}<small class="mono muted">${esc(p.walkMin == null ? '— ' + t('near.minShort', 'МИН') : '~' + p.walkMin + ' ' + t('near.minShort', 'МИН'))}</small></span><button type="button" class="icon-btn" data-rm="${id}" aria-label="${esc(t('near.removeOne', 'Убрать: {n}', { n: pName(p) }))}">${icon('x', 20)}</button></li>`; }).join('')}</ol>
    <p class="day__total">${esc(totalText())}</p><div class="day__btns"><button type="button" class="btn btn--primary btn--sm" data-copy>${icon('copy', 18)}<span>${esc(t('near.copy', 'Скопировать маршрут'))}</span></button><button type="button" class="btn-ghost" data-clear>${esc(t('near.clear', 'Очистить'))}</button></div>`;
  if (!reduced()) gsap.from($$('.day__list li', dayBody).slice(-1), { y: 8, opacity: 0, duration: .2 });
}
function renderList() {
  list.innerHTML = PLACES.map((p) => { const inDay = S.day.includes(p.id); return `<article class="place-card ${matches(p) ? '' : 'is-hide'}"><div class="place-img">${icon(p.icon, 40)}</div><p class="mono place-min">${esc(minText(p))}</p><h3>${esc(pName(p))}</h3><p class="place-d">${esc(pTeaser(p))}</p>
    <div class="place-btns"><a class="btn btn--secondary btn--sm" href="${esc(p.mapUrl)}" target="_blank" rel="noopener">${esc(t('near.route', 'Построить маршрут'))}</a><button type="button" class="btn-ghost" data-day="${p.id}" aria-pressed="${inDay}">${esc(inDay ? t('near.remove', 'Убрать из моего дня') : t('near.add', 'Добавить в мой день'))}</button></div></article>`; }).join('');
}
function renderChips() {
  chipsEl.innerHTML = MOODS.map(([k, l]) => `<button type="button" class="chip" data-mood="${k}" aria-pressed="${S.mood === k}">${esc(t(`near.mood.${k}`, l))}</button>`).join('');
}
function renderSeg() {
  const v = [['map', t('near.viewMap', 'Карта')], ['list', t('near.viewList', 'Список')]];
  segEl.style.setProperty('--n', 2); segEl.style.setProperty('--idx', S.view === 'map' ? 0 : 1);
  segEl.innerHTML = `<span class="seg__thumb" aria-hidden="true"></span>${v.map(([k, l]) => `<button type="button" class="seg__opt" data-nview="${k}" aria-pressed="${S.view === k}">${esc(l)}</button>`).join('')}`;
}

function toggleDay(id) {
  const i = S.day.indexOf(id);
  if (i >= 0) S.day.splice(i, 1);
  else if (S.day.length >= MAX_DAY) { const l = $('#dayLimit'); if (l) l.hidden = false; return; }
  else S.day.push(id);
  saveDay();
  paint(); drawRoute(i < 0); renderDay(); renderCard(false); renderList();
  if (i < 0 && !reduced()) { const b = $(`.mark[data-id="${id}"] .m-badge`, radarEl); if (b) gsap.fromTo(b, { scale: 0, transformOrigin: '12px -12px' }, { scale: 1, duration: .25, ease: 'back.out(2)' }); }  // N6
}
function select(id, { fromList } = {}) {
  S.sel = S.sel === id && !fromList ? S.sel : id;
  paint(); renderCard(true);
  const m = $(`.mark[data-id="${id}"] .m-halo`, radarEl);
  if (m && !reduced()) gsap.fromTo(m, { scale: 1, opacity: .35, transformOrigin: 'center' }, { scale: 1.6, opacity: 0, duration: .5 });     // N5
  if (mqMobile.matches) { const r = card.getBoundingClientRect(); if (r.top > innerHeight - 120 || r.bottom < 0) card.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' }); }
}

function showTip(g) {
  const p = place(g.dataset.id), tg = $('#radarTip', radarEl), tx = $('.tip-t', tg), rect = $('rect', tg);
  tx.textContent = `${pName(p)} · ${p.walkMin == null ? '—' : p.walkMin} ${t('near.minShort', 'МИН')}`;
  tg.setAttribute('visibility', 'visible');
  const w = tx.getComputedTextLength() + 20; rect.setAttribute('width', w);
  const m = g.getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)\)/); let x = +m[1] - w / 2, y = +m[2] - 52;
  x = Math.max(-16, Math.min(656 - w, x)); if (y < -16) y = +m[2] + 24;
  tg.setAttribute('transform', `translate(${x} ${y})`);
  if (!reduced()) gsap.fromTo(tg, { opacity: 0 }, { opacity: 1, duration: .15 });
}
const hideTip = () => $('#radarTip', radarEl)?.setAttribute('visibility', 'hidden');

// ---------- луч (N2, N3) ----------
function loop() {
  let last = null, prevAng = null;
  const period = () => (mqMobile.matches ? 10000 : 8000);
  const tick = (now) => {
    requestAnimationFrame(tick);
    if (!S.visible || document.hidden || reduced()) return;
    const ang = ((now % period()) / period()) * 360;
    beam.setAttribute('transform', `rotate(${ang.toFixed(2)} ${C} ${C})`);
    if (prevAng != null) {
      sorted.forEach((p) => {
        const a = p.angleDeg;
        const crossed = prevAng <= ang ? (prevAng < a && a <= ang) : (a > prevAng || a <= ang);
        if (!crossed) return;
        const g = $(`.mark[data-id="${p.id}"]`, radarEl); if (!g) return;
        const first = !S.awake.has(p.id);
        S.awake.add(p.id);
        if (matches(p)) { g.classList.add('is-lit'); if (first) ping(g); else if (!g.classList.contains('is-dim')) ping(g); }
      });
    }
    prevAng = ang;
  };
  requestAnimationFrame(tick);
}
function ping(g) {
  const c = $('.m-ping', g);
  gsap.fromTo(c, { scale: 1, opacity: .5, transformOrigin: 'center' }, { scale: 2.2, opacity: 0, duration: .7, ease: 'power1.out' });   // N3
}

function mount() {
  radarEl.innerHTML = radarSvg();
  svg = $('svg', radarEl); beam = $('.beam', radarEl);
  if (reduced()) { beam.setAttribute('visibility', 'hidden'); wakeAll(); }
  paint(); drawRoute(false);
}

function switchView(v) {
  if (v === S.view) return;
  const from = S.view === 'map' ? $('#nearMap') : list, to = v === 'map' ? $('#nearMap') : list;
  S.view = v; renderSeg();
  const show = () => { from.hidden = true; to.hidden = false; if (!reduced()) gsap.fromTo(to, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .25, clearProps: 'all' }); };   // N9
  if (reduced()) show(); else gsap.to(from, { opacity: 0, duration: .15, onComplete: () => { gsap.set(from, { clearProps: 'all' }); show(); } });
}

function copyDay() {
  const lines = S.day.map((id, i) => { const p = place(id); return `${i + 1}. ${pName(p)}${p.walkMin == null ? '' : ` (~${p.walkMin} ${t('near.minShort', 'мин').toLowerCase()})`}`; });
  const text = `${t('near.copyHead', 'Мой день в Хабаровске:')}\n${lines.join('\n')}`;
  const done = () => toast(t('near.copied', 'Маршрут скопирован'));
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done, () => fallback(text, done)); else fallback(text, done);
}
function fallback(text, done) { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.append(ta); ta.select(); try { document.execCommand('copy'); done(); } catch { /* нет доступа */ } ta.remove(); }

export function initNearby() {
  radarEl = $('#radar'); card = $('#placeCard'); dayBody = $('#dayBody'); list = $('#nearList'); chipsEl = $('#moodChips'); segEl = $('#nearSeg');
  mount(); renderChips(); renderSeg(); renderCard(false); renderDay(); renderList();

  chipsEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mood]'); if (!b) return;
    S.mood = b.dataset.mood; wakeAll(); renderChips(); paint({ stagger: true }); renderList();               // N7
  });
  segEl.addEventListener('click', (e) => { const b = e.target.closest('[data-nview]'); if (b) switchView(b.dataset.nview); });
  radarEl.addEventListener('click', (e) => { const g = e.target.closest('.mark'); if (g) select(g.dataset.id); });
  radarEl.addEventListener('keydown', (e) => {
    const g = e.target.closest('.mark'); if (!g) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(g.dataset.id); }
    else if (e.key === 'Escape') { S.sel = null; paint(); renderCard(false); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const ms = $$('.mark', radarEl); const i = ms.indexOf(g); ms[(i + (e.key === 'ArrowRight' ? 1 : -1) + ms.length) % ms.length].focus(); }
  });
  radarEl.addEventListener('pointerover', (e) => { const g = e.target.closest('.mark'); if (g && e.pointerType === 'mouse') showTip(g); });
  radarEl.addEventListener('pointerout', (e) => { if (e.target.closest('.mark')) hideTip(); });
  radarEl.addEventListener('focusin', (e) => { const g = e.target.closest('.mark'); if (g) showTip(g); });
  radarEl.addEventListener('focusout', hideTip);
  document.addEventListener('click', (e) => {
    const d = e.target.closest('#nearby [data-day]'); if (d) return toggleDay(d.dataset.day);
    const r = e.target.closest('#nearby [data-rm]'); if (r) { S.day = S.day.filter((x) => x !== r.dataset.rm); saveDay(); paint(); drawRoute(false); renderDay(); renderCard(false); renderList(); return; }
    if (e.target.closest('#nearby [data-copy]')) return copyDay();
    if (e.target.closest('#nearby [data-clear]')) { S.day = []; saveDay(); paint(); drawRoute(false); renderDay(); renderCard(false); renderList(); }
  });

  new IntersectionObserver(([en]) => { S.visible = en.isIntersecting; $('#nearMap').classList.toggle('is-offscreen', !en.isIntersecting); }, { threshold: 0.1 }).observe($('#nearby'));
  // N1: появление радара
  if (!reduced()) {
    gsap.set('#radar svg', { opacity: 0 });
    ScrollTrigger.create({ trigger: '#radar', start: 'top 75%', once: true, onEnter: () => {
      const tl = gsap.timeline();
      tl.fromTo('#radar svg', { opacity: 0, scale: .94, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .5, clearProps: 'transform' })
        .fromTo('#radar .ring', { scale: 0, transformOrigin: `${C}px ${C}px` }, { scale: 1, duration: .7, stagger: .12 }, 0)
        .fromTo('#radar .hotel-pulse', { scale: 0 }, { scale: 1, duration: .4, transformOrigin: 'center', clearProps: 'transform' }, .3);
    } });
  }
  loop();
  onLang(() => { mount(); renderChips(); renderSeg(); renderCard(false); renderDay(); renderList(); });
}
