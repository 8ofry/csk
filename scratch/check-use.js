const fs = require('fs');
const path = require('path');

const svgContent = fs.readFileSync(path.join(__dirname, '..', 'Muscles_front_and_back.svg'), 'utf8');

const useRegex = /<use[^>]*>/g;
const uses = svgContent.match(useRegex) || [];

console.log(`Total use elements found: ${uses.length}`);
uses.slice(0, 30).forEach((u, idx) => {
  console.log(`${idx}: ${u}`);
});
