import { gsap } from './gsap-setup.js';
import { roomById, roomName, ROOMS } from './rooms.js';
import { state, subscribe } from './state.js';
import { t, tn, getLang } from './i18n.js';
import { icon } from './icons.js';
import { mountBooking, guestsSummary, datesSummary } from './booking.js';
import { submitBooking } from './api.js';
import { $, $$, esc, h, mqMobile, reduced, lockScroll, unlockScroll, trapFocus, fmtFull, nightsBetween, ddmm, ymd, addDays } from './util.js';

let modal, sheet, bodyEl, overlay, release, isOpen = false, onCloseCb, unsub;

export function openModal(node, { wide = false, opener, onClose } = {}) {
  if (isOpen) {
    unsub?.(); unsub = null;
    bodyEl.replaceChildren(node);
    sheet.classList.toggle('is-wide', wide);
    if (opener) modal._opener = opener;
    sheet.scrollTop = 0;
    return;
  }
  isOpen = true; onCloseCb = onClose;
  bodyEl.replaceChildren(node);
  sheet.classList.toggle('is-wide', wide);
  modal.hidden = false; overlay.hidden = false;
  lockScroll();
  const mobile = mqMobile.matches;
  if (reduced()) gsap.fromTo([sheet, overlay], { opacity: 0 }, { opacity: 1, duration: .15 });
  else {
    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: .24 });
    gsap.fromTo(sheet, mobile ? { yPercent: 100 } : { y: 24, opacity: 0 }, { yPercent: 0, y: 0, opacity: 1, duration: .36, ease: 'power2.out' });
  }
  release = trapFocus(modal, { onEscape: () => closeModal(), initial: 'input,textarea,button[data-primary]' });
  modal._opener = opener;
}
export function closeModal(instant) {
  if (!isOpen) return;
  isOpen = false;
  const done = () => {
    modal.hidden = true; overlay.hidden = true;
    gsap.set([sheet, overlay], { clearProps: 'all' });
    unlockScroll();
    unsub?.(); unsub = null;
    release?.(modal._opener); release = null;
    onCloseCb?.(); onCloseCb = null;
  };
  if (instant === true) return done();
  if (reduced()) gsap.to([sheet, overlay], { opacity: 0, duration: .15, onComplete: done });
  else { gsap.to(overlay, { opacity: 0, duration: .2 }); gsap.to(sheet, mqMobile.matches ? { yPercent: 100, duration: .28, ease: 'power2.in', onComplete: done } : { y: 16, opacity: 0, duration: .22, onComplete: done }); }
}

// ---- маска телефона ----
export function formatPhone(raw) {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('7') || d.startsWith('8')) d = d.slice(1);
  d = d.slice(0, 10);
  let out = '+7';
  if (d.length) out += ' (' + d.slice(0, 3);
  if (d.length >= 3) out += ')';
  if (d.length > 3) out += ' ' + d.slice(3, 6);
  if (d.length > 6) out += '-' + d.slice(6, 8);
  if (d.length > 8) out += '-' + d.slice(8, 10);
  return { text: d.length ? out : '', digits: d };
}

const field = (id, label, control, err) => `<div class="field" data-f="${id}"><label class="field__label" for="f-${id}">${esc(label)}</label>${control}<p class="field__err" id="e-${id}" role="alert">${icon('circle-alert', 16)}<span>${esc(err)}</span></p></div>`;

export function openBookingModal({ roomId = null, opener } = {}) {
  const r = roomId ? roomById(roomId) : null;
  const root = h(`<div>
    <h2 id="modalTitle">${esc(t('modal.title', 'Заявка на бронь'))}</h2>
    <form class="modal__form" novalidate>
      <div class="summary" aria-label="${esc(t('modal.summary', 'Сводка'))}">
        <div class="summary__row"><span>${esc(t('modal.cabin', 'Каюта'))}</span><b data-s="cabin"></b></div>
        <div class="summary__row"><span>${esc(t('modal.dates', 'Даты'))}</span><b data-s="dates"></b></div>
        <div class="summary__row"><span>${esc(t('modal.guests', 'Гости'))}</span><b data-s="guests"></b></div>
        <p class="field__err" id="e-dates" role="alert" style="display:none">${icon('circle-alert', 16)}<span>${esc(t('err.out', 'Выберите дату выезда'))}</span></p>
        <button type="button" class="btn-ghost summary__edit" data-edit aria-expanded="false">${esc(t('modal.edit', 'Изменить'))}</button>
        <div class="summary__mini" data-mini hidden></div>
      </div>
      ${field('name', t('modal.name', 'Ваше имя'), '<input class="input" id="f-name" name="name" autocomplete="name" required aria-describedby="e-name">', t('err.name', 'Подскажите, как к вам обращаться'))}
      ${field('phone', t('modal.phone', 'Телефон'), '<input class="input" id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 (___) ___-__-__" required aria-describedby="e-phone">', t('err.phone', 'Укажите телефон, чтобы администратор мог подтвердить бронь'))}
      <div class="field"><label class="field__label" for="f-comment">${esc(t('modal.comment', 'Комментарий'))} <span class="muted" style="font-weight:400">(${esc(t('modal.opt', 'необязательно'))})</span></label><textarea class="input" id="f-comment" name="comment" rows="3"></textarea></div>
      <button class="btn btn--primary btn--block" type="submit" data-primary><span>${esc(t('modal.send', 'Отправить заявку'))}</span><span class="btn__arrow">${icon('arrow-right', 20)}</span><span class="btn__spin">${icon('loader-circle', 18)}</span></button>
    </form>
    <p class="modal__demo">${esc(t('modal.demo', 'Демо-режим: заявка не отправляется'))}</p>
  </div>`);
  const form = $('form', root);
  const upd = () => {
    $('[data-s="cabin"]', root).textContent = r ? roomName(r) : t('modal.any', 'Подберём при подтверждении');
    $('[data-s="dates"]', root).textContent = state.checkIn && state.checkOut ? `${fmtFull(state.checkIn)} → ${fmtFull(state.checkOut)}` : datesSummary();
    $('[data-s="guests"]', root).textContent = guestsSummary();
    const ok = state.checkIn && state.checkOut;
    $('#e-dates', root).style.display = ok ? 'none' : 'flex';
  };
  upd();
  unsub = subscribe(upd);
  const mini = $('[data-mini]', root);
  $('[data-edit]', root).addEventListener('click', (e) => {
    const open = mini.hidden;
    mini.hidden = !open;
    e.currentTarget.setAttribute('aria-expanded', String(open));
    if (open && !mini.firstChild) mountBooking(mini, 'mini');
  });
  const name = $('#f-name', root), phone = $('#f-phone', root);
  const vName = () => name.value.trim().length >= 2;
  const vPhone = () => formatPhone(phone.value).digits.length === 10;
  const mark = (id, ok) => { const f = $(`[data-f="${id}"]`, root); f.classList.toggle('has-error', !ok); $('.input', f).setAttribute('aria-invalid', String(!ok)); };
  name.addEventListener('blur', () => mark('name', vName()));
  name.addEventListener('input', () => { if (vName()) mark('name', true); });
  phone.addEventListener('blur', () => mark('phone', vPhone()));
  phone.addEventListener('input', () => { const f = formatPhone(phone.value); phone.value = f.text; if (vPhone()) mark('phone', true); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const okN = vName(), okP = vPhone(), okD = !!(state.checkIn && state.checkOut);
    mark('name', okN); mark('phone', okP); upd();
    if (!okN) return name.focus();
    if (!okP) return phone.focus();
    if (!okD) { mini.hidden = false; if (!mini.firstChild) mountBooking(mini, 'mini'); $('[data-edit]', root).setAttribute('aria-expanded', 'true'); return $('[data-dates]', mini)?.focus(); }
    const btn = $('[data-primary]', root);
    btn.classList.add('is-loading');
    const payload = { name: name.value.trim(), phone: formatPhone(phone.value).text, comment: $('#f-comment', root).value.trim(), roomId: r?.id || null, checkIn: state.checkIn, checkOut: state.checkOut, adults: state.adults, children: state.children };
    await submitBooking(payload);
    showTicket(payload, r);
  });
  openModal(root, { opener });
}

// ---- билет ----
function deckName(d) { return { top: t('deck.top', 'верхняя'), main: t('deck.main', 'главная'), lower: t('deck.lower', 'нижняя') }[d] || '—'; }

function ticketNode(p, r) {
  const nights = nightsBetween(p.checkIn, p.checkOut);
  const guests = p.adults + p.children;
  const idx = r ? ROOMS.indexOf(r) + 1 : 0;
  const flight = `${t('ticket.flightPre', 'КК')}-${ddmm(p.checkIn)}${idx ? ` · №${String(idx).padStart(2, '0')}` : ''}`;
  return h(`<div class="ticket" data-ticket>
    <div class="ticket__main">
      <div class="ticket__top">${icon('anchor', 28)}<span class="mono">${esc(t('ticket.head', 'Посадочный талон · Кают-компания'))}</span></div>
      <div class="ticket__grid">
        <div class="ticket__cabin"><span class="ticket__k mono">${esc(t('ticket.cabin', 'Каюта'))}</span><span class="ticket__v">${esc(r ? roomName(r) : t('modal.any', 'Подберём при подтверждении'))}</span>
          <span class="ticket__deck mono">${esc(t('ticket.deck', 'Палуба'))}: ${esc(r ? deckName(r.deck) : '—')}</span></div>
        <div><span class="ticket__k mono">${esc(t('ticket.pax', 'Пассажир'))}</span><span class="ticket__v">${esc(p.name)}</span></div>
        <div><span class="ticket__k mono">${esc(t('ticket.in', 'Заезд'))}</span><span class="ticket__v">${fmtFull(p.checkIn)}</span></div>
        <div><span class="ticket__k mono">${esc(t('ticket.out', 'Выезд'))}</span><span class="ticket__v">${fmtFull(p.checkOut)}</span></div>
        <div><span class="ticket__k mono">${esc(t('ticket.nights', 'Ночей'))}</span><span class="ticket__v">${nights}</span></div>
        <div><span class="ticket__k mono">${esc(t('ticket.guests', 'Гостей'))}</span><span class="ticket__v">${guests}</span></div>
        <div><span class="ticket__k mono">${esc(t('ticket.flight', 'Рейс'))}</span><span class="ticket__v mono" style="font-size:.875rem">${esc(flight)}</span></div>
      </div>
      <p class="ticket__addr mono">${esc(t('ticket.addr', 'Хабаровск, ул. Гоголя, 21'))}</p>
    </div>
    <div class="ticket__stub"><svg data-tiger width="56" height="38" viewBox="0 0 96 64" aria-hidden="true"></svg><div class="ticket__bars" aria-hidden="true"></div><span class="mono">${esc(t('ticket.show', 'Покажите на ресепшене'))}</span></div>
    <div class="stamp" data-stamp aria-hidden="true"><span>${esc(t('ticket.stamp', 'Заявка принята'))}</span></div>
  </div>`);
}

async function showTicket(p, r) {
  const { TIGER } = await import('./graphics.js');
  const wrap = h(`<div class="ticket-wrap">
    <div style="display:flex;align-items:center;gap:12px;align-self:flex-start">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="var(--ok)" stroke-width="1.5"/><path class="ok-check" d="M7 12.5l3.2 3.2L17 9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg>
      <h2 id="modalTitle" tabindex="-1" style="margin:0;padding:0">${esc(t('modal.okTitle', 'Заявка принята'))}</h2></div>
    <p style="align-self:flex-start;color:var(--ink-muted)">${esc(t('modal.okText', 'Администратор свяжется с вами по указанному телефону'))}</p>
    <div class="slot" data-slot></div>
    <div class="ticket-actions">
      <button type="button" class="btn btn--primary" data-png><span>${esc(t('ticket.png', 'Сохранить как картинку'))}</span><span class="btn__arrow">${icon('download', 20)}</span><span class="btn__spin">${icon('loader-circle', 18)}</span></button>
      <button type="button" class="btn btn--secondary" data-ics>${icon('calendar-plus', 20)}<span>${esc(t('ticket.ics', 'Добавить в календарь'))}</span></button>
      <a class="btn-ghost" href="https://wa.me/79098007766" rel="noopener">${esc(t('cta.wa', 'Написать в WhatsApp'))}</a>
    </div>
    <button type="button" class="btn-ghost" data-close>${esc(t('cta.close', 'Закрыть'))}</button>
    <p class="modal__demo" style="margin:0">${esc(t('modal.demo', 'Демо-режим: заявка не отправляется'))}</p>
  </div>`);
  const ticket = ticketNode(p, r);
  $('[data-tiger]', ticket).innerHTML = TIGER;
  $('[data-slot]', wrap).append(ticket);
  openModal(wrap, { wide: true, opener: modal._opener });
  $('[data-close]', wrap).onclick = () => closeModal();
  $('[data-png]', wrap).onclick = async (e) => {
    const b = e.currentTarget; b.classList.add('is-loading');
    try {
      const { toPng } = await import('html-to-image');
      const url = await toPng(ticket, { pixelRatio: 2, cacheBust: true, backgroundColor: '#FBF9F4' });
      const a = document.createElement('a'); a.href = url; a.download = 'kayut-kompaniya-bilet.png'; a.click();
    } catch (err) { console.warn(err); } finally { b.classList.remove('is-loading'); }
  };
  $('[data-ics]', wrap).onclick = () => {
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kayut-Kompaniya//Demo//RU', 'BEGIN:VEVENT', `UID:${Date.now()}@kayut-kompaniya.demo`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`, `DTSTART;VALUE=DATE:${ymd(p.checkIn)}`, `DTEND;VALUE=DATE:${ymd(p.checkOut)}`,
      `SUMMARY:Кают-компания: ${r ? r.cabinName : 'бронь'}`, 'LOCATION:Хабаровск\\, ул. Гоголя\\, 21', 'DESCRIPTION:Демо-заявка (не отправлялась)', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' })); a.download = 'kayut-kompaniya-zaezd.ics'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const check = $('.ok-check', wrap), stamp = $('[data-stamp]', ticket);
  $('#modalTitle', wrap).focus({ preventScroll: true });
  if (reduced()) { gsap.set(check, { strokeDashoffset: 0 }); return; }
  gsap.set(stamp, { opacity: 0 });
  gsap.set(ticket, { yPercent: -105 });
  gsap.timeline()
    .to(check, { strokeDashoffset: 0, duration: .5, ease: 'power1.out' }, 0)           // A21
    .to(ticket, { yPercent: 0, duration: .7, ease: 'power2.out' }, .25)                // A30
    .fromTo(stamp, { scale: 1.4, rotate: -20, opacity: 0 }, { scale: 1, rotate: -8, opacity: 1, duration: .35, ease: 'power3.out' }, '>+0.3'); // A31
}

export function initModal() {
  modal = $('#modal'); sheet = $('#modalSheet'); bodyEl = $('#modalBody'); overlay = $('#overlay');
  $('#modalClose').addEventListener('click', () => closeModal());
  modal.addEventListener('pointerdown', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open-booking]');
    if (b) { e.preventDefault(); const menu = $('#menu'); if (!menu.hidden) menu.dispatchEvent(new Event('kk-close')); openBookingModal({ opener: b }); }
  });
}
