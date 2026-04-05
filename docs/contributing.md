# Contributing Guide

This document explains how to work on Pour-Over Master without fighting the local setup or drifting away from the current app architecture.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing Your Changes](#testing-your-changes)
- [Submitting Changes](#submitting-changes)
- [Common Tasks](#common-tasks)

## Development Setup

### Prerequisites

- Node.js 18+
- npm
- A Google Gemini API key for AI-backed flows
- Vercel CLI if you want to run the local serverless functions

### Installation

```bash
git clone <repo-url>
cd pour-over-master
npm install
cp .env.example .env
```

Add your Gemini key to `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Running the App

Frontend-only development:

```bash
npm run dev
```

- Runs Vite on `http://localhost:5173`
- Good for UI-only work
- `/api` requests are proxied to `http://localhost:3000`, so local AI features will fail unless the Vercel dev server is also running

Full-stack local development:

```bash
npm run dev:vercel
```

- Runs the app and serverless functions on `http://localhost:3000`
- Use this when testing bean recognition, AI recipe generation, or AI image generation

## Project Structure

```
pour-over-master/
├── api/                    # Vercel serverless functions
├── docs/                   # Project documentation
├── public/                 # Static assets
├── src/
│   ├── components/         # Shared UI
│   ├── pages/              # Route-level screens
│   └── utils/              # Storage, AI, recipe logic
├── CLAUDE.md               # Documentation map
├── README.md               # Project overview
└── vite.config.ts          # Vite config and /api proxy
```

## Development Workflow

### 1. Create a Branch

Use a descriptive branch name. In this repo, Codex-created branches typically use a `codex/` prefix, but any clear branch name is fine.

### 2. Make Changes

- Preserve the current mobile-first design
- Keep desktop behavior in mind: desktop users see a landing page, not the app shell
- Reuse the existing utilities in `src/utils/` when possible
- Update docs when behavior, setup, or architecture changes

### 3. Validate Locally

```bash
npm run lint
npm run build
```

Run `npm run dev:vercel` as needed for AI-backed flows.

### 4. Commit and Push

```bash
git add <files>
git commit -m "fix: short description"
git push origin <branch-name>
```

## Code Style

### TypeScript

- Prefer explicit interfaces and types
- Avoid `any` unless the surrounding code already relies on it
- Keep shared types close to the utilities or modules that own them

### React

- Use functional components and hooks
- Keep route-specific logic in page components
- Extract shared logic into utilities when it is reused across files
- Lazy-load top-level pages the same way `App.tsx` already does

### Styling

- Use the CSS variable palette from [`src/index.css`](/Users/haotianchai/Documents/workspace/pour-over-master/src/index.css)
- Keep shared classes in CSS
- Use inline styles for dynamic values and one-off layout adjustments
- Preserve the current visual language unless the change is intentionally redesigning part of the app

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `BrewChart.tsx` |
| Utilities | camelCase | `beanService.ts` |
| Constants | UPPER_SNAKE | `TEST_RECIPE` |
| Interfaces | PascalCase | `BrewRecipe` |

## Testing Your Changes

### Recommended Checks

1. Run `npm run build`
2. Exercise the changed UI in a mobile-sized viewport
3. If you touched AI flows, run `npm run dev:vercel`
4. If you touched the Brew page, test the finished/share flow
5. If you touched install/update/onboarding behavior, test on a real mobile browser when possible

### Using Test Mode

The Brew page exposes a development-only Test Mode that runs a 10-second recipe. Use it for share-flow or timer UI iteration.

### Testing With a Manual Bean

1. Open the Beans page
2. Click **Add**
3. Enter sample data such as:

   ```text
   Name: Ethiopia Yirgacheffe
   Origin: Ethiopia
   Roast Level: Medium
   Processing Method: Washed
   ```

4. Save the bean
5. Verify it appears in the list and can be opened in Brew

### Testing on Real Devices

1. Run `npm run build`
2. Run `npm run preview`
3. Open the preview URL from a phone on the same network
4. Verify install behavior, bottom navigation, brewing flow, and share flow

## Submitting Changes

### Pull Requests

Before opening a PR:

1. Make sure the docs match the code
2. Summarize what changed
3. Include screenshots for UI changes when helpful
4. List the testing you ran

### Commit Message Examples

```text
fix: stabilize Safari share capture
docs: refresh local development guide
refactor: simplify brew share rendering
```

## Common Tasks

### Adding a New Page

1. Create the page in `src/pages/`
2. Add a lazy route in [`src/App.tsx`](/Users/haotianchai/Documents/workspace/pour-over-master/src/App.tsx)
3. Add a bottom-nav item if the page belongs in the mobile app shell
4. Update docs if the workflow changes

### Adding an API Endpoint

1. Add a new file in `api/`
2. Follow the existing method validation and JSON error response pattern
3. Keep secrets server-side
4. Update docs if the endpoint changes setup or architecture assumptions
