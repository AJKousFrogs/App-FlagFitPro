# PWA Icons for FlagFit Pro

This directory contains the PWA (Progressive Web App) icons for FlagFit Pro.

## Current Icons

- `icon-72x72.png` - Small icon for older devices
- `icon-192x192.png` - Medium icon for Android devices
- `icon-512x512.png` - Large icon for high-DPI displays
- `icon.svg` - Scalable vector icon (any size)
- `icon-base.svg` - Base SVG template

## Missing Icons

The following icon sizes are referenced in the manifest but missing:
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png` (This was causing the error!)
- `icon-152x152.png`
- `icon-384x384.png`

## How to Generate Missing Icons

### Option 1: Use the Icon Generator (Recommended)

1. Run the icon generator:
   ```bash
   npm run generate-icons
   ```

2. This will open `generate-missing-icons.html` in your browser

3. Click "Download All Icons" to download the missing PNG files

4. Save the downloaded files to this directory (`public/icons/`)

5. Click "Update Manifest" to download an updated `manifest.json`

6. Replace your existing `manifest.json` with the downloaded one

### Option 2: Manual Generation

1. Open `generate-missing-icons.html` in your browser
2. Follow the instructions in the web interface

## Icon Design

The icons feature:
- **Gradient Background**: Green (#4a7c59) to Blue (#3B82F6)
- **Rounded Corners**: 12.5% border radius
- **Circle Overlay**: Semi-transparent white circle
- **Text**: "FF" (FlagFit) in bold white
- **Subtitle**: "Pro" in semi-transparent white

## Troubleshooting

### "Error while trying to use the following icon from the Manifest"

This error occurs when the manifest references icons that don't exist. To fix:

1. Generate the missing icons using the tool above
2. Ensure all referenced icons exist in this directory
3. Update the manifest.json to only reference existing icons

### Icon Not Loading

- Check that the icon file exists
- Verify the file path in manifest.json is correct
- Ensure the icon is a valid PNG or SVG file
- Clear browser cache and reload

## Build Process

After generating new icons:

1. Run `npm run build` to rebuild the application
2. The new icons will be copied to `dist/icons/`
3. Deploy the updated `dist/` folder

## PWA Features

These icons enable:
- App installation on mobile devices
- Home screen shortcuts
- Splash screens
- App store listings
- Offline functionality 