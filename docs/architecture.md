# Architecture Documentation

This document describes the system architecture, code organization, and key design decisions of the Pour-Over Master project.

## Table of Contents

- [System Overview](#system-overview)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Data Flow](#data-flow)
- [AI Integration](#ai-integration)
- [Storage Strategy](#storage-strategy)
- [Key Design Decisions](#key-design-decisions)

## System Overview

Pour-Over Master follows a **serverless architecture** with AI capabilities:

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
│  │/api/recognize-bean.js      │  │/api/generate-recipe.js  │  │/api/generate-image.js   │         │
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
- **State Management**: React hooks + Context (no external state library)
- **Storage**: localforage (IndexedDB wrapper)
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: lucide-react
- **Styling**: Vanilla CSS with CSS Variables

### Directory Structure

```
src/
├── pages/                    # Route-level components
│   ├── Beans.tsx            # Bean management (CRUD)
│   ├── Brew.tsx             # Main brewing interface
│   └── History.tsx          # Brew history and sharing
├── components/              # Reusable UI components
│   ├── BrewChart.tsx        # Water volume curve chart
│   ├── DesktopLanding.tsx   # Desktop marketing page
│   ├── InstallPrompt.tsx    # PWA install prompt
│   ├── OnboardingModal.tsx  # First-time user guide
│   └── UpdatePrompt.tsx     # PWA update notification
├── utils/                   # Utility functions
│   ├── ai.ts               # AI API client functions
│   ├── beanService.ts      # Bean data operations
│   ├── rateLimiter.ts      # AI usage rate limiting
│   ├── storage.ts          # IndexedDB abstraction
│   └── suggestions.ts      # Recipe calculation logic
├── App.tsx                 # Root component with routing
└── main.tsx               # Application entry point
```

### Component Design Patterns

1. **Page Components**: Handle routing, data fetching, and page-level state
2. **UI Components**: Pure presentational components with props
3. **Utility Modules**: Pure functions for business logic

### State Management

```typescript
// Example: Bean state flow
User Action → beanService.ts → IndexedDB → UI Update

// Example: Brew timer state
useState → useEffect (interval) → UI Update
```

## Backend Architecture

### Serverless Functions (Vercel)

All AI interactions happen through serverless functions to protect API keys.

#### `/api/recognize-bean.js`
- **Purpose**: Extract bean info from coffee bag photos
- **Input**: Base64-encoded image
- **Output**: Bean details + AI-generated recipe formula
- **AI Model**: gemini-3.1-flash-lite-preview (vision)

#### `/api/generate-recipe.js`
- **Purpose**: Generate custom recipe from bean characteristics
- **Input**: Bean name, origin, roast level, process, tasting notes
- **Output**: Recipe formula with steps
- **AI Model**: gemini-3.1-flash-lite-preview (text)

#### `/api/generate-image.js`
- **Purpose**: Generate origin landscape images for share cards
- **Input**: Origin country, tasting notes
- **Output**: Base64-encoded JPEG image
- **AI Model**: gemini-3.1-flash-image-preview

### Rate Limiting

Client-side rate limiting prevents excessive API usage:
- **Limit**: 10 AI requests per day per user
- **Storage**: IndexedDB (`rate_limit` key)
- **Reset**: Automatic after 24 hours

## Data Flow

### Adding a New Bean

```
1. User takes photo / enters details
2. Client sends image to /api/recognize-bean
3. Gemini Vision extracts info + generates recipe formula
4. Client saves to IndexedDB via beanService
5. UI updates to show new bean
```

### Brewing Process

```
1. User selects bean and coffee weight
2. suggestRecipe() calculates scaled recipe
3. Timer starts with audio cues
4. Upon completion:
   - Save to history
   - Trigger AI image generation (background)
   - Show share card
```

### Share Image Generation

```
1. User clicks "Share Profile"
2. Wait for all images to load (img.complete)
3. Convert Chart.js canvas to images
4. Call html-to-image to capture DOM
5. Restore original canvas elements
6. Share or download the generated JPEG
```

## AI Integration

### Prompt Engineering

The AI prompts are crafted to return structured JSON:

```typescript
// Example from recognize-bean.js
const prompt = `Analyze this image of a coffee bean bag...
Return ONLY valid JSON:
{
  "name": "...",
  "roastLevel": "Light|Medium|Dark",
  "aiFormula": { ... }
}`;
```

### Error Handling

```typescript
try {
  const result = await ai.models.generateContent({ ... });
  // Parse and validate JSON
} catch (error) {
  // Fallback to static defaults
  return generateFallbackFormula(bean);
}
```

## Storage Strategy

### IndexedDB Schema

| Key | Type | Description |
|-----|------|-------------|
| `beans` | Bean[] | User's coffee bean collection |
| `history` | HistoryRecord[] | Completed brew sessions |
| `rate_limit` | RateLimitData | AI usage tracking |
| `has_seen_onboarding` | boolean | Onboarding state |
| `has_dismissed_install_prompt` | boolean | Install prompt state |

### Data Types

```typescript
// Key interfaces
interface Bean {
  id: string;
  name: string;
  origin?: string;
  roastLevel: string;
  process?: string;
  tastingNotes: string[];
  createdAt: number;
  aiFormula?: RecipeFormula;
}

interface BrewRecipe {
  title: string;
  profile: string;
  ratio: number;
  temperature: number;
  grindSize: string;
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

### 1. Offline-First with PWA

**Decision**: Use IndexedDB for all data storage

**Rationale**:
- Coffee brewing often happens in kitchens with poor WiFi
- Users need access to their bean collection offline
- History should persist locally

**Trade-off**: No cross-device sync (unless we add cloud backup later)

### 2. AI-Generated Recipes

**Decision**: Generate recipes on-the-fly using AI instead of static database

**Rationale**:
- Infinite variety possible
- Adapts to specific bean characteristics
- Feels "premium" and innovative

**Trade-off**: Rate limiting required (cost management)

### 3. Canvas-to-Image for Sharing

**Decision**: Convert Chart.js canvas to images before screenshot

**Rationale**:
- `html-to-image` cannot capture canvas content directly
- Pre-conversion ensures chart appears in share image

**Trade-off**: Brief DOM manipulation (cleaned up in finally block)

### 4. Test Mode (Development Only)

**Decision**: Include a 10-second test mode for development, hidden in production

**Rationale**:
- Testing 4-minute brew cycles is impractical during development
- Enables rapid iteration on share image feature
- Prevents confusion for end users who don't need testing features

**Implementation**: Uses `import.meta.env.DEV` to conditionally render the Test Mode toggle

**Trade-off**: Additional code complexity (conditional logic, environment checks)

### 5. Mobile-First Design

**Decision**: Primary UI is mobile-optimized; desktop shows marketing page

**Rationale**:
- Brewing happens in kitchen, typically with phone
- Simplifies UI design decisions

**Trade-off**: Desktop experience is limited (but has QR code for mobile transfer)
