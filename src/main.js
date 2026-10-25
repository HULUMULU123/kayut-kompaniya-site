import '@fontsource/playfair-display/cyrillic-700.css';
import '@fontsource/playfair-display/latin-700.css';
import '@fontsource/onest/cyrillic-400.css';
import '@fontsource/onest/cyrillic-600.css';
import '@fontsource/onest/latin-400.css';
import '@fontsource/onest/latin-600.css';
import '@fontsource/jetbrains-mono/cyrillic-500.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/sections.css';
import './styles/scene.css';

import { icon } from './icons.js';
import { mountIcons } from './util.js';
import { initLang } from './i18n.js';
import { mountGraphics } from './graphics.js';
import { initBookingCards } from './booking.js';
import { initRoomsUI } from './rooms-ui.js';
import { initSections } from './sections.js';
import { initRoute } from './route.js';
import { initNearby } from './nearby.js';
import { initDrawer } from './drawer.js';
import { initModal } from './modal.js';
import { initScroll } from './scroll.js';
import { initAnimations } from './anim.js';
import { initCookie } from './cookie.js';
import { initScene } from './scene.js';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function boot() {
  initLang();
  mountIcons(document, icon);
  mountGraphics();
  initBookingCards();
  initRoomsUI();
  initSections();
  initRoute();
  initNearby();
  initModal();
  initDrawer();
  initScroll();
  initAnimations();
  initScene();
  initCookie();
  // якорь в адресе при загрузке (кроме #cabin=)
  const id = location.hash.slice(1);
  if (id && !id.startsWith('cabin=')) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
