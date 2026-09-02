![Kromatika colors](https://github.com/michael-andreuzza/kromatika/blob/main/images/kromatika.png?raw=true)

# Kromatika

An elegant color palette for user interfaces: 16 scales of 10 shades each
(50–900), plus white and black. Ships in every format you're likely to
need — CSS variables, SCSS, LESS, Stylus, YAML, JSON, JavaScript (CJS + ESM
with types), Tailwind CSS v3 and v4, and W3C Design Tokens — with WCAG
contrast data for every shade and a ready-made semantic light/dark theme.

## Install

```bash
npm install kromatika
```

Or grab the file you need straight from this repo — every format is a
single, dependency-free file.

## Usage

### CSS variables

```css
@import "kromatika/colors.css";

body {
  background: var(--kr-charcoal-50);
  color: var(--kr-charcoal-900);
}
```

Variables are `--kr-{scale}-{shade}`, e.g. `--kr-blue-berry-500`,
`--kr-persian-green-700`, plus `--kr-white` and `--kr-black`.

### Semantic theme (light + dark)

If you want a palette that already works rather than 160 colors to choose
from, `theme.css` maps a small set of semantic tokens onto Kromatika and
flips them with the system theme:

```css
@import "kromatika/theme.css";

body {
  background: var(--kr-background);
  color: var(--kr-foreground);
}
.card { border: 1px solid var(--kr-border); background: var(--kr-muted); }
.button { background: var(--kr-accent); color: var(--kr-accent-foreground); }
```

Tokens: `background`, `foreground`, `muted`, `muted-foreground`, `border`,
`accent`, `accent-foreground`, `success`, `warning`, `danger`. Force a mode
with `<html data-theme="dark">` (or `"light"`). Every pairing passes WCAG AA
for normal text.

### Text color for any shade

Which text color goes on `blue-berry-400`? Kromatika answers for every shade:

```css
.badge {
  background: var(--kr-blue-berry-400);
  color: var(--kr-on-blue-berry-400); /* black here — white only passes from 500 */
}
```

```js
import { colors, on, contrast } from "kromatika";

on.blueBerry[400];        // "#000000"
contrast.blueBerry[400];  // { white: 3.08, black: 6.81 }
```

The full table, with AA thresholds per scale, is in
[CONTRAST.md](./CONTRAST.md).

### Figma, Tokens Studio, Style Dictionary

`tokens.json` follows the W3C Design Tokens format, so it imports directly
into Figma Variables (via the native import or Tokens Studio) and into
Style Dictionary and similar pipelines.

### Tailwind CSS v4

```css
@import "tailwindcss";
@import "kromatika/tailwind.css";
```

Adds `charcoal`, `metal`, `haiti`, `purple`, `blue-berry`, `blue`, `sky`,
`turquoise`, `persian-green`, `pastel-green`, `grass`, `carrot`, `orange`,
`red`, `raspberry`, and `fuchsia` to your theme, in OKLCH:

```html
<button class="bg-blue-berry-500 text-white hover:bg-blue-berry-600">…</button>
```

### Tailwind CSS v3

```js
// tailwind.config.js
const kromatika = require("kromatika/tailwind.config.js");

module.exports = {
  theme: {
    extend: {
      colors: kromatika.theme.extend.colors,
    },
  },
};
```

### JavaScript / TypeScript

```js
import { colors } from "kromatika";        // ESM
const { colors } = require("kromatika");   // CommonJS

colors.charcoal[500];     // "#69696b"
colors.blueBerry[300];    // "#93adff"
colors.white;             // "#ffffff"
```

Scales are camelCase objects keyed by shade (`50`…`900`). Types are
included.

### JSON

```json
{
  "white": "#ffffff",
  "black": "#000000",
  "charcoal": { "50": "#f5f5f7", "100": "#e4e4e7", "…": "…", "900": "#141414" },
  "blue berry": { "50": "#ecf2ff", "…": "…" }
}
```

`colors.json` is the source of truth; every other file is generated from it.

### SCSS

```scss
@import "kromatika/colors.scss";

body {
  background: $kr-charcoal-50;
  color: $kr-charcoal-900;
}
```

### LESS

```less
@import "kromatika/colors.less";

body {
  background: @kr-charcoal-50;
  color: @kr-charcoal-900;
}
```

### Stylus

```stylus
@import "kromatika/colors.styl"

body
  background $kr-charcoal-50
  color $kr-charcoal-900
```

### YAML

```yaml
kr-charcoal:
  50: "#f5f5f7"
  100: "#e4e4e7"
  # …
  900: "#141414"
```

## Scales

| Scale | Character |
| --- | --- |
| Charcoal | Neutral grays |
| Metal | Cool, slightly blue grays |
| Haiti | Muted indigo-violets |
| Purple | Violet |
| Blue berry | Periwinkle blue |
| Blue | Primary blue |
| Sky | Cyan-leaning blue |
| Turquoise | Blue-green |
| Persian green | Teal |
| Pastel green | Fresh green |
| Grass | Yellow-green |
| Carrot | Amber-orange |
| Orange | Red-orange |
| Red | Red |
| Raspberry | Pink-red |
| Fuchsia | Magenta |

## How the shades are tuned

The same shade number means the same thing in every scale. All 13 chromatic
scales share one OKLCH lightness curve, and the three near-neutrals
(charcoal, metal, haiti) share a wider one so they can go nearly black:

| Shade | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chromatic L | .96 | .91 | .84 | .76 | .67 | .58 | .49 | .41 | .35 | .30 |
| Neutral L | .97 | .92 | .84 | .74 | .63 | .52 | .42 | .33 | .25 | .19 |

Hue and chroma are hand-picked per shade and left alone; only lightness is
normalised. That keeps the character of each scale (sky runs from cyan tints
to navy darks, carrot from yellow to amber) while making the numbers
dependable: swap `blue-berry` for `raspberry` and every contrast pairing in
your UI still holds, and the `--kr-on-*` thresholds line up (white text
passes from 500 or 600 on every scale).

## Customizing

Edit `colors.json`, then run `npm run build` to regenerate every other
format. `build.mjs` has no dependencies; it converts hex to OKLCH for the
Tailwind v4 theme, computes the contrast data, and emits the semantic theme
and design tokens.

If you add or change a scale, `node tune.mjs` snaps it onto the shared
curves described above (it rewrites `colors.json`; `--dry` only prints).

## Migrating from 1.x

- **JavaScript:** scales were arrays indexed `0`–`9`; they are now objects
  keyed by shade. `colors.charcoal[5]` → `colors.charcoal[500]`.
- **Tailwind:** multi-word scales are kebab-case, matching Tailwind's own
  conventions. `bg-blueBerry-500` → `bg-blue-berry-500`,
  `persianGreen` → `persian-green`, `pastelGreen` → `pastel-green`.
- **Tailwind v4:** the `tailwind-css-v4` file is now `tailwind.css`, wrapped
  in `@theme`, with white/black included and corrected charcoal values.
- **JSON:** the `{ "kromatika": [ { "name", "colors" } ] }` wrapper is gone;
  it's now a flat map of scale → shades.
- **Hex values have changed.** 2.0 snaps every scale onto a shared lightness
  curve (see above). Hues are the same as 1.x, so everything still looks like
  Kromatika, but shades are slightly lighter or darker than before; the
  middle of carrot and the dark end of metal move the most.

## License

MIT — [Michael Andreuzza](https://michaelandreuzza.com)
