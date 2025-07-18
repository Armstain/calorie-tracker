# Project Structure

## Root Directory Layout

```
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ui/               # Reusable UI components (shadcn/ui style)
│   └── *.tsx             # Feature-specific components
├── lib/                  # Utility libraries and services
│   ├── hooks/           # Custom React hooks
│   └── *.ts             # Services and utilities
├── types/               # TypeScript type definitions
├── __tests__/           # Test files
├── public/              # Static assets
└── .kiro/               # Kiro configuration and specs
```

## Key Directories

### `/app` - Next.js App Router
- **layout.tsx**: Root layout with providers and global setup
- **page.tsx**: Main SPA-style application with view routing
- **globals.css**: Tailwind imports and global styles

### `/components` - React Components
- **UI Components** (`/ui`): Reusable components following shadcn/ui patterns
- **Feature Components**: Domain-specific components (Camera, Results, Tracker, etc.)
- **Naming**: PascalCase, descriptive names (e.g., `CameraCapture.tsx`)

### `/lib` - Services and Utilities
- **Services**: Singleton classes for core functionality (`gemini.ts`, `storage.ts`)
- **Hooks** (`/hooks`): Custom React hooks for shared logic
- **Utilities**: Helper functions and configurations
- **Config**: Application constants and environment handling

### `/types` - TypeScript Definitions
- **index.ts**: Centralized type definitions
- Interface naming: PascalCase with descriptive names
- Shared types for API responses, storage, and component props

## File Naming Conventions

- **Components**: PascalCase (e.g., `CameraCapture.tsx`)
- **Services**: camelCase (e.g., `geminiService.ts`)
- **Utilities**: camelCase (e.g., `dateUtils.ts`)
- **Types**: PascalCase interfaces (e.g., `FoodAnalysisResult`)
- **Tests**: Match source file with `.test.ts` suffix

## Import Patterns

```typescript
// Absolute imports using @ alias
import { Component } from '@/components/Component'
import { service } from '@/lib/service'
import { Type } from '@/types'

// Relative imports for closely related files
import './Component.css'
```

## Component Organization

- **Single responsibility**: Each component has one clear purpose
- **Composition over inheritance**: Use composition patterns
- **Props interfaces**: Define clear TypeScript interfaces for all props
- **Error boundaries**: Wrap components that might fail
- **Mobile-first**: All components designed for mobile with desktop enhancements

## Service Architecture

- **Singleton pattern**: Services use getInstance() pattern
- **Error handling**: Consistent error types and handling
- **Caching**: Built-in caching for expensive operations
- **Rate limiting**: API services implement rate limiting
- **Fallback strategies**: Multiple fallback options for critical services