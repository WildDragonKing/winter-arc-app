# Background Images

This directory contains the background images for light and dark themes.

## Required Images

### Light Mode
**Path**: `light/winter_arc_bg_light.webp`
- Recommended: Use existing winter-themed background with good contrast
- Format: WebP for optimal performance (with JPG/PNG fallback)
- Dimensions: 1920x1080 or higher for HD displays
- Characteristics:
  - Bright, clean aesthetic
  - Winter theme (snow, ice, cool colors)
  - Moderate saturation
  - Good contrast with white/light glass surfaces

### Dark Mode
**Path**: `dark/winter_arc_bg_dark.webp`
- Recommended: Darker variant of the light mode background
- Format: WebP for optimal performance (with JPG/PNG fallback)
- Dimensions: 1920x1080 or higher for HD displays
- Characteristics:
  - 12-16% reduced luminance compared to light variant
  - Desaturated colors
  - Subtle vignette for depth
  - Light noise/grain to prevent banding
  - Good contrast with dark glass surfaces

## Image Generation

If you have `winter_arc_glass_mockup.png`, create a dark variant by:
1. Reducing luminance by 12-16%
2. Desaturating colors slightly
3. Adding subtle vignette
4. Converting to WebP format

Example using ImageMagick:
```bash
convert winter_arc_glass_mockup.png \
  -modulate 85,90,100 \
  -vignette 0x20 \
  light/winter_arc_bg_light.webp

convert light/winter_arc_bg_light.webp \
  -modulate 72,88,100 \
  -vignette 0x30 \
  dark/winter_arc_bg_dark.webp
```

## Fallback

If images are not available, the app will fall back to CSS gradients defined in `src/styles/theme.css`.
