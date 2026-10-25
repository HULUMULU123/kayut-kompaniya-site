import { gsap, ScrollTrigger } from './gsap-setup.js';
import REVIEWS from '../data/reviews.json';
import { t, onLang } from './i18n.js';
import { icon } from './icons.js';
import { $, $$, esc, reduced, mqFine } from './util.js';

// ---------- S4 «судовой журнал» ----------
const LOG = [
  ['Ортопедические матрасы', 'и бельё из натуральных тканей'],
  ['Чистота', 'Белые душевые кабины, свежее бельё и полотенца'],
  ['Общая кухня-гостиная', 'Плита, микроволновка, чайник, фильтр для воды, гладильная доска и утюг'],
  ['Охраняемая парковка', 'За шлагбаумом. Условия и стоимость уточняйте при бронировании'], // TODO: условия и цена парковки
  ['Кондиционер и телевизор', 'В каютах категорий «Офицер» и «Юнга»'],                       // TODO: уточнить по типам
  ['Ресепшн и лифт', 'Администратор встретит и подскажет, куда сходить рядом'],
];
function renderLog() {
  $('#logList').innerHTML = LOG.map(([h, p], i) => `<li class="reveal"><i class="log__dot" aria-hidden="true"></i><span class="log__n mono">${String(i + 1).padStart(2, '0')}</span><div><h3>${esc(t(`log.${i}.h`, h))}</h3><p>${esc(t(`log.${i}.p`, p))}</p></div></li>`).join('');
}
let logTrigger;
function initLog() {
  const log = $('#log'), fill = $('#logFill');
  const items = () => $$('#logList li');
  const mark = (p) => { const hgt = log.getBoundingClientRect().height; items().forEach((li) => li.classList.toggle('is-reached', li.offsetTop + 20 <= p * hgt + 8)); };
  logTrigger?.kill();
  if (reduced()) { gsap.set(fill, { scaleY: 1 }); items().forEach((li) => li.classList.add('is-reached')); return; }
  logTrigger = ScrollTrigger.create({ trigger: log, start: 'top 65%', end: 'bottom 60%', scrub: true, onUpdate: (self) => { gsap.set(fill, { scaleY: self.progress }); mark(self.progress); } });  // A11
  gsap.set(fill, { scaleY: logTrigger.progress }); mark(logTrigger.progress);
}

// ---------- S7 отзывы ----------
function renderReviews() {
  $('#revGrid').innerHTML = REVIEWS.map((r, i) => `<article class="rev reveal"><p class="mono rev__meta">${esc(r.src)} · ${esc(r.date)}</p><p class="rev__text" id="rt-${i}">${esc(r.text)}</p><button type="button" class="btn-ghost rev__more" data-more="${i}" aria-expanded="false" aria-controls="rt-${i}" hidden>${esc(t('rev.more', 'Читать полностью'))}</button><p class="rev__name">${esc(r.name)}</p></article>`).join('');
  requestAnimationFrame(measureRev);
}
function measureRev() {
  $$('.rev').forEach((c) => { const tx = $('.rev__text', c), b = $('.rev__more', c); if (c.classList.contains('is-open')) return; b.hidden = !(tx.scrollHeight > tx.clientHeight + 1); });
}
function initReviews() {
  $('#revGrid').addEventListener('click', (e) => {
    const b = e.target.closest('[data-more]'); if (!b) return;
    const card = b.closest('.rev'); const open = card.classList.toggle('is-open');
    b.setAttribute('aria-expanded', String(open)); b.textContent = open ? t('rev.less', 'Свернуть') : t('rev.more', 'Читать полностью');
  });
  window.addEventListener('resize', measureRev);
  document.fonts?.ready.then(measureRev);
}

// ---------- S8 FAQ ----------
const FAQ = [
  ['Во сколько заезд и выезд?', 'Время заезда и выезда уточняйте у администратора при бронировании.'],   // TODO: часы заезда/выезда
  ['Есть ли парковка?', 'Да, охраняемая парковка за шлагбаумом. Условия и стоимость уточняйте при бронировании.'], // TODO: стоимость
  ['Можно ли с детьми?', 'Да. Семейная каюта рассчитана на двух взрослых и одного ребёнка: двуспальная кровать и раскладной диван. Для большой семьи есть Капитанская каюта.'],
  ['Чем кубрик отличается от каюты?', 'Каюта это отдельный номер. Кубрик это место в общей комнате на 8 человек: двухъярусные кровати, места изолированы друг от друга, у каждого свой светильник, розетка и полочка. Кубрики раздельные для мужчин и женщин.'],
  ['Есть ли общая кухня?', 'Да, кухня-гостиная: плита, микроволновка, чайник, фильтр для воды, гладильная доска и утюг.'],
  ['Как оплатить бронь?', 'Способы и условия оплаты уточняйте у администратора.'],                       // TODO: оплата
  ['Что делать, если приезжаю ночью?', 'Предупредите нас о времени приезда по телефону или в WhatsApp. Условия позднего заезда уточняются.'], // TODO
];
function renderFaq() {
  $('#acc').innerHTML = FAQ.map(([q, a], i) => `<div class="acc__item"><h3><button type="button" class="acc__q" id="aq-${i}" aria-expanded="false" aria-controls="ap-${i}"><span>${esc(t(`faq.${i}.q`, q))}</span>${icon('plus', 24)}</button></h3><div class="acc__panel" id="ap-${i}" role="region" aria-labelledby="aq-${i}"><div><p>${esc(t(`faq.${i}.a`, a))}</p></div></div></div>`).join('');
}
function initFaq() {
  $('#acc').addEventListener('click', (e) => {
    const b = e.target.closest('.acc__q'); if (!b) return;
    const open = b.getAttribute('aria-expanded') === 'true';
    $$('.acc__q').forEach((x) => { x.setAttribute('aria-expanded', 'false'); x.closest('.acc__item').classList.remove('is-open'); });
    b.setAttribute('aria-expanded', String(!open));
    b.closest('.acc__item').classList.toggle('is-open', !open);
  });
}

export function initSections() {
  renderLog(); initLog(); renderReviews(); initReviews(); renderFaq(); initFaq();
  onLang(() => { renderLog(); renderReviews(); renderFaq(); initLog(); $$('#logList .reveal, #revGrid .reveal').forEach((e) => e.classList.add('is-in')); });
}
