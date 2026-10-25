import { state, set, subscribe, snapshotQuery } from './state.js';
import { t, tn, onLang } from './i18n.js';
import { icon } from './icons.js';
import { openCalendar, placePop, close as closeCal } from './calendar.js';
import { chipForGuests } from './rooms.js';
import { nightsBetween, fmtShort, scrollToEl, $, $$, esc, h, clamp } from './util.js';
import { getLang } from './i18n.js';

const instances = [];
let guestPop, guestAnchor;

function datesLabel() {
  const l = getLang();
  const a = state.checkIn ? fmtShort(state.checkIn, l) : t('bk.in', 'Заезд');
  const b = state.checkOut ? fmtShort(state.checkOut, l) : t('bk.out', 'Выезд');
  return `${a} → ${b}`;
}
function guestsLabel() {
  const a = state.adults, c = state.children;
  return `${a} ${tn('adults', a, 'взрослый|взрослых|взрослых')}, ${c} ${tn('kids', c, 'ребёнок|ребёнка|детей')}`;
}
export const guestsSummary = guestsLabel;
export const datesSummary = datesLabel;

function build(host, variant) {
  const mini = variant === 'mini';
  const prev = instances.findIndex((i) => i.host === host);
  if (prev >= 0) instances.splice(prev, 1);
  const uid = Math.random().toString(36).slice(2, 7);
  host.innerHTML = `<form class="bk ${mini ? 'bk--mini' : ''}" novalidate>
    ${mini ? '' : `<div class="seg" style="--n:2" role="group" aria-label="${esc(t('bk.mode', 'Что бронируем'))}" data-seg="mode">
      <span class="seg__thumb" aria-hidden="true"></span>
      <button type="button" class="seg__opt" data-v="whole">${esc(t('bk.whole', 'Каюта целиком'))}</button>
      <button type="button" class="seg__opt" data-v="bunk">${esc(t('bk.bunk', 'Койка в кубрике'))}</button></div>
    <div class="bk__row bk__row--who" data-gender-row hidden>
      <div class="field"><span class="field__label">${esc(t('bk.who', 'Для кого'))}</span>
        <div class="seg" style="--n:2" role="group" aria-label="${esc(t('bk.who', 'Для кого'))}" data-seg="gender"><span class="seg__thumb" aria-hidden="true"></span>
        <button type="button" class="seg__opt" data-v="male">${esc(t('bk.male', 'Мужской'))}</button>
        <button type="button" class="seg__opt" data-v="female">${esc(t('bk.female', 'Женский'))}</button></div></div></div>`}
    <div class="bk__row">
      <div class="field" data-field="dates">
        <span class="field__label field__label--row" id="dl-${uid}">${esc(t('bk.dates', 'Даты проживания'))}<span class="bk__nights" aria-live="polite"></span></span>
        <button type="button" class="input" data-dates aria-haspopup="dialog" aria-expanded="false" aria-labelledby="dl-${uid} dv-${uid}">${icon('calendar-days', 20)}<span class="input__val" id="dv-${uid}"></span></button>
        <p class="field__err" role="alert">${icon('circle-alert', 16)}<span>${esc(t('err.out', 'Выберите дату выезда'))}</span></p>
      </div>
      <div class="field">
        <span class="field__label" id="gl-${uid}">${esc(t('bk.guests', 'Гости'))}</span>
        <button type="button" class="input" data-guests aria-haspopup="dialog" aria-expanded="false" aria-labelledby="gl-${uid} gv-${uid}">${icon('users', 20)}<span class="input__val" id="gv-${uid}"></span></button>
      </div>
      ${mini ? '' : `<button type="submit" class="btn btn--primary btn--lg bk__go"><span class="btn__compass" data-compass>${icon('compass', 20)}</span><span>${esc(t('bk.find', 'Найти каюту'))}</span><span class="btn__arrow">${icon('arrow-right', 20)}</span></button>`}
    </div></form>`;
  const form = $('form', host);
  const inst = { host, form, mini };
  instances.push(inst);

  $$('[data-seg]', form).forEach((seg) => seg.addEventListener('click', (e) => {
    const b = e.target.closest('[data-v]'); if (!b) return;
    set({ [seg.dataset.seg]: b.dataset.v });
  }));
  $('[data-dates]', form).addEventListener('click', (e) => openCalendar(e.currentTarget, () => { sync(); validateDates(inst); }));
  $('[data-guests]', form).addEventListener('click', (e) => openGuests(e.currentTarget));
  form.addEventListener('submit', (e) => { e.preventDefault(); if (!mini) submit(inst); });
  sync();
  return inst;
}

function validateDates(inst, show = true) {
  const ok = !!(state.checkIn && state.checkOut);
  $('[data-field="dates"]', inst.form).classList.toggle('has-error', show && !ok);
  return ok;
}

function submit(inst) {
  if (!validateDates(inst)) { $('[data-dates]', inst.form).focus(); return; }
  const btn = $('.bk__go', inst.form);
  btn.classList.add('is-loading');
  const auto = chipForGuests({ mode: state.mode, adults: state.adults, children: state.children });
  set({ query: snapshotQuery(), searched: true, filter: auto, chipAuto: true }, { search: true });
  setTimeout(() => btn.classList.remove('is-loading'), 400);
  scrollToEl(document.getElementById('rooms'));
}

function sync() {
  instances.forEach(({ form }) => {
    $$('[data-seg]', form).forEach((seg) => {
      const key = seg.dataset.seg;
      const opts = $$('[data-v]', seg);
      const idx = Math.max(0, opts.findIndex((o) => o.dataset.v === state[key]));
      seg.style.setProperty('--idx', idx);
      opts.forEach((o, i) => o.setAttribute('aria-pressed', String(i === idx)));
    });
    const gr = $('[data-gender-row]', form);
    if (gr) gr.hidden = state.mode !== 'bunk';
    const dv = $('[data-dates] .input__val', form);
    dv.textContent = datesLabel();
    dv.classList.toggle('is-empty', !state.checkIn);
    $('[data-guests] .input__val', form).textContent = guestsLabel();
    const n = state.checkIn && state.checkOut ? nightsBetween(state.checkIn, state.checkOut) : 0;
    $('.bk__nights', form).textContent = n ? `· ${n} ${tn('nights', n, 'ночь|ночи|ночей')}` : '';
    if (state.checkOut) $('[data-field="dates"]', form).classList.remove('has-error');
  });
}

function openGuests(a) {
  if (guestPop && !guestPop.hidden && guestAnchor === a) return closeGuests();
  closeCal(); closeGuests();
  guestAnchor = a;
  a.setAttribute('aria-expanded', 'true'); a.classList.add('is-open');
  guestPop = guestPop || document.createElement('div');
  guestPop.className = 'pop pop--guests';
  guestPop.setAttribute('role', 'dialog');
  guestPop.setAttribute('aria-label', t('bk.guests', 'Гости'));
  guestPop.hidden = false;
  if (!guestPop.isConnected) document.body.append(guestPop);
  const row = (key, label, sub, min, max) => `<div class="stepper-row"><div><b>${esc(label)}</b><small>${esc(sub)}</small></div>
    <div class="stepper"><button type="button" data-step="${key}:-1" aria-label="${esc(t('bk.less', 'Меньше'))}: ${esc(label)}">${icon('minus', 20)}</button><output data-out="${key}" aria-live="polite"></output><button type="button" data-step="${key}:1" aria-label="${esc(t('bk.more', 'Больше'))}: ${esc(label)}">${icon('plus', 20)}</button></div></div>`;
  guestPop.innerHTML = row('adults', t('bk.adults', 'Взрослые'), t('bk.adultsSub', 'от 1 до 8'), 1, 8) + row('children', t('bk.kids', 'Дети'), t('bk.kidsSub', 'от 0 до 4'), 0, 4);
  const upd = () => {
    $('[data-out="adults"]', guestPop).textContent = state.adults;
    $('[data-out="children"]', guestPop).textContent = state.children;
    $('[data-step="adults:-1"]', guestPop).disabled = state.adults <= 1;
    $('[data-step="adults:1"]', guestPop).disabled = state.adults >= 8;
    $('[data-step="children:-1"]', guestPop).disabled = state.children <= 0;
    $('[data-step="children:1"]', guestPop).disabled = state.children >= 4;
  };
  guestPop.onclick = (e) => {
    const b = e.target.closest('[data-step]'); if (!b || b.disabled) return;
    const [k, d] = b.dataset.step.split(':');
    set({ [k]: clamp(state[k] + Number(d), k === 'adults' ? 1 : 0, k === 'adults' ? 8 : 4) });
    upd();
    $(`[data-step="${b.dataset.step}"]`, guestPop)?.disabled ? $(`[data-step="${k}:${-Number(d)}"]`, guestPop)?.focus() : 0;
  };
  upd();
  placePop(guestPop, a, 300);
  $('[data-step]:not(:disabled)', guestPop).focus();
  guestPop.onkeydown = (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeGuests(true); } };
  setTimeout(() => document.addEventListener('pointerdown', outsideG, true));
  window.addEventListener('resize', () => closeGuests(), { once: true });
}
const outsideG = (e) => { if (!guestPop.contains(e.target) && !guestAnchor.contains(e.target)) closeGuests(); };
function closeGuests(refocus) {
  if (!guestPop || guestPop.hidden) return;
  guestPop.hidden = true;
  guestAnchor.setAttribute('aria-expanded', 'false'); guestAnchor.classList.remove('is-open');
  document.removeEventListener('pointerdown', outsideG, true);
  if (refocus) guestAnchor.focus();
}

export function mountBooking(host, variant) {
  const inst = build(host, variant);
  return inst;
}
export function initBookingCards() {
  $$('[data-booking]').forEach((host) => mountBooking(host, 'full'));
  subscribe(() => sync());
  onLang(() => {
    instances.filter((i) => !i.mini && i.host.isConnected).map((i) => i.host).forEach((hh) => build(hh, 'full'));
    sync();
  });
}
export { validateDates };
