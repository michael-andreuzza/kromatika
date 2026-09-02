# Changelog

## 2.0.0 — 2026-09-02

A ground-up rebuild. Every distributed file is now generated from a single
source of truth, and the palette itself has been tuned.

### Palette

- Every scale sits on a shared OKLCH lightness curve: 13 chromatic scales on
  one curve, the three near-neutrals (charcoal, metal, haiti) on a wider one
  that reaches nearly black. Hue and chroma per shade are unchanged from 1.x.
  See "How the shades are tuned" in the README.
- `colors.json` stores `oklch()` values instead of hex, so retuning is exact
  and repeatable. Hex is derived at build time with chroma clipped into sRGB.

### New

- **Contrast data.** WCAG 2 ratios against white and black for all 160
  shades, and the text color that passes best: `--kr-on-{scale}-{shade}` in
  CSS, `on` and `contrast` exports in JS, and the full table in `CONTRAST.md`.
- **Semantic theme.** `theme.css` maps `background`, `foreground`, `muted`,
  `muted-foreground`, `border`, `accent`, `accent-foreground`, `success`,
  `warning`, `danger` onto the palette, follows the system theme, and can be
  forced with `data-theme`. Every pairing passes AA.
- **Tailwind v4 semantic utilities.** `tailwind-theme.css` exposes the theme
  as `bg-background`, `text-muted-foreground`, `border-border`, etc.
- **W3C Design Tokens.** `tokens.json` for Figma Variables, Tokens Studio and
  Style Dictionary.
- **Wide gamut.** `colors.oklch.css` — the same variables as `oklch()` with
  hex fallbacks, so vivid shades use the full P3 gamut where available.
- **ESM and types.** `index.mjs` with named exports and `index.d.ts`, plus a
  proper `exports` map.
- **Tests.** `npm test` verifies generated files are fresh, every shade is on
  its curve, and every theme pairing passes AA. Runs in CI and before
  publishing.

### Breaking

- JS scales are objects keyed by shade, not arrays: `colors.charcoal[5]` →
  `colors.charcoal[500]`.
- CommonJS exports `{ colors, on, contrast }` instead of the bare palette.
- Tailwind color names are kebab-case: `blueBerry` → `blue-berry`,
  `persianGreen` → `persian-green`, `pastelGreen` → `pastel-green`.
- `tailwind-css-v4` is now `tailwind.css`, wrapped in `@theme`, with white
  and black included and corrected charcoal values.
- `colors.json` lost its `{ "kromatika": [...] }` wrapper and now holds
  `oklch()` values; use `tokens.json` for hex in JSON.
- Hex values have shifted slightly across the board due to the lightness
  tuning. The middle of carrot and the dark end of metal move the most.

## 1.x

Initial releases: 16 scales in CSS, SCSS, LESS, Stylus, YAML, JSON, JS and
Tailwind formats.
