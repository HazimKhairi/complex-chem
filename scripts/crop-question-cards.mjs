/*
 * Crop the LEFT half ("Did you know?" info panel) out of each
 * question card in public/assets/question-cards/ and write the result
 * alongside as <n>_left.png. The right half (the actual question) is
 * never used at runtime — only the left half is shown in the in-game
 * hint popup, replacing the previous text-based explainer.
 *
 * Run: node scripts/crop-question-cards.mjs
 */

import sharp from "sharp";
import { readdirSync, mkdirSync, existsSync } from "node:fs";
import { join, basename, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CARDS_DIR = join(__dirname, "..", "public", "assets", "question-cards");
const OUT_DIR = join(CARDS_DIR, "left");

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const files = readdirSync(CARDS_DIR).filter(
  (f) => extname(f).toLowerCase() === ".png" && /^\d+\.png$/i.test(f)
);

if (files.length === 0) {
  console.error("No numbered card PNGs found in", CARDS_DIR);
  process.exit(1);
}

console.log(`Found ${files.length} card(s). Cropping left halves → ${OUT_DIR}`);

for (const file of files) {
  const src = join(CARDS_DIR, file);
  const meta = await sharp(src).metadata();
  if (!meta.width || !meta.height) {
    console.warn(`!! skip ${file}: missing dimensions`);
    continue;
  }
  // The two sub-cards sit side-by-side with a thin gutter between them.
  // 49% width keeps us safely on the left card without clipping any of
  // the info panel's red border on the right edge.
  const cropW = Math.floor(meta.width * 0.49);
  const out = join(OUT_DIR, file);
  await sharp(src)
    .extract({ left: 0, top: 0, width: cropW, height: meta.height })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`  ${file} → left/${basename(out)} (${cropW} × ${meta.height})`);
}

console.log("Done.");
