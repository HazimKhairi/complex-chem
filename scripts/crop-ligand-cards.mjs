/*
 * Split each composite ligand card in public/assets/ligand-cards/N.png
 * (front + back stitched horizontally) into two tightly-cropped files:
 *   public/assets/ligand-cards/front/N.png  — left half (logo/text)
 *   public/assets/ligand-cards/back/N.png   — right half (structure)
 *
 * sharp's .trim() removes the surrounding white padding so when the
 * UI renders with background-size: contain + background-position:
 * center the card sits perfectly centred without any cropped-half
 * positioning hack (was 220% / 6% / 94% before).
 *
 * Run: node scripts/crop-ligand-cards.mjs
 */

import sharp from "sharp";
import { readdirSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CARDS_DIR = join(__dirname, "..", "public", "assets", "ligand-cards");
const FRONT_DIR = join(CARDS_DIR, "front");
const BACK_DIR  = join(CARDS_DIR, "back");

if (!existsSync(FRONT_DIR)) mkdirSync(FRONT_DIR, { recursive: true });
if (!existsSync(BACK_DIR))  mkdirSync(BACK_DIR,  { recursive: true });

const files = readdirSync(CARDS_DIR)
  .filter((f) => /^\d+\.png$/.test(f))
  .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

if (files.length === 0) {
  console.error("No numbered card PNGs found in", CARDS_DIR);
  process.exit(1);
}

console.log(`Found ${files.length} ligand card(s). Writing halves...`);

for (const file of files) {
  const src = join(CARDS_DIR, file);
  const meta = await sharp(src).metadata();
  if (!meta.width || !meta.height) {
    console.warn(`!! skip ${file}: missing dimensions`);
    continue;
  }

  // Each COMPOSITE source is two cards side-by-side (~1.46:1 landscape).
  // SINGLE-CARD sources (e.g. 1.png at the time of writing) are
  // portrait (~0.7:1) — there's no second card to extract. Detect via
  // aspect ratio: anything ≥ 1.0 wide-vs-tall is a composite.
  const isComposite = meta.width / meta.height >= 1.0;
  const halfW = Math.floor(meta.width * 0.49);
  const rightStart = meta.width - halfW;

  // sharp can't pipeline extract → trim in a single chain (sharp
  // re-orders the ops and the post-trim dimensions invalidate the
  // earlier extract). Two-pass approach: extract to a Buffer, then
  // open the buffer and trim → write. Threshold 10 tolerates
  // near-white anti-aliasing on the rounded card edges without
  // eating into the actual card content.
  //
  if (!isComposite) {
    // Single-card source — trim the whole image and write the same
    // card to BOTH front and back so the flip card still works
    // (back will read identical to front, but at least the layout
    // doesn't render half a card).
    const fullTrimmed = await sharp(src)
      .trim({ background: "#ffffff", threshold: 10 })
      .toBuffer();
    const fm = await sharp(fullTrimmed).metadata();
    console.log(
      `  ${basename(file)}  SINGLE CARD (${meta.width}×${meta.height}) → trimmed ${fm.width}×${fm.height}, same on both sides`
    );
    await sharp(fullTrimmed).png({ compressionLevel: 9 }).toFile(join(FRONT_DIR, file));
    await sharp(fullTrimmed).png({ compressionLevel: 9 }).toFile(join(BACK_DIR, file));
    continue;
  }

  const frontBuf = await sharp(src)
    .extract({ left: 0, top: 0, width: halfW, height: meta.height })
    .toBuffer();
  await sharp(frontBuf)
    .trim({ background: "#ffffff", threshold: 10 })
    .png({ compressionLevel: 9 })
    .toFile(join(FRONT_DIR, file));

  const backBuf = await sharp(src)
    .extract({ left: rightStart, top: 0, width: halfW, height: meta.height })
    .toBuffer();
  await sharp(backBuf)
    .trim({ background: "#ffffff", threshold: 10 })
    .png({ compressionLevel: 9 })
    .toFile(join(BACK_DIR, file));

  // Report final dimensions so we can sanity-check the trim.
  const f = await sharp(join(FRONT_DIR, file)).metadata();
  const b = await sharp(join(BACK_DIR,  file)).metadata();
  console.log(
    `  ${basename(file)}  front ${f.width}×${f.height}  back ${b.width}×${b.height}`
  );
}

console.log("Done.");
