// Arabic font registration for @react-pdf/renderer.
// Tajawal hosted at jsdelivr CDN — no local file needed. Cached after first use.
// NFR-USE-02: typographic parity for Arabic. Without explicit registration,
// react-pdf renders Arabic as boxes.

import { Font } from "@react-pdf/renderer";

let registered = false;

const TAJAWAL_BASE = "https://cdn.jsdelivr.net/npm/@fontsource/tajawal/files";

export function ensureFontsRegistered() {
  if (registered) return;

  Font.register({
    family: "Tajawal",
    fonts: [
      { src: `${TAJAWAL_BASE}/tajawal-arabic-400-normal.woff`, fontWeight: 400 },
      { src: `${TAJAWAL_BASE}/tajawal-arabic-500-normal.woff`, fontWeight: 500 },
      { src: `${TAJAWAL_BASE}/tajawal-arabic-700-normal.woff`, fontWeight: 700 },
    ],
  });

  // Disable auto-hyphenation for Arabic word integrity
  Font.registerHyphenationCallback((word) => [word]);

  registered = true;
}
