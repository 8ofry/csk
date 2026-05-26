const fs = require('fs');
const path = require('path');

const svgContent = fs.readFileSync(path.join(__dirname, '..', 'Muscles_front_and_back.svg'), 'utf8');

function parseTransform(transformStr) {
  if (!transformStr) return { tx: 0, ty: 0, mx: 1, my: 1 };
  let tx = 0, ty = 0, mx = 1, my = 1;
  const translateMatch = transformStr.match(/translate\(([^,]+),?([^)]*)\)/);
  if (translateMatch) {
    tx = parseFloat(translateMatch[1]);
    ty = translateMatch[2] ? parseFloat(translateMatch[2]) : 0;
  }
  const matrixMatch = transformStr.match(/matrix\(([^,]+),([^,]+),([^,]+),([^,]+),([^,]+),([^)]+)\)/);
  if (matrixMatch) {
    mx = parseFloat(matrixMatch[1]);
    my = parseFloat(matrixMatch[4]);
    tx = parseFloat(matrixMatch[5]);
    ty = parseFloat(matrixMatch[6]);
  }
  return { tx, ty, mx, my };
}

const tagRegex = /(<g[^>]*>|<\/g>|<path[^>]*\/>|<path[^>]*>|<\/path>|<use[^>]*\/>)/g;
let match;
let currentGroups = [];
const elements = [];

while ((match = tagRegex.exec(svgContent)) !== null) {
  const tag = match[1];
  if (tag.startsWith('<g')) {
    const id = (tag.match(/id="([^"]+)"/) || [])[1] || '';
    const transform = (tag.match(/transform="([^"]+)"/) || [])[1] || '';
    currentGroups.push({ id, transform: parseTransform(transform) });
  } else if (tag.startsWith('</g>')) {
    currentGroups.pop();
  } else if (tag.startsWith('<path') || tag.startsWith('<use')) {
    const isPath = tag.startsWith('<path');
    const id = (tag.match(/id="([^"]+)"/) || [])[1] || '';
    const d = (tag.match(/d="([^"]+)"/) || (tag.match(/inkscape:original-d="([^"]+)"/) || []))[1] || '';
    const href = (tag.match(/xlink:href="([^"]+)"/) || tag.match(/href="([^"]+)"/) || [])[1] || '';
    const transform = (tag.match(/transform="([^"]+)"/) || [])[1] || '';

    elements.push({
      type: isPath ? 'path' : 'use',
      id,
      d,
      href,
      transform: parseTransform(transform),
      groups: [...currentGroups]
    });
  }
}

const rawPathsMap = new Map();
elements.forEach((el) => {
  if (el.type === 'path') {
    rawPathsMap.set(el.id, el);
  }
});

function getPathPoints(dStr) {
  if (!dStr) return [];
  const matches = dStr.match(/[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/g);
  if (!matches) return [];
  const points = [];
  for (let i = 0; i < matches.length - 1; i += 2) {
    points.push({ x: parseFloat(matches[i]), y: parseFloat(matches[i+1]) });
  }
  return points;
}

function transformPoint(pt, t) {
  return {
    x: pt.x * t.mx + t.tx,
    y: pt.y * t.my + t.ty
  };
}

const resolved = [];

elements.forEach((el) => {
  if (el.type === 'path') {
    const pts = getPathPoints(el.d);
    if (pts.length === 0) return;
    let transformedPts = pts;
    el.groups.forEach((g) => {
      transformedPts = transformedPts.map(pt => transformPoint(pt, g.transform));
    });
    transformedPts = transformedPts.map(pt => transformPoint(pt, el.transform));

    const xs = transformedPts.map(p => p.x);
    const ys = transformedPts.map(p => p.y);
    resolved.push({
      id: el.id,
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
      centerX: (Math.min(...xs) + Math.max(...xs)) / 2,
      centerY: (Math.min(...ys) + Math.max(...ys)) / 2,
      source: 'original'
    });
  } else if (el.type === 'use') {
    const targetId = el.href.substring(1);
    const targetPath = rawPathsMap.get(targetId);
    if (targetPath) {
      const pts = getPathPoints(targetPath.d);
      if (pts.length > 0) {
        let transformedPts = pts;
        targetPath.groups.forEach((g) => {
          transformedPts = transformedPts.map(pt => transformPoint(pt, g.transform));
        });
        transformedPts = transformedPts.map(pt => transformPoint(pt, targetPath.transform));
        el.groups.forEach((g) => {
          transformedPts = transformedPts.map(pt => transformPoint(pt, g.transform));
        });
        transformedPts = transformedPts.map(pt => transformPoint(pt, el.transform));

        const xs = transformedPts.map(p => p.x);
        const ys = transformedPts.map(p => p.y);
        resolved.push({
          id: `${el.id}_ref_${targetId}`,
          minX: Math.min(...xs),
          maxX: Math.max(...xs),
          minY: Math.min(...ys),
          maxY: Math.max(...ys),
          centerX: (Math.min(...xs) + Math.max(...xs)) / 2,
          centerY: (Math.min(...ys) + Math.max(...ys)) / 2,
          source: 'use_path'
        });
      }
    } else {
      const pathsInGroup = elements.filter(other => other.type === 'path' && other.groups.some(g => g.id === targetId));
      pathsInGroup.forEach((targetPath) => {
        const pts = getPathPoints(targetPath.d);
        if (pts.length > 0) {
          let transformedPts = pts;
          const groupIndex = targetPath.groups.findIndex(g => g.id === targetId);
          for (let i = 0; i <= groupIndex; i++) {
            transformedPts = transformedPts.map(pt => transformPoint(pt, targetPath.groups[i].transform));
          }
          transformedPts = transformedPts.map(pt => transformPoint(pt, targetPath.transform));
          el.groups.forEach((g) => {
            transformedPts = transformedPts.map(pt => transformPoint(pt, g.transform));
          });
          transformedPts = transformedPts.map(pt => transformPoint(pt, el.transform));

          const xs = transformedPts.map(p => p.x);
          const ys = transformedPts.map(p => p.y);
          resolved.push({
            id: `${el.id}_ref_${targetPath.id}`,
            minX: Math.min(...xs),
            maxX: Math.max(...xs),
            minY: Math.min(...ys),
            maxY: Math.max(...ys),
            centerX: (Math.min(...xs) + Math.max(...xs)) / 2,
            centerY: (Math.min(...ys) + Math.max(...ys)) / 2,
            source: 'use_group'
          });
        }
      });
    }
  }
});

// Separate into Front and Back
const front = resolved.filter(p => p.centerX < 203.5);
const back = resolved.filter(p => p.centerX >= 203.5);

let out = '';
out += '===================================================\n';
out += `FRONT SILHOUETTE PATHS (${front.length} paths)\n`;
out += '===================================================\n';
front.sort((a, b) => a.centerY - b.centerY || a.centerX - b.centerX);
front.forEach((p) => {
  out += `ID: ${p.id.padEnd(35)} | CenterX: ${p.centerX.toFixed(2).padStart(6)} (range ${p.minX.toFixed(1)}..${p.maxX.toFixed(1)}) | CenterY: ${p.centerY.toFixed(2).padStart(6)} (range ${p.minY.toFixed(1)}..${p.maxY.toFixed(1)}) | Source: ${p.source}\n`;
});

out += '\n===================================================\n';
out += `BACK SILHOUETTE PATHS (${back.length} paths)\n`;
out += '===================================================\n';
back.sort((a, b) => a.centerY - b.centerY || a.centerX - b.centerX);
back.forEach((p) => {
  out += `ID: ${p.id.padEnd(35)} | CenterX: ${p.centerX.toFixed(2).padStart(6)} (range ${p.minX.toFixed(1)}..${p.maxX.toFixed(1)}) | CenterY: ${p.centerY.toFixed(2).padStart(6)} (range ${p.minY.toFixed(1)}..${p.maxY.toFixed(1)}) | Source: ${p.source}\n`;
});

fs.writeFileSync(path.join(__dirname, '..', 'scratch', 'resolved-paths.txt'), out, 'utf8');
console.log('Saved to scratch/resolved-paths.txt');
