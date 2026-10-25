import en from '../i18n/en.json';
import { $$, store } from './util.js';

const DICTS = { en };
const LANGS = ['ru', 'en', 'zh', 'ja', 'ko'];
const LABELS = { ru: 'RU', en: 'EN', zh: '中文', ja: '日本語', ko: '한국어' };
let lang = 'ru';
const subs = new Set();

export const getLang = () => lang;
export const onLang = (fn) => { subs.add(fn); };

// t('ключ', 'русский текст по умолчанию', { vars })
export function t(key, def, vars) {
  let s = DICTS[lang]?.[key] ?? def ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  return s;
}
// склонение: tn('key', n, 'ночь|ночи|ночей'); en: 'night|nights'
export function tn(key, n, def) {
  const forms = (DICTS[lang]?.[key] ?? def).split('|');
  if (lang === 'ru') {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return forms[2];
    if (b > 1 && b < 5) return forms[1];
    if (b === 1) return forms[0];
    return forms[2];
  }
  return n === 1 ? forms[0] : (forms[1] || forms[0]);
}

function applyStatic() {
  $$('[data-i18n]').forEach((el) => {
    if (!('ru' in el.dataset)) el.dataset.ru = el.textContent;
    el.textContent = t(el.dataset.i18n, el.dataset.ru);
  });
  $$('[data-i18n-html]').forEach((el) => {
    if (!('ru' in el.dataset)) el.dataset.ru = el.innerHTML;
    el.innerHTML = t(el.dataset.i18nHtml, el.dataset.ru);
  });
  $$('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':');
      const k = `ru_${attr.replace(/-/g, '_')}`;
      if (!(k in el.dataset)) el.dataset[k] = el.getAttribute(attr) || '';
      el.setAttribute(attr, t(key, el.dataset[k]));
    });
  });
}

export function setLang(next, { silent } = {}) {
  if (!LANGS.includes(next)) next = 'ru';
  lang = next;
  document.documentElement.lang = next;
  store.set('kk.lang', next);
  const cur = document.getElementById('langCur');
  if (cur) cur.textContent = LABELS[next];
  $$('#langList [data-lang]').forEach((b) => b.setAttribute('aria-current', String(b.dataset.lang === next)));
  applyStatic();
  if (!silent) subs.forEach((fn) => fn(next));
  return DICTS[next] ? true : next === 'ru';
}

export function initLang() {
  const q = new URLSearchParams(location.search).get('lang');
  const saved = store.get('kk.lang');
  const pick = LANGS.includes(q) ? q : LANGS.includes(saved) ? saved : 'ru';
  if (pick !== 'ru') setLang(pick, { silent: true });
  else setLang('ru', { silent: true });
}
