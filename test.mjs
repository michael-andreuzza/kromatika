// Guards the promises the README makes. Run with `npm test`.
//
//  1. Every generated file matches what build.mjs would write now, so nobody
//     edits an output by hand or forgets to rebuild after touching colors.json.
//  2. Every shade sits exactly on its lightness curve (see color.mjs).
//  3. `on` agrees with `contrast`, and every semantic theme pairing passes
//     WCAG AA: 4.5:1 for text, 3:1 for status colours against the background.
//  4. CJS and ESM entry points expose the same data; package.json "files"
//     all exist.

import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { generate } from "./build.mjs";
import { STEPS, parseColor, curveFor, contrast } from "./color.mjs";

const require = createRequire(import.meta.url);
const here = (f) => new URL(`./${f}`, import.meta.url);
let failures = 0;
const check = (ok, msg) => { if (!ok) { failures++; console.error("  ✗", msg); } };

/* 1. freshness */
console.log("generated files are fresh");
for (const [name, content] of Object.entries(generate())) {
  check(existsSync(here(name)), `${name} is missing — run npm run build`);
  if (existsSync(here(name))) check(readFileSync(here(name), "utf8") === content, `${name} is stale — run npm run build`);
}

/* 2. lightness curve */
console.log("shades sit on the lightness curve");
const src = JSON.parse(readFileSync(here("colors.json"), "utf8"));
for (const [name, value] of Object.entries(src)) {
  if (typeof value === "string") continue;
  const shades = STEPS.map((s) => parseColor(value[s]));
  const curve = curveFor(shades);
  STEPS.forEach((step, i) => {
    check(Math.abs(shades[i].L - curve[i]) < 1e-6, `${name} ${step}: L ${shades[i].L} ≠ ${curve[i]} — run node tune.mjs`);
  });
}

/* 3. contrast */
console.log("contrast data and theme pairings pass AA");
const { colors, on, contrast: ratios } = await import("./index.mjs");
for (const [scale, shades] of Object.entries(ratios)) {
  for (const [step, r] of Object.entries(shades)) {
    const expected = r.white >= r.black ? "#ffffff" : "#000000";
    check(on[scale][step] === expected, `on.${scale}[${step}] should be ${expected}`);
    const actual = { white: contrast(colors[scale][step], "#ffffff"), black: contrast(colors[scale][step], "#000000") };
    check(Math.abs(actual.white - r.white) < 0.006 && Math.abs(actual.black - r.black) < 0.006, `contrast.${scale}[${step}] is stale`);
  }
}

const theme = readFileSync(here("theme.css"), "utf8");
const [lightBlock, darkBlock] = theme.split("@media");
const vars = (block) => Object.fromEntries([...block.matchAll(/--kr-([\w-]+): (#[0-9a-f]{6})/g)].map((m) => [m[1], m[2]]));
for (const [mode, block] of [["light", lightBlock], ["dark", darkBlock]]) {
  const t = vars(block);
  const pair = (a, b, min) => {
    const r = contrast(t[a], t[b]);
    check(r >= min, `${mode}: ${a} on ${b} is ${r.toFixed(2)}:1, needs ${min}:1`);
  };
  pair("foreground", "background", 4.5);
  pair("muted-foreground", "background", 4.5);
  pair("muted-foreground", "muted", 4.5);
  pair("accent-foreground", "accent", 4.5);
  for (const k of ["accent", "success", "warning", "danger"]) pair(k, "background", 3);
}

/* 4. entry points and package files */
console.log("entry points agree and package files exist");
const cjs = require("./index.js");
check(JSON.stringify(cjs.colors) === JSON.stringify(colors), "index.js and index.mjs colors differ");
check(JSON.stringify(cjs.on) === JSON.stringify(on), "index.js and index.mjs on differ");
check(JSON.stringify(cjs.contrast) === JSON.stringify(ratios), "index.js and index.mjs contrast differ");
check(Object.keys(cjs).join() === "colors,on,contrast", "index.js should export exactly { colors, on, contrast }");

const pkg = JSON.parse(readFileSync(here("package.json"), "utf8"));
for (const f of pkg.files) check(existsSync(here(f)), `package.json files: ${f} does not exist`);
for (const [k, v] of Object.entries(pkg.exports)) {
  const targets = typeof v === "string" ? [v] : Object.values(v);
  for (const t of targets) check(existsSync(here(t)), `package.json exports ${k} → ${t} does not exist`);
}

if (failures) { console.error(`\n${failures} check${failures === 1 ? "" : "s"} failed`); process.exit(1); }
console.log("\nall checks passed");
