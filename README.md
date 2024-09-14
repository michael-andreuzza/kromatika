![Kromatika colors](https://github.com/michael-andreuzza/kromatika/blob/main/images/kromatika.png?raw=true)

# Kromatika Color Library

Kromatika is a comprehensive color library that provides a wide range of color palettes for use in your web projects. This library includes colors organized by categories, making it easy to maintain a consistent color scheme throughout your application.

## Installation

To use the Kromatika color library in your project, follow these steps:

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/michael-andreuzza/kromatika.git
   cd kromatika
   ```

2. **Install Dependencies**
   To get started with Kromatika, you need to install the package and any necessary dependencies. If you are using npm, you can install Kromatika with:

NPM

```bash
npm install kromatika
```

Yarn

```bash
yarn add kromatika
```

## Usage

### Importing Colors

You can import the colors into your JavaScript, JSON, SCSS and CSS files as needed.

#### JavaScript

To use the colors in your JavaScript files, you can import the `colors` object from `index.js`:

```js
const colors = require('./index.js');
// EXample usage:
console.log(colors.black); // Outputs the hex color code for black

#### JSON

To use the colors in your JSON files, you can import the `colors` object from `colors.json`:

```

```json
{
  "metal": [
    "#F3F4F7",
    "#E2E4EB",
    "#CCD0DC",
    "#B3BACB",
    "#9BA4BA",
    "#828DA9",
    "#626E8E",
    "#49526A",
    "#303646",
    "#191C24"
  ]
  // Add more color categories as needed
}
```

#### YAML

To use the colors in your YAML files, you can import the `colors.yml` file:

```yaml
metal:
  - "#F3F4F7"
  - "#E2E4EB"
  - "#CCD0DC"
  - "#B3BACB"
  - "#9BA4BA"
  - "#828DA9"
  - "#626E8E"
  - "#49526A"
  - "#303646"
  - "#191C24"
# Add more color categories as needed
```

#### SCSS

To use the colors in your SCSS files, you can import the `colors.scss` file:

```scss
@import "./colors.scss";
// EXample usage:
body {
  background-color: var(--kr-charcoal-50);
  color: var(--white);
}
```

#### LESS

To use the colors in your LESS files, you can import the colors.less file:

```less
@import "~kromatika/colors.less";
// Example usage:
body {
  background-color: @black-50;
  color: @white;
}
```

#### Stylus

To use the colors in your Stylus files, you can import the colors.styl file:

```stylus
@import "~kromatika/colors.styl"
// Example usage:
body
  background-color: $black-50
  color: $white
```

#### CSS

```css
body {
  background-color: var(--kr-charcoal-50); /* Using a black shade */
}
```

### Available Colors

The color library includes the following categories:

- **charcoal**: A range of shades of charcoal.
- **Metal Shades**: A range of metallic colors.
- **Haiti Shades**: Soft, muted colors inspired by the Haitian palette.
- **Purple Shades**: A variety of purple tones.
- **Blue Berry Shades**: Fresh and vibrant blue shades.
- **Blue Shades**: Rich and deep blue colors.
- **Sky Shades**: Light and airy sky colors.
- **Turquoise Shades**: Bright and refreshing turquoise tones.
- **Persian Green Shades**: Elegant green shades.
- **Pastel Green Shades**: Soft and pastel green colors.
- **Grass Shades**: Lively green shades.
- **Carrot Shades**: Warm and inviting orange shades.
- **Orange Shades**: Bright and cheerful orange tones.
- **Red Shades**: Bold and vibrant red colors.
- **Raspberry Shades**: Sweet and rich raspberry tones.
- **Fuchsia Shades**: Bright and lively fuchsia colors.

### Customization

You can easily customize the colors by modifying the values in the `colors.json` file, or directly in the `index.js`, `colors.scss`, and `colors.css` files. This flexibility allows you to tailor the color palette to fit your project's branding and design requirements.

### License

This project is licensed under the MIT License.

### Contributing

Contributions are welcome! If you have suggestions for improvements or new color palettes, feel free to open an issue or submit a pull request.

### Acknowledgments

Thank you for using Kromatika! We hope this color library enhances your project and streamlines your design process.

### Author

[Michael Andreuzza](https://michaelandreuzza.com)
