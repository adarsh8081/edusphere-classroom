# EduSphere Mobile App

> React Native / Expo mobile application for Android and iOS.

## Status: Scaffold

This directory is prepared for future React Native / Expo implementation. The mobile app will use a separate UI for native experience but shares API client, types, and utilities with the web app.

## Getting Started (Future)

```bash
npx expo install
npx expo start   # Start Expo dev server
```

## Architecture

```
apps/mobile/
├── src/
│   ├── screens/      ← Screen components
│   ├── components/   ← Native UI components
│   ├── navigation/   ← React Navigation setup
│   ├── services/     ← API calls via @edusphere/api-client
│   ├── hooks/        ← Custom hooks
│   └── store/        ← State management
└── assets/           ← Images, fonts
```

## Shared Packages

- `@edusphere/api-client` — Typed API SDK
- `@edusphere/types` — Shared TypeScript types
- `@edusphere/utils` — Shared utility functions

## Technology

- **React Native** with **Expo** for cross-platform mobile development
- Outputs: Android APK/AAB, iOS IPA
