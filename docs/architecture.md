# Architecture Documentation

This document describes the system architecture, code organization, and the design decisions that shape the current Pour-Over Master app.

## Table of Contents

- [System Overview](#system-overview)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Data Flow](#data-flow)
- [AI Integration](#ai-integration)
- [Storage Strategy](#storage-strategy)
- [Key Design Decisions](#key-design-decisions)

## System Overview

Pour-Over Master is a mobile-first PWA with a Vite frontend, local IndexedDB persistence, and Vercel serverless functions for Gemini-powered features.

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (PWA)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Beans Page  │  │  Brew Page   │  │ History Page │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│           │                │                  │            │
│           └────────────────┴──────────────────┘            │
│                          │                                  │
│              ┌───────────┴───────────┐                     │
│              │   IndexedDB (local)   │                     │
│              └───────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ API Calls
┌─────────────────────────────────────────────────────────────┐
│                   Vercel Serverless                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ recognize-  │  │ generate-   │  │ generate-   │         │
│  │ bean.js     │  │ recipe.js   │  │ image.js    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                           │                                 │
│                   Google Gemini API                         │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Technology Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v7
- **State Management**: React hooks and local component state
- **Storage**: `localforage` (IndexedDB wrapper)
- **Charts**: Chart.js with `react-chartjs-2`
- **Icons**: `lucide-react`
- **Styling**: Vanilla CSS with CSS variables and inline styles for dynamic values

### Directory Structure

```
src/
├── pages/
│   ├── Beans.tsx
│   ├── Brew.tsx
│   └── History.tsx
├── components/
│   ├── BrewChart.tsx
│   ├── DesktopLanding.tsx
│   ├── InstallPrompt.tsx
│   ├── OnboardingModal.tsx
│   └── UpdatePrompt.tsx
├── utils/
│   ├── ai.ts
│   ├── beanService.ts
│   ├── rateLimiter.ts
│   ├── storage.ts
│   └── suggestions.ts
├── App.tsx
└── main.tsx
```

### Rendering Model

- On mobile and tablet-sized devices, the app renders the brewing workflow.
- On desktop, [`App.tsx`](/Users/haotianchai/Documents/workspace/pour-over-master/src/App.tsx) renders [`DesktopLanding.tsx`](/Users/haotianchai/Documents/workspace/pour-over-master/src/components/DesktopLanding.tsx) instead of the app shell.
- Page components are lazy-loaded with `React.lazy(...)`.

## Backend Architecture

### Serverless Functions

All Gemini requests are routed through Vercel serverless functions so the API key stays server-side.

#### `/api/recognize-bean.js`
- **Purpose**: Extract bean details from a bag photo
- **Input**: Base64 image data URL
- **Output**: Bean fields plus an AI-generated base recipe formula
- **Model**: `gemini-3.1-flash-lite-preview`

#### `/api/generate-recipe.js`
- **Purpose**: Generate a base recipe formula for manually entered beans
- **Input**: Name, origin, roast level, process, tasting notes
- **Output**: `aiFormula` JSON payload
- **Model**: `gemini-3.1-flash-lite-preview`

#### `/api/generate-image.js`
- **Purpose**: Generate abstract watercolor artwork for the share card
- **Input**: Origin and tasting notes
- **Output**: Base64 JPEG data URL
- **Model**: `gemini-3.1-flash-image-preview`

### Local Development Networking

- `npm run dev` starts the Vite frontend on `http://localhost:5173`
- Vite proxies `/api` to `http://localhost:3000`
- `npm run dev:vercel` is required for local AI-backed flows because it runs the serverless functions

## Data Flow

### Adding a Bean

```
1. User takes a photo or enters bean details manually
2. The client optionally calls /api/recognize-bean or /api/generate-recipe
3. The bean and any aiFormula are saved in IndexedDB
4. Beans page reloads and renders the saved bean list
```

### Brewing

```
1. User selects a bean and coffee weight
2. suggestRecipe() scales the stored formula for the selected dose
3. The timer runs with audio cues and a live target-weight display
4. On completion, the brew is saved to history
5. The share card view is rendered and share-image preparation begins
```

### Share Image Generation

```
1. The finished brew view mounts the share card
2. The app waits for image assets to load and decode
3. Chart canvases are temporarily replaced with <img> snapshots
4. html-to-image generates a JPEG at pixelRatio 2
5. The original canvases are restored
6. The Share action reuses the pre-rendered image when possible
```

## AI Integration

### Prompt Structure

- `recognize-bean.js` asks Gemini to return strict JSON with bean metadata and a base `aiFormula`
- `generate-recipe.js` asks Gemini for an `aiFormula` when a bean is created manually
- `generate-image.js` asks Gemini for a non-literal watercolor-style image based on tasting notes

### Error Handling

- The API routes return structured JSON errors on invalid input or missing configuration
- The client surfaces those errors with toasts or console logging
- If a bean has no `aiFormula`, the brew flow falls back to static formulas in [`suggestions.ts`](/Users/haotianchai/Documents/workspace/pour-over-master/src/utils/suggestions.ts)

## Storage Strategy

### IndexedDB Keys

| Key | Type | Description |
|-----|------|-------------|
| `beans` | `Bean[]` | Saved coffee beans |
| `history` | `HistoryRecord[]` | Completed brews |
| `settings` | `unknown` | Reserved key, currently unused |
| `rate_limit` | `RateLimitData` | Client-side AI usage tracking |
| `has_seen_onboarding` | `boolean` | Onboarding visibility state |
| `has_dismissed_install_prompt` | `boolean` | Install prompt dismissal state |

### Core Data Types

```typescript
interface Bean {
  id: string;
  name: string;
  roastLevel: string;
  tastingNotes: string[];
  origin?: string;
  process?: string;
  createdAt: number;
  aiFormula?: RecipeFormula;
}

interface BrewRecipe {
  title: string;
  profile: string;
  ratio: number;
  temperature: number;
  grindSize: string;
  coffeeWeight: number;
  steps: BrewStep[];
}

interface BrewStep {
  name: string;
  targetWeight: number;
  duration: number;
  pouringDuration: number;
  description: string;
}
```

## Key Design Decisions

### 1. Offline-First Storage

**Decision**: Store product data locally in IndexedDB via `localforage`

**Why**:
- Brewing often happens away from a laptop and sometimes with weak connectivity
- Beans and history need to remain available offline
- The app does not yet implement user accounts or cloud sync

### 2. AI-Generated Base Formulas

**Decision**: Persist a base AI formula with each bean, then scale it at brew time

**Why**:
- The expensive AI work only happens when beans are recognized or created
- The brew screen can respond instantly to dose changes
- Static fallback formulas still allow brewing if AI generation fails

### 3. Canvas-to-Image Share Capture

**Decision**: Replace canvases with generated images before calling `html-to-image`

**Why**:
- `html-to-image` is unreliable with live canvases
- Share cards need to include the chart consistently, especially on Safari

### 4. Development-Only Test Mode

**Decision**: Expose a 10-second recipe only in development builds

**Why**:
- Share and timer iteration would otherwise be slow
- The toggle stays out of production UX

### 5. Mobile-First Product Experience

**Decision**: Optimize the real app for mobile and show a desktop landing page instead of a desktop workflow

**Why**:
- Brewing happens on phones in kitchens
- The core UX is designed around narrow screens, camera capture, and home-screen installation
