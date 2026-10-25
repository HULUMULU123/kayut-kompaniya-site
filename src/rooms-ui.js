import { gsap, Flip, ScrollTrigger } from './gsap-setup.js';
import { ROOMS, CHIPS, lit, listVisible, roomName, roomDesc, roomPass, roomAlt, badgeText, priceHtml, picture, wireSkeletons, AMEN } from './rooms.js';
import { state, set, subscribe } from './state.js';
import { t, onLang } from './i18n.js';
import { icon } from './icons.js';
import { initShip, update as updateShip, setSelected, litTotal, relayout } from './ship.js';
import { openCabin } from './drawer.js';
import { openBookingModal } from './modal.js';
import { $, $$, esc, reduced, mqMobile } from './util.js';

let grid, chipsEl, segEl, countEl, emptyEl, vShip, vList;
const CHIP_LABEL = { all: 'Все', solo: 'Одному', duo: 'Вдвоём', family: 'Семьёй', group: 'Компанией', budget: 'Бюджетно' };

function renderChips() {
  chipsEl.innerHTML = CHIPS.map(([k]) => `<button type="button" class="chip" data-chip="${k}" aria-pressed="${state.filter === k}">${esc(t(`chip.${k}`, CHIP_LABEL[k]))}</button>`).join('');
}
function renderSeg() {
  const views = [['schema', t('view.schema', 'Схема')], ['list', t('view.list', 'Список')]];
  const idx = views.findIndex(([k]) => k === state.view);
  segEl.style.setProperty('--n', 2); segEl.style.setProperty('--idx', idx);
  segEl.innerHTML = `<span class="seg__thumb" aria-hidden="true"></span>${views.map(([k, l]) => `<button type="button" class="seg__opt" data-view="${k}" aria-pressed="${state.view === k}">${esc(l)}</button>`).join('')}`;
}

function cardHtml(r) {
  const icons = r.amenities.slice(0, 4).map((k) => AMEN[k]).filter(Boolean).map(([ic, key, def]) => { const l = t(key, def); return `<span role="img" aria-label="${esc(l)}" title="${esc(l)}">${icon(ic, 20)}</span>`; }).join('');
  return `<article class="card" data-card="${r.id}" aria-labelledby="ct-${r.id}">
    <button type="button" class="card__media skel" data-open="${r.id}" aria-label="${esc(roomName(r))}">${picture(r.photos[0], { alt: roomAlt(r) })}<span class="badge mono">${esc(badgeText(r))}</span></button>
    <div class="card__body">
      <p class="mono card__pass">${esc(roomPass(r).slice(0, 4).join(' · '))}</p>
      <h3 id="ct-${r.id}"><button type="button" class="card__title" data-open="${r.id}">${esc(roomName(r))}</button></h3>
      <p class="card__desc">${esc(roomDesc(r))}</p>
      <button type="button" class="btn-ghost" style="align-self:flex-start;padding-left:0" data-open="${r.id}">${esc(t('cta.more', 'Подробнее'))}</button>
      <div class="card__icons">${icons}</div>
      <div class="card__foot">${priceHtml(r)}<button type="button" class="btn btn--primary btn--sm" data-book="${r.id}"><span>${esc(t('cta.book', 'Забронировать'))}</span></button></div>
    </div></article>`;
}
function renderList() {
  grid.innerHTML = ROOMS.map(cardHtml).join('');
  wireSkeletons(grid);
  applyVisibility();
}
function applyVisibility() {
  $$('.card', grid).forEach((c) => c.classList.toggle('is-hide', !listVisible(ROOMS.find((r) => r.id === c.dataset.card), state)));
}

function counts() {
  const total = ROOMS.length;
  const n = state.view === 'list' ? $$('.card:not(.is-hide)', grid).length : litTotal();
  countEl.textContent = t('rooms.count', 'Подходят вам: {n} из {total}', { n, total });
  emptyEl.hidden = n !== 0;
  return n;
}

function filterList(animate) {
  const cards = $$('.card', grid);
  const want = (c) => listVisible(ROOMS.find((r) => r.id === c.dataset.card), state);
  const leaving = cards.filter((c) => !c.classList.contains('is-hide') && !want(c));
  const entering = cards.filter((c) => c.classList.contains('is-hide') && want(c));
  const stay = cards.filter((c) => !c.classList.contains('is-hide') && want(c));
  const apply = () => cards.forEach((c) => c.classList.toggle('is-hide', !want(c)));
  if (!animate || reduced() || !leaving.length && !entering.length) { apply(); return; }
  const go = () => {
    const st = Flip.getState(stay);
    apply();
    gsap.set(leaving, { clearProps: 'opacity' });
    Flip.from(st, { duration: .35, ease: 'power2.inOut' });                                  // A9
    gsap.fromTo(entering, { opacity: 0 }, { opacity: 1, duration: .2, delay: .15, clearProps: 'opacity' });
  };
  if (leaving.length) gsap.to(leaving, { opacity: 0, duration: .15, onComplete: go }); else go();
}

function switchView(view) {
  if (view === state.view) return;
  const from = state.view === 'schema' ? vShip : vList, to = view === 'schema' ? vShip : vList;
  set({ view });
  const show = () => {
    from.hidden = true; to.hidden = false;
    if (view === 'list') applyVisibility(); else ScrollTrigger.refresh();
    counts();
    if (!reduced()) gsap.fromTo(to, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .25, ease: 'power2.out', clearProps: 'all' });  // A28
  };
  if (reduced()) show(); else gsap.to(from, { opacity: 0, duration: .15, onComplete: () => { gsap.set(from, { clearProps: 'all' }); show(); } });
}

export function initRoomsUI() {
  grid = $('#roomGrid'); chipsEl = $('#chips'); segEl = $('#viewSeg'); countEl = $('#roomsCount'); emptyEl = $('#empty'); vShip = $('#viewShip'); vList = $('#viewList');
  renderChips(); renderSeg(); renderList(); initShip(); counts();

  chipsEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-chip]'); if (!b) return;
    set({ filter: b.dataset.chip, chipAuto: false, searched: false }, { chip: true });
  });
  segEl.addEventListener('click', (e) => { const b = e.target.closest('[data-view]'); if (b) { switchView(b.dataset.view); renderSeg(); } });
  grid.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open]'); if (o) return openCabin(o.dataset.open, o);
    const b = e.target.closest('[data-book]'); if (b) openBookingModal({ roomId: b.dataset.book, opener: b });
  });
  $('#resetFilter').addEventListener('click', () => set({ filter: 'all', chipAuto: false, searched: false, mode: 'whole', adults: 2, children: 0, query: { mode: 'whole', gender: state.gender, adults: 2, children: 0 } }, { chip: true }));

  let last = { filter: state.filter, selected: null };
  subscribe((st, meta) => {
    if (meta.chip || meta.search) {
      $$('[data-chip]', chipsEl).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.chip === st.filter)));
      if (st.view === 'list') filterList(true); else applyVisibility();
      updateShip({ animate: true });
      counts();
      chipsEl.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' });
    }
    if (st.selected !== last.selected) { last.selected = st.selected; setSelected(st.selected); }
  });
  onLang(() => { renderChips(); renderSeg(); renderList(); relayout(); counts(); });
}
