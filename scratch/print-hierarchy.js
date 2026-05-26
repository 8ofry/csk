const fs = require('fs');
const path = require('path');

const svgContent = fs.readFileSync(path.join(__dirname, '..', 'Muscles_front_and_back.svg'), 'utf8');

const tagRegex = /(<g[^>]*>|<\/g>|<use[^>]*\/>|<svg[^>]*>|<\/svg>)/g;
let match;
let depth = 0;

while ((match = tagRegex.exec(svgContent)) !== null) {
  const tag = match[1];
  if (tag.startsWith('<svg') || tag.startsWith('<g')) {
    const id = (tag.match(/id="([^"]+)"/) || [])[1] || '';
    const transform = (tag.match(/transform="([^"]+)"/) || [])[1] || '';
    console.log(`${'  '.repeat(depth)}${tag.startsWith('<svg') ? 'svg' : 'g'} id="${id}" transform="${transform}"`);
    depth++;
  } else if (tag.startsWith('</svg>') || tag.startsWith('</g>')) {
    depth--;
    console.log(`${'  '.repeat(depth)}/${tag.startsWith('</svg>') ? 'svg' : 'g'}`);
  } else if (tag.startsWith('<use')) {
    const id = (tag.match(/id="([^"]+)"/) || [])[1] || '';
    const href = (tag.match(/xlink:href="([^"]+)"/) || tag.match(/href="([^"]+)"/) || [])[1] || '';
    const transform = (tag.match(/transform="([^"]+)"/) || [])[1] || '';
    console.log(`${'  '.repeat(depth)}use id="${id}" href="${href}" transform="${transform}"`);
  }
}
