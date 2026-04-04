# Contributing Guide

Thank you for your interest in contributing to Pour-Over Master! This document provides guidelines for development workflow and contribution.

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
- npm or yarn
- Google Gemini API key (for AI features)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd pour-over-master

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
pour-over-master/
├── api/                    # Vercel serverless functions
│   ├── recognize-bean.js   # Bean image recognition
│   ├── generate-recipe.js  # Recipe generation
│   └── generate-image.js   # AI image generation
├── src/
│   ├── pages/             # Main application pages
│   ├── components/        # Reusable UI components
│   ├── utils/             # Utility functions and services
│   ├── App.tsx           # Root component
│   └── main.tsx          # Entry point
├── docs/                  # Documentation
├── public/               # Static assets
├── CLAUDE.md            # Documentation map
└── README.md            # Project overview
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make Changes

- Follow the existing code style
- Write clear, descriptive commit messages
- Test your changes thoroughly

### 3. Test Locally

```bash
# Run linting
npm run lint

# Test the build
npm run build

# Test with Vercel CLI (for API functions)
npm run dev:vercel
```

### 4. Commit and Push

```bash
git add .
git commit -m "feat: add new feature description"
git push origin feature/your-feature-name
```

## Code Style

### TypeScript

- Use explicit types for function parameters and return values
- Avoid `any` when possible
- Use interfaces for object shapes

```typescript
// Good
interface Bean {
  id: string;
  name: string;
  origin?: string;
}

function getBeanById(id: string): Promise<Bean | undefined> {
  // implementation
}

// Avoid
function getBeanById(id: any): any {
  // implementation
}
```

### React Components

- Use functional components with hooks
- Keep components focused on a single responsibility
- Extract reusable logic into custom hooks

```typescript
// Component structure
interface Props {
  bean: Bean;
  onDelete: (id: string) => void;
}

export const BeanCard: React.FC<Props> = ({ bean, onDelete }) => {
  // Component logic
  
  return (
    // JSX
  );
};
```

### CSS/Styling

- Use CSS variables for theming (defined in `src/index.css`)
- Follow BEM-like naming for custom classes
- Prefer inline styles for dynamic values

```css
/* Use CSS variables */
.glass-panel {
  background: var(--color-surface);
  backdrop-filter: var(--glass-blur);
}
```

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `BrewChart.tsx` |
| Utilities | camelCase | `beanService.ts` |
| Constants | UPPER_SNAKE | `TEST_RECIPE` |
| Interfaces | PascalCase | `BrewRecipe` |
| CSS Variables | kebab-case | `--color-primary` |

## Testing Your Changes

### Using Test Mode

For rapid iteration, use Test Mode (10-second brew cycle):

1. Ensure you're running in development mode (`npm run dev`)
2. Go to Brew page
3. Toggle "⚡ Test Mode" switch (only visible in development)
4. Start brewing

### Testing Share Images

When modifying share image generation:

1. Complete a brew (use Test Mode)
2. Click "Share Profile"
3. Verify the generated image contains:
   - Chart curve
   - All text elements
   - QR code
   - Proper styling

### Testing on Real Devices

For PWA-related changes:

1. Build for production: `npm run build`
2. Serve locally: `npx serve dist`
3. Access from mobile device on same network
4. Test "Add to Home Screen" functionality

### Browser Testing Matrix

| Browser | Minimum Version | Priority |
|---------|-----------------|----------|
| Chrome | 90+ | High |
| Safari (iOS) | 14+ | High |
| Safari (macOS) | 14+ | Medium |
| Firefox | 88+ | Medium |
| Edge | 90+ | Low |

## Submitting Changes

### Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure CI passes** (lint, build)
4. **Fill out PR template** with:
   - Description of changes
   - Screenshots (for UI changes)
   - Testing performed

### PR Title Format

```
feat: add new feature
ci: update CI configuration
docs: update documentation
fix: fix bug in share image
perf: improve performance
refactor: restructure code
style: fix formatting
test: add tests
```

### Review Process

- All PRs require at least one review
- Address review comments promptly
- Squash commits before merge if requested

## Common Tasks

### Adding a New Page

1. Create component in `src/pages/NewPage.tsx`
2. Add route in `src/App.tsx`
3. Add navigation item in `BottomNav`
4. Update documentation

### Adding an API Endpoint

1. Create file in `api/` directory
2. Follow existing pattern for error handling
3. Add rate limiting if using AI
4. Update architecture docs

### Modifying Storage Schema

1. Update interfaces in `src/utils/beanService.ts` or `storage.ts`
2. Consider migration strategy for existing data
3. Update type definitions

### Debugging Tips

```typescript
// Enable verbose logging
localStorage.setItem('debug', 'true');

// Clear all app data
await localforage.clear();

// Check IndexedDB contents
await localforage.keys();
await localforage.getItem('beans');
```

## Questions?

- Check [architecture.md](./architecture.md) for system design
- Check [testing.md](./testing.md) for testing strategies
- Review [CLAUDE.md](../CLAUDE.md) for documentation map

## Code of Conduct

- Be respectful and constructive
- Focus on the code, not the person
- Help others learn and grow
- Follow the project's coding standards
