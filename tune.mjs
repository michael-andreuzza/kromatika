// Normalises colors.json so every scale follows the same lightness curve.
//
// For each scale: each shade keeps its own hue and chroma, and lightness is
// snapped to a shared OKLCH curve, then clipped into sRGB by reducing chroma.
// Near-neutral scales (low chroma) get a wider curve so they can go nearly
// black, like every major palette does with its grays.
//
// Hue is deliberately left alone: the hand-picked drift inside a scale (sky
// running from cyan tints to navy darks, carrot from yellow to amber) is part
// of the palette's character, and it has no effect on contrast.
//
// Usage: node tune.mjs [--dry] [--fix-hue]
//   --dry      print the diff, do not write colors.json
//   --fix-hue  also lock every shade to the scale's chroma-weighted mean hue

import { readFileSync, writeFileSync } from "node:fs";

const CHROMATIC = [0.96, 0.91, 0.84, 0.76, 0.67, 0.58, 0.49, 0.41, 0.35, 0.30];
const NEUTRAL   = [0.97, 0.92, 0.84, 0.74, 0.63, 0.52, 0.42, 0.33, 0.25, 0.19];
const NEUTRAL_MAX_CHROMA = 0.08; // charcoal, metal, haiti
const GRAY_MAX_CHROMA = 0.03;    // charcoal, metal: hue is noise, leave it
const STEPS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"];

/* ---- color math ---- */

const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function hexToOklch(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(A, B), H: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 };
}

function oklchToRgb({ L, C, H }) {
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const inGamut = (rgb) => rgb.every((c) => c >= -1e-6 && c <= 1 + 1e-6);

// Reduce chroma until the color fits in sRGB; keeps L and H exact.
function toHex(color) {
  let { L, C, H } = color;
  if (!inGamut(oklchToRgb({ L, C, H }))) {
    let lo = 0, hi = C;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToRgb({ L, C: mid, H }))) lo = mid; else hi = mid;
    }
    C = lo;
  }
  return "#" + oklchToRgb({ L, C, H })
    .map((c) => Math.round(gam(Math.min(1, Math.max(0, c))) * 255).toString(16).padStart(2, "0"))
    .join("");
}

/* ---- tune ---- */

const FIX_HUE = process.argv.includes("--fix-hue");
const src = JSON.parse(readFileSync(new URL("./colors.json", import.meta.url), "utf8"));
const out = {};
const report = [];

for (const [name, value] of Object.entries(src)) {
  if (typeof value === "string") { out[name] = value; continue; }

  const shades = STEPS.map((s) => hexToOklch(value[s]));
  const maxC = Math.max(...shades.map((c) => c.C));
  const neutral = maxC < NEUTRAL_MAX_CHROMA;
  const gray = maxC < GRAY_MAX_CHROMA;
  const curve = neutral ? NEUTRAL : CHROMATIC;
  // For --fix-hue: the scale's identity hue, weighted by chroma so the vivid
  // middle shades count more than the washed-out ends.
  let x = 0, y = 0;
  for (const c of shades) { x += c.C * Math.cos((c.H * Math.PI) / 180); y += c.C * Math.sin((c.H * Math.PI) / 180); }
  const anchorHue = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;

  out[name] = {};
  STEPS.forEach((step, i) => {
    const orig = shades[i];
    const hex = toHex({
      L: curve[i],
      C: orig.C,
      H: FIX_HUE && !gray ? anchorHue : orig.H,
    });
    out[name][step] = hex;
    report.push([name, step, value[step], hex]);
  });
}

console.log("scale          step  before    after");
for (const [n, s, a, b] of report) {
  console.log(n.padEnd(14), s.padStart(4), " ", a, a === b ? "  (same)" : "→ " + b);
}

if (!process.argv.includes("--dry")) {
  writeFileSync(new URL("./colors.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
  console.log("\nwrote colors.json — run `node build.mjs` to regenerate outputs");
}
