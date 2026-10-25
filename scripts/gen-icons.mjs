// Собирает src/icons.js из lucide-static (stroke 1.75 задаётся в CSS)
import fs from 'node:fs';
const names = ['arrow-right','chevron-down','x','menu','plus','minus','phone','message-circle','mail','map-pin','check','calendar-days','calendar-plus','users','bed-double','bed-single','tv','snowflake','shower-head','lamp-desk','sparkles','car','utensils','compass','anchor','pointer','navigation','waves','download','loader-circle','circle-alert','globe','building-2','bath','layers','arrow-up-down','landmark','trees','church','ship','map','sailboat','ship-wheel','life-buoy','train-front','plane','sunrise','sun','moon','footprints','shopping-bag','copy','trash-2','route','bus','coffee'];
const out = {};
for (const n of names) {
  const p = `node_modules/lucide-static/icons/${n}.svg`;
  if (!fs.existsSync(p)) { console.warn('missing', n); continue; }
  const s = fs.readFileSync(p, 'utf8');
  out[n] = s.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '').replace(/\s+/g, ' ').trim();
}
fs.writeFileSync('src/icons.js', `// Сгенерировано scripts/gen-icons.mjs\nexport const ICONS = ${JSON.stringify(out)};\nexport const icon = (n, size = 20, cls = '') => \`<svg class="ic \${cls}" width="\${size}" height="\${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">\${ICONS[n] || ''}</svg>\`;\n`);
