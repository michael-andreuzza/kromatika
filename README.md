# Kromatika Color Library

Kromatika is a comprehensive color library that provides a wide range of color palettes for use in your web projects. This library includes colors organized by categories, making it easy to maintain a consistent color scheme throughout your application.

## Installation

To use the Kromatika color library in your project, follow these steps:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/kromatika.git
   cd kromatika
   ```

2. **Install Dependencies** (if applicable):
   If you are using a package manager like npm or yarn, you can install any necessary dependencies. For example:
   ```bash
   npm install
   ```

## Usage

### Importing Colors

You can import the colors into your JavaScript or SCSS files as needed.

#### JavaScript

To use the colors in your JavaScript files, you can import the `colors` object from `index.js`:
```js
const colors = require('./index.js');
// EXample usage:
console.log(colors.black); // Outputs the hex color code for black
```

#### SCSS

To use the colors in your SCSS files, you can import the `colors.scss` file:
```
@import './colors.scss';
// EXample usage:
body {
    background-color: var(--black-50);
    color: var(--white);
}

### CSS


### Available Colors

The color library includes the following categories:

- **Black Shades**: Various shades of black.
- **Metal Shades**: A range of metallic colors.
- **Haiti Shades**: Soft, muted colors inspired by the Haitian palette.
- **Purple Shades**: A variety of purple tones.
- **Blue Berry Shades**: Fresh and vibrant blue shades.
- **Royal Blue Shades**: Rich and deep blue colors.
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

#### Example Usage in CSS

```css
body { background-color: var(--black-50); } /* Using a black shade */
```

#### Example JSON Structure

```json
{
  "black": [
    "#E7E7E9",
    "#CFCFD3",
    "#A0A0A7",
    "#71717A",
    "#45454A",
    "#18181A",
    "#141415",
    "#0F0F10",
    "#0A0A0B",
    "#050505"
  ],
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

### Customization

You can easily customize the colors by modifying the values in the `colors.json` file or directly in the `index.js` and `colors.scss` files. This allows you to tailor the color palette to fit your project's branding and design requirements.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! If you have suggestions for improvements or new color palettes, feel free to open an issue or submit a pull request.

## Acknowledgments

Thank you for using Kromatika! We hope this color library enhances your project and makes your design process smoother.