# CalorieMeter 🍽️

CalorieMeter is a modern Next.js web application that revolutionizes calorie tracking through AI-powered food analysis. Simply take a photo of your meal and get instant, detailed nutritional information powered by Google's advanced Gemini AI models. The app features comprehensive user onboarding, advanced health integration with BMR/TDEE calculations, intelligent learning capabilities, natural language correction system, robust local storage with SSR compatibility, and full Progressive Web App (PWA) support while maintaining complete data privacy through browser-based storage.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/caloriemeter.git
cd caloriemeter

# Install dependencies
npm install

# Set up environment variables (optional - app works with default test API key)
cp .env.local.example .env.local
# Edit .env.local and add your Gemini API key if desired

# Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

## 📋 Prerequisites

- **Node.js** 18.0 or higher
- **Modern web browser** with camera support
- **Gemini API key** (optional - default test key provided)

## ✨ Features

### 🎯 Recent Updates & Improvements

- **Production-Ready Storage Service**: Optimized storage service with enhanced reliability and performance:
  - **Clean Initialization**: Removed debug logging for production-ready performance and cleaner console output
  - **Universal SSR Compatibility**: Full server-side rendering support with `typeof window === 'undefined'` checks throughout all storage operations
  - **Enhanced Profile Management**: Complete user profile CRUD operations with versioned schema (v1.0) and metadata tracking
  - **Advanced Health Calculations**: Built-in BMR and TDEE calculations using Harris-Benedict equation with activity level multipliers
  - **Intelligent Data Validation**: Comprehensive validation system for all user data including age, height, weight, and activity levels
  - **Automatic Data Cleanup**: Smart data retention with configurable cleanup periods and automatic old entry removal
  - **Storage Quota Management**: Real-time storage usage monitoring with quota management and optimization
  - **Data Import/Export**: Complete data backup and restore functionality with JSON format support
  - **Profile Validation Helpers**: Advanced validation with detailed error reporting for health metrics and user data
  - **Onboarding Integration**: Seamless onboarding completion tracking with profile persistence and goal calculation
- **Server-Side Rendering (SSR) Compatibility**: Enhanced Next.js compatibility with comprehensive SSR protection:
  - **Universal Service Layer**: All storage and learning services now include `typeof window === 'undefined'` checks for seamless server-side rendering
  - **Learning Service SSR Protection**: AI learning service (`learningService.ts`) now safely handles server-side initialization without localStorage access
  - **Storage Service SSR Protection**: Complete storage service compatibility with SSR, preventing hydration errors with enhanced debugging capabilities
  - **Network Status Hook SSR Protection**: Network detection hooks safely handle server-side rendering scenarios
  - **Enhanced Debugging**: Added comprehensive debug logging to storage service for troubleshooting SSR initialization issues
  - **Improved Build Performance**: Faster Next.js builds with reduced client-server hydration mismatches
  - **Production Stability**: Enhanced production deployment stability with proper SSR/client-side boundary handling
- **Production-Ready Natural Language Correction System**: Enterprise-grade AI-powered correction interface with advanced reliability features:
  - **Conversational Interface**: Users can type corrections like "That's actually a large pizza slice, not small" or "It's grilled chicken, not fried"
  - **Advanced Multi-Retry Architecture**: Intelligent retry system with exponential backoff (1s, 2s, 4s delays) for handling API rate limits and service failures
  - **Comprehensive Error Management**: Smart error categorization with specific handling for rate limits (429), authentication (401/403), and service unavailability (503)
  - **Real-time Progress Feedback**: Visual retry indicators with attempt counters ("Retrying... (2/3)") and detailed processing status updates
  - **Robust Response Processing**: Dual-layer JSON parsing with primary and fallback parsing strategies for maximum reliability
  - **Enhanced User Experience**: Improved correction examples with proper quote escaping, helpful tips, and rate limit guidance
  - **Intelligent API Integration**: Multi-model fallback system via `/api/gemini-correction` (Gemini 1.5 Flash → 1.5 Pro) with comprehensive error handling
  - **Production Reliability**: Enhanced error boundaries, timeout handling, service degradation management, and comprehensive logging
  - **Seamless UI Integration**: Updated `ResultsProps` interface with `onAnalysisUpdate` callback for real-time correction updates
- **Advanced Profile Management in Settings**: Complete profile editing system integrated into GoalSettings component:
  - In-app profile editing without requiring onboarding restart
  - Real-time unit conversion between metric and imperial systems
  - Comprehensive validation with detailed error messaging
  - Automatic calorie goal recalculation based on profile changes
  - Profile reset functionality with onboarding restart option
  - Profile creation for users who skipped initial onboarding
- **Goal Performance Analytics**: Intelligent goal tracking and recommendations:
  - Weekly performance analysis with current goal vs. actual intake comparison
  - Smart recommendations for goal adjustments based on usage patterns
  - Color-coded performance indicators and achievement rate tracking
- **Advanced Toast Notification System**: Modern, accessible notification system powered by **Sonner** with comprehensive user feedback:
  - Multiple toast types (success, error, info, loading) with distinct visual styling and custom icons
  - Smart auto-dismiss with configurable duration and persistent loading toasts
  - Promise-based toasts for automatic loading/success/error state management
  - Interactive actions within toasts for user interaction and quick responses
  - Smooth animations with proper timing and easing, optimized for performance
  - Complete toast lifecycle management with add, remove, update, and clear operations
  - Convenience methods for common use cases with memory-efficient cleanup
  - Integrated with main app for food analysis feedback and user notifications
- **Jest Configuration Fix**: Corrected `moduleNameMapper` configuration for proper path alias resolution in tests
- **Enhanced Test Coverage**: Comprehensive test suite including onboarding flow integration tests
- **Improved Error Handling**: Better error boundaries and user-friendly error messages
- **Mobile-First Camera Interface**: Streamlined camera capture with optimized mobile experience
- **Advanced Health Calculations**: Complete implementation of BMR, TDEE, and BMI calculations
- **Comprehensive Food Database**: Built-in database with 30+ common foods across 8 categories

### 👋 Smart User Onboarding & Profile Management

- **Comprehensive 5-Step Onboarding Flow**: Complete user profile setup with intelligent navigation and smooth animations:
  1. **Welcome Step**: App introduction with personalization benefits, privacy assurance, and feature highlights
  2. **Basic Info Step**: Personal details collection with advanced validation and real-time unit conversion:
     - Age input (13-120 years) with comprehensive error messaging
     - Gender selection with inclusive options (male, female, other, prefer not to say)
     - Height input with metric (cm) and imperial (ft/in) unit support and seamless conversion
     - Weight input with metric (kg) and imperial (lbs) unit support and automatic conversion
     - Real-time unit system toggle with automatic field conversion
  3. **Activity Step**: Activity level selection with detailed scientific descriptions and examples:
     - Five activity levels (sedentary to extremely active) with multiplier indicators (1.2x to 1.9x)
     - Exercise frequency tracking (0-7 days/week) with validation
     - Real-world examples and descriptions for accurate self-assessment
     - Scientific explanation of TDEE calculation methodology
  4. **Goals Step**: Fitness goal setting with real-time calorie calculations and personalized recommendations:
     - Four primary goals (weight loss, maintenance, weight gain, muscle building)
     - Real-time calorie target calculation using Harris-Benedict equation
     - Visual calorie adjustment indicators showing daily deficit/surplus (-500 to +500 calories)
     - Optional health objectives selection with 8 predefined options
     - Scientific explanation of goal-based calorie adjustments
  5. **Completion Step**: Comprehensive profile summary with calculated health metrics and next steps:
     - Complete profile overview with all collected information
     - Real-time BMI calculation with health categorization and color coding
     - Daily calorie target with scientific calculation explanation
     - Health objectives summary and personalized welcome message
     - Clear next steps guidance for app usage

- **Advanced Health Calculation Engine**: Scientific formulas for accurate personalized recommendations:
  - **BMR Calculation**: Harris-Benedict equation with gender-specific formulas and precision accuracy
  - **TDEE Calculation**: BMR × activity level multiplier (1.2x to 1.9x) for accurate daily energy needs
  - **Goal-Based Calorie Adjustments**: Automatic daily calorie modifications for specific fitness objectives:
    - Weight Loss: 500 calorie deficit for sustainable 1 lb/week loss
    - Weight Gain: 500 calorie surplus for healthy 1 lb/week gain
    - Maintenance: Precise TDEE matching for weight stability
    - Muscle Building: 300 calorie surplus optimized for lean mass gain
  - **BMI Analysis**: Complete Body Mass Index calculation with health categorization and color-coded indicators
  - **Unit Conversion System**: Comprehensive conversion utilities for international users with precision handling

- **Intelligent User Experience**: Smart detection and seamless navigation:
  - **New vs. Returning User Detection**: Automatic onboarding status checking for seamless experience
  - **Progress Tracking**: Visual step indicators with progress percentage and smooth transitions
  - **Keyboard Navigation**: Full keyboard accessibility with ESC key support for step navigation
  - **Error Recovery**: Comprehensive error boundaries with graceful fallback and restart options
  - **Skip Option**: Optional onboarding with ability to skip and complete later with minimal profile creation
  - **Seamless Integration**: Existing users bypass onboarding and splash screen for instant app access

- **Data Integrity & Validation**: Robust validation system with user-friendly error messaging:
  - **Comprehensive Form Validation**: Real-time validation with detailed error messages and recovery guidance
  - **Health Metrics Validation**: Scientific validation ranges with health-conscious boundaries
  - **Profile Data Persistence**: Complete profile storage with versioned schema (v1.0) and metadata tracking
  - **Data Completeness Assessment**: Real-time evaluation of profile completeness for accurate calculations
  - **Privacy-First Design**: Prominent privacy messaging with local-only data storage guarantee

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
- **Production-Grade Natural Language Correction System**: Revolutionary AI-powered correction interface with enterprise-level reliability:
  - **Conversational Interface**: Users can describe corrections naturally: "That's actually a large pizza slice, not small" or "It's grilled chicken, not fried"
  - **Advanced Retry Architecture**: Intelligent multi-attempt system with exponential backoff (1s, 2s, 4s delays) for handling API rate limits and temporary failures
  - **Comprehensive Error Classification**: Smart error handling with specific responses for rate limits (429), authentication failures (401/403), and service unavailability (503)
  - **Real-time User Feedback**: Visual retry progress indicators with attempt counters ("Retrying... (2/3)") and detailed processing status updates
  - **Robust Response Parsing**: Dual-layer JSON parsing system with primary and fallback parsing strategies to handle various AI response formats
  - **Enhanced User Experience**: Improved correction examples with proper quote escaping, helpful tips, and rate limit guidance
  - **Intelligent Rate Limit Management**: Built-in awareness of API limitations with user-friendly messaging and automatic retry suggestions
  - **Graceful Degradation**: Comprehensive error recovery with detailed error messages, recovery guidance, and fallback options
  - **Multi-Model API Architecture**: Dedicated `/api/gemini-correction` route with intelligent model fallback (Gemini 1.5 Flash → 1.5 Pro)
  - **Production Reliability**: Enhanced error boundaries, timeout handling, service degradation management, and comprehensive logging
- **Advanced Toast Notification System**: Modern, accessible notification system with comprehensive user feedback:
  - **Multiple Toast Types**: Success, error, info, and loading toast notifications with distinct visual styling and icons
  - **Smart Auto-Dismiss**: Configurable duration with automatic dismissal (default 5s) and persistent loading toasts
  - **Interactive Actions**: Optional action buttons within toasts for user interaction and quick responses
  - **Smooth Animations**: Slide-in/slide-out animations with proper timing and easing for polished user experience
  - **Accessibility Features**: Screen reader support with proper ARIA labels and keyboard navigation
  - **Toast Management**: Complete toast lifecycle management with add, remove, update, and clear operations
  - **Convenience Methods**: Simple success(), error(), info(), and loading() methods for common use cases
  - **Visual Feedback**: Color-coded backgrounds, icons, and styling for immediate recognition of toast types
  - **Responsive Design**: Mobile-optimized positioning and sizing with proper z-index stacking
  - **Memory Efficient**: Automatic cleanup and proper state management to prevent memory leaks
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

### 🏥 Health Integration & Advanced Calculations

- **Scientific Health Calculations**: Comprehensive health metrics using validated scientific formulas:
  - **Harris-Benedict BMR**: Gender-specific Basal Metabolic Rate calculations with precision accuracy
  - **TDEE Calculations**: Total Daily Energy Expenditure with activity level multipliers (1.2x to 1.9x)
  - **Goal-Based Calorie Adjustments**: Automatic daily calorie adjustments for specific fitness goals
  - **BMI Analysis**: Complete Body Mass Index calculation with health categorization and color-coded status
- **Advanced Unit Conversion System**: Comprehensive conversion utilities for international users:
  - **Height Conversion**: Seamless cm ↔ ft/in conversion with proper decimal handling
  - **Weight Conversion**: Accurate kg ↔ lbs conversion with precision maintenance
  - **Automatic Unit Detection**: Smart unit preference detection based on user input patterns
- **Comprehensive Health Validation**: Robust validation system with user-friendly error messaging:
  - **Age Validation**: 13-120 years range with developmental and geriatric considerations
  - **Height Validation**: 100-250cm (3.3-8.2ft) range with unit-specific validation
  - **Weight Validation**: 30-300kg (66-660lbs) range with health-conscious boundaries
  - **Activity Level Validation**: Five-tier activity system with detailed descriptions and examples
- **Personalized Calorie Recommendations**: AI-driven daily calorie goal calculations:
  - **Weight Loss**: 500 calorie deficit for sustainable 1 lb/week loss
  - **Weight Gain**: 500 calorie surplus for healthy 1 lb/week gain
  - **Maintenance**: Precise TDEE matching for weight stability
  - **Muscle Building**: 300 calorie surplus optimized for lean mass gain
- **Health Metrics Dashboard**: Real-time health metric calculations and tracking:
  - **BMI Categories**: Underweight, Normal, Overweight, Obese with color-coded indicators
  - **Calorie Balance Analysis**: Daily intake vs. target with visual progress indicators
  - **Health Recommendations**: Personalized suggestions based on calculated metrics
- **Profile Data Integrity**: Advanced profile management with data validation and error recovery:
  - **Versioned Schema**: Profile data versioning for future compatibility
  - **Data Validation**: Comprehensive validation with detailed error reporting
  - **Default Value System**: Smart defaults for incomplete profiles with gender-based recommendations
  - **Profile Completeness**: Real-time assessment of profile data completeness for accurate calculations

### ⚙️ Settings & Customization

- **Comprehensive Profile Management**: Complete user profile editing and management system integrated into settings:
  - **Profile Information Display**: View complete profile summary with personal info, activity level, and fitness goals
  - **In-App Profile Editing**: Full profile editing interface without requiring onboarding restart:
    - Personal information (age, gender, height, weight) with real-time validation
    - Metric/Imperial unit system toggle with automatic field conversion
    - Activity level selection with detailed descriptions and examples
    - Exercise frequency tracking (0-7 days per week)
    - Primary fitness goal selection with emoji icons and clear descriptions
    - Health objectives management with multi-select capabilities
  - **Profile Validation System**: Comprehensive validation with detailed error messages:
    - Age validation (13-120 years) with health-conscious boundaries
    - Height validation with unit-specific ranges (100-250cm or 3-8ft)
    - Weight validation with unit-specific ranges (30-300kg or 66-660lbs)
    - Exercise frequency validation (0-7 days per week)
  - **Automatic Calorie Goal Updates**: Profile changes automatically recalculate daily calorie goals using scientific formulas
  - **Profile Reset Functionality**: Complete profile reset with confirmation dialog and onboarding restart option
  - **Profile Creation for Existing Users**: Create profile for users who skipped initial onboarding
- **API Key Management**: Support for personal Gemini API keys with default test key
- **Data Retention**: Configurable data retention periods (1-365 days)
- **Notifications**: Optional goal achievement and reminder notifications
- **Goal Presets**: Quick-select calorie goal presets for different lifestyles (Weight Loss, Maintenance, Active, Athletic)
- **Goal Performance Analytics**: Weekly performance tracking with intelligent recommendations:
  - Current goal vs. weekly average comparison
  - Goal achievement rate calculation and display
  - Smart recommendations for goal adjustments based on actual intake patterns
  - Color-coded performance indicators (success, warning, info)
- **Enhanced UI**: Improved form inputs with better text contrast and accessibility
- **Dark Mode Support**: Full dark mode compatibility across all interface elements

### 💾 Advanced Data Management & Storage

- **Comprehensive Storage Service**: Complete local storage management with advanced features:
  - **Singleton Architecture**: Efficient singleton pattern with SSR-safe initialization and instance management
  - **Universal SSR Support**: Full server-side rendering compatibility with proper window detection and fallback handling
  - **Enhanced Data Validation**: Comprehensive validation system for all data types with detailed error reporting
  - **Automatic Data Cleanup**: Intelligent cleanup system with configurable retention periods (1-365 days) and automatic old entry removal
  - **Storage Quota Management**: Real-time storage usage monitoring with quota tracking and optimization recommendations
  - **Profile Data Management**: Complete user profile CRUD operations with versioned schema and metadata tracking
  - **Health Calculation Engine**: Built-in BMR, TDEE, and BMI calculations using scientific formulas (Harris-Benedict equation)
  - **Data Integrity Checks**: Comprehensive data validation with error recovery and graceful fallback handling
- **Data Backup & Restore**: Complete data management with import/export capabilities:
  - **JSON Export**: Full data backup including settings, entries, and profile data with metadata timestamps
  - **Selective Import**: Restore data from exported files with comprehensive validation and error handling
  - **Data Migration**: Support for data format upgrades and schema versioning for future compatibility
  - **Backup Validation**: Automatic validation of imported data with detailed error reporting and recovery options
- **Storage Optimization**: Advanced storage management and monitoring:
  - **Real-time Usage Tracking**: Monitor storage usage with percentage calculations and quota warnings
  - **Intelligent Cleanup**: Automatic cleanup of old entries based on user-defined retention periods
  - **Storage Health Monitoring**: Track storage health with usage statistics and optimization recommendations
  - **Data Compression**: Efficient data storage with JSON compression and optimization techniques
- **Data Security & Privacy**: Privacy-first data management with local-only storage:
  - **Local-Only Storage**: All data stored locally in browser with no external database dependencies
  - **Data Encryption**: Secure data storage with browser-native security features
  - **Privacy Controls**: User control over data retention, export, and deletion with clear privacy policies
  - **Selective Data Clearing**: Granular data management with options to clear specific data types or time periods

### 📱 Progressive Web App (PWA)

- **Offline Support**: Service worker with intelligent caching strategies for static assets
- **Background Sync**: Queued photo analysis when offline with automatic processing when online
- **App-like Experience**: Installable PWA with standalone display mode
- **Smart Caching**: Network-first for API calls, cache-first for static resources
- **Offline Fallback**: Graceful degradation when network is unavailable
- **Mobile Optimization**: Portrait-primary orientation with touch-optimized interface

## 🏗️ Architecture & Project Structure

### Current Project Organization

```
├── app/                           # Next.js App Router
│   ├── api/gemini-correction/     # Production-grade natural language correction API
│   │   └── route.ts              # Multi-model fallback with intelligent retry logic
│   ├── globals.css               # Global styles with Tailwind CSS 4.0
│   ├── layout.tsx                # Root layout with PWA support
│   └── page.tsx                  # Main SPA application
├── components/                    # React components
│   ├── ui/                       # Reusable UI components (shadcn/ui style)
│   │   ├── badge.tsx             # Badge component
│   │   ├── button.tsx            # Button component
│   │   ├── card.tsx              # Card component
│   │   ├── input.tsx             # Input component
│   │   └── toast.tsx             # Toast notification system
│   ├── onboarding/               # Complete 5-step onboarding flow
│   │   ├── WelcomeStep.tsx       # App introduction and benefits
│   │   ├── BasicInfoStep.tsx     # Personal information collection
│   │   ├── ActivityStep.tsx      # Activity level selection
│   │   ├── GoalsStep.tsx         # Fitness goals and calorie calculation
│   │   ├── CompletionStep.tsx    # Profile summary and completion
│   │   └── OnboardingFlow.tsx    # Main onboarding orchestrator
│   ├── NaturalLanguageCorrection.tsx  # AI-powered correction interface
│   ├── ResultsDisplay.tsx        # Enhanced food analysis display
│   ├── WorkingCamera.tsx         # Optimized mobile camera capture
│   ├── DailyTracker.tsx          # Daily progress tracking
│   ├── HistoryView.tsx           # Weekly analytics and trends
│   ├── GoalSettings.tsx          # Settings with integrated profile management
│   ├── HealthIntegration.tsx     # BMI calculator and health metrics
│   ├── FoodDatabaseEntry.tsx     # Quick food entry from database
│   ├── DataManagement.tsx        # Data backup and restore
│   ├── ErrorBoundary.tsx         # Error boundary component
│   ├── ErrorNotification.tsx     # Error notification system
│   └── SplashScreen.tsx          # App loading screen
├── lib/                          # Services and utilities
│   ├── hooks/                    # Custom React hooks
│   │   ├── useErrorHandler.ts    # Error handling hook
│   │   ├── useNetworkStatus.ts   # Network status detection
│   │   ├── useToast.ts           # Toast notification management hook
│   │   └── useDebounce.ts        # Debounce utility hook
│   ├── gemini.ts                 # AI service with multi-model support
│   ├── storage.ts                # Production-ready storage service
│   ├── learningService.ts        # AI improvement and learning system
│   ├── foodDatabase.ts           # Built-in food database (30+ items)
│   ├── calorieCalculations.ts    # Health calculation utilities
│   ├── cache.ts                  # Caching utilities
│   ├── config.ts                 # Environment and API configuration
│   └── utils.ts                  # Utility functions and validation
├── types/                        # TypeScript definitions
│   └── index.ts                  # Comprehensive type definitions
├── __tests__/                    # Comprehensive test suite
│   ├── components/               # Component tests
│   │   ├── onboarding/           # Onboarding flow tests
│   │   └── *.test.tsx            # Individual component tests
│   ├── integration/              # Integration tests
│   │   ├── app.test.tsx          # Main app integration tests
│   │   └── onboarding-integration.test.tsx  # Onboarding integration
│   └── lib/                      # Service and utility tests
│       ├── hooks/                # Hook tests
│       └── *.test.ts             # Service tests
└── public/                       # Static assets and PWA manifest
    ├── manifest.json             # PWA manifest
    └── *.svg                     # App icons and assets
```

### Key Architectural Decisions

- **Client-Side First**: Minimizes server costs while maintaining full functionality with comprehensive local storage
- **SSR-Compatible Services**: Universal service layer with comprehensive server-side rendering support and proper hydration boundaries
- **Advanced Local Storage**: Complete data privacy with browser-based persistence, SSR-safe initialization, and intelligent data management:
  - **Singleton Storage Service**: Centralized storage management with consistent API and error handling
  - **Comprehensive Data Validation**: Multi-layer validation system with detailed error reporting and recovery
  - **Automatic Data Cleanup**: Intelligent cleanup with configurable retention periods and storage optimization
  - **Profile Management**: Complete user profile lifecycle with versioned schema and metadata tracking
  - **Health Calculations**: Built-in scientific calculations for BMR, TDEE, and BMI with activity level adjustments
- **Component Composition**: Modular, reusable components with clear responsibilities and proper separation of concerns
- **Service Layer**: Singleton services for consistent data management with SSR protection and comprehensive error handling
- **Type Safety**: Comprehensive TypeScript interfaces for all data models with strict validation and type checking
- **Error Boundaries**: Graceful error handling at component and application levels with user-friendly error recovery
- **Progressive Enhancement**: Works offline with intelligent caching strategies and seamless online/offline transitions
- **Universal Rendering**: Seamless server-side and client-side rendering with proper hydration boundaries and SSR optimization
- **Data Integrity**: Multi-layer data validation with automatic error recovery and data consistency checks
- **Privacy-First Design**: Local-only data storage with no external database dependencies and user-controlled data management

## 🛠️ Technology Stack

### Core Framework & Runtime
- **Next.js 15.4.1** with App Router for modern React development
- **React 19.1.0** with TypeScript 5 for type-safe component development
- **Node.js** runtime environment for development and build processes

### Styling & UI Components
- **Tailwind CSS 4.0** for utility-first styling and responsive design
- **Lucide React** for consistent iconography throughout the application
- **Sonner** for modern, accessible toast notifications with smooth animations
- **class-variance-authority** and **clsx** for conditional styling patterns
- **tailwind-merge** for intelligent class merging and optimization

### AI Integration & APIs
- **Google Gemini AI** with multi-model support (Gemini 2.0 Flash, 1.5 Pro, 1.5 Flash)
- **Direct client-side API integration** with intelligent fallback to Next.js API routes
- **Advanced rate limiting** and model fallback support for production reliability
- **Natural language processing** for conversational food corrections

### Data Management & Storage
- **Browser LocalStorage** for primary data persistence with SSR compatibility
- **IndexedDB** fallback support for large datasets and enhanced performance
- **No external database dependencies** - fully client-side storage architecture
- **Comprehensive data validation** and integrity checking throughout the application

### Testing & Quality Assurance
- **Jest 30.0.4** with jsdom environment for comprehensive unit testing
- **React Testing Library 16.3.0** for component testing with user-centric approach
- **@testing-library/user-event 14.6.1** for realistic user interaction testing
- **Comprehensive test coverage** including unit, integration, and component tests

### Development Tools & Configuration
- **ESLint 9** with Next.js configuration for code quality and consistency
- **TypeScript 5** with strict mode for enhanced type safety and developer experience
- **PostCSS** for advanced CSS processing and optimization
- **Turbopack** for fast development server and hot module replacement

### Deployment & Production
- **Vercel platform** deployment with free tier optimization
- **Static site generation** where possible for optimal performance
- **Environment variable management** for secure API key handling
- **Progressive Web App (PWA)** capabilities with offline support

### Architecture Patterns & Best Practices
- **Client-side focused architecture** to minimize server costs and maximize performance
- **Singleton services** for storage and AI integration with consistent state management
- **Comprehensive error boundaries** and user-friendly error handling throughout the application
- **Mobile-first responsive design** with progressive enhancement for desktop users
- **Server-side rendering (SSR) compatibility** with proper hydration boundaries

### Storage Service Architecture

The `StorageService` class is the backbone of the application's data management system, providing a comprehensive solution for local data persistence with advanced features:

#### Core Features

```typescript
export class StorageService {
  // Singleton pattern with SSR safety and clean initialization
  static getInstance(): StorageService
  
  // User Settings Management
  getUserSettings(): UserSettings
  updateUserSettings(settings: Partial<UserSettings>): void
  
  // Food Entry Management
  saveFoodEntry(entry: Omit<FoodEntry, 'id'>): FoodEntry
  getDailyEntries(date: string): FoodEntry[]
  getTodaysEntries(): FoodEntry[]
  deleteEntry(entryId: string): boolean
  
  // User Profile Management (Complete CRUD)
  getUserProfile(): UserProfile | null
  saveUserProfile(profile: UserProfile): void
  updateUserProfile(updates: Partial<UserProfile>): void
  hasCompletedOnboarding(): boolean
  markOnboardingComplete(profile: UserProfile): void
  resetUserProfile(): void
  
  // Health Calculations (Built-in Scientific Formulas)
  calculateBMR(profile: UserProfile): number | null
  calculateDailyCalories(profile: UserProfile): number | null
  
  // Data Management & Analytics
  getWeeklyData(): DailyData[]
  exportData(): string
  importData(jsonData: string): void
  clearAllData(): void
  
  // Storage Optimization
  cleanupOldEntries(): void
  getStorageInfo(): { used: number; available: number; percentage: number }
  
  // Data Validation
  validateProfileData(profile: Partial<UserProfile>): { isValid: boolean; errors: string[] }
}
```

#### Key Improvements in Latest Version

- **Clean Production Initialization**: Removed debug logging for optimal production performance
- **Enhanced SSR Compatibility**: Universal server-side rendering support with proper window detection
- **Comprehensive Profile Management**: Complete user profile lifecycle with versioned schema
- **Scientific Health Calculations**: Built-in BMR/TDEE calculations using Harris-Benedict equation
- **Intelligent Data Validation**: Multi-layer validation with detailed error reporting
- **Automatic Data Cleanup**: Smart retention policies with configurable cleanup periods
- **Storage Quota Management**: Real-time usage monitoring and optimization recommendations

## 🧪 Development & Testing

### Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Create production build
npm start           # Start production server
npm run lint        # Run ESLint code quality checks

# Testing
npm test            # Run all tests once
npm run test:watch  # Run tests in watch mode for development
npm run test:coverage # Generate comprehensive coverage report
npm run test:ci     # Run tests in CI mode with coverage
```

### Test Coverage

The application includes comprehensive test coverage across multiple layers:

#### Component Tests (`__tests__/components/`)
- **Camera Components**: Camera capture and working camera functionality
- **Food Database**: Food selection and entry components
- **Goal Settings**: Settings interface and profile management
- **Results Display**: Food analysis results and correction interfaces
- **Onboarding Flow**: Complete 5-step onboarding process testing

#### Integration Tests (`__tests__/integration/`)
- **App Integration**: End-to-end application flow testing
- **Onboarding Integration**: Complete onboarding workflow validation

#### Service Tests (`__tests__/lib/`)
- **Storage Service**: Comprehensive data persistence and profile management
- **Gemini AI Service**: API integration and multi-model fallback testing
- **Food Database**: Built-in food database functionality
- **Calorie Calculations**: Health calculation accuracy and validation
- **Utility Functions**: Helper functions and validation logic
- **Custom Hooks**: Error handling and network status detection

#### Test Configuration

The project uses Jest with the following configuration:
- **jsdom environment** for browser API simulation
- **React Testing Library** for component testing best practices
- **Comprehensive mocking** for external APIs and browser APIs
- **Coverage reporting** with detailed metrics and thresholds

### Toast Notification System Usage

The application uses **Sonner** for modern, accessible toast notifications with comprehensive user feedback:

```typescript
import { useToast } from '@/lib/hooks/useToast';
import { ToastContainer } from '@/components/ui/toast';

function MyComponent() {
  const { success, error, info, loading, dismiss, promise } = useToast();

  const handleSuccess = () => {
    success('Operation completed!', 'Your data has been saved successfully.');
  };

  const handleError = () => {
    error('Something went wrong', 'Please try again later.');
  };

  const handleLoading = () => {
    const toastId = loading('Processing...', 'Please wait while we analyze your food.');
    // Later: dismiss(toastId);
  };

  const handlePromise = () => {
    const myPromise = fetchData();
    promise(myPromise, {
      loading: 'Loading...',
      success: 'Data loaded successfully!',
      error: 'Failed to load data',
    });
  };

  return (
    <div>
      {/* Your component content */}
      <ToastContainer />
    </div>
  );
}
```

**Toast Types:**
- `success()` - Green toast with checkmark icon, auto-dismisses in 5s
- `error()` - Red toast with error icon, auto-dismisses in 5s
- `info()` - Blue toast with info icon, auto-dismisses in 5s
- `loading()` - Blue toast with animated spinner, persists until manually dismissed
- `promise()` - Automatically handles promise states with loading/success/error transitions
- `dismiss()` - Manually dismiss specific toasts or all toasts

**Features:**
- **Rich Colors**: Beautiful default Sonner styling with rich color themes
- **Smooth Animations**: Built-in slide animations and transitions
- **Mobile Responsive**: Optimized positioning and sizing for all devices
- **Accessibility**: Full keyboard navigation and screen reader support
- **Promise Integration**: Elegant loading states for async operations

### Development Workflow

1. **Setup Development Environment**
   ```bash
   git clone <repository-url>
   cd caloriemeter
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.local.example .env.local
   # Add your Gemini API key (optional - default test key provided)
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   # Application available at http://localhost:3000
   ```

4. **Run Tests During Development**
   ```bash
   npm run test:watch
   # Tests run automatically on file changes
   ```

5. **Code Quality Checks**
   ```bash
   npm run lint
   # Fix any ESLint issues before committing
   ```

### Project Structure Guidelines

- **Components**: PascalCase naming (e.g., `CameraCapture.tsx`)
- **Services**: camelCase with descriptive names (e.g., `geminiService.ts`)
- **Types**: Centralized in `/types/index.ts` with PascalCase interfaces
- **Tests**: Mirror source structure with `.test.ts` or `.test.tsx` suffix
- **Imports**: Use absolute imports with `@/` alias for clean import paths

### Contributing Guidelines

1. **Code Style**: Follow existing patterns and ESLint configuration
2. **Testing**: Add tests for new features and maintain coverage
3. **Type Safety**: Ensure all TypeScript interfaces are properly defined
4. **Mobile-First**: Design components with mobile users as the primary target
5. **Accessibility**: Include proper ARIA labels and keyboard navigation support

## ⚙️ Configuration & API Setup

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Gemini AI API Key (Optional - default test key provided)
GEMINI_API_KEY=your_gemini_api_key_here

# Application URL (for PWA and metadata)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Gemini AI API Setup

The application works out of the box with a provided test API key, but for unlimited usage:

1. **Get Your API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key for Gemini AI
   - Copy the generated key

2. **Configure the Application**
   - Add your API key to `.env.local` as `GEMINI_API_KEY`
   - Or enter it in the app settings for user-specific configuration

3. **API Features**
   - **Multi-Model Support**: Automatic fallback between Gemini 2.0 Flash, 1.5 Pro, and 1.5 Flash
   - **Rate Limiting**: Intelligent request management with exponential backoff
   - **Error Handling**: Comprehensive error recovery with user-friendly messages
   - **Caching**: Smart response caching to minimize API calls

### Application Configuration

The app includes several configuration options in `lib/config.ts`:

```typescript
// Default application settings
export const APP_CONFIG = {
  DEFAULT_CALORIE_GOAL: 2000,        // Default daily calorie target
  DATA_RETENTION_DAYS: 30,           // How long to keep food entries
  MAX_DAILY_ENTRIES: 50,             // Maximum entries per day
  IMAGE_QUALITY: 0.8,                // Image compression quality
  MAX_IMAGE_SIZE: 1024 * 1024,       // 1MB image size limit
  DEFAULT_TEST_API_KEY: 'provided',   // Built-in test key
}

// Gemini AI model configuration
export const GEMINI_MODELS = {
  'gemini-2.0-flash': {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    maxRequestsPerMinute: 15,
    maxRequestsPerDay: 1500,
    priority: 1, // Highest priority
  },
  // Additional models with fallback support
}
```

### PWA Configuration

The application is configured as a Progressive Web App with:

- **Offline Support**: Service worker with intelligent caching
- **Installable**: Can be installed on mobile devices and desktop
- **App-like Experience**: Standalone display mode
- **Optimized Icons**: Multiple icon sizes for different devices

### Storage Configuration

Local storage is configured with:

- **Automatic Cleanup**: Configurable data retention (1-365 days)
- **Quota Management**: Real-time storage usage monitoring
- **Data Validation**: Comprehensive validation for all stored data
- **Backup/Restore**: JSON export/import functionality

## 🔧 Troubleshooting

### Common Issues

#### Camera Not Working
- **Check Permissions**: Ensure camera permissions are granted in browser
- **HTTPS Required**: Camera API requires HTTPS in production
- **Fallback Option**: Use file upload if camera is unavailable

#### API Errors
- **Rate Limiting**: Wait a moment if you see rate limit errors
- **API Key Issues**: Verify your Gemini API key is correct
- **Network Problems**: Check internet connection and try again

#### Storage Issues
- **Quota Exceeded**: Clear old data or increase retention period
- **Data Corruption**: Use data export/import to recover
- **SSR Errors**: Ensure proper server-side rendering compatibility

#### Performance Issues
- **Large Images**: Images are automatically compressed to 1MB
- **Storage Full**: Regular cleanup removes old entries automatically
- **Slow Analysis**: Try different Gemini models for faster responses

### Debug Mode

Enable debug logging by opening browser developer tools:

```javascript
// In browser console
localStorage.setItem('debug', 'true')
// Reload the page to see detailed logging
```

### Getting Help

1. **Check Browser Console**: Look for error messages and warnings
2. **Test with Default Key**: Verify the app works with the built-in test API key
3. **Clear Storage**: Reset all data if experiencing persistent issues
4. **Update Browser**: Ensure you're using a modern browser with camera support

## 📊 Feature Summary

### Core Functionality
- ✅ **AI-Powered Food Analysis** - Instant calorie estimation from photos
- ✅ **Multi-Model AI Support** - Gemini 2.0 Flash, 1.5 Pro, 1.5 Flash with intelligent fallback
- ✅ **Natural Language Corrections** - Conversational AI-powered food corrections
- ✅ **Comprehensive Food Database** - 30+ common foods across 8 categories
- ✅ **Daily Calorie Tracking** - Real-time progress monitoring with visual indicators
- ✅ **Weekly History & Analytics** - 7-day trends with goal achievement tracking
- ✅ **Smart Camera Interface** - Mobile-optimized photo capture with file upload fallback

### User Experience
- ✅ **5-Step Onboarding Flow** - Comprehensive profile setup with health calculations
- ✅ **Profile Management** - Complete user profile editing with metric/imperial units
- ✅ **Health Integration** - BMI calculator, BMR/TDEE calculations, health recommendations
- ✅ **Goal Setting & Tracking** - Customizable daily calorie goals with performance analytics
- ✅ **Data Management** - Complete backup/restore with JSON export/import
- ✅ **Progressive Web App** - Installable with offline support and app-like experience

### Technical Features
- ✅ **Server-Side Rendering** - Full SSR compatibility with Next.js 15.4.1
- ✅ **TypeScript Integration** - Comprehensive type safety with strict mode
- ✅ **Comprehensive Testing** - Unit, integration, and component tests with Jest
- ✅ **Error Handling** - Robust error boundaries with user-friendly recovery
- ✅ **Local Storage** - Privacy-first data persistence with intelligent cleanup
- ✅ **Mobile-First Design** - Responsive interface optimized for mobile devices

### Privacy & Security
- ✅ **Local-Only Data Storage** - No external database, complete data privacy
- ✅ **Optional API Key** - Works with default test key or personal Gemini API key
- ✅ **Data Control** - User-controlled data retention and deletion
- ✅ **No Tracking** - No analytics or user tracking, privacy-focused design

## 🤝 Contributing

We welcome contributions to CalorieMeter! Here's how you can help:

### Ways to Contribute
- 🐛 **Bug Reports**: Report issues with detailed reproduction steps
- 💡 **Feature Requests**: Suggest new features or improvements
- 🔧 **Code Contributions**: Submit pull requests with bug fixes or new features
- 📖 **Documentation**: Improve documentation and help others understand the project
- 🧪 **Testing**: Add tests or improve existing test coverage

### Development Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper tests
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for providing advanced food recognition capabilities
- **Next.js Team** for the excellent React framework and development experience
- **Tailwind CSS** for the utility-first CSS framework
- **React Testing Library** for testing best practices and user-centric testing
- **Vercel** for seamless deployment and hosting platform
- **Open Source Community** for the amazing tools and libraries that make this project possible

---

**CalorieMeter** - Revolutionizing calorie tracking through AI-powered food analysis 🍽️✨

Made with ❤️ using Next.js, React, TypeScript, and Google Gemini AInt
  getUserSettings(): UserSettings
  updateUserSettings(settings: Partial<UserSettings>): void
  
  // Food Entry Management
  saveFoodEntry(entry: Omit<FoodEntry, 'id'>): FoodEntry
  getDailyEntries(date: string): FoodEntry[]
  getTodaysEntries(): FoodEntry[]
  getWeeklyData(): DailyData[]
  
  // User Profile Management
  getUserProfile(): UserProfile | null
  saveUserProfile(profile: UserProfile): void
  updateUserProfile(updates: Partial<UserProfile>): void
  hasCompletedOnboarding(): boolean
  markOnboardingComplete(profile: UserProfile): void
  
  // Health Calculations
  calculateBMR(profile: UserProfile): number | null
  calculateDailyCalories(profile: UserProfile): number | null
  
  // Data Management
  exportData(): string
  importData(jsonData: string): void
  clearAllData(): void
  cleanupOldEntries(): void
  
  // Storage Monitoring
  getStorageInfo(): { used: number; available: number; percentage: number }
}
```

#### Advanced Capabilities

- **SSR Compatibility**: All methods include `typeof window === 'undefined'` checks for seamless server-side rendering
- **Data Validation**: Comprehensive validation using the `validation` utility with detailed error reporting
- **Health Calculations**: Built-in BMR and TDEE calculations using the Harris-Benedict equation with activity multipliers
- **Automatic Cleanup**: Configurable data retention with automatic cleanup of old entries
- **Profile Versioning**: Versioned profile schema (v1.0) with metadata tracking for future compatibility
- **Error Handling**: Comprehensive error handling with typed `StorageError` objects and user-friendly messages
- **Storage Optimization**: Real-time storage usage monitoring with quota management and optimization recommendations

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun package manager
- Modern web browser with camera support (for photo capture functionality)

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

4. **Production-Grade Natural Language Correction API** (already included):

The application includes an enterprise-ready API route at `app/api/gemini-correction/route.ts` with advanced reliability features:

**Key Features:**
- **Multi-Model Fallback**: Automatic fallback from Gemini 1.5 Flash to 1.5 Pro for optimal reliability
- **Intelligent Retry Logic**: Exponential backoff with configurable delays (1s, 2s, 4s) for handling rate limits
- **Comprehensive Error Handling**: Specific handling for rate limits (429), authentication (401/403), and service unavailability (503)
- **Built-in Rate Limiting**: 5 requests per minute with intelligent client identification
- **Production Reliability**: Enhanced error boundaries, timeout handling, and comprehensive logging

**API Architecture:**
```typescript
// Multi-model fallback with retry logic
const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro'];
const retryDelays = [1000, 2000, 4000]; // Exponential backoff

// Intelligent error handling
if (response.status === 429) {
  // Rate limited - wait and retry
  if (attempt < retryDelays.length) {
    await delay(retryDelays[attempt]);
    continue;
  }
}

// Comprehensive response validation
if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
  return NextResponse.json({
    response: data.candidates[0].content.parts[0].text,
    modelUsed: modelName
  });
}
    });

  } catch (error) {
    console.error('Gemini correction API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

5. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### SSR Compatibility

The application is fully compatible with Next.js Server-Side Rendering (SSR) and static generation:

- **Universal Services**: All storage and learning services include SSR protection with `typeof window === 'undefined'` checks
- **Enhanced Debugging**: Comprehensive debug logging in storage service for troubleshooting SSR initialization and localStorage access patterns
- **Hydration Safety**: Prevents client-server mismatch errors during Next.js hydration
- **Production Ready**: Optimized for Vercel deployment with proper SSR/client boundary handling
- **Build Performance**: Enhanced build times with reduced SSR complexity
- **Development Experience**: Improved debugging capabilities for SSR-related issues during development

```bash
# Build for production with SSR support
npm run build

# Start production server
npm start
```

## 🗣️ Production-Grade Natural Language Correction System

The Natural Language Correction system represents a breakthrough in food analysis accuracy with enterprise-level reliability, allowing users to correct AI analysis results using conversational language with advanced error handling and retry mechanisms.

### Enhanced Features

- **Conversational Interface**: Users can describe corrections in natural language like:
  - "That's actually a large pizza slice, not small"
  - "It's grilled chicken, not fried"
  - "That's a veggie burger, not beef"
  - "Add extra cheese and bacon"

- **Production-Ready Reliability**: Advanced system architecture with:
  - **Multi-Retry Logic**: Intelligent retry system with exponential backoff (1s, 2s, 4s delays)
  - **Comprehensive Error Handling**: Specific handling for rate limits (429), authentication (401/403), and service unavailability (503)
  - **Real-time Progress Feedback**: Visual retry indicators with attempt counters ("Retrying... (2/3)")
  - **Robust Response Processing**: Dual-layer JSON parsing with primary and fallback parsing strategies
  - **Enhanced User Guidance**: Improved correction examples with proper quote escaping and rate limit tips

- **Intelligent Processing**: The system uses advanced AI to:
  - Parse natural language corrections with context awareness
  - Handle various response formats with fallback parsing
  - Recalculate calories, macronutrients, and nutritional information
  - Update cooking methods, ingredients, and portion sizes
  - Provide detailed error recovery and user guidance

- **Real-time Updates**: Corrections are applied instantly with:
  - Automatic calorie recalculation with error recovery
  - Updated macronutrient breakdowns with validation
  - Revised total meal calories with consistency checks
  - Learning system integration for future improvements

### Advanced Technical Implementation

The enhanced correction system features:
- **Multi-Model API Architecture**: Dedicated `/api/gemini-correction` route with intelligent fallback (Gemini 1.5 Flash → 1.5 Pro)
- **Enhanced NaturalLanguageCorrection Component**: Production-ready modal interface with advanced error handling and retry logic
- **Robust Error Classification**: Smart error categorization with specific recovery strategies for different failure types
- **Rate Limit Intelligence**: Built-in awareness of API limitations with automatic retry suggestions and user-friendly messaging
- **Comprehensive Logging**: Detailed error logging and debugging information for production troubleshooting
- **TypeScript Safety**: Enhanced type definitions with comprehensive error handling interfaces

### Enhanced Component Architecture

```typescript
// Production-Ready Natural Language Correction Component
interface NaturalLanguageCorrectionProps {
  analysisResult: FoodAnalysisResult;
  foodIndex: number;
  onCorrectionApplied: (correctedFood: FoodItem, newTotalCalories: number) => void;
  onCancel: () => void;
}

// Component State Management with Advanced Error Handling
const [correctionText, setCorrectionText] = useState("");
const [isProcessing, setIsProcessing] = useState(false);
const [error, setError] = useState<string | null>(null);
const [retryAttempt, setRetryAttempt] = useState(0); // New: Retry tracking

// Advanced Retry Logic with Exponential Backoff
const maxRetries = 2;
const retryDelays = [1000, 2000, 4000]; // 1s, 2s, 4s delays

for (let attempt = 0; attempt <= maxRetries; attempt++) {
  try {
    setRetryAttempt(attempt + 1);
    
    if (attempt > 0) {
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
    
    // API call with comprehensive error handling
    const response = await fetch("/api/gemini-correction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: correctionPrompt }),
    });

    // Enhanced error classification
    if (response.status === 429) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    } else if (response.status === 503) {
      throw new Error('AI service is temporarily unavailable. Please try again in a few minutes.');
    } else if (response.status === 401 || response.status === 403) {
      throw new Error('API key authentication failed. Please check your settings.');
    }
    
    // Success - exit retry loop
    return;
  } catch (error) {
    // Intelligent retry decision based on error type
    if (error.message.includes('Too many requests') && attempt < maxRetries) {
      continue; // Retry for rate limits
    }
    break; // Exit for other errors
  }
}

// Enhanced Results Display with Correction Support
interface ResultsProps {
  analysisResult: FoodAnalysisResult;
  onAddToDaily: () => void;
  onRetakePhoto: () => void;
  onAnalysisUpdate?: (updatedResult: FoodAnalysisResult) => void; // Enhanced callback
}
```

### Production Reliability Features

- **Dual-Layer JSON Parsing**: Primary parsing with fallback strategy for various AI response formats
- **Enhanced User Feedback**: Real-time retry progress with attempt counters and detailed status messages
- **Intelligent Error Recovery**: Context-aware error messages with specific recovery guidance
- **Rate Limit Awareness**: Built-in understanding of API limitations with automatic retry suggestions
- **Comprehensive Logging**: Detailed error logging with response debugging for production troubleshooting

### Enhanced Usage Experience

1. After receiving AI analysis results, click "Natural Correction" on any food item
2. Type your correction in plain English in the modal dialog with improved examples and guidance
3. The system processes your correction with intelligent retry logic and real-time progress feedback
4. If rate limited or encountering errors, the system automatically retries with exponential backoff
5. Visual progress indicators show retry attempts ("Retrying... (2/3)") with helpful tips
6. Updated results are applied automatically with comprehensive error recovery
7. Enhanced user guidance provides specific tips for rate limit scenarios and correction formatting

### Recent Enhancements (Latest Update)

- **Advanced Retry Architecture**: Implemented intelligent multi-attempt system with exponential backoff delays
- **Comprehensive Error Classification**: Added specific handling for rate limits, authentication failures, and service unavailability
- **Real-time Progress Indicators**: Visual feedback showing retry attempts and processing status
- **Robust Response Processing**: Dual-layer JSON parsing with primary and fallback parsing strategies
- **Enhanced User Experience**: Improved correction examples with proper quote escaping and helpful tips
- **Production Reliability**: Enhanced error boundaries, timeout handling, and comprehensive logging
- **Rate Limit Intelligence**: Built-in awareness of API limitations with user-friendly messaging

## 🔧 Recent Bug Fixes & Code Quality Improvements

### Server-Side Rendering (SSR) Enhancements

- **Universal Service Compatibility**: Comprehensive SSR protection across all service layers
  - **Learning Service**: Added `typeof window === 'undefined'` checks in `loadCorrections()` and `saveCorrections()` methods
  - **Storage Service**: Enhanced SSR compatibility in `getUserSettings()`, `updateUserSettings()`, `getAllEntries()`, `cleanupOldEntries()`, and `clearAllData()` methods
  - **Network Status Hook**: SSR-safe network detection with proper client-side initialization
  - **Hydration Error Prevention**: Eliminated client-server mismatch errors during Next.js hydration
  - **Production Stability**: Improved deployment reliability with proper SSR/client boundary handling

### Component Stability Enhancements

- **ResultsDisplay Component**: Fixed variable reference consistency in food analysis rendering
  - Corrected `currentAnalysisResult` to `analysisResult` for proper data binding
  - Ensures consistent display of detailed food analysis information
  - Improved component reliability and data flow integrity

### Code Quality & Maintenance

- **TypeScript Strict Mode**: Enhanced type safety across all components
- **Error Boundary Integration**: Comprehensive error handling for component failures
- **Performance Optimizations**: Reduced re-renders and improved component efficiency
- **Accessibility Improvements**: Enhanced screen reader support and keyboard navigation
- **Mobile Responsiveness**: Continued refinements for optimal mobile experience
- **Build Performance**: Faster Next.js builds with reduced SSR complexity and improved caching
- **Enhanced Error Logging**: Comprehensive error logging system across all services:
  - **Structured Error Messages**: Consistent error formatting with context and error type classification
  - **Service-Level Logging**: Detailed logging in storage, learning, and AI services for debugging
  - **User-Friendly Error Recovery**: Graceful error handling with clear user messaging and recovery options
  - **Development Debugging**: Enhanced console logging for development troubleshooting

## 🧪 Testing & Quality Assurance

### Comprehensive Test Suite

- **Unit Tests**: Complete coverage of utility functions, services, and components
  - **Date Utilities**: Full coverage of date formatting, validation, and range calculations
  - **Storage Service**: Comprehensive testing of data persistence, profile management, and SSR compatibility
  - **Validation System**: Complete validation testing for food entries, user profiles, and health metrics
  - **Error Handling**: Thorough testing of error utilities and user-friendly message generation
  - **Food Database**: Complete testing of food search, categorization, and calorie calculations
  - **Health Calculations**: Scientific formula validation for BMR, TDEE, and BMI calculations

- **Integration Tests**: End-to-end testing of critical user flows
  - **Onboarding Flow**: Complete user onboarding process testing with profile creation
  - **Food Analysis**: AI integration testing with mock responses and error scenarios
  - **Data Management**: Storage and retrieval testing across different user scenarios

- **Component Tests**: React component testing with user interaction simulation
  - **Camera Components**: Camera capture and photo processing testing
  - **Results Display**: Food analysis result rendering and correction system testing
  - **Settings Management**: Profile editing and goal setting component testing

### Quality Metrics

- **TypeScript Strict Mode**: 100% type safety across all components and services
- **ESLint Configuration**: Comprehensive code quality rules with Next.js best practices
- **Test Coverage**: Extensive test coverage across critical application paths
- **Error Boundary Protection**: Comprehensive error handling at component and application levels
- **SSR Compatibility**: Full server-side rendering support with proper hydration handling

### Development Commands

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# CI mode for production
npm run test:ci

# Lint code quality
npm run lint
```

## 🛠️ Technology Stack

### Core Framework

- **Next.js 15.4.1** with App Router and Turbopack for fast development
- **React 19.1.0** with TypeScript 5 for type safety
- **Tailwind CSS 4.0** with PostCSS for modern styling

### AI & APIs

- **Google Gemini AI** (Gemini 2.0 Flash, 1.5 Pro, 1.5 Flash models)
- **Direct client-side integration** with intelligent fallback strategies for food analysis
- **Dedicated API Route** (`/api/gemini-correction`) using Gemini 1.5 Pro for natural language correction processing
- **Advanced rate limiting** and comprehensive error handling across all AI interactions
- **Multi-model support** with automatic failover for optimal performance and reliability
- **Natural Language Processing** for conversational food analysis corrections with real-time recalculation

### UI & Components

- **Lucide React 0.525.0** for comprehensive icon library (User, RotateCcw, MessageSquare, Loader2, Check, X icons)
- **Custom UI components** following shadcn/ui patterns with consistent amber color scheme
- **class-variance-authority 0.7.1** and **clsx 2.1.1** for conditional styling
- **tailwind-merge 3.3.1** for intelligent class merging
- **Mobile-first responsive design** with touch-optimized interfaces
- **Advanced Modal System** for complex interactions including natural language corrections with keyboard support
- **Enhanced Component Props** with updated interfaces supporting real-time analysis updates
- **Toast Notification System** with multiple types (success, error, info, loading), smooth animations, and accessibility features
- **Progressive Web App** capabilities with service worker

### PWA & Offline

- **Service Worker** for intelligent caching and offline support
- **Background Sync** for queued operations when offline
- **Cache Strategies** - Network-first for APIs, cache-first for static assets
- **Offline Fallback** with graceful degradation
- **PWA Manifest** with app installation support

### Data & Storage

- **Browser LocalStorage** for primary data persistence with intelligent quota management
- **No external database** - fully client-side architecture ensuring complete data privacy
- **Advanced User Profile System**: Comprehensive profile management with scientific health calculations:
  - **Versioned Schema**: Profile data versioning (v1.0) for future compatibility and migration support
  - **Data Integrity Validation**: Real-time validation with comprehensive error reporting and recovery
  - **Onboarding State Management**: Smart detection of new vs. returning users for seamless experience
  - **In-App Profile Editing**: Complete profile modification system integrated into settings interface
  - **Profile Reset and Recovery**: Full profile reset functionality with onboarding restart capability
- **Scientific Health Calculation Engine**: Complete implementation of validated health formulas:
  - **Harris-Benedict BMR**: Gender-specific Basal Metabolic Rate calculations with precision accuracy
  - **TDEE Calculations**: Total Daily Energy Expenditure with five activity level multipliers (1.2x to 1.9x)
  - **Goal-Based Calorie Adjustments**: Automatic daily calorie modifications for specific fitness objectives
  - **BMI Analysis**: Complete Body Mass Index calculation with health categorization and color-coded indicators
- **Comprehensive Unit Conversion System**: Full metric/imperial support with precision handling:
  - **Height Conversion**: Seamless cm ↔ ft/in conversion with proper decimal and fraction handling
  - **Weight Conversion**: Accurate kg ↔ lbs conversion maintaining calculation precision
  - **Unit Preference Detection**: Automatic unit system detection based on user input patterns
- **Advanced Health Metrics Validation**: Robust validation system with detailed error messaging:
  - **Age Validation**: 13-120 years range with developmental and health considerations
  - **Height Validation**: 100-250cm (3.3-8.2ft) range with unit-specific boundary checking
  - **Weight Validation**: 30-300kg (66-660lbs) range with health-conscious limits
  - **Activity Level Validation**: Five-tier system with detailed descriptions and real-world examples
- **Intelligent Default Value System**: Smart fallback system for incomplete profiles:
  - **Gender-Based Defaults**: Male (2500 cal), Female (2000 cal) default recommendations
  - **Profile Completeness Assessment**: Real-time evaluation of data completeness for accurate calculations
  - **Missing Data Detection**: Comprehensive reporting of required fields for full functionality
- **Data compression** and automatic cleanup utilities with storage optimization
- **Export/Import** functionality for complete data backup and transfer including profile data
- **Profile Data Persistence**: Complete profile storage with metadata tracking and update timestamps

### Testing & Quality

- **Jest 30.0.4** with jsdom environment and proper `moduleNameMapper` configuration for path aliases
- **React Testing Library 16.3.0** for component testing with comprehensive mocking
- **@testing-library/user-event 14.6.1** for interaction testing
- **@testing-library/jest-dom 6.6.3** for enhanced DOM assertions
- **TypeScript 5** with strict mode configuration
- **ESLint 9** with Next.js 15.4.1 configuration
- **Comprehensive test coverage** including:
  - Unit tests for utility functions and services
  - Component tests for UI interactions and rendering
  - Integration tests for complete user flows
  - API route tests for natural language correction system
  - Onboarding flow integration tests
  - Error handling and edge case scenarios

## 📊 Data Models & Types

The application uses comprehensive TypeScript interfaces for type safety and data consistency, including advanced health calculation utilities:

### Core Data Types

```typescript
// Enhanced Food Analysis with Macronutrients
interface MacroNutrients {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface FoodItem {
  name: string;
  calories: number;
  quantity: string;
  confidence: number;
  ingredients?: string[];
  cookingMethod?: 'grilled' | 'fried' | 'baked' | 'steamed' | 'raw' | 'boiled' | 'roasted';
  macros?: MacroNutrients;
  category?: 'protein' | 'vegetable' | 'grain' | 'fruit' | 'dairy' | 'snack' | 'beverage';
  healthScore?: number;
}

interface FoodAnalysisResult {
  foods: FoodItem[];
  totalCalories: number;
  confidence: number;
  timestamp: string;
  imageUrl?: string;
  modelUsed?: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  restaurantName?: string;
  totalMacros?: MacroNutrients;
}

// Enhanced Component Props with Analysis Updates
interface ResultsProps {
  analysisResult: FoodAnalysisResult;
  onAddToDaily: () => void;
  onRetakePhoto: () => void;
  onAnalysisUpdate?: (updatedResult: FoodAnalysisResult) => void; // For natural language corrections
}

// User Profile for personalization and onboarding
interface UserProfile {
  hasCompletedOnboarding: boolean;
  personalInfo: {
    age?: number;
    gender?: 'male' | 'female';
    height?: { value: number; unit: 'cm' | 'ft_in' };
    weight?: { value: number; unit: 'kg' | 'lbs' };
  };
  activity: {
    level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    exerciseFrequency?: number; // days per week
  };
  goals: {
    primary?: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_building';
    targetCalories?: number;
    healthObjectives?: string[];
  };
  preferences: {
    units?: 'metric' | 'imperial';
    notifications?: boolean;
  };
  metadata: {
    createdAt: string;
    lastUpdated: string;
    onboardingVersion: string;
  };
}

interface StoredProfile {
  version: '1.0';
  profile: UserProfile;
  checksum?: string; // For data integrity
}imary?: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_building';
    targetCalories?: number;
    healthObjectives?: string[];
  };
  preferences: {
    units?: 'metric' | 'imperial';
    notifications?: boolean;
  };
  metadata: {
    createdAt: string;
    lastUpdated: string;
    onboardingVersion: string;
  };
}

// AI Analysis Results
interface FoodAnalysisResult {
  foods: FoodItem[];
  totalCalories: number;
  confidence: number;
  timestamp: string;
  imageUrl?: string;
  modelUsed?: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  restaurantName?: string;
  totalMacros?: MacroNutrients;
}

// Individual Food Items
interface FoodItem {
  name: string;
  calories: number;
  quantity: string;
  confidence: number;
  ingredients?: string[];
  cookingMethod?: 'grilled' | 'fried' | 'baked' | 'steamed' | 'raw' | 'boiled' | 'roasted';
  macros?: MacroNutrients;
  category?: 'protein' | 'vegetable' | 'grain' | 'fruit' | 'dairy' | 'snack' | 'beverage';
  healthScore?: number; // 1-10 scale
}

// Enhanced Component Props with Analysis Update Support
interface ResultsProps {
  analysisResult: FoodAnalysisResult;
  onAddToDaily: () => void;
  onRetakePhoto: () => void;
  onAnalysisUpdate?: (updatedResult: FoodAnalysisResult) => void; // New: For real-time corrections
}

// Daily Food Entries
interface FoodEntry {
  id: string;
  timestamp: string;
  foods: FoodItem[];
  totalCalories: number;
  imageData?: string;
  date: string; // YYYY-MM-DD format
}

// Application Settings
interface UserSettings {
  dailyCalorieGoal: number;
  apiKey?: string;
  notifications: boolean;
  dataRetentionDays: number;
}

// Health Calculation Constants and Utilities
interface CalorieCalculations {
  // Activity level multipliers for TDEE calculations
  ACTIVITY_MULTIPLIERS: {
    sedentary: 1.2;      // Little or no exercise
    light: 1.375;        // Light exercise 1-3 days/week
    moderate: 1.55;      // Moderate exercise 3-5 days/week
    active: 1.725;       // Hard exercise 6-7 days/week
    very_active: 1.9;    // Very hard exercise & physical job
  };
  
  // Goal-based calorie adjustments
  GOAL_ADJUSTMENTS: {
    weight_loss: -500;      // 500 calorie deficit for ~1 lb/week loss
    weight_gain: 500;       // 500 calorie surplus for ~1 lb/week gain
    maintenance: 0;         // No adjustment
    muscle_building: 300;   // Moderate surplus for muscle building
  };
}

// Comprehensive Health Metrics
interface HealthMetrics {
  bmr: number | null;           // Basal Metabolic Rate
  tdee: number | null;          // Total Daily Energy Expenditure
  calorieGoal: number | null;   // Personalized daily calorie goal
  bmi: number | null;           // Body Mass Index
  bmiCategory: string | null;   // BMI health category
  bmiCategoryWithColor: {       // BMI category with UI color
    category: string;
    color: string;
  } | null;
}
```

## 📁 Project Structure

```text
├── app/                    # Next.js App Router
│   ├── api/               # API routes for server-side processing
│   │   └── gemini-correction/ # Natural language correction API endpoint
│   │       └── route.ts   # POST endpoint for processing user corrections
│   ├── globals.css        # Global styles with Tailwind CSS and custom properties
│   ├── layout.tsx         # Root layout with PWA configuration and metadata
│   └── page.tsx           # Main SPA application with view routing
├── components/            # React components
│   ├── ui/               # Reusable UI components with dark mode support
│   │   ├── button.tsx   # Button component with variant system, gradients, and consistent amber color scheme
│   │   ├── input.tsx    # Input component with amber focus states and enhanced contrast
│   │   ├── card.tsx     # Card components for consistent layout
│   │   └── badge.tsx    # Badge component for status indicators
│   ├── onboarding/      # Complete user onboarding flow components
│   │   ├── OnboardingFlow.tsx # Main onboarding orchestrator with step management and navigation
│   │   ├── WelcomeStep.tsx # Welcome screen with app introduction, benefits, and privacy messaging
│   │   ├── BasicInfoStep.tsx # Personal information collection with unit conversion and validation
│   │   ├── ActivityStep.tsx # Activity level selection with scientific descriptions and examples
│   │   ├── GoalsStep.tsx # Fitness goal setting with real-time calorie calculations
│   │   └── CompletionStep.tsx # Profile summary with calculated health metrics and next steps
│   ├── WorkingCamera.tsx # Optimized camera interface with mobile-first design
│   ├── ResultsDisplay.tsx # AI analysis results with detailed nutritional info and correction integration
│   ├── NaturalLanguageCorrection.tsx # Revolutionary natural language correction system for AI analysis results
│   ├── DailyTracker.tsx  # Daily progress tracking with entry management
│   ├── HistoryView.tsx   # Weekly history with chart and list views
│   ├── HealthIntegration.tsx # BMI calculator and health metrics with profile integration
│   ├── GoalSettings.tsx  # Comprehensive settings and profile management with in-app editing
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
│   ├── storage.ts       # LocalStorage service with profile and data management
│   ├── foodDatabase.ts  # Comprehensive food database (30+ items)
│   ├── calorieCalculations.ts # Complete health calculation engine with scientific formulas:
│   │                    #   - BMR calculations using Harris-Benedict equation
│   │                    #   - TDEE calculations with activity level multipliers
│   │                    #   - Goal-based calorie adjustments and recommendations
│   │                    #   - BMI calculations with health categorization
│   │                    #   - Unit conversion utilities (metric/imperial)
│   │                    #   - Health metrics validation and error handling
│   ├── cache.ts         # Intelligent caching system for API responses
│   ├── config.ts        # Environment and API configuration
│   ├── learningService.ts # AI learning and user correction system with natural language correction support
│   └── utils.ts         # Helper functions and utilities with profile validation
├── types/               # TypeScript type definitions
│   └── index.ts         # Centralized type definitions including UserProfile interfaces
├── __tests__/           # Comprehensive test suite
│   ├── components/      # Component-specific tests
│   │   ├── onboarding/  # Onboarding flow component tests
│   │   └── ResultsDisplay.test.tsx # AI results display tests
│   ├── integration/     # Integration and end-to-end tests
│   │   ├── app.test.tsx # Main app integration tests
│   │   └── onboarding-integration.test.tsx # Complete onboarding flow tests
│   └── lib/            # Service and utility tests
│       ├── hooks/      # Custom hook tests
│       ├── calorieCalculations.test.ts # Health calculation tests
│       ├── gemini.test.ts # AI service tests
│       ├── storage.test.ts # Data persistence tests
│       └── foodDatabase.test.ts # Food database tests
├── public/              # Static assets and PWA files
│   ├── manifest.json    # PWA manifest with app configuration
│   ├── sw.js           # Service worker for offline support
│   └── *.svg           # App icons and graphics
└── .kiro/              # Kiro configuration and project specs
    ├── specs/          # Project specifications and documentation
    └── steering/       # Development guidelines and rules
```

## 🧪 Testing

The application includes a comprehensive test suite covering all major functionality with advanced testing strategies:

### Comprehensive Test Coverage

- **Storage Service Testing**: Complete testing of the advanced storage service including:
  - **Profile Management**: User profile CRUD operations, validation, and onboarding completion tracking
  - **Health Calculations**: BMR, TDEE, and BMI calculation accuracy with various user profiles and edge cases
  - **Data Validation**: Comprehensive validation testing for age, height, weight, activity levels, and fitness goals
  - **Data Cleanup**: Automatic cleanup functionality with retention period testing and storage optimization
  - **Import/Export**: Data backup and restore functionality with validation, error handling, and format migration
  - **SSR Compatibility**: Server-side rendering safety with proper window detection and fallback handling
  - **Storage Quota Management**: Storage usage monitoring, quota tracking, and optimization recommendations
- **Advanced Mocking Strategies**: Sophisticated mocking implementations for:
  - **LocalStorage**: Complete localStorage mocking with quota simulation, error scenarios, and SSR compatibility
  - **Window Object**: Proper window detection mocking for SSR testing and universal service compatibility
  - **Health Calculations**: Scientific formula testing with various user profiles and measurement units
  - **Data Validation**: Comprehensive validation testing with edge cases and error recovery scenarios

### Running Tests

The project includes a comprehensive test suite with proper Jest configuration and advanced testing features:

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# CI mode
npm run test:ci

# Run specific test suites
npm test -- --testPathPattern=storage
npm test -- --testPathPattern=components
npm test -- --testPathPattern=integration
```

**Enhanced Jest Configuration**: Updated Jest configuration with proper `moduleNameMapper` for TypeScript path alias resolution and comprehensive test environment setup.

### Development Workflow

1. **Start Development Server**: `npm run dev` with Turbopack for fast development
2. **Run Tests in Watch Mode**: `npm run test:watch` for continuous testing during development
3. **Type Checking**: TypeScript compilation happens automatically with Next.js
4. **Linting**: `npm run lint` for code quality checks
5. **Build for Production**: `npm run build` to create optimized production build

### Test Structure

```text
__tests__/
├── components/          # Component tests
│   ├── onboarding/     # Complete onboarding flow tests
│   │   └── OnboardingFlow.test.tsx
│   ├── GoalSettings.test.tsx    # Settings and profile management
│   └── ResultsDisplay.test.tsx  # Food analysis results
├── integration/         # Integration tests
│   ├── app.test.tsx    # Main app integration
│   └── onboarding-integration.test.tsx # Onboarding flow integration
└── lib/                # Service and utility tests
    ├── hooks/
    │   └── useErrorHandler.test.ts
    ├── calorieCalculations.test.ts  # Health calculation tests
    ├── gemini.test.ts              # AI service tests
    ├── storage.test.ts             # Comprehensive storage service tests
    └── foodDatabase.test.ts        # Food database tests
```

#### Storage Service Test Coverage

The `storage.test.ts` file provides comprehensive testing for all storage service functionality:

- **User Settings Management**: Testing of settings CRUD operations with validation and error handling
- **Food Entry Management**: Complete testing of food entry storage, retrieval, and management
- **User Profile Operations**: Testing of profile creation, updates, validation, and onboarding completion
- **Health Calculations**: Testing of BMR, TDEE, and BMI calculations with various user profiles
- **Data Validation**: Comprehensive validation testing with edge cases and error scenarios
- **Data Cleanup**: Testing of automatic cleanup functionality with retention periods
- **Import/Export**: Testing of data backup and restore with validation and error handling
- **SSR Compatibility**: Testing of server-side rendering safety with proper window detection
- **Storage Quota Management**: Testing of storage usage monitoring and optimization
- **Error Handling**: Testing of error scenarios with proper error recovery and user messaging

### Test Coverage

- **Unit Tests**: Component logic and service functions with comprehensive mocking
- **Integration Tests**: Full app integration testing with user workflows including:
  - Complete onboarding flow integration testing
  - App-wide integration tests with proper mocking strategies
- **Component Testing**: React Testing Library tests for all major components including:
  - ResultsDisplay with AI analysis results and user interactions
  - Complete onboarding flow components (WelcomeStep, BasicInfoStep, ActivityStep, GoalsStep, CompletionStep)
  - Error handling components with boundary testing
  - UI components with accessibility testing
- **Advanced Service Testing**: Complete test coverage for core services with enhanced testing strategies:
  - **Storage Service**: Comprehensive testing of the singleton storage service including:
    - Profile management with CRUD operations and validation
    - Health calculations (BMR, TDEE, BMI) with scientific formula accuracy
    - Data cleanup and retention period management
    - Import/export functionality with data validation
    - SSR compatibility with proper window detection
    - Storage quota management and optimization
  - **Gemini AI Service**: API integration testing with mocking and error scenarios
  - **Food Database Service**: Search functionality and calorie calculation testing
  - **Learning Service**: AI improvement system with correction pattern testing
  - **Health Calculation Service**: BMR, TDEE, and BMI calculations with various user profiles
  - **Unit Conversion Utilities**: Metric/imperial conversions with precision testing
  - **Error Handler Hook**: Retry logic, state management, and error recovery testing
- **Onboarding Flow Testing**: Comprehensive testing for user onboarding:
  - Step navigation and progress tracking
  - Form validation and error handling
  - Profile data collection and storage
  - User experience flow from welcome to completion
  - Mobile responsiveness and accessibility
- **Health Calculation Testing**: Comprehensive testing for:
  - Harris-Benedict BMR calculations for all genders
  - TDEE calculations with activity level multipliers
  - Goal-based calorie adjustments and validation
  - BMI calculations and health categorization
  - Unit conversions between metric and imperial systems
- **Error Handling**: Comprehensive error scenario testing with boundary cases
- **Accessibility**: Screen reader compatibility and keyboard navigation testing
- **Hook Testing**: Custom React hooks with proper testing utilities and state management

## 🔧 Configuration

### Jest Configuration

The project uses Jest with proper configuration for Next.js and TypeScript:

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

### Environment Variables

Create a `.env.local` file (optional):

```env
# Optional: Your personal Gemini API key for unlimited usage
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: App URL for production deployment
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### API Configuration

The app includes intelligent API key management:

- **Default Test Key**: Provided for immediate app usage without setup
- **Personal API Key**: Optional Gemini API key for unlimited usage
- **Rate Limiting**: Automatic rate limiting with different limits for test vs. personal keys
- **Model Fallback**: Automatic fallback between Gemini 2.0 Flash, 1.5 Pro, and 1.5 Flash models

### Deployment

The application is optimized for deployment on Vercel's free tier:

```bash
# Deploy to Vercel
vercel --prod

# Or connect your GitHub repository to Vercel for automatic deployments
```

**Deployment Features**:
- Static site generation where possible
- Automatic HTTPS and CDN
- Environment variable management
- Zero-config deployment with Next.js optimizationional: Custom app URL for production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**Note**: The app includes a default test API key, so you can start using it immediately without configuration.

### API Key Setup

1. **Default Usage**: No setup required - uses included test API key
2. **Personal Key**: Get your free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. **Configuration**: Add your key in Settings or environment variables

### User Profile Setup & Onboarding

1. **Comprehensive 5-Step Onboarding Flow**: Complete profile setup with intelligent navigation and validation:
   - **Welcome Step**: App introduction with personalization benefits and privacy assurance
   - **Basic Info Step**: Personal information collection with advanced validation:
     - Age input (13-120 years) with comprehensive error messaging
     - Gender selection with inclusive options (male, female, other, prefer not to say)
     - Height input with metric (cm) and imperial (ft/in) unit support and conversion
     - Weight input with metric (kg) and imperial (lbs) unit support and conversion
     - Real-time unit system toggle with automatic field conversion
   - **Activity Step**: Activity level selection with detailed scientific descriptions:
     - Five activity levels (sedentary to extremely active) with multiplier indicators
     - Exercise frequency tracking (0-7 days/week) with validation
     - Real-world examples and descriptions for accurate self-assessment
   - **Goals Step**: Fitness goal setting with real-time calorie calculations:
     - Four primary goals (weight loss, maintenance, weight gain, muscle building)
     - Real-time calorie target calculation using Harris-Benedict equation
     - Optional health objectives selection with personalized recommendations
     - Visual calorie adjustment indicators showing daily deficit/surplus
   - **Completion Step**: Comprehensive profile summary with calculated health metrics:
     - Complete profile overview with all collected information
     - Real-time BMI calculation with health categorization and color coding
     - Daily calorie target with scientific calculation explanation
     - Health objectives summary and next steps guidance
2. **Advanced Health Calculation Engine**: Scientific formulas for accurate recommendations:
   - **BMR Calculation**: Harris-Benedict equation with gender-specific formulas and precision
   - **TDEE Calculation**: BMR × activity level multiplier (1.2x to 1.9x) for accurate daily needs
   - **Goal-Based Adjustments**: Automatic calorie modifications (±500 cal for weight change, +300 for muscle building)
   - **BMI Analysis**: Complete Body Mass Index calculation with health categorization
   - **Unit Conversion**: Comprehensive metric/imperial conversion with precision maintenance
3. **Smart User Experience**: Intelligent user detection and seamless navigation:
   - **New User Detection**: Automatic onboarding trigger for first-time users
   - **Returning User Bypass**: Existing users skip onboarding and splash screen for instant access
   - **Progress Tracking**: Clear step indicators with percentage completion and backward navigation
   - **Form Validation**: Real-time validation with user-friendly error messages and guidance
   - **Mobile Optimization**: Fully responsive interface optimized for touch interaction
4. **Data Privacy & Security**: Complete local storage with privacy-first approach:
   - **Local-Only Storage**: All profile data stored locally with no external transmission
   - **Privacy Messaging**: Clear privacy assurance throughout onboarding process
   - **Data Integrity**: Versioned profile schema with validation and error recovery
   - **Profile Persistence**: Complete profile storage with metadata tracking and update timestamps
5. **Profile Management**: Comprehensive profile editing and maintenance:
   - **Real-Time Updates**: Instant recalculation of health metrics when profile changes
   - **Validation System**: Comprehensive validation with detailed error reporting
   - **Default Handling**: Smart defaults for incomplete profiles with gender-based recommendations
   - **Profile Completeness**: Real-time assessment of data completeness for accurate calculations

### Health Calculation Details

The app uses scientifically-backed formulas for accurate health calculations with comprehensive validation:

#### BMR (Basal Metabolic Rate) - Harris-Benedict Equation
- **Male Formula**: 88.362 + (13.397 × weight_kg) + (4.799 × height_cm) - (5.677 × age)
- **Female Formula**: 447.593 + (9.247 × weight_kg) + (3.098 × height_cm) - (4.330 × age)
- **Non-Binary/Other**: Average of male and female calculations for inclusive support
- **Unit Conversion**: Automatic conversion from imperial to metric for calculation accuracy

#### TDEE (Total Daily Energy Expenditure)
- **Formula**: BMR × Activity Level Multiplier
- **Activity Levels with Scientific Multipliers**:
  - **Sedentary (1.2x)**: Little or no exercise, desk job
  - **Light (1.375x)**: Light exercise/sports 1-3 days/week
  - **Moderate (1.55x)**: Moderate exercise/sports 3-5 days/week
  - **Active (1.725x)**: Hard exercise/sports 6-7 days/week
  - **Very Active (1.9x)**: Very hard exercise/sports & physical job

#### Goal-Based Calorie Adjustments
- **Weight Loss**: -500 calories/day (sustainable 1 lb/week loss)
- **Weight Gain**: +500 calories/day (healthy 1 lb/week gain)
- **Maintenance**: No adjustment (TDEE = daily goal)
- **Muscle Building**: +300 calories/day (optimized for lean mass gain)

#### BMI (Body Mass Index) Analysis
- **Formula**: weight_kg / (height_m)²
- **Categories with Color Coding**:
  - **Underweight (<18.5)**: Blue indicator with health recommendations
  - **Normal (18.5-24.9)**: Green indicator showing healthy range
  - **Overweight (25-29.9)**: Yellow indicator with lifestyle suggestions
  - **Obese (≥30)**: Red indicator with health guidance

#### Unit Conversion System
- **Height Conversion**: cm ↔ ft/in with proper decimal and fraction handling
- **Weight Conversion**: kg ↔ lbs with precision maintenance for calculations
- **Automatic Detection**: Smart unit preference detection based on user input patterns

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

- **Local Data Storage**: All user data including personal profiles stored locally in browser
- **No External Database**: No personal data sent to external services
- **Profile Privacy**: Personal health information (age, weight, height, goals) never leaves the device
- **Image Privacy**: Photos analyzed via API but not permanently stored
- **API Key Security**: Secure handling of API credentials
- **Data Control**: Users have full control over their data retention and profile information
- **Profile Reset**: Option to clear profile data and restart onboarding process
- **Data Integrity**: Profile data validation and versioning for data consistency

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

### Latest Changes

- **User Onboarding System**: Added comprehensive 5-step onboarding flow for new users:
  - **WelcomeStep Component**: Introduction screen with app benefits, personalization features, and privacy messaging
  - **Multi-Step Flow**: Complete onboarding journey with BasicInfo, Activity, Goals, and Completion steps
  - **Smart User Detection**: Automatic detection of new vs. returning users with seamless experience
  - **Mobile-First Design**: Fully responsive onboarding interface optimized for all device sizes
  - **Progress Indicators**: Clear step navigation with backward/forward movement capabilities
  - **Privacy Assurance**: Prominent privacy messaging emphasizing local-only data storage
- **Enhanced User Experience**: Existing users now bypass both onboarding and splash screen for instant app access
- **Advanced Calorie Calculation System**: Added comprehensive `calorieCalculations.ts` service with scientific health calculations
- **Harris-Benedict BMR Calculations**: Separate male/female BMR calculations with support for non-binary users (averaged calculations)
- **TDEE Integration**: Total Daily Energy Expenditure calculations with activity level multipliers (1.2x to 1.9x)
- **Goal-Based Calorie Adjustments**: Automatic calorie goal adjustments for fitness objectives:
  - Weight Loss: -500 calories/day (~1 lb/week loss)
  - Weight Gain: +500 calories/day (~1 lb/week gain)
  - Muscle Building: +300 calories/day (moderate surplus)
  - Maintenance: No adjustment
- **Comprehensive Unit Conversions**: Full conversion utilities for height (cm ↔ ft/in) and weight (kg ↔ lbs)
- **Health Metrics Validation**: Detailed validation with user-friendly error messages for all health inputs
- **BMI Calculations**: Complete BMI calculation system with health categorization and color-coded status indicators
- **Profile Calculation Service**: All-in-one calculation service providing BMR, TDEE, calorie goals, BMI, and health categories
- **Smart Default Values**: Intelligent defaults for incomplete profiles with gender-based calorie recommendations

### Previous Updates

- **User Profile System**: Added comprehensive user profile management with TypeScript interfaces for personalized health tracking
- **Profile Data Types**: Implemented `UserProfile` and `StoredProfile` interfaces with complete personal information, activity levels, fitness goals, and preferences
- **Storage Service Extensions**: Enhanced storage service with profile CRUD operations, onboarding status tracking, and BMR calculations
- **Health Calculations**: Integrated Harris-Benedict equation for personalized calorie goal calculations based on user profile data
- **Data Validation**: Added comprehensive validation for health metrics including age (13-120), height, weight, and activity levels
- **Profile Versioning**: Implemented versioned profile storage schema with data integrity validation and migration support

### Previous Updates

- **Button Component Styling**: Updated outline variant with improved text contrast (`text-amber-800` instead of `text-amber-700`) for better accessibility and visual consistency across the design system

### Latest Features

- **Enhanced UI Components**: Comprehensive updates to core UI components with improved visual design and accessibility
  - **Button Component**: Refined outline and ghost variants with improved text contrast (`text-amber-800`) and enhanced hover states (`hover:text-amber-900`)
  - **Improved Color Consistency**: Standardized amber color scheme across all button variants for better brand consistency
  - **Visual Hierarchy**: Enhanced button styling with proper color transitions and improved readability
  - **Ghost Button Updates**: Consistent amber color scheme (`text-amber-800`, `hover:text-amber-900`) for better visual cohesion
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
- **Enhanced Data Export**: Comprehensive backup including user data, settings, profile data, and AI learning corrections
- **Import Validation**: Robust data import with format validation and error handling including profile data
- **Entry Management**: Delete individual food entries from daily tracker
- **Daily Reset**: Complete daily progress reset functionality
- **Enhanced UI**: Improved mobile interface with better touch targets
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Health Integration**: BMI calculator and personalized goal recommendations with profile-based calculations
- **User Profile System**: Complete profile management with onboarding flow, health metrics, and personalized recommendations
- **Smart Calorie Goals**: AI-calculated daily calorie recommendations using Harris-Benedict equation and user profile data
- **Profile Validation**: Comprehensive validation for health metrics with proper ranges and unit conversion support
- **Onboarding State Management**: Seamless detection and handling of new vs. returning users with profile-based app flow

### Development Improvements

- **UI Component Enhancement**: Comprehensive updates to core UI components including:
  - **Button Component**: Refined outline and ghost variants with improved text contrast and consistent amber color scheme
  - **Color System**: Standardized amber color palette (`text-amber-800`, `hover:text-amber-900`) with smooth transitions
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

## 📝 Recent Changes & Updates

### Latest Release Features

- **🎯 Natural Language Correction System**: Revolutionary AI-powered correction interface allowing users to describe changes in plain English
  - **New Component**: `NaturalLanguageCorrection.tsx` with modal-based correction interface
  - **API Integration**: Dedicated `/api/gemini-correction` route using Gemini 1.5 Pro for advanced natural language processing
  - **Enhanced Props**: Updated `ResultsProps` interface with optional `onAnalysisUpdate` callback for real-time analysis updates
  - **Intelligent Processing**: AI understands context and recalculates calories, macronutrients, and nutritional information
  - **User Experience**: Keyboard shortcuts (Enter to submit), loading states, and comprehensive error handling

- **🔧 Component Interface Updates**: Enhanced component props for better integration
  - **ResultsProps Enhancement**: Added optional `onAnalysisUpdate?: (updatedResult: FoodAnalysisResult) => void` parameter
  - **Real-time Updates**: Seamless integration between correction system and results display
  - **Type Safety**: Comprehensive TypeScript support for all new features

- **🏗️ Architecture Improvements**: Robust server-side processing for natural language corrections
  - **Dedicated API Route**: Secure server-side processing with comprehensive error handling
  - **Model Selection**: Uses Gemini 1.5 Pro for optimal natural language understanding
  - **Rate Limiting**: Built-in rate limiting and API key management
  - **Error Recovery**: Graceful error handling with user-friendly feedback

### Technical Enhancements

- **Enhanced Error Handling**: Comprehensive error boundaries and user feedback systems
- **Improved Type Definitions**: Updated TypeScript interfaces for better type safety
- **API Route Security**: Secure server-side processing with proper validation
- **Component Integration**: Seamless integration between correction system and existing components

---

Built with ❤️ using Next.js, React, and Google Gemini AI