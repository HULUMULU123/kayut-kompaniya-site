import { gsap } from './gsap-setup.js';
import { setLang, t } from './i18n.js';
import { $, $$, reduced, lockScroll, unlockScroll, isLocked, trapFocus } from './util.js';

export function initScroll() {
  const hdr = $('#hdr'), prog = $('#progress'), mbar = $('#mbar');
  let lastY = window.scrollY, ticking = false;

  const onScroll = () => {
    const y = window.scrollY, dy = y - lastY;
    hdr.classList.toggle('is-scrolled', y > 24);
    if (!isLocked()) {
      if (dy > 4 && y > 80) hdr.classList.add('is-hidden');
      else if (dy < -4 || y <= 80) hdr.classList.remove('is-hidden');
    } else hdr.classList.remove('is-hidden');
    document.body.classList.toggle('hdr-hidden', hdr.classList.contains('is-hidden'));
    if (Math.abs(dy) > 4) lastY = y;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    prog.classList.toggle('is-on', y > 200);
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // ScrollSpy
  const links = $$('.nav [data-spy]');
  const seen = new Map();
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => seen.set(e.target.id, e.isIntersecting));
    const cur = links.find((a) => seen.get(a.dataset.spy)) ;
    links.forEach((a) => { const on = a === cur; a.classList.toggle('is-active', on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }, { threshold: 0.4 });
  links.forEach((a) => { const s = document.getElementById(a.dataset.spy); if (s) spy.observe(s); });

  // мобильная панель брони (A19)
  let cardGone = false, footerIn = false;
  const updBar = () => {
    const on = cardGone && !footerIn && !isLocked();
    mbar.classList.toggle('is-on', on);
    mbar.setAttribute('aria-hidden', String(!on));
    $('button', mbar).tabIndex = on ? 0 : -1;
    document.body.classList.toggle('has-mbar', on);
  };
  new IntersectionObserver(([en]) => { cardGone = !en.isIntersecting && en.boundingClientRect.bottom < 0; updBar(); }).observe($('[data-booking="hero"]'));
  new IntersectionObserver(([en]) => { footerIn = en.isIntersecting; updBar(); }).observe($('#footer'));
  new MutationObserver(updBar).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // меню (мобильное)
  const menu = $('#menu'), burger = $('#burger');
  let release;
  const openMenu = () => {
    menu.hidden = false; burger.setAttribute('aria-expanded', 'true'); lockScroll();
    gsap.fromTo(menu, { xPercent: 100 }, { xPercent: 0, duration: reduced() ? .001 : .32, ease: 'power2.out' });
    release = trapFocus(menu, { onEscape: closeMenu });
  };
  const closeMenu = () => {
    if (menu.hidden) return;
    gsap.to(menu, { xPercent: 100, duration: reduced() ? .001 : .26, ease: 'power2.in', onComplete: () => { menu.hidden = true; gsap.set(menu, { clearProps: 'all' }); unlockScroll(); release?.(burger); release = null; burger.setAttribute('aria-expanded', 'false'); } });
  };
  burger.addEventListener('click', openMenu);
  $('#menuClose').addEventListener('click', closeMenu);
  menu.addEventListener('click', (e) => { if (e.target.closest('.menu__nav a')) closeMenu(); });
  menu.addEventListener('kk-close', () => { menu.hidden = true; gsap.set(menu, { clearProps: 'all' }); unlockScroll(); release?.(null); release = null; burger.setAttribute('aria-expanded', 'false'); });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches && !menu.hidden) menu.dispatchEvent(new Event('kk-close')); });

  // язык
  const lang = $('#lang'), btn = $('#langBtn'), list = $('#langList');
  const toggle = (open) => { list.hidden = !open; btn.setAttribute('aria-expanded', String(open)); };
  btn.addEventListener('click', () => toggle(list.hidden));
  document.addEventListener('pointerdown', (e) => { if (!list.hidden && !lang.contains(e.target)) toggle(false); });
  lang.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !list.hidden) { e.stopPropagation(); toggle(false); btn.focus(); } });
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lang]'); if (!b) return;
    const ok = setLang(b.dataset.lang); toggle(false); btn.focus();
    if (!ok) toast('Перевод на этот язык скоро появится. Пока показан русский.'); // TODO: перевод zh/ja/ko
  });
  $('#footLang').addEventListener('click', () => { window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' }); setTimeout(() => { toggle(true); $('#langList button')?.focus(); }, reduced() ? 0 : 500); });
}

let toastT;
export function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 3500);
}
