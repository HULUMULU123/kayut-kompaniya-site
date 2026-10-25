// Статичный дневной постер hero (14.9): public/assets/hero-poster.svg
import fs from 'node:fs';
import { layers, VB } from '../src/scene-art.js';
const css = `svg{--sun:#F4C95D;--c-cloud:#fff;--cloud-o:.92;--c-far:#CFE4EF;--c-ledge:#9CC4DA;--c-ledge-d:#8AB6CF;--c-bridge:#5E96B5;--c-river1:#BFDCEB;--c-river2:#7FB3CF;--c-hull:#fff;--c-window:#fff;--c-near:#2A86B3;--paper:#FBF9F4;--lamp:#FFE9B0;--sand-100:#F6EFE3;--sand-300:#E6D5B8;--sea-700:#145A82;--sea-900:#0B3552;--font-mono:monospace}
.sk-a{stop-color:#EAF4F9}.sk-b{stop-color:#FBF9F4}.cir{opacity:.5}.moon,.star,.cwin,.lamps,.glow,.mast-lamp,.v,.glint{opacity:0}.gw2{display:none}.ship-scale{transform:scale(1.12)}.drift{transform:none}.hit{display:none}`;
const body = layers({ mobile: false }).filter((l) => l.id !== 'L1').map((l) => `<g>${l.svg}</g>`).join('');
const sky = layers({ mobile: false })[0].svg;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB}" preserveAspectRatio="xMidYMax slice"><style>${css}</style>${sky}${body}</svg>`
  .replace(/<g class="gull-wrap"[\s\S]*?<\/g><\/g>/g, '').replace(/ class="train"[^>]*visibility="hidden"/, ' visibility="hidden"');
fs.writeFileSync('public/assets/hero-poster.svg', svg);
console.log((svg.length / 1024).toFixed(1), 'KB');
