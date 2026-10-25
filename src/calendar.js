import { state, set } from './state.js';
import { t, tn, getLang } from './i18n.js';
import { icon } from './icons.js';
import { startOfDay, addDays, sameDay, nightsBetween, mqMobile, trapFocus, lockScroll, unlockScroll, $, $$ } from './util.js';

const MAX_NIGHTS = 30;
let pop, anchor, viewMonth, releaseTrap, overlayEl;

export function placePop(el, a, width) {
  const r = a.getBoundingClientRect();
  const w = width || el.offsetWidth;
  let left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
  let top = r.bottom + 8;
  const hgt = el.offsetHeight;
  if (top + hgt > window.innerHeight - 8 && r.top - hgt - 8 > 8) top = r.top - hgt - 8;
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

function monthName(d) {
  return `${d.toLocaleDateString(getLang() === 'ru' ? 'ru-RU' : 'en-GB', { month: 'long' })} ${d.getFullYear()}`;
}
function dowNames() {
  const base = new Date(2024, 0, 1); // понедельник
  return Array.from({ length: 7 }, (_, i) => addDays(base, i).toLocaleDateString(getLang() === 'ru' ? 'ru-RU' : 'en-GB', { weekday: 'short' }).replace('.', ''));
}

function monthHtml(first, idx, count) {
  const today = startOfDay(new Date());
  const y = first.getFullYear(), m = first.getMonth();
  const lead = (new Date(y, m, 1).getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const { checkIn, checkOut } = state;
  const hardMax = checkIn && !checkOut ? addDays(checkIn, MAX_NIGHTS) : null;
  let cells = '';
  for (let i = 0; i < lead; i++) cells += '<span></span>';
  for (let d = 1; d <= days; d++) {
    const date = new Date(y, m, d);
    const dis = date < today || (hardMax && date > hardMax);
    const cls = ['cal__day'];
    if (sameDay(date, today)) cls.push('is-today');
    if (checkIn && sameDay(date, checkIn)) cls.push('is-start');
    if (checkOut && sameDay(date, checkOut)) cls.push('is-end');
    if (checkIn && checkOut && date > checkIn && date < checkOut) cls.push('in-range');
    const sel = (checkIn && sameDay(date, checkIn)) || (checkOut && sameDay(date, checkOut));
    cells += `<button type="button" class="${cls.join(' ')}" data-date="${date.getTime()}" ${dis ? 'disabled' : ''} aria-pressed="${sel ? 'true' : 'false'}" aria-label="${date.toLocaleDateString(getLang() === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}"><span>${d}</span></button>`;
  }
  const prevDis = idx === 0 && first <= new Date(today.getFullYear(), today.getMonth(), 1);
  return `<div class="cal__month">
    <div class="cal__head">
      ${idx === 0 ? `<button type="button" class="cal__nav" data-nav="-1" aria-label="${t('cal.prev', 'Предыдущий месяц')}" ${prevDis ? 'disabled' : ''}><span style="transform:scaleX(-1);display:inline-flex">${icon('arrow-right', 20)}</span></button>` : '<span style="width:44px"></span>'}
      <span>${monthName(first)}</span>
      ${idx === count - 1 ? `<button type="button" class="cal__nav" data-nav="1" aria-label="${t('cal.next', 'Следующий месяц')}">${icon('arrow-right', 20)}</button>` : '<span style="width:44px"></span>'}
    </div>
    <div class="cal__grid" role="grid">${dowNames().map((n) => `<span class="cal__dow">${n}</span>`).join('')}${cells}</div>
  </div>`;
}

function footText() {
  const { checkIn, checkOut } = state;
  if (checkIn && checkOut) { const n = nightsBetween(checkIn, checkOut); return `${n} ${tn('nights', n, 'ночь|ночи|ночей')}`; }
  return t('cal.pickOut', 'Выберите дату выезда');
}

function render(focusDate) {
  const sheet = mqMobile.matches;
  const count = sheet ? 1 : 2;
  const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const months = Array.from({ length: count }, (_, i) => monthHtml(new Date(first.getFullYear(), first.getMonth() + i, 1), i, count)).join('');
  pop.innerHTML = `<div class="cal"><div class="cal__months">${months}</div>
    <div class="cal__foot"><span class="cal__hint" aria-live="polite">${footText()}</span><button type="button" class="btn btn--primary btn--sm cal__done" data-done>${t('cal.done', 'Готово')}</button></div></div>`;
  if (focusDate) $(`[data-date="${focusDate}"]`, pop)?.focus();
}

function pick(ms) {
  const d = new Date(Number(ms));
  const { checkIn, checkOut } = state;
  if (!checkIn || checkOut || d <= checkIn) set({ checkIn: d, checkOut: null }, { from: 'cal' });
  else {
    if (nightsBetween(checkIn, d) > MAX_NIGHTS) set({ checkIn: d, checkOut: null }, { from: 'cal' });
    else set({ checkOut: d }, { from: 'cal' });
  }
  render(ms);
  if (state.checkIn && state.checkOut && !mqMobile.matches) setTimeout(close, 220);
}

function onKey(e) {
  const b = e.target.closest?.('.cal__day');
  if (!b) return;
  const map = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
  if (!(e.key in map)) return;
  e.preventDefault();
  const target = addDays(new Date(Number(b.dataset.date)), map[e.key]);
  const btn = $(`[data-date="${target.getTime()}"]`, pop);
  if (btn && !btn.disabled) btn.focus();
  else if (!btn) {
    viewMonth = new Date(target.getFullYear(), target.getMonth() - (mqMobile.matches ? 0 : (target < viewMonth ? 0 : 1)), 1);
    if (target < startOfDay(new Date())) return;
    render(target.getTime());
  }
}

export function openCalendar(a, onClose) {
  if (pop && !pop.hidden) { close(); }
  anchor = a;
  anchor.setAttribute('aria-expanded', 'true');
  anchor.classList.add('is-open');
  pop = pop || document.createElement('div');
  pop.className = 'pop pop--cal';
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', t('cal.title', 'Выбор дат'));
  pop.hidden = false;
  if (!pop.isConnected) document.body.append(pop);
  viewMonth = state.checkIn || startOfDay(new Date());
  pop.onclick = (e) => {
    const nav = e.target.closest('[data-nav]');
    if (nav) { viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + Number(nav.dataset.nav), 1); render(); $('[data-nav]:not(:disabled)', pop)?.focus(); return; }
    const day = e.target.closest('.cal__day');
    if (day && !day.disabled) return pick(day.dataset.date);
    if (e.target.closest('[data-done]')) close();
  };
  pop.onkeydown = onKey;
  render();
  const sheet = mqMobile.matches;
  pop.classList.toggle('pop--sheet', sheet);
  pop.closeCb = onClose;
  if (sheet) {
    overlayEl = $('#overlay'); overlayEl.hidden = false; overlayEl.onclick = close;
    lockScroll();
    pop.style.left = ''; pop.style.top = '';
    releaseTrap = trapFocus(pop, { onEscape: close, initial: '.is-start' });
  } else {
    pop.style.width = 'auto';
    placePop(pop, anchor, pop.offsetWidth);
    document.addEventListener('keydown', escHandler, true);
    setTimeout(() => document.addEventListener('pointerdown', outside, true));
    window.addEventListener('resize', close, { once: true });
    $('.is-start', pop)?.focus() || $('.cal__day:not(:disabled)', pop)?.focus();
  }
}
const escHandler = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(true); } };
const outside = (e) => { if (!pop.contains(e.target) && !anchor.contains(e.target)) close(); };

export function close(refocus) {
  if (!pop || pop.hidden) return;
  pop.hidden = true;
  anchor?.setAttribute('aria-expanded', 'false');
  anchor?.classList.remove('is-open');
  document.removeEventListener('keydown', escHandler, true);
  document.removeEventListener('pointerdown', outside, true);
  if (mqMobile.matches && releaseTrap) {
    releaseTrap(anchor); releaseTrap = null; unlockScroll();
    if (overlayEl) { overlayEl.hidden = true; overlayEl.onclick = null; }
  } else if (refocus) anchor?.focus();
  pop.closeCb?.();
}
