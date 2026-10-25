import ROOMS from '../data/rooms.json';
import PHOTOS from '../data/photos.json';
import { t } from './i18n.js';
import { esc } from './util.js';

export { ROOMS };
export const roomById = (id) => ROOMS.find((r) => r.id === String(id));
export const DECKS = ['top', 'main', 'lower'];
export const isDorm = (r) => r.kind === 'barkas' || r.kind === 'kubrik';

// ---- подсветка ----
// В макете «горит» = подходит по составу гостей. С подключением бронирования
// здесь же добавится проверка «свободна на выбранные даты».
export function isLit(room, q) {
  if (q.mode === 'bunk') return isDorm(room) && room.gender === q.gender;
  const guests = q.adults + q.children;
  return !isDorm(room) && room.capacity >= guests;
}

const CHIP_RULES = {
  solo: (r) => (r.capacity === 1 && !isDorm(r)) || isDorm(r),
  duo: (r) => r.capacity === 2,
  family: (r) => r.cabinName === 'Семейная каюта' || r.cabinName === 'Капитанская каюта',
  group: (r) => r.cabinName === 'Капитанская каюта' || isDorm(r),
  budget: (r) => isDorm(r),
};
export const CHIPS = [
  ['all', 'Все'], ['solo', 'Одному'], ['duo', 'Вдвоём'], ['family', 'Семьёй'], ['group', 'Компанией'], ['budget', 'Бюджетно'],
];
export const chipMatch = (room, chip) => chip === 'all' || CHIP_RULES[chip](room);

export function chipForGuests(q) {
  const n = q.adults + q.children;
  if (q.mode === 'bunk') return n === 1 ? 'solo' : 'group';
  if (n === 1) return 'solo';
  if (n === 2) return 'duo';
  if (n <= 4) return q.children > 0 ? 'family' : 'group';
  return 'group';
}

// итог: подсвечена ли каюта при текущем состоянии
export function lit(room, st) {
  const base = isLit(room, st.query);
  if (st.filter === 'all') return base;
  return chipMatch(room, st.filter) && (st.chipAuto ? base : true);
}
// видна ли карточка в списке
export function listVisible(room, st) {
  if (st.filter === 'all') return st.searched ? isLit(room, st.query) : true;
  return chipMatch(room, st.filter) && (st.chipAuto ? isLit(room, st.query) : true);
}

// ---- тексты ----
export const roomName = (r) => t(`room.${r.id}.name`, r.cabinName);
export const roomDesc = (r) => t(`room.${r.id}.desc`, r.description);
export const roomAlt = (r) => t(`room.${r.id}.alt`, r.alt);
export const roomPass = (r) => t(`room.${r.id}.pass`, r.passport.join('|')).split('|');
export const roomNotes = (r) => r.notes.map((n, i) => t(`room.${r.id}.note${i}`, n));
export const roomLabel = (r) => t(`room.${r.id}.label`, r.label);
export function badgeText(r) {
  if (r.gender === 'female') return t('badge.female', 'ТОЛЬКО ДЛЯ ЖЕНЩИН');
  if (r.gender === 'male') return t('badge.male', 'ТОЛЬКО ДЛЯ МУЖЧИН');
  return r.bathroom === 'own' ? t('badge.own', 'СВОЙ САНУЗЕЛ') : t('badge.shared', 'ОБЩИЙ САНУЗЕЛ');
}
export function priceHtml(r, { compact } = {}) {
  if (r.priceFrom == null) return `<span class="price"><b class="is-ask">${esc(t('price.ask', 'Цена по запросу'))}</b></span>`; // TODO: цены
  return `<span class="price"><b>${esc(t('price.from', 'от {p} ₽', { p: r.priceFrom.toLocaleString('ru-RU') }))}</b>${compact ? '' : `<small>${esc(t('price.night', 'за ночь'))}</small>`}</span>`;
}
export const priceText = (r) => (r.priceFrom == null ? t('price.ask', 'Цена по запросу') : t('price.from', 'от {p} ₽', { p: r.priceFrom.toLocaleString('ru-RU') }));

export const AMEN = {
  orthopedic: ['bed-double', 'amen.orthopedic', 'Ортопедический матрас'],
  linen: ['layers', 'amen.linen2', 'Бельё из натуральных тканей'],
  shower: ['shower-head', 'amen.shower', 'Душевая кабина в каюте'],
  tv: ['tv', 'amen.tv', 'Телевизор'],
  ac: ['snowflake', 'amen.ac', 'Кондиционер'],
  lamp: ['lamp-desk', 'amen.lamp', 'Свой светильник, розетка и полочка'],
  'shared-bath': ['bath', 'amen.sharedbath', 'Санузел на этаже'],
};

// ---- фото ----
export function picture(id, { alt = '', sizes = '(min-width:1024px) 380px, (min-width:640px) 50vw, 100vw', eager = false, cls = '' } = {}) {
  const p = PHOTOS[id];
  if (!p) return '';
  const srcset = p.sizes.map((w) => `/assets/img/${id}-${w}.webp ${w}w`).join(', ');
  const src = `/assets/img/${id}-${p.sizes.includes(800) ? 800 : p.sizes[p.sizes.length - 1]}.webp`;
  return `<img class="${cls}" src="${src}" srcset="${srcset}" sizes="${sizes}" width="${p.w}" height="${p.h}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}
export const photoSizes = (id) => PHOTOS[id];

// скелетон: снимаем при load
export function wireSkeletons(root) {
  root.querySelectorAll('.skel').forEach((s) => {
    const img = s.querySelector('img');
    if (!img) return;
    const done = () => s.classList.add('is-loaded');
    if (img.complete && img.naturalWidth) done(); else img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });
}
