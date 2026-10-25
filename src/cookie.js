import { gsap } from './gsap-setup.js';
import { openModal, closeModal } from './modal.js';
import { t } from './i18n.js';
import { h, $, $$, esc, store, reduced } from './util.js';

const KEY = 'kk.cookie';
const CATS = [['necessary', 'Строго необходимые', 'Нужны для работы сайта, их нельзя отключить.'], ['perf', 'Производительности', 'Помогают считать посещения и улучшать сайт.'], ['func', 'Функциональные', 'Запоминают ваши предпочтения, например язык.'], ['ads', 'Рекламные', 'Позволяют показывать персонализированную рекламу.']];

function save(choice) { store.set(KEY, JSON.stringify(choice)); }

export function initCookie() {
  const box = $('#cookie');
  if (store.get(KEY)) return;
  const hide = () => { gsap.to(box, { opacity: 0, y: 16, duration: reduced() ? .001 : .25, onComplete: () => { box.hidden = true; } }); };
  setTimeout(() => {
    box.hidden = false;
    if (!reduced()) gsap.fromTo(box, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .3, ease: 'power2.out' });
  }, 1200);
  $('#cookieAll').addEventListener('click', () => { save({ necessary: true, perf: true, func: true, ads: true }); hide(); });
  $('#cookieSet').addEventListener('click', (e) => {
    const node = h(`<div><h2 id="modalTitle">${esc(t('cookie.title', 'Настройки cookie'))}</h2>
      <form class="modal__form">${CATS.map(([k, n, d]) => `<div class="switch-row"><div><b id="cl-${k}">${esc(t(`cookie.${k}`, n))}</b><p>${esc(t(`cookie.${k}d`, d))}</p></div><label class="switch"><input type="checkbox" aria-labelledby="cl-${k}" data-k="${k}" ${k === 'necessary' ? 'checked disabled' : ''}><i></i></label></div>`).join('')}
      <button class="btn btn--primary btn--block" type="submit" data-primary>${esc(t('cookie.save', 'Сохранить выбор'))}</button></form></div>`);
    $('form', node).addEventListener('submit', (ev) => {
      ev.preventDefault();
      const c = {}; $$('input[data-k]', node).forEach((i) => { c[i.dataset.k] = i.checked; });
      save(c); closeModal(); hide();
    });
    openModal(node, { opener: e.currentTarget });
  });
}
