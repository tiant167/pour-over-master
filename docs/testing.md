# Testing Guide

This document describes the testing strategies and tools available for the Pour-Over Master project.

## Table of Contents

- [Quick Start](#quick-start)
- [Test Mode](#test-mode)
- [Manual Testing](#manual-testing)
- [Automated Testing with Chrome DevTools MCP](#automated-testing-with-chrome-devtools-mcp)
- [Testing Share Image Generation](#testing-share-image-generation)
- [Troubleshooting](#troubleshooting)

## Quick Start

```bash
# Start the development server
npm run dev

# The app will be available at http://localhost:5173
```

## Test Mode

For rapid development and testing, use **Test Mode** to run a shortened 10-second brew instead of the full ~4 minute cycle.

> **Note:** Test Mode is only available in development environment (`npm run dev`). It is automatically hidden in production builds.

### Enabling Test Mode

1. Start the development server: `npm run dev`
2. Navigate to the **Brew** page
3. Toggle the **⚡ Test Mode** switch in the top-right corner
4. The brew cycle will be shortened to:
   - **Bloom**: 3 seconds
   - **Pour**: 4 seconds
   - **Wait**: 3 seconds

### When to Use Test Mode

| Scenario | Recommended Mode |
|----------|------------------|
| Testing share image generation | Test Mode ✅ (dev only) |
| Testing UI flow and navigation | Test Mode ✅ (dev only) |
| Testing timer accuracy | Normal Mode |
| Testing recipe scaling | Normal Mode |
| End-to-user experience testing | Normal Mode |

## Manual Testing

### Adding a Test Bean

For testing with real bean data (origin, tasting notes, AI image generation):

1. Go to **Beans** page
2. Click **Add**
3. Enter test data:
   ```
   Name: Ethiopia Yirgacheffe
   Origin: Ethiopia
   Roast Level: Medium
   Processing: Washed
   ```
4. Click **Save Bean**

### Testing Share Image Feature

1. Complete a brew (using Test Mode for speed)
2. Wait for the **finished** screen
3. Click **Share Profile**
4. Verify the generated image contains:
   - Title and completion badge
   - Brew data (Ratio, Temperature, Time)
   - Water volume curve chart
   - QR code
   - Brand footer

## Automated Testing with Chrome DevTools MCP

The Chrome DevTools MCP plugin can be used for automated browser testing.

### Setup

```bash
# Install the plugin (if not already installed)
claude /plugin install chrome-devtools-mcp
claude /reload-plugins
```

### Example Test Flow

```typescript
// Navigate to the app
await navigate_page({ type: 'url', url: 'http://localhost:5173' });

// Emulate mobile device
await emulate({ viewport: '390x844x3,mobile,touch' });

// Take a screenshot for verification
await take_screenshot();

// Click through onboarding
const snapshot = await take_snapshot();
const getStartedBtn = findButton(snapshot, 'Get Started');
await click({ uid: getStartedBtn.uid });
```

## Testing Share Image Generation

The share image generation uses `html-to-image` to capture the DOM. This is a critical feature that requires special handling for canvas elements.

### How It Works

1. **Wait for images**: All `<img>` elements must be fully loaded (`img.complete === true`)
2. **Convert canvas to image**: Chart.js charts are rendered on canvas, which `html-to-image` cannot directly capture. The solution:
   ```typescript
   const img = document.createElement('img');
   img.src = canvas.toDataURL('image/png');
   canvas.parentNode.replaceChild(img, canvas);
   ```
3. **Generate**: Call `toJpeg()` with `pixelRatio: 2` for high quality
4. **Restore**: Replace the temporary images back to original canvases

### Testing Checklist

- [ ] Canvas chart renders correctly in share image
- [ ] AI-generated origin image renders correctly
- [ ] Text and data are legible
- [ ] QR code is scannable
- [ ] Image quality is acceptable (not blurry)

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Blank chart | Canvas not converted to image | Check `handleShareClick` converts canvas elements |
| Missing AI image | Image not fully loaded | Ensure `img.complete` check with timeout |
| Blurry output | Low pixel ratio | Use `pixelRatio: 2` in `toJpeg` options |
| Broken UI after share | Canvas not restored | Ensure finally block restores canvases |

## Troubleshooting

### Dev Server Won't Start

```bash
# Check if port is in use
lsof -i :5173

# Kill existing process or use different port
npm run dev -- --port 3000
```

### AI Image Generation Fails

- Verify `GEMINI_API_KEY` is set in `.env`
- Check browser console for API errors
- Note: Image generation is rate-limited

### Share Button Does Nothing

- Check browser console for JavaScript errors
- Verify `html-to-image` is installed: `npm ls html-to-image`
- Test in incognito mode to rule out extension conflicts

## Best Practices

1. **Use Test Mode** when testing non-timing features (development environment only)
2. **Clear IndexedDB** between test sessions if testing storage:
   ```javascript
   // In browser console
   await localforage.clear()
   ```
3. **Test on real devices** for PWA functionality (add to home screen, offline mode)
4. **Verify responsive design** at different screen sizes (320px - 428px width)
