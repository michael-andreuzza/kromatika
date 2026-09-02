// Generates every distributed format from colors.json, the single source
// of truth. Run with `npm run build` after editing colors.json.
import { readFileSync, writeFileSync } from "node:fs";

const src = JSON.parse(readFileSync(new URL("./colors.json", import.meta.url), "utf8"));
const STEPS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"];

const kebab = (name) => name.toLowerCase().replace(/\s+/g, "-");
const camel = (name) => kebab(name).replace(/-(\w)/g, (_, c) => c.toUpperCase());
const label = (name) => name.replace(/\b\w/g, (c) => c.toUpperCase());

// Flatten into [{ name, kebab, camel, shades: [[step, hex], ...] | hex }]
const groups = Object.entries(src).map(([name, value]) => ({
  name: label(name),
  kebab: kebab(name),
  camel: camel(name),
  single: typeof value === "string" ? value.toLowerCase() : null,
  shades: typeof value === "string" ? [] : STEPS.map((s) => [s, value[s].toLowerCase()]),
}));

/* ---------------------------------------------------------------- */
/* sRGB hex -> OKLCH, for the Tailwind v4 theme                       */
/* ---------------------------------------------------------------- */

function hexToOklch(hex) {
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(A, B);
  const H = C < 0.0005 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`;
}

/* ---------------------------------------------------------------- */
/* WCAG 2 contrast: which text color works on each shade              */
/* ---------------------------------------------------------------- */

function luminance(hex) {
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE = "#ffffff";
const BLACK = "#000000";

// For every shade: contrast vs white and black, and the better text color.
const contrastData = {};
for (const g of groups) {
  if (g.single) continue;
  contrastData[g.kebab] = {};
  for (const [step, hex] of g.shades) {
    const white = contrast(hex, WHITE);
    const black = contrast(hex, BLACK);
    contrastData[g.kebab][step] = {
      white: +white.toFixed(2),
      black: +black.toFixed(2),
      on: white >= black ? WHITE : BLACK,
    };
  }
}

/* ---------------------------------------------------------------- */
/* Emitters                                                           */
/* ---------------------------------------------------------------- */

const header = (comment) => `${comment} Generated from colors.json by build.mjs — do not edit by hand.\n`;

function lines(fmtSingle, fmtShade, fmtComment = null) {
  const out = [];
  for (const g of groups) {
    if (fmtComment) out.push(fmtComment(g.name));
    if (g.single) out.push(fmtSingle(g.kebab, g.single));
    for (const [step, hex] of g.shades) out.push(fmtShade(g.kebab, step, hex));
  }
  return out.join("\n") + "\n";
}

let onVars = "\n  /* Text color with the best WCAG contrast on each shade */\n";
for (const [scale, shades] of Object.entries(contrastData)) {
  for (const [step, d] of Object.entries(shades)) onVars += `  --kr-on-${scale}-${step}: ${d.on};\n`;
}

const css =
  header("/*") .replace("\n", " */\n") +
  ":root {\n" +
  lines(
    (n, h) => `  --kr-${n}: ${h};`,
    (n, s, h) => `  --kr-${n}-${s}: ${h};`,
    (name) => `  /* ${name} */`
  ) +
  onVars +
  "}\n";

const scss = header("//") + lines(
  (n, h) => `$kr-${n}: ${h};`,
  (n, s, h) => `$kr-${n}-${s}: ${h};`,
  (name) => `// ${name}`
);

const less = header("//") + lines(
  (n, h) => `@kr-${n}: ${h};`,
  (n, s, h) => `@kr-${n}-${s}: ${h};`,
  (name) => `// ${name}`
);

const styl = header("//") + lines(
  (n, h) => `$kr-${n} = ${h}`,
  (n, s, h) => `$kr-${n}-${s} = ${h}`,
  (name) => `// ${name}`
);

let yml = header("#");
for (const g of groups) {
  if (g.single) yml += `kr-${g.kebab}: "${g.single}"\n`;
  else {
    yml += `kr-${g.kebab}:\n`;
    for (const [step, hex] of g.shades) yml += `  ${step}: "${hex}"\n`;
  }
}

// JS object literal shared by CJS, ESM, and the Tailwind v3 config.
function jsObject(indent, keyFn) {
  const pad = " ".repeat(indent);
  const out = [];
  for (const g of groups) {
    if (g.single) out.push(`${pad}${keyFn(g)}: "${g.single}",`);
    else {
      out.push(`${pad}${keyFn(g)}: {`);
      for (const [step, hex] of g.shades) out.push(`${pad}  ${step}: "${hex}",`);
      out.push(`${pad}},`);
    }
  }
  return out.join("\n");
}

// `on`: best text color per shade. `contrast`: the ratios behind it.
function onObject(indent) {
  const pad = " ".repeat(indent);
  return groups.filter((g) => !g.single).map((g) =>
    `${pad}${g.camel}: {\n` +
    g.shades.map(([s]) => `${pad}  ${s}: "${contrastData[g.kebab][s].on}",`).join("\n") +
    `\n${pad}},`
  ).join("\n");
}
function contrastObject(indent) {
  const pad = " ".repeat(indent);
  return groups.filter((g) => !g.single).map((g) =>
    `${pad}${g.camel}: {\n` +
    g.shades.map(([s]) => {
      const d = contrastData[g.kebab][s];
      return `${pad}  ${s}: { white: ${d.white}, black: ${d.black} },`;
    }).join("\n") +
    `\n${pad}},`
  ).join("\n");
}

const jsBody =
  `const colors = {\n${jsObject(2, (g) => g.camel)}\n};\n\n` +
  `const on = {\n${onObject(2)}\n};\n\n` +
  `const contrast = {\n${contrastObject(2)}\n};\n`;

const cjs = header("//") + jsBody +
  `\nmodule.exports = colors;\nmodule.exports.colors = colors;\nmodule.exports.on = on;\nmodule.exports.contrast = contrast;\nmodule.exports.default = colors;\n`;
const esm = header("//") + jsBody.replace(/^const /gm, "export const ") + `\nexport default colors;\n`;

let dts = header("//");
dts += `export type Shade = "50" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";\n`;
dts += `export type Scale = Record<Shade, string>;\n`;
dts += `export type ScaleName = ${groups.filter((g) => !g.single).map((g) => `"${g.camel}"`).join(" | ")};\n\n`;
dts += `export interface Colors {\n`;
for (const g of groups) dts += `  ${g.camel}: ${g.single ? "string" : "Scale"};\n`;
dts += `}\n\n`;
dts += `/** Best text color (white or black) for each shade, by WCAG 2 contrast. */\n`;
dts += `export type On = Record<ScaleName, Scale>;\n`;
dts += `/** WCAG 2 contrast ratios of each shade against white and black. */\n`;
dts += `export type Contrast = Record<ScaleName, Record<Shade, { white: number; black: number }>>;\n\n`;
dts += `export const colors: Colors;\nexport const on: On;\nexport const contrast: Contrast;\nexport default colors;\n`;

/* W3C Design Tokens (Figma Variables, Tokens Studio, Style Dictionary) */
const tokens = { kromatika: {} };
for (const g of groups) {
  if (g.single) tokens.kromatika[g.kebab] = { $type: "color", $value: g.single };
  else {
    tokens.kromatika[g.kebab] = {};
    for (const [step, hex] of g.shades) tokens.kromatika[g.kebab][step] = { $type: "color", $value: hex };
  }
}
const tokensJson = JSON.stringify(tokens, null, 2) + "\n";

/* CONTRAST.md: full table, plus a quick-reference of AA thresholds */
const AA = 4.5;
let contrastMd = `# Contrast\n\nWCAG 2 contrast ratios for every shade against white and black text, and the\ntext color Kromatika recommends (\`--kr-on-*\`, \`on.*\` in JS). AA for normal\ntext is 4.5:1; AA for large text and UI components is 3:1.\n\nGenerated from colors.json by build.mjs.\n\n## Quick reference\n\nThe first shade where white text passes AA (4.5:1), and the last shade where\nblack text does.\n\n| Scale | White text from | Black text up to |\n| --- | --- | --- |\n`;
for (const g of groups) {
  if (g.single) continue;
  const d = contrastData[g.kebab];
  const firstWhite = g.shades.find(([s]) => d[s].white >= AA)?.[0] ?? "—";
  const lastBlack = [...g.shades].reverse().find(([s]) => d[s].black >= AA)?.[0] ?? "—";
  contrastMd += `| ${g.name} | ${firstWhite} | ${lastBlack} |\n`;
}
for (const g of groups) {
  if (g.single) continue;
  contrastMd += `\n## ${g.name}\n\n| Shade | Hex | vs white | vs black | Use |\n| --- | --- | --- | --- | --- |\n`;
  for (const [step, hex] of g.shades) {
    const d = contrastData[g.kebab][step];
    const mark = (v) => `${v.toFixed(2)}${v >= AA ? " ✓" : v >= 3 ? " ◐" : ""}`;
    contrastMd += `| ${step} | \`${hex}\` | ${mark(d.white)} | ${mark(d.black)} | ${d.on === WHITE ? "white" : "black"} text |\n`;
  }
}
contrastMd += `\n✓ passes AA for normal text (≥ 4.5:1) · ◐ passes AA for large text and UI (≥ 3:1)\n`;

/* theme.css: a small semantic layer that works in light and dark */
const pick = (scale, step) => groups.find((g) => g.kebab === scale).shades.find(([s]) => s === step)[1];
const semantic = {
  light: {
    background: WHITE,
    foreground: pick("charcoal", "900"),
    muted: pick("charcoal", "50"),
    "muted-foreground": pick("charcoal", "500"),
    border: pick("charcoal", "100"),
    accent: pick("blue", "600"), // first blue shade where white text passes AA
    "accent-foreground": WHITE,
    success: pick("pastel-green", "500"),
    warning: pick("carrot", "400"),
    danger: pick("red", "500"),
  },
  dark: {
    background: pick("charcoal", "900"),
    foreground: pick("charcoal", "50"),
    muted: pick("charcoal", "800"),
    "muted-foreground": pick("charcoal", "300"),
    border: pick("charcoal", "700"),
    accent: pick("blue", "400"),
    "accent-foreground": pick("charcoal", "900"),
    success: pick("pastel-green", "300"),
    warning: pick("carrot", "300"),
    danger: pick("red", "300"),
  },
};
const block = (vars, indent) => Object.entries(vars).map(([k, v]) => `${" ".repeat(indent)}--kr-${k}: ${v};`).join("\n");
const themeCss =
  header("/*").replace("\n", " */\n") +
  `/* Semantic tokens on top of Kromatika. Follows the system theme; set\n   data-theme="light" or "dark" on <html> to force one. */\n` +
  `:root {\n  color-scheme: light dark;\n${block(semantic.light, 2)}\n}\n\n` +
  `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n${block(semantic.dark, 4)}\n  }\n}\n\n` +
  `:root[data-theme="dark"] {\n${block(semantic.dark, 2)}\n}\n`;

const twConfig =
  header("//") +
  `// Tailwind CSS v3: spread into your theme, or require it in tailwind.config.js.\n` +
  `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n` +
  jsObject(8, (g) => (g.kebab.includes("-") ? `"${g.kebab}"` : g.kebab)) +
  `\n      },\n    },\n  },\n};\n`;

let twCss = header("/*").replace("\n", " */\n");
twCss += `/* Tailwind CSS v4: @import "kromatika/tailwind.css" after tailwindcss. */\n@theme {\n`;
for (const g of groups) {
  twCss += `  /* ${g.name} */\n`;
  if (g.single) twCss += `  --color-${g.kebab}: ${g.single};\n`;
  for (const [step, hex] of g.shades) twCss += `  --color-${g.kebab}-${step}: ${hexToOklch(hex)};\n`;
}
twCss += `}\n`;

/* ---------------------------------------------------------------- */

const files = {
  "colors.css": css,
  "colors.scss": scss,
  "colors.less": less,
  "colors.styl": styl,
  "colors.yml": yml,
  "index.js": cjs,
  "index.mjs": esm,
  "index.d.ts": dts,
  "tailwind.config.js": twConfig,
  "tailwind.css": twCss,
  "tokens.json": tokensJson,
  "theme.css": themeCss,
  "CONTRAST.md": contrastMd,
};

for (const [name, content] of Object.entries(files)) {
  writeFileSync(new URL(`./${name}`, import.meta.url), content);
  console.log("wrote", name);
}
