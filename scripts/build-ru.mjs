// Собирает i18n/ru.json: тексты из index.html (data-i18n*), вызовов t()/tn() в src/ и данных кают.
import fs from 'node:fs';
import path from 'node:path';
const out = {};
const html = fs.readFileSync('index.html', 'utf8');
const unesc = (s) => s.replace(/\\'/g, "'").replace(/\\n/g, '\n');
for (const m of html.matchAll(/data-i18n="([^"]+)"[^>]*>([^<]*)</g)) out[m[1]] = m[2].trim();
for (const m of html.matchAll(/data-i18n-html="([^"]+)"[^>]*>([\s\S]*?)<\/(?:h1|p)>/g)) out[m[1]] = m[2].trim();
for (const m of html.matchAll(/<[^>]*?data-i18n-attr="([^"]+)"[^>]*>/g)) {
  const tag = m[0];
  for (const pair of m[1].split(';')) { const [attr, key] = pair.split(':'); const v = tag.match(new RegExp(`${attr}="([^"]*)"`)); if (v) out[key] = v[1]; }
}
const walk = (d) => fs.readdirSync(d).flatMap((f) => { const p = path.join(d, f); return fs.statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : []; });
for (const f of walk('src').filter((x) => !x.endsWith('i18n.js'))) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(/\bt\('([\w.]+)',\s*'((?:[^'\\]|\\.)*)'/g)) out[m[1]] = unesc(m[2]);
  for (const m of s.matchAll(/\bt\(`([\w.]+)`?,\s*'((?:[^'\\]|\\.)*)'/g)) out[m[1]] = unesc(m[2]);
  for (const m of s.matchAll(/\btn\('([\w.]+)',\s*[^,]+,\s*'((?:[^'\\]|\\.)*)'/g)) out[m[1]] = unesc(m[2]);
}
// массивы с динамическими ключами
const arr = (file, name, keyFn) => {
  const s = fs.readFileSync(file, 'utf8');
  const block = s.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\n\\];`));
  if (!block) return;
  [...block[1].matchAll(/\[\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)'/g)].forEach((m, i) => keyFn(i, unesc(m[1]), unesc(m[2])));
};
arr('src/sections.js', 'LOG', (i, h, p) => { out[`log.${i}.h`] = h; out[`log.${i}.p`] = p; });
arr('src/sections.js', 'PLACES', (i, n, d) => { out[`near.${i}.n`] = n; out[`near.${i}.d`] = d; });
arr('src/sections.js', 'FAQ', (i, q, a) => { out[`faq.${i}.q`] = q; out[`faq.${i}.a`] = a; });
const route = fs.readFileSync('src/route.js', 'utf8');
for (const m of route.matchAll(/k: '(\w+)', d: '[^']*', title: \['([^']*)', '([^']*)'\], time: '([^']*)', tip: '([^']*)'/g)) {
  out[`route.${m[1]}.h`] = m[2]; out[`route.${m[1]}.tab`] = m[3]; out[`route.${m[1]}.time`] = m[4]; out[`route.${m[1]}.tip`] = m[5];
}
for (const k of ['all', 'solo', 'duo', 'family', 'group', 'budget']) out[`chip.${k}`] = { all: 'Все', solo: 'Одному', duo: 'Вдвоём', family: 'Семьёй', group: 'Компанией', budget: 'Бюджетно' }[k];
Object.assign(out, { 'ship.deckTop': 'ВЕРХНЯЯ ПАЛУБА', 'ship.deckMain': 'ГЛАВНАЯ ПАЛУБА', 'ship.deckLower': 'НИЖНЯЯ ПАЛУБА',
  'amen.orthopedic': 'Ортопедический матрас', 'amen.linen2': 'Бельё из натуральных тканей', 'amen.shower': 'Душевая кабина в каюте', 'amen.tv': 'Телевизор', 'amen.ac': 'Кондиционер', 'amen.lamp': 'Свой светильник, розетка и полочка', 'amen.sharedbath': 'Санузел на этаже' });
const rooms = JSON.parse(fs.readFileSync('data/rooms.json', 'utf8'));
for (const r of rooms) {
  out[`room.${r.id}.name`] = r.cabinName; out[`room.${r.id}.label`] = r.label; out[`room.${r.id}.desc`] = r.description;
  out[`room.${r.id}.alt`] = r.alt; out[`room.${r.id}.pass`] = r.passport.join('|'); r.notes.forEach((n, i) => { out[`room.${r.id}.note${i}`] = n; });
}
for (const p of JSON.parse(fs.readFileSync('data/nearby.json', 'utf8'))) { out[`nearby.${p.id}.n`] = p.name; out[`nearby.${p.id}.d`] = p.teaser; }
for (const [k, l] of [['all', 'Всё'], ['walk', 'Пройтись'], ['culture', 'Культура'], ['amur', 'Вид на Амур'], ['errands', 'По делам']]) out[`near.mood.${k}`] = l;
const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync('i18n/ru.json', JSON.stringify(sorted, null, 1) + '\n');
let en = {}; try { en = JSON.parse(fs.readFileSync('i18n/en.json', 'utf8')); } catch {}
const missing = Object.keys(sorted).filter((k) => !(k in en));
console.log(`ru.json: ${Object.keys(sorted).length} ключей; нет в en.json: ${missing.length}`);
if (process.argv.includes('--missing')) console.log(JSON.stringify(Object.fromEntries(missing.map((k) => [k, sorted[k]])), null, 1));
