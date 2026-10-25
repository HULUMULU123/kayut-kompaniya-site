import { gsap, ScrollTrigger } from './gsap-setup.js';
import { $, $$, reduced, mqMobile } from './util.js';

function splitWords(el) {
  const walk = (node) => {
    Array.from(node.childNodes).forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((w) => {
          if (!w) return;
          if (/^\s+$/.test(w)) frag.append(' ');
          else { const o = document.createElement('span'); o.className = 'w'; const i = document.createElement('span'); i.textContent = w; o.append(i); frag.append(o); }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  el.setAttribute('aria-label', el.textContent.trim());
  walk(el);
}

export function initAnimations() {
  window.__kk = true;
  const anim = !reduced();
  const hero = $('.hero');
  const h1 = $('.hero__h1');
  splitWords(h1);
  new IntersectionObserver(([en]) => hero.classList.toggle('is-offscreen', !en.isIntersecting)).observe(hero);

  // 14.6: загрузка hero (текст); слои сцены и корабль запускает scene.js
  if (anim) {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' }, onComplete: () => hero.classList.add('is-ready') });
    tl.from('#hdr', { opacity: 0, duration: .3 }, 0)
      .from('.hero__eyebrow', { y: 12, opacity: 0, duration: .4 }, .1)
      .from('.hero__h1 .w > span', { yPercent: 100, duration: .6, stagger: .06 }, .3)
      .from('.hero__sub', { y: 16, opacity: 0, duration: .5 }, .5)
      .from('.hero__card', { y: 32, opacity: 0, duration: .6, clearProps: 'transform,opacity' }, .65)
      .from('.facts', { opacity: 0, duration: .4 }, .8);
  } else hero.classList.add('is-ready');

  // A7: reveal
  if (anim) {
    ScrollTrigger.batch('.reveal', {
      start: 'top 88%', once: true, batchMax: 6, interval: .08,
      onEnter: (batch) => {
        batch.forEach((b) => b.classList.add('is-in'));
        gsap.fromTo(batch, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .7, ease: 'power2.out', stagger: .07, clearProps: 'transform,opacity' });
      },
    });
    // страница открыта с якорем: всё выше точки якоря показываем сразу
    window.addEventListener('load', () => {
      ScrollTrigger.refresh();
      requestAnimationFrame(() => $$('.reveal:not(.is-in)').forEach((el) => { if (el.getBoundingClientRect().bottom < 0) el.classList.add('is-in'); }));
    });
  }

  // пауза бесконечных анимаций вне экрана
  [['.final']].forEach(([sel]) => { const el = $(sel); if (el) new IntersectionObserver(([en]) => el.classList.toggle('is-offscreen', !en.isIntersecting)).observe(el); });
}
