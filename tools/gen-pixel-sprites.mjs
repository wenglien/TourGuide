// Generates the pixel-art SVGs in src/assets/pixel from character maps.
// Usage: node tools/gen-pixel-sprites.mjs src/assets/pixel
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2];
mkdirSync(out, { recursive: true });

function svg(map, palette, scale = 1) {
  const rows = map.trim().split('\n').map((r) => r.trim());
  const w = rows[0].length;
  const h = rows.length;
  let rects = '';
  rows.forEach((row, y) => {
    // merge horizontal runs of the same colour
    let x = 0;
    while (x < w) {
      const c = row[x];
      let run = 1;
      while (x + run < w && row[x + run] === c) run++;
      if (c !== '.' && palette[c]) rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${palette[c]}"/>`;
      x += run;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * scale}" height="${h * scale}" shape-rendering="crispEdges">${rects}</svg>`;
}

const hikerPal = {
  K: '#10122B', R: '#E52521', S: '#F7C08A', Y: '#FBD000', y: '#C88A00',
  G: '#00A651', B: '#3B44C9', N: '#7A3E12', W: '#FFFFFF',
};

// a small traveller with a cap and a backpack, facing right
const hikerA = `
....RRRR....
...RRRRRRR..
...KKSSKSS..
...SSSSSSS..
....SSSSS...
..yYGGGG....
.yYYGGGGS...
.yYYGGGGS...
.yYYGGGG....
..yYBBBB....
....BBBB....
....BB.BB...
....BB.BB...
...NNN.NNN..
`;
const hikerB = `
....RRRR....
...RRRRRRR..
...KKSSKSS..
...SSSSSSS..
....SSSSS...
..yYGGGG....
.yYYGGGG....
.yYYGGGGS...
.yYYGGGGS...
..yYBBBB....
...BBBBBB...
..BB....BB..
..BB....BB..
.NNN....NNN.
`;

const coin = `
..KKKK..
.KYYYYK.
KYWYYyYK
KYWYYyYK
KYWYYyYK
KYYYYyYK
.KyyyyK.
..KKKK..
`;
const coinPal = { K: '#10122B', Y: '#FBD000', y: '#C88A00', W: '#FFF4B0' };

// classic ground block, 16×16
const ground = `
LBBBBBBBBKLBBBBB
BLLLLLLLLKBLLLLD
BLLLLLLLLKBLLLLD
BLLLLLLLLKBLLLLD
BLLLLLLLLKKLLLLD
BLLLLLLLLKDKKLLD
BLLLLLLLLKDDDKKK
KKLLLLLLLKBBBBBD
BDKKLLLLLKBLLLLD
BLLDKKKKKBLLLLLD
BLLLLKBBBLLLLLLD
BLLLLKBLLLLLLLLD
BLLLLKBLLLLLLLLD
BLLLLKBLLLLLLLKD
BLLLLKBLLLLLLKDD
LKKKKKDDDDDDDDDK
`;
const groundDay = { L: '#C84C0C', B: '#FCBCB0', D: '#7A2A04', K: '#10122B' };
const groundNight = { L: '#3C5A9A', B: '#9CC4FF', D: '#1C2A55', K: '#05041A' };

const cloud = `
............WWWW................
..........WWWWWWWW..............
.........WWWWWWWWWW.............
.....WWWWWWWWWWWWWWW............
....WWWWWWWWWWWWWWWWWWWW........
...WWWWWWWWWWWWWWWWWWWWWWW......
..WWWWWWWWWWWWWWWWWWWWWWWWWW....
.WWWWWWWWWWWWWWWWWWWWWWWWWWWW...
.WWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
.WWWccWWWWWWWWWWWWccWWWWWWWWWW..
..WWWccccWWWWWWWccccWWWWWWWccW..
....ccccccccccccccccccccccccc...
`;
const cloudPal = { W: '#FFFFFF', c: '#BFE6FF' };

const flag = `
.KK.......
KWWK......
KWWK......
.KKGGGGG..
..KGGGGGG.
..KGGGWGGG
..KGGGGGG.
..KGGGGG..
..K.......
..K.......
..K.......
..K.......
..K.......
..K.......
..K.......
.KKK......
`;
const flagPal = { K: '#10122B', W: '#FFFFFF', G: '#00A651' };

const flag2 = `
.KK.......
KWWK......
KWWK......
.KKGGGG...
..KGGGGGG.
..KGGGWGGG
..KGGGGGGG
..KGGGG...
..K.......
..K.......
..K.......
..K.......
..K.......
..K.......
..K.......
.KKK......
`;

const sparkle = `
...W...
...W...
..WYW..
WWYYYWW
..WYW..
...W...
...W...
`;
const sparklePal = { W: '#FFFFFF', Y: '#FBD000' };

const qblock = `
KKKKKKKKKKKK
KYYYYYYYYYYK
KYKYYYYYYKYK
KYYYKKKKYYYK
KYYKKyyKKYyK
KYYyyYYKKYyK
KYYYYYKKyYyK
KYYYYKKyYYyK
KYYYYyyYYYyK
KYYYYKKYYYyK
KYKYYyyYYKyK
KKKKKKKKKKKK
`;
const qPal = { K: '#10122B', Y: '#FBD000', y: '#C88A00' };

const used = `
KKKKKKKKKKKK
KNNNNNNNNNNK
KNKNNNNNNKNK
KNNNNNNNNNNK
KNNNNNNNNNNK
KNNNNNNNNNNK
KNNNNNNNNNNK
KNNNNNNNNNNK
KNNNNNNNNNNK
KNNNNNNNNNNK
KNKNNNNNNKNK
KKKKKKKKKKKK
`;
const usedPal = { K: '#10122B', N: '#B5651D' };

const files = {
  'hiker.svg': svg(hikerA, hikerPal),
  'hiker-step.svg': svg(hikerB, hikerPal),
  'coin.svg': svg(coin, coinPal),
  'ground.svg': svg(ground, groundDay),
  'ground-night.svg': svg(ground, groundNight),
  'flag.svg': svg(flag, flagPal),
  'flag-wave.svg': svg(flag2, flagPal),
  'sparkle.svg': svg(sparkle, sparklePal),
  'qblock.svg': svg(qblock, qPal),
  'qblock-used.svg': svg(used, usedPal),
};

// the sky: two clouds on a wide transparent tile (the cloud is only an ingredient)
const cloudSvg = svg(cloud, cloudPal);
files['sky.svg'] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 260" width="640" height="260" shape-rendering="crispEdges">`
  + `<g transform="translate(40 70) scale(4)">${inner(cloudSvg)}</g>`
  + `<g transform="translate(380 24) scale(3)">${inner(cloudSvg)}</g>`
  + `</svg>`;

function inner(s) { return s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, ''); }

// the night: scattered square stars
let stars = '';
const pts = [[22, 30], [96, 80], [150, 18], [210, 120], [268, 52], [330, 150], [380, 34], [452, 96], [520, 20], [590, 132], [610, 60], [60, 170], [250, 210], [470, 200]];
pts.forEach(([x, y], i) => {
  const s = i % 3 === 0 ? 4 : 2;
  stars += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="#FFF4B0" opacity="${i % 2 ? 0.55 : 0.9}"/>`;
});
files['stars.svg'] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 260" width="640" height="260" shape-rendering="crispEdges">${stars}</svg>`;

for (const [name, body] of Object.entries(files)) writeFileSync(join(out, name), body);
console.log('wrote', Object.keys(files).join(', '));
