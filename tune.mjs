// Normalises colors.json so every scale follows the same lightness curve.
//
// Each shade keeps its own hue and chroma; lightness is snapped to the shared
// OKLCH curve (see color.mjs). Near-neutral scales get a wider curve so they
// can go nearly black, like every major palette does with its grays.
//
// Hue is deliberately left alone: the hand-picked drift inside a scale (sky
// running from cyan tints to navy darks, carrot from yellow to amber) is part
// of the palette's character, and it has no effect on contrast.
//
// Shades are written back as oklch() strings, so running this twice is a
// no-op. Hex values in colors.json are accepted and converted.
//
// Usage: node tune.mjs [--dry] [--fix-hue]
//   --dry      print the diff, do not write colors.json
//   --fix-hue  also lock every shade to the scale's chroma-weighted mean hue

import { readFileSync, writeFileSync } from "node:fs";
import { STEPS, parseColor, formatOklch, oklchToHex, curveFor, isNeutral } from "./color.mjs";

const FIX_HUE = process.argv.includes("--fix-hue");
const GRAY_MAX_CHROMA = 0.03; // charcoal, metal: hue is noise, never lock it

const url = new URL("./colors.json", import.meta.url);
const src = JSON.parse(readFileSync(url, "utf8"));
const out = {};
const report = [];

for (const [name, value] of Object.entries(src)) {
  if (typeof value === "string") { out[name] = value; continue; }

  const shades = STEPS.map((s) => parseColor(value[s]));
  const curve = curveFor(shades);
  const gray = Math.max(...shades.map((c) => c.C)) < GRAY_MAX_CHROMA;

  let x = 0, y = 0;
  for (const c of shades) { x += c.C * Math.cos((c.H * Math.PI) / 180); y += c.C * Math.sin((c.H * Math.PI) / 180); }
  const anchorHue = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;

  out[name] = {};
  STEPS.forEach((step, i) => {
    const orig = shades[i];
    const tuned = { L: curve[i], C: orig.C, H: FIX_HUE && !gray ? anchorHue : orig.H };
    out[name][step] = formatOklch(tuned);
    report.push([name, step, oklchToHex(orig), oklchToHex(tuned), isNeutral(shades)]);
  });
}

console.log("scale          step  before    after");
for (const [n, s, a, b, neutral] of report) {
  console.log(n.padEnd(14), s.padStart(4), " ", a, a === b ? "  (same)" : "→ " + b, neutral && s === "50" ? "  [neutral curve]" : "");
}

if (!process.argv.includes("--dry")) {
  writeFileSync(url, JSON.stringify(out, null, 2) + "\n");
  console.log("\nwrote colors.json — run `npm run build` to regenerate outputs");
}
