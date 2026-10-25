import { gsap } from './gsap-setup.js';
import { roomById, roomName, roomDesc, roomPass, roomNotes, roomAlt, priceHtml, picture, wireSkeletons, AMEN, ROOMS } from './rooms.js';
import { set, state } from './state.js';
import { t } from './i18n.js';
import { icon } from './icons.js';
import { $, $$, esc, mqMobile, reduced, lockScroll, unlockScroll, trapFocus } from './util.js';
import { openBookingModal } from './modal.js';

let el, body, foot, overlay, release, openId = null, opener = null, busy = false, img = 0;

const heading = () => $('#drawerTitle');

function content(r) {
  const photos = r.photos;
  const amen = r.amenities.map((k) => AMEN[k]).filter(Boolean).map(([ic, key, def]) => `<li>${icon(ic, 20)}<span>${esc(t(key, def))}</span></li>`).join('');
  const notes = roomNotes(r);
  return `<div class="dr-gallery">
      <div class="dr-main skel" data-main>${picture(photos[0], { alt: roomAlt(r), sizes: '(min-width:768px) 560px, 100vw', eager: true })}</div>
      ${photos.length > 1 ? `<div class="dr-thumbs" role="group" aria-label="${esc(t('dr.photos', 'Фотографии'))}">${photos.map((p, i) => `<button type="button" class="dr-thumb" data-th="${i}" aria-label="${esc(t('dr.photo', 'Фото {n}', { n: i + 1 }))}" aria-current="${i === 0}">${picture(p, { alt: '', sizes: '72px' })}</button>`).join('')}</div>` : ''}
    </div>
    <div class="dr-body">
      <p class="mono muted">${esc(roomPass(r).join(' · '))}</p>
      <h2 id="drawerTitle" tabindex="-1">${esc(roomName(r))}</h2>
      <p>${esc(roomDesc(r))}</p>
      <section class="dr-section"><h3>${esc(t('dr.inside', 'Что в каюте'))}</h3><ul class="amen-list">${amen}</ul></section>
      ${notes.length ? `<section class="dr-section"><h3>${esc(t('dr.important', 'Важно'))}</h3><div class="notes">${notes.map((n) => `<p>${esc(n)}</p>`).join('')}</div></section>` : ''}
    </div>`;
}

function setImage(r, i) {
  img = (i + r.photos.length) % r.photos.length;
  const main = $('[data-main]', el);
  main.classList.remove('is-loaded');
  main.innerHTML = picture(r.photos[img], { alt: roomAlt(r), sizes: '(min-width:768px) 560px, 100vw', eager: true });
  wireSkeletons(main);
  $$('.dr-thumb', el).forEach((b, k) => b.setAttribute('aria-current', String(k === img)));
}

export function openCabin(id, from, { fromHash } = {}) {
  const r = roomById(id);
  if (!r || busy) return;
  if (openId) { if (openId === r.id) return; finishClose(true); }
  openId = r.id; opener = from || document.activeElement; img = 0;
  body.innerHTML = content(r);
  foot.innerHTML = `<div class="drawer__price">${priceHtml(r)}</div><button type="button" class="btn btn--primary" data-book>${esc(t('dr.book', 'Забронировать каюту'))}<span class="btn__arrow">${icon('arrow-right', 20)}</span></button>`;
  wireSkeletons(body);
  body.scrollTop = 0;
  body.onclick = (e) => { const th = e.target.closest('[data-th]'); if (th) setImage(r, Number(th.dataset.th)); };
  $('[data-book]', foot).onclick = () => { const o = opener; close({ onDone: () => openBookingModal({ roomId: r.id, opener: o }) }); };
  bindSwipe(r);
  el.hidden = false; overlay.hidden = false;
  lockScroll();
  set({ selected: r.id });
  if (!fromHash) history.replaceState(null, '', `#cabin=${r.id}`);
  const mobile = mqMobile.matches;
  busy = true;
  if (reduced()) { gsap.fromTo([el, overlay], { opacity: 0 }, { opacity: 1, duration: .15, onComplete: () => { busy = false; } }); }
  else {
    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: .24 });
    gsap.fromTo(el, mobile ? { yPercent: 100 } : { xPercent: 100 }, { yPercent: 0, xPercent: 0, duration: .36, ease: 'power2.out', onComplete: () => { busy = false; } });
  }
  release = trapFocus(el, { onEscape: () => close(), initial: '#drawerTitle' });
}

function finishClose(instant, onDone) {
  el.hidden = true;
  gsap.set(el, { clearProps: 'all' });
  if (!onDone) { overlay.hidden = true; gsap.set(overlay, { clearProps: 'all' }); }
  unlockScroll();
  const o = opener;
  openId = null; busy = false;
  release?.(onDone ? null : o); release = null;
  set({ selected: null });
  onDone?.();
}

export function close({ onDone } = {}) {
  if (!openId || busy) return;
  busy = true;
  if (location.hash.startsWith('#cabin=')) history.replaceState(null, '', location.pathname + location.search);
  const done = () => finishClose(false, onDone);
  if (reduced()) gsap.to(onDone ? el : [el, overlay], { opacity: 0, duration: .15, onComplete: done });
  else {
    const mobile = mqMobile.matches;
    if (!onDone) gsap.to(overlay, { opacity: 0, duration: .24 * .8 });
    gsap.to(el, mobile ? { yPercent: 100, duration: .36 * .8, ease: 'power2.in', onComplete: done } : { xPercent: 100, duration: .36 * .8, ease: 'power2.in', onComplete: done });
  }
}

function bindSwipe(r) {
  // свайп фото влево/вправо; свайп вниз закрывает bottom sheet
  let sx = 0, sy = 0, dy = 0, mode = null;
  const main = $('[data-main]', el);
  el.ontouchstart = (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; dy = 0; mode = null; };
  el.ontouchmove = (e) => {
    const dx = e.touches[0].clientX - sx; dy = e.touches[0].clientY - sy;
    if (!mode) {
      if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) && main.contains(e.target)) mode = 'x';
      else if (dy > 12 && mqMobile.matches && body.scrollTop <= 0 && Math.abs(dy) > Math.abs(dx)) mode = 'y';
      else if (Math.abs(dy) > 12) mode = 'none';
    }
    if (mode === 'y') { gsap.set(el, { y: Math.max(0, dy) }); }
  };
  el.ontouchend = (e) => {
    const dx = e.changedTouches[0].clientX - sx;
    if (mode === 'x' && Math.abs(dx) > 40) setImage(r, img + (dx < 0 ? 1 : -1));
    if (mode === 'y') { if (dy > 110) { gsap.set(el, { y: 0 }); close(); } else gsap.to(el, { y: 0, duration: .25 }); }
  };
}

export function initDrawer() {
  el = $('#drawer'); body = $('#drawerBody'); foot = $('#drawerFoot'); overlay = $('#overlay');
  $('#drawerClose').addEventListener('click', () => close());
  overlay.addEventListener('click', () => { if (openId) close(); });
  const fromHash = () => {
    const m = location.hash.match(/^#cabin=(\d+)/);
    if (m && roomById(m[1])) openCabin(m[1], document.activeElement, { fromHash: true });
    else if (openId && !location.hash.startsWith('#cabin=')) close();
  };
  window.addEventListener('hashchange', fromHash);
  fromHash();
}
export const drawerOpen = () => !!openId;
