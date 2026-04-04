# Pour-Over Master Documentation Map

Welcome to the Pour-Over Master project! This document serves as your starting point for navigating the project documentation.

## Quick Links

| Document | Purpose | Target Audience |
|----------|---------|-----------------|
| [README.md](./README.md) | Project overview, features, tech stack | Everyone |
| [docs/testing.md](./docs/testing.md) | Testing strategies and test mode usage | Developers, QA |
| [docs/architecture.md](./docs/architecture.md) | System architecture and code organization | New team members |
| [docs/contributing.md](./docs/contributing.md) | Development workflow and contribution guidelines | Contributors |

## Project Overview

**Pour-Over Master** is an AI-native Progressive Web App (PWA) for pour-over coffee brewing, featuring:

- AI-powered coffee bean recognition using Google Gemini Vision
- Dynamic recipe generation based on bean characteristics
- Smart brewing timer with visual guidance
- Shareable brew cards with AI-generated artwork

## Architecture Highlights

```
├── api/                    # Vercel Serverless Functions
│   ├── recognize-bean.js   # Gemini Vision API integration
│   ├── generate-recipe.js  # Recipe generation
│   └── generate-image.js   # AI image generation
├── src/
│   ├── pages/              # Main page components
│   │   ├── Beans.tsx       # Bean management
│   │   ├── Brew.tsx        # Brewing interface
│   │   └── History.tsx     # Brew history
│   ├── components/         # Reusable components
│   ├── utils/              # Utilities (AI, storage, etc.)
│   └── App.tsx             # Main app component
└── public/                 # Static assets
```

## Getting Started

1. **New to the project?** Start with [README.md](./README.md) for setup instructions
2. **Want to run tests?** See [docs/testing.md](./docs/testing.md)
3. **Need to understand the codebase?** Read [docs/architecture.md](./docs/architecture.md)
4. **Ready to contribute?** Check [docs/contributing.md](./docs/contributing.md)

## Key Technologies

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: CSS with CSS Variables (Glassmorphism design)
- **State Management**: React hooks + localforage (IndexedDB)
- **AI Integration**: Google Gemini SDK
- **Backend**: Vercel Serverless Functions
- **PWA**: vite-plugin-pwa

## Need Help?

- Check the specific documentation file for your topic
- Look for inline code comments in critical files
- Review the [architecture document](./docs/architecture.md) for system design decisions
