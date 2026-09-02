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

const css =
  header("/*") .replace("\n", " */\n") +
  ":root {\n" +
  lines(
    (n, h) => `  --kr-${n}: ${h};`,
    (n, s, h) => `  --kr-${n}-${s}: ${h};`,
    (name) => `  /* ${name} */`
  ) +
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

const cjs = header("//") + `const colors = {\n${jsObject(2, (g) => g.camel)}\n};\n\nmodule.exports = colors;\nmodule.exports.colors = colors;\nmodule.exports.default = colors;\n`;
const esm = header("//") + `export const colors = {\n${jsObject(2, (g) => g.camel)}\n};\n\nexport default colors;\n`;

let dts = header("//");
dts += `export type Shade = "50" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";\n`;
dts += `export type Scale = Record<Shade, string>;\n\n`;
dts += `export interface Colors {\n`;
for (const g of groups) dts += `  ${g.camel}: ${g.single ? "string" : "Scale"};\n`;
dts += `}\n\nexport const colors: Colors;\nexport default colors;\n`;

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
};

for (const [name, content] of Object.entries(files)) {
  writeFileSync(new URL(`./${name}`, import.meta.url), content);
  console.log("wrote", name);
}
