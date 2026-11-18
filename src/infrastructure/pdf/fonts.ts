// Arabic font registration for @react-pdf/renderer.
// Self-hosted in public/fonts so PDF generation works offline and without CDN latency.
// NFR-USE-02: typographic parity for Arabic.

import path from "node:path";
import { Font } from "@react-pdf/renderer";

let registered = false;

export function ensureFontsRegistered() {
  if (registered) return;

  const fontsDir = path.join(process.cwd(), "public", "fonts");

  Font.register({
    family: "Tajawal",
    fonts: [
      { src: path.join(fontsDir, "tajawal-arabic-400-normal.woff"), fontWeight: 400 },
      { src: path.join(fontsDir, "tajawal-arabic-500-normal.woff"), fontWeight: 500 },
      { src: path.join(fontsDir, "tajawal-arabic-700-normal.woff"), fontWeight: 700 },
    ],
  });

  // Disable auto-hyphenation for Arabic word integrity
  Font.registerHyphenationCallback((word) => [word]);

  registered = true;
}
