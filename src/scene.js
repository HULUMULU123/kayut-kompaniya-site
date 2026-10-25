import { gsap } from './gsap-setup.js';
import { layers, wrapSvg, PALETTE_CSS, VB, SHIP, SUN } from './scene-art.js';
import { icon } from './icons.js';
import { $, $$, reduced, mqMobile, store, h } from './util.js';
import { t } from './i18n.js';

const pct = (x) => `${(((x + 100) / 1800) * 100).toFixed(3)}%`;
const pcty = (y) => `${((y / 760) * 100).toFixed(3)}%`;

let hero, scene, stage, built = false, visible = true;
const lay = [];            // { el, d }
let train, gullTimers = [], trainTimer, trainTween, gullTweens = [];

function build() {
  const mobile = mqMobile.matches;
  const defs = layers({ mobile });
  stage.innerHTML = '';
  lay.length = 0;
  defs.forEach((l) => {
    const div = document.createElement('div');
    div.className = `layer layer--${l.id.toLowerCase()}`;
    div.dataset.d = l.d;
    div.innerHTML = wrapSvg(l.svg).replace('<svg ', '<svg aria-hidden="true" ');
    if (l.id === 'L1') { div.className = 'scene__sky'; scene.prepend(div); div.querySelector('svg').setAttribute('preserveAspectRatio', 'xMidYMid slice'); return; }
    if (l.tiger) {
      const b = h(`<button type="button" class="hit hit--tiger" aria-label="${t('hero.tiger', 'Погладить тигра')}" style="left:${pct(1566 - 8)};top:${pcty(424 - 8)};width:${((84 / 1800) * 100).toFixed(2)}%;height:${((60 / 760) * 100).toFixed(2)}%"></button>`);
      div.append(b);
    }
    if (l.ship) {
      const a = h(`<a class="hit hit--ship" href="#rooms" aria-label="${t('hero.shipGo', 'Перейти к выбору каюты')}" style="left:${pct(SHIP.x - 390)};top:${pcty(SHIP.y - 360)};width:${((780 / 1800) * 100).toFixed(2)}%;height:${((372 / 760) * 100).toFixed(2)}%"></a>`);
      div.append(a);
    }
    stage.append(div);
    lay.push({ el: div, d: l.d });
  });
  train = $('.train', stage);
  bindTiger(); bindShip();
  built = true;
}

function bindShip() {
  const a = $('.hit--ship', stage); if (!a) return;
  const on = () => scene.classList.add('ship-hover'), off = () => scene.classList.remove('ship-hover');
  a.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') on(); });
  a.addEventListener('pointerleave', off);
  a.addEventListener('focus', on); a.addEventListener('blur', off);
}

let bubbleT;
function bindTiger() {
  const b = $('.hit--tiger', stage); if (!b) return;
  const bubble = h(`<div class="bubble mono" role="status" hidden>${t('hero.tigerSay', 'Р-Р-Р! ДОБРО ПОЖАЛОВАТЬ')}</div>`);
  b.parentElement.append(bubble);
  bubble.style.left = pct(1566 - 40); bubble.style.top = pcty(424 - 44);
  b.addEventListener('click', () => {
    bubble.hidden = false; scene.classList.add('tiger-turn');
    if (!reduced()) gsap.fromTo(bubble, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: .2 });
    clearTimeout(bubbleT);
    bubbleT = setTimeout(() => { bubble.hidden = true; scene.classList.remove('tiger-turn'); }, 2400);
  });
}

// ---------- параллакс (H2 курсор, H3 дрейф на таче) ----------
function parallax() {
  if (reduced()) return;
  const fine = matchMedia('(pointer: fine)').matches;
  const cur = { x: 0, y: 0 }, tgt = { x: .5, y: .5 };
  if (fine) hero.addEventListener('pointermove', (e) => { const r = hero.getBoundingClientRect(); tgt.x = (e.clientX - r.left) / r.width; tgt.y = (e.clientY - r.top) / r.height; });
  let t0 = performance.now();
  const loop = (now) => {
    requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    let nx, ny;
    if (fine) { cur.x += (tgt.x - cur.x - 0.5 + 0.5) * 0; cur.x += (tgt.x - 0.5 - cur.x) * .08; cur.y += (tgt.y - 0.5 - cur.y) * .08; nx = cur.x; ny = cur.y; }
    else { nx = 0; ny = 0; }
    const tt = (now - t0) / 1000;
    lay.forEach(({ el, d }) => {
      let x, y;
      if (fine) { x = -nx * d * 28; y = -ny * d * 12; }
      else { x = Math.sin(tt / 14 * Math.PI * 2) * d * 10; y = 0; }
      el.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
    });
  };
  requestAnimationFrame(loop);
}

// ---------- события: поезд, чайки ----------
function runTrain() {
  if (!train || reduced() || !visible || document.hidden) return;
  train.setAttribute('visibility', 'visible');
  trainTween?.kill();
  trainTween = gsap.fromTo(train, { x: 1900 }, { x: -620, duration: 28, ease: 'none', onComplete: () => train.setAttribute('visibility', 'hidden') });
}
function runGulls() {
  if (mqMobile.matches || reduced() || !visible || document.hidden) return;
  $$('[data-gull]', stage).forEach((g, i) => {
    const y0 = 140 + i * 55;
    const tw = gsap.timeline({ delay: i * 1.1 });
    tw.fromTo(g, { x: -200, y: y0 }, { x: 1900, duration: 14, ease: 'none' }, 0)
      .to(g, { y: y0 - 50, duration: 7, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0);
    gullTweens.push(tw);
  });
  const wings = setInterval(() => $$('.gull', stage).forEach((g) => g.classList.toggle('up')), 220);
  setTimeout(() => clearInterval(wings), 16500);
}
function schedule() {
  if (reduced()) return;
  setTimeout(() => { runTrain(); trainTimer = setInterval(runTrain, 45000); }, 6000);
  setTimeout(() => { runGulls(); const loop = () => { setTimeout(() => { runGulls(); loop(); }, 35000 + Math.random() * 5000); }; loop(); }, 10000);
}

// ---------- день / ночь ----------
function watchUI() {
  const btn = $('#watch');
  const set = (night, first) => {
    hero.dataset.watch = scene.dataset.watch = night ? 'night' : 'day';
    document.body.classList.toggle('is-night', night);
    btn.setAttribute('aria-pressed', String(night));
    btn.setAttribute('aria-label', (night ? t('watch.night', 'НОЧЬ') : t('watch.day', 'ДЕНЬ')).toLowerCase() + '. ' + (night ? t('watch.toDay', 'Сменить вахту: день') : t('watch.toNight', 'Сменить вахту: ночь')));
    btn.innerHTML = `${icon(night ? 'moon' : 'sun', 20)}<span class="mono">${night ? t('watch.night', 'НОЧЬ') : t('watch.day', 'ДЕНЬ')}</span>`;
    store.set('kk-watch', night ? 'night' : 'day');
  };
  set(store.get('kk-watch') === 'night');
  btn.addEventListener('click', () => set(hero.dataset.watch !== 'night'));
  return set;
}

export function initScene() {
  hero = $('.hero'); scene = $('#scene'); stage = $('#stage');
  const set = watchUI();
  const make = () => {
    build();
    if (!reduced()) { gsap.set('.layer svg', { opacity: 0 }); }
  };
  const run = () => {
    make();
    parallax();
    schedule();
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (trainTween) trainTween.paused(!visible); gullTweens.forEach((g) => g.paused(!visible)); }).observe(hero);
    document.addEventListener('visibilitychange', () => { if (trainTween) trainTween.paused(document.hidden || !visible); });
    matchMedia('(max-width: 767px)').addEventListener('change', () => { make(); intro(true); });
    intro();
  };
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 60));
  idle(run);
  return set;
}

// H1 рассвет + выплывание корабля (14.6)
function intro(quick) {
  hero.classList.add('scene-ready');
  if (reduced() || quick) { gsap.set('.layer svg', { opacity: 1, y: 0 }); return; }
  const svgs = lay.map((l) => $('svg', l.el));
  gsap.set('.scene__sky svg', { opacity: 0 });
  const tl = gsap.timeline();
  tl.to('.scene__sky svg', { opacity: 1, duration: .4 }, 0)
    .fromTo(svgs.filter((s) => !s.closest('.layer--l2, .layer--l7')), { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: .9, ease: 'power2.out', stagger: .11 }, 0.2)
    .fromTo($('.layer--l2 svg, .layer--l23 svg', stage), { y: 140, opacity: 0 }, { y: 0, opacity: 1, duration: 1.4, ease: 'power2.out' }, .2)
    .fromTo($('svg', $('.layer--l7', stage)), { opacity: 0 }, { opacity: 1, duration: .4 }, .5)
    .fromTo('.ship-arrive', { x: -260 }, { x: 0, duration: 1.6, ease: 'power2.out' }, .5)
    .fromTo('#watch', { opacity: 0 }, { opacity: 1, duration: .3 }, 1.4);
}
