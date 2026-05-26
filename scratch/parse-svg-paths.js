const fs = require('fs');
const path = require('path');

const svgContent = fs.readFileSync(path.join(__dirname, '..', 'Muscles_front_and_back.svg'), 'utf8');

// A simple parser for SVG paths and group translations
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
    mx = parseFloat(matrixMatch[1]); // x scale / mirror
    my = parseFloat(matrixMatch[4]); // y scale
    tx = parseFloat(matrixMatch[5]); // x translation
    ty = parseFloat(matrixMatch[6]); // y translation
  }
  return { tx, ty, mx, my };
}

// Simple XML parser to trace groups and paths
const { XMLParser } = require('crypto'); // We can just write a simple DOM-like parser using regex
// Or we can use regular expressions to match elements and their parents.
// Let's write a robust regex parser that tracks the hierarchy.

const elements = [];
let match;

// We will find all elements: <g>, </g>, <path>, <use>
// Tokenize the SVG content
const tagRegex = /(<g[^>]*>|<\/g>|<path[^>]*\/>|<path[^>]*>|<\/path>|<use[^>]*\/>)/g;
let currentGroups = [];

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
      transformStr: transform,
      transform: parseTransform(transform),
      groups: [...currentGroups]
    });
  }
}

console.log(`Parsed ${elements.length} elements.`);

// Now let's calculate the bounding boxes in the SVG space
// For a path, we parse numbers from the d attribute.
// The odd numbers are X, even are Y (approximately, if we just extract all floats).
// To be more precise, let's just parse all numbers in the 'd' attribute.
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

// Function to apply transforms to a point
function transformPoint(pt, t) {
  return {
    x: pt.x * t.mx + t.tx,
    y: pt.y * t.my + t.ty
  };
}

// Collect all resolved path geometries
const resolvedPaths = [];

// First, store the raw path definitions in a map for <use> dereferencing
const rawPathsMap = new Map();
const rawGroupsMap = new Map();

// We need to parse raw groups contents too. But let's build them by matching elements.
elements.forEach((el) => {
  if (el.type === 'path') {
    rawPathsMap.set(el.id, el);
  }
});

// Let's resolve each element's absolute geometry
elements.forEach((el) => {
  if (el.type === 'path') {
    const pts = getPathPoints(el.d);
    if (pts.length === 0) return;

    // Apply group transforms from inside out
    let transformedPts = pts;
    el.groups.forEach((g) => {
      transformedPts = transformedPts.map(pt => transformPoint(pt, g.transform));
    });
    // Apply path transform if any
    transformedPts = transformedPts.map(pt => transformPoint(pt, el.transform));

    const xs = transformedPts.map(p => p.x);
    const ys = transformedPts.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    resolvedPaths.push({
      id: el.id,
      centerX,
      centerY,
      minX,
      maxX,
      minY,
      maxY,
      source: 'original'
    });
  } else if (el.type === 'use') {
    // A <use> links to a path or a group.
    const targetId = el.href.substring(1);
    // If it's a path:
    const targetPath = rawPathsMap.get(targetId);
    if (targetPath) {
      const pts = getPathPoints(targetPath.d);
      if (pts.length > 0) {
        let transformedPts = pts;
        // Target path's own group transforms
        targetPath.groups.forEach((g) => {
          transformedPts = transformedPts.map(pt => transformPoint(pt, g.transform));
        });
        // Target path's own transform
        transformedPts = transformedPts.map(pt => transformPoint(pt, targetPath.transform));
        // Use element's group transforms
        el.groups.forEach((g) => {
          transformedPts = transformedPts.map(pt => transformPoint(pt, g.transform));
        });
        // Use element's own transform
        transformedPts = transformedPts.map(pt => transformPoint(pt, el.transform));

        const xs = transformedPts.map(p => p.x);
        const ys = transformedPts.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        resolvedPaths.push({
          id: `${el.id}_ref_${targetId}`,
          centerX,
          centerY,
          minX,
          maxX,
          minY,
          maxY,
          source: 'use_path'
        });
      }
    } else {
      // It might reference a group. Let's find all paths that were inside that group.
      // A path was inside the group if its groups stack contains a group with that targetId.
      const pathsInGroup = elements.filter(other => other.type === 'path' && other.groups.some(g => g.id === targetId));
      pathsInGroup.forEach((targetPath) => {
        const pts = getPathPoints(targetPath.d);
        if (pts.length > 0) {
          let transformedPts = pts;
          // Apply target path's group transforms up to the referenced group
          const groupIndex = targetPath.groups.findIndex(g => g.id === targetId);
          for (let i = 0; i <= groupIndex; i++) {
            transformedPts = transformedPts.map(pt => transformPoint(pt, targetPath.groups[i].transform));
          }
          // Now apply target path's own transform
          transformedPts = transformedPts.map(pt => transformPoint(pt, targetPath.transform));
          // Now apply use element's group transforms
          el.groups.forEach((g) => {
            transformedPts = transformedPts.map(pt => transformPoint(pt, g.transform));
          });
          // Now apply use element's own transform
          transformedPts = transformedPts.map(pt => transformPoint(pt, el.transform));

          const xs = transformedPts.map(p => p.x);
          const ys = transformedPts.map(p => p.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;

          resolvedPaths.push({
            id: `${el.id}_ref_${targetPath.id}`,
            centerX,
            centerY,
            minX,
            maxX,
            minY,
            maxY,
            source: 'use_group'
          });
        }
      });
    }
  }
});

// Let's print out the paths sorting them by centerX to see where they fall
console.log("\nALL RESOLVED PATH GEOMETRIES (sorted by centerX):");
resolvedPaths.sort((a, b) => a.centerX - b.centerX);
resolvedPaths.forEach((p) => {
  console.log(`ID: ${p.id.padEnd(35)} | CenterX: ${p.centerX.toFixed(2).padStart(6)} | CenterY: ${p.centerY.toFixed(2).padStart(6)} | Source: ${p.source}`);
});
