# Testing Guide

This document covers the practical testing workflows for Pour-Over Master.

## Table of Contents

- [Quick Start](#quick-start)
- [Test Mode](#test-mode)
- [Manual Testing](#manual-testing)
- [Share Image Testing](#share-image-testing)
- [Troubleshooting](#troubleshooting)

## Quick Start

```bash
# Frontend-only development
npm run dev

# Full-stack local development with serverless functions
npm run dev:vercel
```

Use `npm run dev` for UI-only work. Use `npm run dev:vercel` when you need local `/api` routes for Gemini-backed features.

## Test Mode

The Brew page includes a development-only Test Mode that runs a 10-second recipe instead of a full-length brew.

> Test Mode is only rendered in development builds via `import.meta.env.DEV`.

### Enabling Test Mode

1. Start a development server
2. Open the Brew page
3. Toggle **Test Mode**
4. Start brewing

The test recipe is:

- **Bloom**: 3 seconds
- **Pour**: 4 seconds
- **Wait**: 3 seconds

### When to Use It

| Scenario | Recommended Mode |
|----------|------------------|
| Share image work | Test Mode |
| Finished-screen UI tweaks | Test Mode |
| Timer polish | Test Mode |
| Realistic recipe scaling validation | Normal mode |
| End-user feel checks | Normal mode |

## Manual Testing

### Add a Manual Bean

1. Open **Beans**
2. Click **Add**
3. Enter sample data:

   ```text
   Name: Ethiopia Yirgacheffe
   Origin: Ethiopia
   Roast Level: Medium
   Processing Method: Washed
   ```

4. Save the bean
5. Confirm the bean appears in the list

### Validate Core Flows

1. Add or recognize a bean
2. Start a brew from the Beans page or Brew page
3. Finish the brew
4. Confirm a history entry is created
5. Open History and verify the bean metadata resolves correctly

### Mobile-Specific Checks

1. Use a mobile viewport or a real phone
2. Confirm onboarding only appears once
3. Confirm the install prompt does not overlap onboarding incorrectly
4. Confirm bottom navigation stays usable across pages

## Share Image Testing

The Brew page’s share flow is more complex than a plain DOM screenshot, so it deserves focused checks.

### How It Works

1. After the brew finishes, the app starts pre-rendering the share image
2. The share card waits for image assets to load and decode
3. Chart canvases are replaced with generated `<img>` elements
4. The app waits for a couple of paint frames
5. `html-to-image` generates a JPEG with `pixelRatio: 2`
6. The original canvases are restored
7. Share reuses the pre-rendered image when possible

Example conversion pattern:

```typescript
const img = document.createElement('img');
img.src = canvas.toDataURL('image/png');
canvas.parentNode.replaceChild(img, canvas);
```

### Checklist

- [ ] Share button becomes available after the finished screen loads
- [ ] Chart appears in the exported image
- [ ] Brew metadata is visible and legible
- [ ] QR code is present
- [ ] AI watercolor artwork appears when generation succeeds
- [ ] Fallback loading state looks acceptable while artwork is still pending
- [ ] The UI remains stable after sharing

### Common Issues

| Issue | Likely Cause | What to Check |
|-------|--------------|---------------|
| Blank chart | Canvas swap did not happen | Review the canvas replacement logic in `Brew.tsx` |
| Missing artwork | Image not ready yet | Review image readiness waits and retry behavior |
| Blurry export | Low capture resolution | Confirm `pixelRatio: 2` is still used |
| Broken share card after export | Canvas restore path failed | Confirm the `finally` restore logic still runs |

## Troubleshooting

### AI Features Do Not Work Locally

- Verify `GEMINI_API_KEY` is set in `.env`
- Make sure you are running `npm run dev:vercel`
- Check the browser console and Vercel dev logs for API errors

### Share Button Fails

- Check the browser console for share diagnostics
- Verify `html-to-image` is installed
- Retry after the finished screen has had time to prepare the share preview

### Reset Local App State

If you need a clean slate while testing storage:

```javascript
await localforage.clear()
```
