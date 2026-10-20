# Fonts

The UI uses three fonts:

| Font     | Used for                         | How it loads                          |
|----------|----------------------------------|---------------------------------------|
| Poppins  | Body text, navigation, buttons   | Google Fonts (automatic)              |
| Orbitron | Headings and big numbers         | Google Fonts (automatic)              |
| Pirulen  | Brand / small futuristic labels  | **Place the font file in this folder** |

## Adding Pirulen

Pirulen is not on Google Fonts, so it can't be loaded automatically.
Put your licensed copy in this folder using one of these names:

- `pirulen.woff2` (preferred, smallest)
- `pirulen.woff`
- `pirulen.otf`
- `pirulen.ttf`

(`Pirulen.ttf`, `pirulen rg.otf` etc. also work - matching is case-insensitive
and any file starting with "pirulen" is picked up.)

The app embeds it automatically. If no file is found, **Orbitron is used as the
fallback**, so nothing breaks.
