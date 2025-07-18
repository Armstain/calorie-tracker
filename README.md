# CalorieMeter 🍽️

CalorieMeter is a modern Next.js web application that revolutionizes calorie tracking through AI-powered food analysis. Simply take a photo of your meal and get instant, detailed nutritional information powered by Google's advanced Gemini AI models. The app features comprehensive tracking, health integration, intelligent learning capabilities, and full Progressive Web App (PWA) support while maintaining complete data privacy through local storage.

## ✨ Features

### 📸 Smart Food Capture

- **Ultra-Compact Mobile Interface**: Redesigned camera component with maximum space efficiency (max-w-xs) for optimal mobile experience
- **Streamlined Camera Initialization**: Simplified camera startup with automatic back camera preference and seamless front camera fallback
- **Intelligent Camera Detection**: Smart constraint-based camera selection with robust error handling and recovery
- **Clean Status Management**: Removed verbose status messages for cleaner, more intuitive user experience
- **Optimized Loading States**: Proper loading indicators during camera initialization and photo capture processes
- **Contextual UI States**: Dynamic interface that adapts based on camera status - clean welcome screen, active camera preview, or photo confirmation
- **Gradient Brand Integration**: Consistent amber-to-orange gradient branding throughout the camera interface for visual cohesion
- **Intelligent Layout Switching**: Horizontal button layouts that maximize screen real estate and improve thumb accessibility
- **One-Touch Camera Activation**: Instant camera access with automatic environment camera detection for food photography
- **Overlay Capture System**: Integrated capture button directly overlaid on camera preview for intuitive single-tap photo capture
- **Live Status Indicators**: Animated pulse indicators showing active camera status with clear visual feedback
- **Square Aspect Ratio Preview**: Optimized 1:1 camera preview that matches modern social media expectations and improves food framing
- **Subtle Visual Enhancements**: Delicate frame overlay on camera preview and rounded corners for professional appearance
- **Streamlined Photo Confirmation**: Horizontal action buttons (Analyze/Retake) for quick decision-making without scrolling
- **Smart File Upload Integration**: Seamless file upload option with hover effects and accessibility improvements
- **Enhanced Touch Targets**: Properly sized buttons (py-2.5) with adequate spacing for reliable mobile interaction
- **Progressive Loading States**: Clear loading indicators and disabled states during photo capture and processing
- **Robust Error Handling**: Comprehensive error recovery with user-friendly messaging and fallback options
- **Visual Feedback System**: Hover effects, scale transforms, and shadow enhancements for responsive user interaction
- **Accessibility-First Design**: High contrast indicators, clear labeling, and proper ARIA support for screen readers

### 🤖 AI-Powered Analysis

- **Advanced Gemini Integration**: Multi-model support with Gemini 2.0 Flash, 1.5 Pro, and 1.5 Flash
- **Intelligent Fallback System**: Automatic model switching with retry logic and exponential backoff
- **Comprehensive Food Analysis**: Detailed breakdown including macronutrients, ingredients, cooking methods, and health scores
- **Enhanced Nutritional Data**: Protein, carbs, fat, fiber content with percentage breakdowns
- **Context Recognition**: Meal type detection (breakfast, lunch, dinner, snack) and restaurant identification
- **Confidence Scoring**: AI confidence levels for each food item with visual indicators
- **Smart Learning System**: User correction feedback system to improve future accuracy with pattern recognition
- **Correction Analytics**: Track and analyze user corrections to improve AI model performance
- **Rate Limiting**: Intelligent rate limiting with daily and per-minute request management
- **Error Recovery**: Comprehensive error handling with user-friendly messages and retry mechanisms

### 📊 Daily Tracking & Management

- **Advanced Progress Monitoring**: Visual progress bars with color-coded goal achievement status
- **Comprehensive Entry Management**: View, expand, edit, and delete individual food entries with confirmation dialogs
- **Smart Daily Reset**: Complete daily progress reset with data preservation options
- **Intelligent Goal Setting**: Customizable daily calorie goals with validation and quick presets
- **Real-time Updates**: Instant calorie total updates with smooth animations
- **Entry Details**: Expandable food entries showing ingredients, cooking methods, and nutritional breakdowns
- **Meal Timestamps**: Automatic timestamping of all food entries for detailed tracking
- **Comprehensive Food Database**: Built-in database with 30+ common foods across 8 categories:
  - 🍎 Fruits (apples, bananas, oranges, berries, etc.)
  - 🥬 Vegetables (broccoli, carrots, spinach, tomatoes, etc.)
  - 🍞 Grains & Starches (rice, bread, pasta, oats, etc.)
  - 🍗 Proteins (chicken, beef, fish, eggs, beans, etc.)
  - 🥛 Dairy (milk, cheese, yogurt, etc.)
  - 🥜 Snacks (nuts, crackers, chips, etc.)
  - ☕ Beverages (coffee, tea, juice, soda, etc.)
  - 🍰 Desserts (cookies, cake, ice cream, etc.)
- **Smart Food Search**: Real-time search through categorized food database with emoji icons
- **Flexible Portions**: Multiple portion sizes (small, medium, large, cups, tablespoons) with precise calorie calculations
- **Quick Add Interface**: Modal-based food selection with instant calorie entry without photo analysis

### 📈 History & Analytics

- **Advanced 7-Day History**: Interactive weekly calorie intake visualization with comprehensive trend analysis
- **Dual View Modes**: Toggle between chart visualization and detailed list views for historical data
- **Smart Goal Tracking**: Track daily goal completion rates with color-coded achievement indicators
- **Trend Analysis**: Automatic trend detection (increasing, decreasing, stable) with percentage changes
- **Weekly Statistics**: Comprehensive weekly averages, totals, and goal achievement rates
- **Interactive Data**: Click on dates to view detailed daily breakdowns and meal entries

### 🏥 Health Integration

- **BMI Calculator**: Built-in BMI calculation with health categorization
- **Health Metrics**: Weight tracking with trend analysis
- **Personalized Goals**: AI-recommended calorie goals based on health metrics
- **Activity Levels**: Customizable activity level settings for accurate calculations

### ⚙️ Settings & Customization

- **API Key Management**: Support for personal Gemini API keys with default test key
- **Data Retention**: Configurable data retention periods (1-365 days)
- **Notifications**: Optional goal achievement and reminder notifications
- **Goal Presets**: Quick-select calorie goal presets for different lifestyles
- **Enhanced UI**: Improved form inputs with better text contrast and accessibility
- **Dark Mode Support**: Full dark mode compatibility across all interface elements

### 💾 Data Management & Backup

- **Data Export**: Complete data backup as JSON files with metadata
- **Data Import**: Restore data from exported files with validation
- **Storage Monitoring**: Real-time storage usage tracking and optimization
- **Selective Clearing**: Clear today's, week's, or all data with confirmation
- **Data Summary**: Overview of entries, corrections, and storage usage
- **Learning Data**: Export/import AI correction data for improved accuracy

### 📱 Progressive Web App (PWA)

- **Offline Support**: Service worker with intelligent caching strategies for static assets
- **Background Sync**: Queued photo analysis when offline with automatic processing when online
- **App-like Experience**: Installable PWA with standalone display mode
- **Smart Caching**: Network-first for API calls, cache-first for static resources
- **Offline Fallback**: Graceful degradation when network is unavailable
- **Mobile Optimization**: Portrait-primary orientation with touch-optimized interface

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun package manager

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd caloriemeter
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables (optional):

```bash
cp .env.local.example .env.local
# Edit .env.local with your Gemini API key (optional - default test key provided)
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Technology Stack

### Core Framework

- **Next.js 15.4.1** with App Router and Turbopack
- **React 19.1.0** with TypeScript 5
- **Tailwind CSS 4.0** with PostCSS for styling

### AI & APIs

- **Google Gemini AI** (Gemini 2.0 Flash, 1.5 Pro, 1.5 Flash models)
- **Direct client-side integration** with intelligent fallback strategies
- **Advanced rate limiting** and comprehensive error handling
- **Multi-model support** with automatic failover

### UI & Components

- **Lucide React 0.525.0** for comprehensive icon library
- **Custom UI components** following shadcn/ui patterns with consistent amber color scheme
- **class-variance-authority 0.7.1** and **clsx 2.1.1** for conditional styling
- **tailwind-merge 3.3.1** for intelligent class merging
- **Mobile-first responsive design** with touch-optimized interfaces
- **Progressive Web App** capabilities with service worker

### PWA & Offline

- **Service Worker** for intelligent caching and offline support
- **Background Sync** for queued operations when offline
- **Cache Strategies** - Network-first for APIs, cache-first for static assets
- **Offline Fallback** with graceful degradation
- **PWA Manifest** with app installation support

### Data & Storage

- **Browser LocalStorage** for primary data persistence
- **No external database** - fully client-side architecture
- **Data compression** and automatic cleanup utilities
- **Export/Import** functionality for data backup and transfer

### Testing & Quality

- **Jest 30.0.4** with jsdom environment for comprehensive testing
- **React Testing Library 16.3.0** for component testing
- **@testing-library/user-event 14.6.1** for interaction testing
- **@testing-library/jest-dom 6.6.3** for enhanced DOM assertions
- **TypeScript 5** with strict mode configuration
- **ESLint 9** with Next.js 15.4.1 configuration

## 📁 Project Structure

```text
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles with Tailwind CSS and custom properties
│   ├── layout.tsx         # Root layout with PWA configuration and metadata
│   └── page.tsx           # Main SPA application with view routing
├── components/            # React components
│   ├── ui/               # Reusable UI components with dark mode support
│   │   ├── button.tsx   # Button component with variant system, gradients, and consistent amber color scheme
│   │   ├── input.tsx    # Input component with enhanced contrast and dark mode
│   │   ├── card.tsx     # Card components for consistent layout
│   │   └── badge.tsx    # Badge component for status indicators
│   ├── WorkingCamera.tsx # Optimized camera interface with mobile-first design
│   ├── ResultsDisplay.tsx # AI analysis results with detailed nutritional info
│   ├── DailyTracker.tsx  # Daily progress tracking with entry management
│   ├── HistoryView.tsx   # Weekly history with chart and list views
│   ├── HealthIntegration.tsx # BMI calculator and health metrics
│   ├── GoalSettings.tsx  # Settings and configuration management
│   ├── DataManagement.tsx # Complete data export/import system
│   ├── FoodDatabaseEntry.tsx # Quick add food database with search
│   ├── SplashScreen.tsx  # App loading screen with animated branding
│   ├── ErrorBoundary.tsx # React error boundary for graceful error handling
│   └── ErrorNotification.tsx # User-friendly error messaging system
├── lib/                  # Services and utilities
│   ├── hooks/           # Custom React hooks
│   │   ├── useErrorHandler.ts # Comprehensive error handling hook
│   │   └── useNetworkStatus.ts # Network connectivity monitoring
│   ├── gemini.ts        # Gemini AI service with multi-model support
│   ├── storage.ts       # LocalStorage service with data management
│   ├── foodDatabase.ts  # Comprehensive food database (30+ items)
│   ├── cache.ts         # Intelligent caching system for API responses
│   ├── config.ts        # Environment and API configuration
│   ├── learningService.ts # AI learning and user correction system
│   └── utils.ts         # Helper functions and utilities
├── types/               # TypeScript type definitions
│   └── index.ts         # Centralized type definitions for the app
├── __tests__/           # Comprehensive test suite
│   ├── components/      # Component-specific tests
│   ├── integration/     # Integration and end-to-end tests
│   └── lib/            # Service and utility tests
├── public/              # Static assets and PWA files
│   ├── manifest.json    # PWA manifest with app configuration
│   ├── sw.js           # Service worker for offline support
│   └── *.svg           # App icons and graphics
└── .kiro/              # Kiro configuration and project specs
    ├── specs/          # Project specifications and documentation
    └── steering/       # Development guidelines and rules
```

## 🧪 Testing

The application includes a comprehensive test suite covering all major functionality:

### Running Tests

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# CI mode
npm run test:ci
```

### Test Structure

```text
__tests__/
├── components/          # Component tests
│   └── ResultsDisplay.test.tsx
├── integration/         # Integration tests
│   └── app.test.tsx
└── lib/                # Service and utility tests
    ├── hooks/
    │   └── useErrorHandler.test.ts
    ├── gemini.test.ts
    ├── storage.test.ts
    └── foodDatabase.test.ts
```

### Test Coverage

- **Unit Tests**: Component logic and service functions with comprehensive mocking
- **Integration Tests**: Full app integration testing with user workflows
- **Component Testing**: React Testing Library tests for all major components including:
  - ResultsDisplay with AI analysis results and user interactions
  - Error handling components with boundary testing
  - UI components with accessibility testing
- **Service Testing**: Complete test coverage for core services:
  - Gemini AI service with API mocking and error scenarios
  - Storage service with LocalStorage mocking and data validation
  - Food database service with search and calculation testing
  - Error handler hook with retry logic and state management
- **Error Handling**: Comprehensive error scenario testing with boundary cases
- **Accessibility**: Screen reader compatibility and keyboard navigation testing
- **Hook Testing**: Custom React hooks with proper testing utilities and state management

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file (optional):

```env
# Optional: Your personal Gemini API key for unlimited usage
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Custom app URL for production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**Note**: The app includes a default test API key, so you can start using it immediately without configuration.

### API Key Setup

1. **Default Usage**: No setup required - uses included test API key
2. **Personal Key**: Get your free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. **Configuration**: Add your key in Settings or environment variables

## 📱 Mobile Optimization

CalorieMeter is designed mobile-first with:

- **Touch-optimized interface** with proper touch targets (44px minimum)
- **Camera access** with comprehensive permission handling and fallbacks
- **Responsive design** that works on all screen sizes with adaptive layouts
- **PWA capabilities** for app-like experience with offline support
- **Offline-ready** error handling and intelligent caching strategies
- **Network status detection** with slow connection indicators
- **Gesture-friendly navigation** with swipe-compatible interfaces

## 🛡️ Error Handling & Reliability

The application includes comprehensive error handling:

- **Error Boundaries**: React error boundaries to catch and handle component errors gracefully
- **Network Error Recovery**: Automatic retry logic with exponential backoff for API failures
- **Camera Error Handling**: Graceful fallbacks when camera access is denied or unavailable
- **Storage Error Management**: Handles localStorage quota exceeded and access denied scenarios
- **User-Friendly Messages**: Clear, actionable error messages with suggested solutions
- **Error Analytics**: Track error patterns to improve application reliability
- **Offline Capability**: Graceful degradation when network connectivity is lost

## 🔒 Privacy & Security

- **Local Data Storage**: All user data stored locally in browser
- **No External Database**: No personal data sent to external services
- **Image Privacy**: Photos analyzed via API but not permanently stored
- **API Key Security**: Secure handling of API credentials
- **Data Control**: Users have full control over their data retention

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard (optional)
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: Report bugs and request features via GitHub Issues
- **Documentation**: Check the `/docs` folder for detailed guides
- **API Issues**: Verify your Gemini API key and rate limits

## 🔄 Recent Updates

### Latest Features

- **Enhanced UI Components**: Comprehensive updates to core UI components with improved visual design and accessibility
  - **Button Component**: Refined outline variant with improved text contrast (`text-amber-700`) and enhanced hover states (`hover:text-amber-800`)
  - **Improved Color Consistency**: Standardized amber color scheme across all button variants for better brand consistency
  - **Visual Hierarchy**: Enhanced button styling with proper color transitions and improved readability
  - **Ghost Button Updates**: Consistent amber color scheme (`text-amber-700`, `hover:text-amber-800`) for better visual cohesion
  - **Input Components**: Updated with improved text contrast (`text-black`) for better readability
  - **Dark Mode Support**: Maintained comprehensive dark mode compatibility across all form elements
  - **Focus States**: Enhanced with amber ring colors for brand consistency and accessibility
  - **Placeholder Visibility**: Improved placeholder text contrast ratios for better user experience
- **Accessibility Improvements**: Better color contrast, visual feedback, and consistent color handling for users with different accessibility needs
- **Design System Consistency**: Standardized styling across all UI components with proper color schemes and hover states
- **Redesigned Camera Interface**: Complete mobile-first redesign with compact, intuitive controls and streamlined user experience
- **Enhanced Visual Design**: Modern UI with rounded corners, subtle shadows, gradient accents, and improved visual hierarchy
- **Optimized Camera Preview**: Square aspect-ratio preview with integrated capture button overlay for one-touch photo capture
- **Smart Status Indicators**: Live camera status with animated pulse indicator and clear visual feedback
- **Improved Touch Targets**: Larger, more accessible buttons with proper spacing and hover states for better mobile interaction
- **Streamlined Workflow**: Simplified photo capture and review process with fewer steps and clearer action buttons
- **Food Database Service**: Comprehensive local database with 30+ common foods across 8 categories (fruits, vegetables, grains, proteins, dairy, snacks, beverages, desserts)
- **Quick Add Functionality**: Instant calorie entry without photo analysis using the built-in food database
- **Smart Portion Calculations**: Multiple portion sizes for each food item with automatic calorie calculations
- **Food Search & Categories**: Search functionality and organized food categories with emoji icons for easy navigation
- **Flexible Serving Sizes**: Common portion options (small, medium, large, cups, tablespoons) with precise multipliers
- **Progressive Web App (PWA)**: Full PWA implementation with service worker for offline support
- **Service Worker Integration**: Intelligent caching strategies with network-first for APIs and cache-first for static assets
- **Background Sync**: Queued photo analysis when offline with automatic processing when connection is restored
- **Offline Support**: Graceful degradation and offline fallback capabilities for improved user experience
- **App Installation**: Installable PWA with standalone display mode and app-like experience
- **ES6 Module Syntax**: Updated test files to use modern ES6 import syntax instead of CommonJS require()
- **JSX Compliance**: Fixed apostrophe handling in JSX using Next.js recommended `&apos;` entity
- **Data Management System**: Complete data export/import functionality with JSON backup files
- **Storage Monitoring**: Real-time storage usage tracking with visual indicators
- **Selective Data Clearing**: Granular data deletion (today, week, or all data) with confirmation dialogs
- **Enhanced Data Export**: Comprehensive backup including user data, settings, and AI learning corrections
- **Import Validation**: Robust data import with format validation and error handling
- **Entry Management**: Delete individual food entries from daily tracker
- **Daily Reset**: Complete daily progress reset functionality
- **Enhanced UI**: Improved mobile interface with better touch targets
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Health Integration**: BMI calculator and personalized goal recommendations

### Development Improvements

- **UI Component Enhancement**: Comprehensive updates to core UI components including:
  - **Button Component**: Refined outline and ghost variants with improved text contrast and consistent amber color scheme
  - **Color System**: Standardized amber color palette (`text-amber-700`, `hover:text-amber-800`) with smooth transitions
  - **Input Components**: Updated with improved text contrast (`text-black`) for better readability
  - **Visual Polish**: Enhanced button styling with consistent color schemes and refined hover states
- **Accessibility Improvements**: Enhanced form components with better contrast ratios and consistent visual feedback
- **Design System Consistency**: Standardized component styling across light and dark themes with proper color handling
- **Modern JavaScript**: Comprehensive ES6 module usage throughout the codebase
- **Type Safety**: Enhanced TypeScript integration with strict mode across all components and services
- **Testing Framework**: Comprehensive test suite with Jest 30.0.4 and React Testing Library 16.3.0
- **Code Quality**: ESLint 9 configuration with Next.js 15.4.1 best practices
- **PWA Implementation**: Full Progressive Web App support with service worker and offline capabilities
- **Performance Optimization**: Turbopack integration for faster development builds

---

Built with ❤️ using Next.js, React, and Google Gemini AI