# Figma to React Native Variables

A Figma plugin to copy variables defined in Figma, such as colors, typography, and spacing, into a format suitable for React Native development. This plugin bridges the gap between design and development, ensuring consistency across platforms.

## Features
- Display Figma variables (e.g., colors, typography, spacing) to a JavaScript code.
- Automatically format variables for React Native usage.
- Simplify the handoff process between designers and developers.
- Ensure consistency between your design system and React Native implementation.

## Installation
1. Open **Figma** and navigate to the **Plugins** section.
2. Search for `Figma to React Native Variables` in the plugin library.
3. Click **Install**.

## Usage
1. Open your Figma file and navigate to the variables you want to copy.
2. Launch the plugin via **Plugins → Figma to React Native Variables**.
3. Click **Copy** and use in your React Native project.

### Example Output
If your Figma variables are set as follows:
- Typography:
```js
export const fontFamily = {
  "default": "Noto Sans JP"
}

export const fontWeight = {
  "normal": "Regular",
  "bold": "Bold"
}

export const fontSize = {
  "10": 11,
  "20": 13,
  "30": 16,
  "40": 19,
  "50": 23,
  "60": 28,
  "70": 33,
  "80": 40,
  "90": 48
}

export const letterSpacing = {
  "10": 0,
  "20": 0,
  "30": 0,
  "40": 0,
  "50": 0,
  "60": 0,
  "70": 0,
  "80": 0,
  "90": 0
}

export const lineHeight = {
  "10": "145%",
  "20": 1.5399999618530273,
  "30": 1.5,
  "40": 1.4700000286102295,
  "50": 1.5700000524520874,
  "60": 1.5700000524520874,
  "70": 1.5800000429153442,
  "80": 1.5,
  "90": "142%",
  "trim": 1
}

export const typography = {
  "title": {
    "lg": {
      "fontFamily": fontFamily['default'],
      "fontWeight": fontWeight['bold'],
      "fontSize": fontSize['90'],
      "lineHeight": lineHeight['_90'],
      "letterSpacing": letterSpacing['90']
    },
    "md": {
      "fontFamily": fontFamily['default'],
      "fontWeight": fontWeight['bold'],
      "fontSize": fontSize['80'],
      "lineHeight": lineHeight['80'],
      "letterSpacing": letterSpacing['80']
    }
  },
  "body": {
    "lg": {
      "fontFamily": fontFamily['default'],
      "fontWeight": fontWeight['normal'],
      "fontSize": fontSize['40'],
      "lineHeight": lineHeight['40'],
      "letterSpacing": letterSpacing['40'],
      "bold": {
        "fontFamily": fontFamily['default'],
        "fontWeight": fontWeight['bold'],
        "fontSize": fontSize['40'],
        "lineHeight": lineHeight['40'],
        "letterSpacing": letterSpacing['40']
      }
    },
    "md": {
      "fontFamily": fontFamily['default'],
      "fontWeight": fontWeight['normal'],
      "fontSize": fontSize['30'],
      "lineHeight": lineHeight['30'],
      "letterSpacing": letterSpacing['30'],
      "bold": {
        "fontFamily": fontFamily['default'],
        "fontWeight": fontWeight['bold'],
        "fontSize": fontSize['30'],
        "lineHeight": lineHeight['30'],
        "letterSpacing": letterSpacing['30']
      }
    },
  },
}
```

## Benefits
- **Design-Development Consistency**: Keep your React Native project in sync with Figma designs.
- **Time-Saving**: Automate the process of converting design tokens into usable code.
- **Ease of Use**: copy variables directly from Figma with minimal setup.

## Supported Formats
- **JavaScript (`.js`) or Typescript (`.ts`)**: Ideal for React Native projects.

## Known Limitations
- The plugin currently supports only Figma variables explicitly defined in the design system.

## Changelog
### v1.0.0
- Initial release.
- Display Figma variables as JavaScript.

## Support
If you encounter any issues or have feature requests, please open an issue on the [GitHub repository](https://github.com/BIGasLIFE/figma-reactnative-variable-viewer/issues). 

## License
This plugin is licensed under the [MIT License](LICENSE).
