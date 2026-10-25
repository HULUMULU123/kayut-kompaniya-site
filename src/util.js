export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
export const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
export const reduced = () => mqReduced.matches;
export const mqMobile = window.matchMedia('(max-width: 767px)');
export const mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* приватный режим */ } },
};

export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

// ---- даты ----
export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const sameDay = (a, b) => a && b && a.getTime() === b.getTime();
export const nightsBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / 86400000);
const pad = (n) => String(n).padStart(2, '0');
export const fmtShort = (d, lang = 'ru') => d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short' }).replace('.', '');
export const fmtFull = (d) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
export const ymd = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
export const ddmm = (d) => `${pad(d.getDate())}${pad(d.getMonth() + 1)}`;

// ---- блокировка прокрутки с компенсацией скроллбара ----
let locks = 0;
export function lockScroll() {
  if (locks++ === 0) {
    const sw = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = sw > 0 ? `${sw}px` : '';
    document.body.classList.add('is-locked');
  }
}
export function unlockScroll() {
  if (locks > 0 && --locks === 0) {
    document.body.style.paddingRight = '';
    document.body.classList.remove('is-locked');
  }
}
export const isLocked = () => locks > 0;

// ---- фокус-трап ----
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
export function trapFocus(container, { onEscape, initial } = {}) {
  const opener = document.activeElement;
  const items = () => $$(FOCUSABLE, container).filter((el) => el.offsetParent !== null || el === document.activeElement);
  const onKey = (e) => {
    if (e.key === 'Escape') { if (onEscape) { e.stopPropagation(); onEscape(); } return; }
    if (e.key !== 'Tab') return;
    const list = items();
    if (!list.length) { e.preventDefault(); return; }
    const first = list[0], last = list[list.length - 1];
    if (e.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !container.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', onKey, true);
  requestAnimationFrame(() => { (initial ? $(initial, container) : null)?.focus?.() || items()[0]?.focus({ preventScroll: true }); });
  return (returnTo) => {
    document.removeEventListener('keydown', onKey, true);
    const t = returnTo || opener;
    if (t && document.contains(t) && t.offsetParent !== null) t.focus({ preventScroll: true });
  };
}

export function mountIcons(root, icon) {
  $$('[data-ic]', root).forEach((el) => {
    if (el.firstChild) return;
    el.innerHTML = icon(el.dataset.ic, Number(el.dataset.size) || 20);
  });
}

export function scrollToEl(el, behavior) {
  if (!el) return;
  el.scrollIntoView({ behavior: behavior || (reduced() ? 'auto' : 'smooth'), block: 'start' });
}

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
