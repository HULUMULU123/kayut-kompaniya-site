import { gsap, ScrollTrigger, MotionPathPlugin } from './gsap-setup.js';
import { t, onLang } from './i18n.js';
import { icon, ICONS } from './icons.js';
import { $, $$, esc, reduced } from './util.js';

// Схема условная: улицы и маршруты не соответствуют реальной карте (TODO: сверить с OpenStreetMap)
const HOTEL = [440, 330];
const ROUTES = [
  { k: 'station', d: 'M130 130V250H300V330H440', title: ['С вокзала', 'С вокзала'], time: 'Время в пути: уточняется', tip: 'Напишите нам время прибытия: подскажем, как удобнее добраться до ул. Гоголя, 21.' }, // TODO: время и способ
  { k: 'airport', d: 'M0 420H180V330H440', title: ['Из аэропорта', 'Из аэропорта'], time: 'Время в пути: уточняется', tip: 'Позвоните или напишите в WhatsApp: подскажем маршрут от аэропорта до отеля.' },       // TODO
  { k: 'car', d: 'M360 560V410H440V330', title: ['На машине', 'На машине'], time: 'Время в пути: уточняется', tip: 'Охраняемая парковка за шлагбаумом. Условия и стоимость уточняйте при бронировании.' }, // TODO
];
let active = 0, scrubTrigger, tl, mapReady = false;

function mapSvg() {
  const streets = [];
  for (let x = 60; x <= 560; x += 70) streets.push(`<path d="M${x} 150V560"/>`);
  for (let y = 190; y <= 560; y += 60) streets.push(`<path d="M0 ${y}H600"/>`);
  const routes = ROUTES.map((r) => `<g data-route="${r.k}" ${r.k === ROUTES[active].k ? '' : 'opacity="0"'}>
      <mask id="m-${r.k}" maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="560"><path class="reveal-p" d="${r.d}" pathLength="1" stroke="#fff" stroke-width="10" fill="none" stroke-dasharray="1" stroke-dashoffset="1" stroke-linecap="round" stroke-linejoin="round"/></mask>
      <path class="route-p" d="${r.d}" fill="none" stroke="var(--sand-300)" stroke-width="3" stroke-dasharray="8 8" stroke-linecap="round" stroke-linejoin="round" mask="url(#m-${r.k})"/></g>`).join('');
  return `<svg class="map-svg" viewBox="0 0 800 560" role="img" aria-label="${esc(t('route.mapAria', 'Условная схема: путь от вокзала до отеля на ул. Гоголя, 21'))}" preserveAspectRatio="xMidYMid slice">
    <path d="M430 0H800V320C720 300 640 280 600 220S500 90 430 0Z" fill="#0F4A70"/>
    <path d="M470 0C540 90 620 200 650 240S740 310 800 330" fill="none" stroke="#1B6190" stroke-width="1.5" opacity=".7"/>
    <g stroke="#1B4F72" stroke-width="1" fill="none">${streets.join('')}</g>
    <g stroke="#C9DFEC" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"><path d="M520 70L760 150"/><path d="M525 80L765 160" opacity=".5"/><path d="M560 84v14M600 98v14M640 111v14M680 124v14M720 138v14" stroke-width="1.5"/></g>
    <text x="620" y="60">AMUR</text>
    <text x="470" y="215" transform="rotate(-8 470 215)">${esc(t('map.embank', 'Набережная'))}</text>
    <g><circle cx="130" cy="130" r="9" fill="#fff"/><g transform="translate(118 118)" color="#0B3552" fill="none" stroke="#0B3552" stroke-width="1.6">${icon('train-front', 24).replace(/<svg[^>]*>|<\/svg>/g, '')}</g></g>
    <text x="146" y="106">${esc(t('map.station', 'Вокзал'))}</text>
    <text x="236" y="316">${esc(t('map.square', 'Комсомольская пл.'))}</text>
    ${routes}
    <circle class="hotel-pulse" cx="${HOTEL[0]}" cy="${HOTEL[1]}" r="14"/>
    <circle cx="${HOTEL[0]}" cy="${HOTEL[1]}" r="16" fill="var(--accent)"/>
    <g transform="translate(${HOTEL[0] - 11} ${HOTEL[1] - 11}) scale(.9167)" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS.anchor}</g>
    <text x="${HOTEL[0] + 24}" y="${HOTEL[1] + 4}" style="fill:#fff">${esc(t('map.hotel', 'ул. Гоголя, 21'))}</text>
    <g id="boat" class="boat"><path d="M-12 2H12L8 9H-8Z"/><path d="M0 -10V1M0 -10L8 0H0Z"/></g>
  </svg><p class="small map-note">${esc(t('map.note', 'Схема, масштаб не соблюдён'))}</p>`;
}

function panel() {
  const r = ROUTES[active];
  $('#routePanel').innerHTML = `<h3>${esc(t(`route.${r.k}.h`, r.title[0]))}</h3><p class="mono route__time">${esc(t(`route.${r.k}.time`, r.time))}</p><p>${esc(t(`route.${r.k}.tip`, r.tip))}</p>`;
  $('#routePanel').setAttribute('aria-labelledby', `tab-${r.k}`);
}
function tabs() {
  $('#routeTabs').innerHTML = ROUTES.map((r, i) => `<button type="button" class="tab" role="tab" id="tab-${r.k}" aria-selected="${i === active}" aria-controls="routePanel" tabindex="${i === active ? 0 : -1}" data-i="${i}">${esc(t(`route.${r.k}.tab`, r.title[1]))}</button>`).join('');
}

function setupScrub() {
  scrubTrigger?.kill(); tl?.kill();
  const g = $(`[data-route="${ROUTES[active].k}"]`), reveal = $('.reveal-p', g), path = $('.route-p', g), boat = $('#boat');
  gsap.set(reveal, { strokeDashoffset: 1 });
  if (reduced()) { gsap.set(reveal, { strokeDashoffset: 0 }); gsap.set(boat, { motionPath: { path, align: path, alignOrigin: [.5, .5], start: 1, end: 1 } }); return; }
  tl = gsap.timeline({ scrollTrigger: { trigger: '#routeMap', start: 'top 70%', end: 'bottom 45%', scrub: true } });   // A12
  scrubTrigger = tl.scrollTrigger;
  tl.to(reveal, { strokeDashoffset: 0, ease: 'none', duration: 1 }, 0)
    .to(boat, { motionPath: { path, align: path, alignOrigin: [.5, .5], autoRotate: false }, ease: 'none', duration: 1 }, 0);
}

function switchTo(i) {
  if (i === active) return;
  const prev = $(`[data-route="${ROUTES[active].k}"]`);
  active = i;
  $$('.tab').forEach((b, k) => { b.setAttribute('aria-selected', String(k === i)); b.tabIndex = k === i ? 0 : -1; });
  panel();
  scrubTrigger?.kill(); tl?.kill(); scrubTrigger = tl = null;
  const g = $(`[data-route="${ROUTES[i].k}"]`), reveal = $('.reveal-p', g), path = $('.route-p', g), boat = $('#boat');
  if (reduced()) { gsap.set(prev, { opacity: 0 }); gsap.set(g, { opacity: 1 }); gsap.set(reveal, { strokeDashoffset: 0 }); gsap.set(boat, { motionPath: { path, align: path, alignOrigin: [.5, .5], start: 1, end: 1 } }); return; }
  gsap.to(prev, { opacity: 0, duration: .2 });                                                                          // A14
  gsap.set(g, { opacity: 1 }); gsap.set(reveal, { strokeDashoffset: 1 });
  const t2 = gsap.timeline({ delay: .2 });
  t2.to(reveal, { strokeDashoffset: 0, duration: .7, ease: 'power1.inOut' }, 0)
    .to(boat, { motionPath: { path, align: path, alignOrigin: [.5, .5] }, duration: .7, ease: 'power1.inOut' }, 0);
}

export function initRoute() {
  const draw = () => { $('#routeMap').innerHTML = mapSvg(); tabs(); panel(); if (mapReady) { active = Math.min(active, 2); } setupScrub(); mapReady = true; };
  draw();
  $('#routeTabs').addEventListener('click', (e) => { const b = e.target.closest('.tab'); if (b) switchTo(Number(b.dataset.i)); });
  $('#routeTabs').addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const n = ROUTES.length; const i = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : (active + (e.key === 'ArrowRight' ? 1 : -1) + n) % n;
    switchTo(i); $$('.tab')[i].focus();
  });
  onLang(() => { tabs(); panel(); const g = $('#routeMap'); const keep = active; g.innerHTML = mapSvg(); const gg = $(`[data-route="${ROUTES[keep].k}"]`); const rp = $('.reveal-p', gg); gsap.set(rp, { strokeDashoffset: 0 }); const path = $('.route-p', gg); gsap.set('#boat', { motionPath: { path, align: path, alignOrigin: [.5, .5], start: 1, end: 1 } }); });
  new IntersectionObserver(([en]) => $('#routeMap').classList.toggle('is-offscreen', !en.isIntersecting)).observe($('#routeMap'));
}
