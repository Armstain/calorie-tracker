# Design Document

## Overview

The Food Calorie Estimator is a Next.js web application that enables users to capture food photos using their device camera and receive AI-powered calorie estimates through Google's Gemini AI. The application includes comprehensive daily tracking, goal setting, and historical analysis features while maintaining a cost-effective architecture using free tier services.

## Architecture

### High-Level Architecture

The application follows a client-side focused architecture to minimize server costs and stay within free tier limits:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │───▶│  Gemini AI API   │───▶│  Google Cloud   │
│  (Client-Side)  │    │   (Free Tier)    │    │   (Free Tier)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Local Storage   │
│ (Browser API)   │
└─────────────────┘
```

### Technology Stack

- **Frontend**: Next.js 15.4.1 with React 19.1.0
- **Styling**: Tailwind CSS 4.0
- **AI Integration**: Google Gemini AI (Gemini-1.5-flash model)
- **Data Storage**: Browser LocalStorage API
- **Camera Access**: Web MediaDevices API
- **Image Processing**: HTML5 Canvas API
- **Deployment**: Vercel (free tier)

### API Integration Strategy

**Option 1: Direct Client-Side Integration (Recommended)**
- Use Gemini AI REST API directly from the browser
- Implement API key through environment variables
- Utilize CORS-enabled endpoints

**Option 2: Next.js API Routes (Fallback)**
- Create API route at `/api/analyze-food`
- Proxy requests to Gemini AI
- Handle authentication server-side

## Components and Interfaces

### Core Components

#### 1. CameraCapture Component
```typescript
interface CameraProps {
  onPhotoCapture: (imageData: string) => void;
  onError: (error: string) => void;
}
```

**Responsibilities:**
- Request camera permissions
- Display camera preview
- Capture and process photos
- Handle image orientation and quality

#### 2. FoodAnalyzer Component
```typescript
interface AnalyzerProps {
  imageData: string;
  onAnalysisComplete: (result: FoodAnalysisResult) => void;
  onAnalysisError: (error: string) => void;
}
```

**Responsibilities:**
- Send images to Gemini AI
- Parse AI responses
- Handle API errors and retries
- Display loading states

#### 3. ResultsDisplay Component
```typescript
interface ResultsProps {
  analysisResult: FoodAnalysisResult;
  onAddToDaily: (calories: number) => void;
  onRetakePhoto: () => void;
}
```

**Responsibilities:**
- Display identified foods and calories
- Show confidence levels
- Provide action buttons
- Format nutritional information

#### 4. DailyTracker Component
```typescript
interface TrackerProps {
  dailyGoal: number;
  currentTotal: number;
  todaysEntries: FoodEntry[];
  onGoalUpdate: (newGoal: number) => void;
}
```

**Responsibilities:**
- Display daily progress
- Show calorie goal progress bar
- List today's food entries
- Handle goal modifications

#### 5. HistoryView Component
```typescript
interface HistoryProps {
  weeklyData: DailyData[];
  onDateSelect: (date: string) => void;
}
```

**Responsibilities:**
- Display 7-day calorie history
- Show trend charts
- Calculate weekly averages
- Navigate between dates

### Service Interfaces

#### GeminiService
```typescript
interface GeminiService {
  analyzeFood(imageBase64: string): Promise<FoodAnalysisResult>;
  validateApiKey(): Promise<boolean>;
}
```

#### StorageService
```typescript
interface StorageService {
  saveFoodEntry(entry: FoodEntry): void;
  getDailyEntries(date: string): FoodEntry[];
  getWeeklyData(): DailyData[];
  updateDailyGoal(goal: number): void;
  getDailyGoal(): number;
}
```

## Data Models

### FoodAnalysisResult
```typescript
interface FoodAnalysisResult {
  foods: FoodItem[];
  totalCalories: number;
  confidence: number;
  timestamp: string;
  imageUrl?: string;
}

interface FoodItem {
  name: string;
  calories: number;
  quantity: string;
  confidence: number;
}
```

### FoodEntry
```typescript
interface FoodEntry {
  id: string;
  timestamp: string;
  foods: FoodItem[];
  totalCalories: number;
  imageData?: string;
  date: string; // YYYY-MM-DD format
}
```

### DailyData
```typescript
interface DailyData {
  date: string; // YYYY-MM-DD format
  totalCalories: number;
  goalCalories: number;
  entries: FoodEntry[];
  goalMet: boolean;
}
```

### UserSettings
```typescript
interface UserSettings {
  dailyCalorieGoal: number;
  apiKey?: string;
  notifications: boolean;
  dataRetentionDays: number;
}
```

## Error Handling

### Error Types and Handling Strategy

#### Camera Errors
- **Permission Denied**: Show instructions for enabling camera access
- **Hardware Unavailable**: Fallback to file upload option
- **Capture Failed**: Retry mechanism with user feedback

#### API Errors
- **Rate Limiting**: Implement exponential backoff and user notification
- **Authentication**: Clear error messages for API key issues
- **Network Errors**: Retry logic with offline capability messaging
- **Invalid Response**: Graceful degradation with manual entry option

#### Storage Errors
- **Quota Exceeded**: Data cleanup and user notification
- **Access Denied**: Fallback to session storage
- **Corruption**: Data validation and recovery mechanisms

### Error Recovery Patterns

```typescript
interface ErrorHandler {
  handleCameraError(error: CameraError): void;
  handleApiError(error: ApiError): Promise<void>;
  handleStorageError(error: StorageError): void;
  showUserFriendlyMessage(error: AppError): void;
}
```

## Testing Strategy

### Unit Testing
- **Components**: React Testing Library for UI components
- **Services**: Jest for business logic and API integration
- **Utilities**: Pure function testing for data processing
- **Storage**: LocalStorage mocking and data persistence tests

### Integration Testing
- **Camera Integration**: Mock MediaDevices API
- **Gemini API**: Mock API responses and error scenarios
- **End-to-End Flows**: User journey from photo capture to result display

### Performance Testing
- **Image Processing**: Large image handling and compression
- **API Response Times**: Gemini AI response time monitoring
- **Storage Performance**: Large dataset handling in LocalStorage

### Accessibility Testing
- **Screen Reader**: ARIA labels and semantic HTML
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: WCAG 2.1 AA compliance
- **Mobile Accessibility**: Touch target sizes and gestures

## Security Considerations

### API Key Management
- Store Gemini API key in environment variables
- Never expose keys in client-side code
- Implement key rotation capability
- Use Next.js API routes for sensitive operations

### Data Privacy
- All user data stored locally in browser
- No personal data sent to external services except images
- Clear data retention policies
- User control over data deletion

### Image Security
- Validate image formats and sizes
- Implement image compression to reduce data transfer
- No permanent storage of user images
- Clear temporary image data after analysis

## Performance Optimization

### Image Optimization
- Compress images before API calls (target: <1MB)
- Use WebP format when supported
- Implement progressive loading for results
- Cache analysis results locally

### API Optimization
- Implement request debouncing
- Use Gemini-1.5-flash for faster responses
- Batch multiple food items in single request
- Implement smart retry logic

### Storage Optimization
- Compress stored data using JSON compression
- Implement data cleanup for old entries
- Use IndexedDB for large datasets if needed
- Lazy load historical data

### UI Performance
- Implement virtual scrolling for history
- Use React.memo for expensive components
- Optimize re-renders with proper dependency arrays
- Implement skeleton loading states

## Deployment Architecture

### Vercel Deployment (Free Tier)
- Static site generation where possible
- API routes for Gemini integration
- Environment variable management
- Automatic HTTPS and CDN

### Environment Configuration
```typescript
interface EnvironmentConfig {
  GEMINI_API_KEY: string;
  NEXT_PUBLIC_APP_URL: string;
  NODE_ENV: 'development' | 'production';
}
```

### Build Optimization
- Tree shaking for unused code
- Image optimization with Next.js
- CSS purging with Tailwind
- Bundle analysis and size monitoring