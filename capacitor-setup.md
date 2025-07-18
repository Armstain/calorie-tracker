# Capacitor Setup for CalorieMeter

## Installation

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/camera @capacitor/filesystem
```

## Initialize Capacitor

```bash
npx cap init CalorieMeter com.caloriemeter.app
```

## Add Android Platform

```bash
npx cap add android
```

## Configuration (capacitor.config.ts)

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.caloriemeter.app',
  appName: 'CalorieMeter',
  webDir: 'out', // Next.js static export
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    LocalStorage: {
      group: 'CalorieMeterData'
    }
  }
};

export default config;
```

## Build Process

```bash
# Build Next.js app
npm run build
npm run export

# Sync with Capacitor
npx cap sync

# Open in Android Studio
npx cap open android
```

## Native Features Available

- ✅ Enhanced camera access
- ✅ File system access
- ✅ Push notifications
- ✅ App store distribution
- ✅ Better performance