// Color math shared by build.mjs, tune.mjs and test.mjs. No dependencies.
//
// colors.json stores each shade as an `oklch(L C H)` string (plain hex is
// also accepted, for adding colors by hand). OKLCH is the source of truth
// because hex is lossy: round-tripping through it nudges channels by one and
// makes tuning non-idempotent. Hex is derived at build time, clipping chroma
// into sRGB while keeping lightness and hue exact.

const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function hexToRgb(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
}

export function hexToOklch(hex) {
  const [r, g, b] = hexToRgb(hex).map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(A, B);
  const H = C < 0.0005 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return { L, C, H };
}

export function oklchToLinearRgb({ L, C, H }) {
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

export const inSrgb = (color) => oklchToLinearRgb(color).every((c) => c >= -1e-6 && c <= 1 + 1e-6);

// Largest chroma at this L and H that still fits in sRGB.
export function clipToSrgb(color) {
  if (inSrgb(color)) return color;
  let lo = 0, hi = color.C;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (inSrgb({ ...color, C: mid })) lo = mid; else hi = mid;
  }
  return { ...color, C: lo };
}

export function oklchToHex(color) {
  return "#" + oklchToLinearRgb(clipToSrgb(color))
    .map((c) => Math.round(gam(Math.min(1, Math.max(0, c))) * 255).toString(16).padStart(2, "0"))
    .join("");
}

export function formatOklch({ L, C, H }) {
  return `oklch(${L.toFixed(3)} ${C.toFixed(4)} ${H.toFixed(1)})`;
}

// Accepts "oklch(L C H)" or "#rrggbb".
export function parseColor(value) {
  const m = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/i.exec(value.trim());
  if (m) return { L: +m[1], C: +m[2], H: +m[3] };
  if (/^#[0-9a-f]{6}$/i.test(value.trim())) return hexToOklch(value.trim().toLowerCase());
  throw new Error(`Unrecognised color "${value}" — use oklch(L C H) or #rrggbb`);
}

/* WCAG 2 */

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/* Palette structure */

export const STEPS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"];

// Shared lightness curves. Chromatic scales follow one; near-neutral scales
// (low chroma) follow a wider one so they can reach nearly black.
export const CURVE_CHROMATIC = [0.96, 0.91, 0.84, 0.76, 0.67, 0.58, 0.49, 0.41, 0.35, 0.30];
export const CURVE_NEUTRAL   = [0.97, 0.92, 0.84, 0.74, 0.63, 0.52, 0.42, 0.33, 0.25, 0.19];
export const NEUTRAL_MAX_CHROMA = 0.08;

export const isNeutral = (shades) => Math.max(...shades.map((c) => c.C)) < NEUTRAL_MAX_CHROMA;
export const curveFor = (shades) => (isNeutral(shades) ? CURVE_NEUTRAL : CURVE_CHROMATIC);
