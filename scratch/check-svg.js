const fs = require('fs');
const path = require('path');

const svgContent = fs.readFileSync(path.join(__dirname, '..', 'Muscles_front_and_back.svg'), 'utf8');

const pathRegex = /<path\s+[^>]*id="([^"]+)"[^>]*>/g;
let match;
const ids = [];
while ((match = pathRegex.exec(svgContent)) !== null) {
  ids.push(match[1]);
}

console.log(`Total path IDs found: ${ids.length}`);
console.log('Sample IDs:', ids.slice(0, 50));
