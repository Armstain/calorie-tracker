# Technology Stack

## Framework & Runtime
- **Next.js 15.4.1** with App Router
- **React 19.1.0** with TypeScript 5
- **Node.js** runtime environment

## Styling & UI
- **Tailwind CSS 4.0** for styling
- **Lucide React** for icons
- **class-variance-authority** and **clsx** for conditional styling
- **tailwind-merge** for class merging

## AI Integration
- **Google Gemini AI** (Gemini-1.5-flash model)
- Direct client-side API integration with fallback to Next.js API routes
- Rate limiting and model fallback support

## Data & Storage
- **Browser LocalStorage** for data persistence
- **IndexedDB** fallback for large datasets
- No external database - fully client-side storage

## Testing
- **Jest** with **jsdom** environment
- **React Testing Library** for component testing
- **@testing-library/user-event** for interaction testing

## Development Tools
- **ESLint** with Next.js config
- **TypeScript** with strict mode
- **PostCSS** for CSS processing

## Deployment
- **Vercel** platform (free tier)
- Static site generation where possible
- Environment variable management

## Common Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm start           # Start production server

# Testing
npm test            # Run tests
npm run test:watch  # Watch mode
npm run test:coverage # Coverage report
npm run test:ci     # CI mode

# Code Quality
npm run lint        # ESLint check
```

## Architecture Patterns
- Client-side focused to minimize server costs
- Singleton services for storage and AI integration
- Error boundaries and comprehensive error handling
- Mobile-first responsive design
- Progressive Web App capabilities