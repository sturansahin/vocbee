# VocBee — Application Architecture Document

> **Generated:** February 7, 2026  
> **App Version:** 1.0.0  
> **Expo SDK:** 54  
> **React Native:** 0.81.5

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [Architecture & Folder Structure](#2-architecture--folder-structure)
3. [Navigation & Screen Flow](#3-navigation--screen-flow)
4. [Services & Business Logic](#4-services--business-logic)
5. [Scheduled Notifications System](#5-scheduled-notifications-system)
6. [State & Data Flow](#6-state--data-flow)
7. [Localization (i18n)](#7-localization-i18n)
8. [Configuration & Environment](#8-configuration--environment)
9. [Potential Issues & Risk Analysis](#9-potential-issues--risk-analysis)
10. [Production Readiness Assessment](#10-production-readiness-assessment)

---

## 1. Application Overview

### What the Application Does

VocBee is a vocabulary learning mobile application built with React Native and Expo. Users select a native language and a target language, then learn words through a swipeable flashcard interface organized by CEFR proficiency levels (A1 → C1). The app delivers scheduled local notifications containing vocabulary words, offers AI-powered grammar explanations via the Groq API, and tracks progress with Firebase cloud synchronization.

### Main User Goals

- **Learn vocabulary** by swiping through flashcards (swipe right = learned, swipe left = skip)
- **Review example sentences** for each word in both native and target languages
- **Receive periodic notifications** with vocabulary words throughout the day
- **Track progress** across five CEFR levels with automatic level advancement
- **Save favorite words** for later review
- **Get AI grammar explanations** for example sentences

### Supported Platforms

| Platform | Status |
|----------|--------|
| Android  | Full support (EAS builds: APK for preview, AAB for production) |
| iOS      | Full support (requires EAS build) |
| Expo Go  | Partial (AdMob disabled; notifications limited) |
| Web      | Not supported |

### Supported Languages

21 languages are available as both native and target languages: Amharic, Arabic, Chinese, English, French, German, Hindi, Indonesian, Italian, Japanese, Korean, Persian, Portuguese, Russian, Serbian, Spanish, Swahili, Thai, Turkish, Urdu, Vietnamese.

---

## 2. Architecture & Folder Structure

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                    App.tsx (Root)                     │
│  SafeAreaProvider → ThemeProvider → AlertProvider     │
│  → AuthProvider → ErrorBoundary → GestureHandler     │
│  → OfflineNotice → NavigationContainer               │
├─────────────────────────────────────────────────────┤
│  Screens (UI Layer)                                  │
│  ├── Onboarding → Auth → Setup → Home (Main Loop)  │
│  ├── Settings, Favorites, ExampleSentences          │
│  └── LevelTest, ForgotPassword, Splash              │
├─────────────────────────────────────────────────────┤
│  Services (Business Logic Layer)                     │
│  ├── vocabularyService   (word data management)     │
│  ├── progressService     (learning progress)        │
│  ├── notificationService (scheduled notifications)  │
│  ├── SyncService         (Firestore sync)           │
│  ├── favoritesService    (favorite words)           │
│  ├── groqService         (AI grammar)               │
│  ├── adMobService        (advertisements)           │
│  ├── storage             (AsyncStorage wrapper)     │
│  └── i18n                (internationalization)     │
├─────────────────────────────────────────────────────┤
│  Data Layer                                          │
│  ├── AsyncStorage  (local persistence)              │
│  ├── Firebase Auth (authentication)                 │
│  └── Firestore     (cloud database)                 │
└─────────────────────────────────────────────────────┘
```

### Folder Structure

```
vocbee/
├── App.tsx                  # Root component: providers, navigation, lifecycle
├── constants.ts             # Theme colors, language list, level definitions, quiz data
├── types.ts                 # RootStackParamList, Language/Level interfaces
│
├── screens/                 # UI screens (each is a full-page component)
│   ├── SplashScreen.tsx         # Animated splash on app launch
│   ├── OnboardingScreen.tsx     # First-time carousel (3 slides)
│   ├── AuthScreens.tsx          # LoginScreen + SignUpScreen
│   ├── ForgotPasswordScreen.tsx # Password reset form
│   ├── SetupScreens.tsx         # 7-step setup wizard (languages, level, notifications)
│   ├── LevelTestScreen.tsx      # 6-question quiz to detect user level
│   ├── HomeScreen.tsx           # Main flashcard learning screen
│   ├── ExampleSentencesScreen.tsx  # Example sentences + AI grammar
│   ├── FavoritesScreen.tsx      # Saved words list
│   └── SettingsScreen.tsx       # All settings, modals, profile editing
│
├── components/              # Reusable UI components
│   ├── UIComponents.tsx         # Button, Input, Header primitives
│   ├── CustomAlert.tsx          # Themed modal alert (replaces Alert.alert)
│   ├── ErrorBoundary.tsx        # React error boundary with restart
│   ├── OfflineNotice.tsx        # Network connectivity banner
│   ├── ConnectionErrorScreen.tsx # Full-screen connection error
│   ├── SafeBannerAd.tsx         # Safe AdMob banner wrapper
│   └── SwarmLogo.tsx            # Animated bee logo component
│
├── services/                # Business logic and data access
│   ├── vocabularyService.ts     # Load/merge/store vocabulary from bundled assets
│   ├── progressService.ts       # Track learned words, level progression
│   ├── notificationService.ts   # Schedule, track, process local notifications
│   ├── SyncService.ts           # Firestore read/write, daily auto-sync
│   ├── favoritesService.ts      # Manage favorite words (local + Firebase)
│   ├── groqService.ts           # AI grammar explanations via Groq API
│   ├── adMobService.ts          # AdMob initialization and ad loading
│   ├── storage.ts               # Low-level AsyncStorage operations
│   ├── storageKeys.ts           # Central storage key constants
│   └── i18n.ts                  # i18next initialization and language detection
│
├── context/                 # React Contexts for global state
│   ├── AuthContext.tsx          # Auth state, user data, profile, notification settings
│   └── ThemeContext.tsx         # Dark/light theme based on system preference
│
├── config/                  # External service configuration
│   └── firebase.ts              # Firebase app/auth/firestore initialization
│
├── utils/                   # Utility helpers
│   └── typography.ts            # Font family constants
│
├── locales/                 # i18n translations (21 locale files)
│   ├── index.ts                 # Exports combined resources
│   ├── en.ts                    # English (base, 274 keys)
│   ├── tr.ts, de.ts, ...       # 20 additional locale files
│
├── assets/
│   ├── vocabulary/              # Bundled vocabulary JSON files (21 languages × 5 levels = 105 .txt files)
│   ├── language/                # Language-specific assets (21 language subdirectories)
│   ├── icons/                   # Flag icons and app icons
│   └── animations/              # Lottie animation files + swarm animation generator
│
├── app.json                 # Expo configuration
├── eas.json                 # EAS Build profiles
├── package.json             # Dependencies
└── tsconfig.json            # TypeScript configuration
```

### Responsibility Summary

| Directory | Responsibility |
|-----------|---------------|
| `screens/` | Full-screen views, user interaction handlers, navigation triggers. Each screen manages its own local state and calls services for data operations. |
| `components/` | Reusable, stateless or lightly stateful UI primitives. Shared across screens. |
| `services/` | All business logic: data loading, persistence, scheduling, API calls, sync. Services are pure TypeScript modules (no React components). |
| `context/` | Global state management via React Context: authentication and theme. |
| `config/` | Third-party SDK initialization (Firebase). |
| `utils/` | Small helpers with no side effects (font constants). |
| `locales/` | Translation files for 21 languages. |
| `assets/` | Static resources bundled into the app binary. |

---

## 3. Navigation & Screen Flow

### Navigation Setup

The app uses `@react-navigation/stack` with a single `Stack.Navigator` in `App.tsx`. All screens are registered at the top level — there are no nested navigators or tab navigators despite the `MainTabs` route name.

**Important:** The `MainTabs` route renders `HomeScreen` directly (not a tab navigator). This naming is a legacy naming artifact.

### Route Definitions

```typescript
type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  NativeLanguage: { detectedLevel?: string } | undefined;
  LevelTest: { nativeLanguage: string; targetLanguage: string };
  MainTabs: undefined;
  Settings: undefined;
  Favorites: undefined;
  ExampleSentences: {
    word: string;
    translation: string;
    sentence1: string;
    sentence2: string;
    nativeSentence1: string;
    nativeSentence2: string;
  };
};
```

### User Journeys

#### First-Time User Flow

```
App Launch
  → SplashScreen (animated, auto-dismisses)
  → Onboarding (3-slide carousel)
  → Login (or SignUp)
  → SetupScreen (7 steps):
      Step 1: Select native language
      Step 2: Select target language
      Step 3: Select level (beginner/intermediate/advanced) or take LevelTest
      Step 4: Notification permission request
      Step 5: Set notification start time
      Step 6: Set notification end time
      Step 7: Set notification frequency
  → HomeScreen (MainTabs) — vocabulary generation happens during setup
```

#### Returning User Flow

```
App Launch
  → SplashScreen
  → Route Determination:
      If not logged in → Login
      If logged in + no setup → NativeLanguage (SetupScreen)
      If logged in + setup complete → MainTabs (HomeScreen)
```

#### Learning Session Flow

```
HomeScreen
  ├── Swipe right → Mark word as learned → Next card
  ├── Swipe left → Next card (no progress change)
  ├── Tap "More Examples" → ExampleSentencesScreen
  │     └── Tap "Explain Grammar" → AI explanation from Groq API
  ├── Tap heart icon → Toggle favorite
  ├── Tap settings icon → SettingsScreen
  └── Tap favorites icon → FavoritesScreen
```

### Initial Route Determination Logic

The `determineInitialRoute` function in `App.tsx` decides which screen to show on app start:

1. Check `@VocBee:hasSeenOnboarding` in AsyncStorage → if not set, show `Onboarding`
2. Wait for `AuthContext` to resolve loading
3. If no authenticated user → show `Login`
4. If user exists, check `userData.setupCompleted === true` OR existence of both `nativeLanguage` and `targetLanguage` in preferences → if yes, show `MainTabs`
5. Otherwise → show `NativeLanguage` (setup wizard)

### Critical Paths Where Failures Block Usage

| Path | Failure Mode | Impact |
|------|-------------|--------|
| Firebase Auth initialization | Network error during `onAuthStateChanged` | App shows `ConnectionErrorScreen` with retry button |
| `fetchAndSaveUserData` during login | Firestore unreachable | `connectionError` state triggers error screen |
| Vocabulary generation in `SetupScreen` | Asset loading failure | App navigates to `MainTabs` with empty vocabulary |
| `getStoredVocabulary` in `HomeScreen` | Corrupted AsyncStorage data | Empty card stack, "No vocabulary" message |

---

## 4. Services & Business Logic

### 4.1 vocabularyService.ts

**Role:** Loads vocabulary data from bundled `.txt` assets (actually JSON content), merges native and target language words, and stores the result in AsyncStorage.

**Key Operations:**
- `generateVocabulary(native, target)` — Loads all 5 levels for both languages, merges them by word index, and stores the combined result under `@vocabulary`
- `getStoredVocabulary(level)` — Retrieves vocabulary for a specific level from AsyncStorage
- `mergeVocabulary(native, target, level)` — Pairs target words with native translations using index-based alignment
- `shuffleArray(array)` — Fisher-Yates shuffle for randomizing card order

**Data Model:**
```typescript
interface VocabularyWord {
  id: number;
  word: string;           // Target language
  translation: string;    // Native language
  sentence1: string;      // Example 1 (target)
  sentence2: string;      // Example 2 (target)
  nativeSentence1: string;
  nativeSentence2: string;
}
```

**Asset Loading:** Uses `expo-asset` to download the bundled `.txt` file, then `expo-file-system` to read it as a string, and `JSON.parse` to decode. An in-memory cache (`vocabularyCache`) prevents redundant file reads.

### 4.2 progressService.ts

**Role:** Tracks which words have been learned per CEFR level, manages the current level, and handles level advancement.

**Storage Keys:**
- `@user_progress` — JSON object mapping levels to arrays of learned word IDs
- `@current_level` — Current CEFR level string (e.g., `'A1'`)
- `@last_word_id` — Last viewed word ID for resume

**Key Operations:**
- `markWordAsLearned(level, wordId)` — Adds word ID to learned array, marks sync needed
- `checkAndAdvanceLevel()` — If all words in current level are learned, advances to next level
- `resetProgress()` — Clears all progress, current level, and last word ID
- `restoreProgressFromFirebase(...)` — Writes Firebase-fetched data to AsyncStorage

### 4.3 notificationService.ts

**Role:** Manages the full lifecycle of local vocabulary notifications — permission requests, scheduling, tracking, processing, and response handling.

*Detailed analysis in [Section 5](#5-scheduled-notifications-system).*

### 4.4 SyncService.ts

**Role:** Synchronizes local progress, favorites, and profile data with Firestore.

**Sync Strategy:**
- **Daily auto-sync:** `autoSync()` is called when the app comes to foreground. It checks if 24 hours have passed since last sync AND if there are unsynced changes.
- **Force sync:** `forceSync()` skips time checking. Called on logout, profile changes, and language/progress resets.
- **Fetch on login:** `fetchAndSaveUserData()` pulls all data from Firestore (preferences, progress, favorites) and writes to AsyncStorage. Also regenerates vocabulary if language pair changed.

**Device Tracking:** A unique `deviceId` is generated per installation and stored. When syncing, the ID is written to Firestore as `lastActiveDeviceId`. On startup, AuthContext compares local and Firebase device IDs to decide if a full re-fetch is needed (supports multi-device scenarios).

**Data Synced:**
- Progress: `learnedWords`, `currentLevel`, `lastWordIndex`
- Preferences: `nativeLanguage`, `targetLanguage`, `level`
- Favorites: Array of `{id, level}` objects
- Profile: `displayName`

### 4.5 favoritesService.ts

**Role:** Manages favorite words locally with Firebase sync.

**Storage:** User-specific AsyncStorage key `@favorites_{userId}`. Stores array of `{id: number, level: Level}` objects. Includes migration logic from a legacy format (plain number array).

**Firebase Sync:** `syncFavoritesToFirebase()` is called by `SyncService` during daily sync or force sync. `restoreFavoritesFromFirebase()` is called on login.

### 4.6 groqService.ts

**Role:** Sends two example sentences to the Groq LLM API for grammar analysis, returning structured explanations in the user's native language.

**API:** Uses `llama-3.3-70b-versatile` model via `https://api.groq.com/openai/v1/chat/completions`. API key is sourced from `EXPO_PUBLIC_GROQ_API_KEY` environment variable.

**Caching:** In-memory `Map` cache keyed by `sentence1|sentence2|outputLanguage`. Cache is lost on app restart.

**Response Format:** Requests JSON response with `sentence1.structure`, `sentence1.grammar`, `sentence1.reason` (and same for `sentence2`).

### 4.7 adMobService.ts

**Role:** Manages Google AdMob integration with safe degradation in Expo Go.

**Ad Types:**
- **Banner ads** — Rendered via `SafeBannerAd` component
- **Interstitial ads** — Full-screen transition ads
- **App open ads** — Shown every 3rd app launch

**Safety:** The module is loaded via a try/catch around `require('react-native-google-mobile-ads')`. In Expo Go, it detects the execution environment and skips all ad operations. In `__DEV__` mode, placeholder UI is shown.

**Note:** Ad unit IDs in the codebase are Google test IDs, not production IDs.

### 4.8 storage.ts

**Role:** Low-level AsyncStorage operations for progress, sync state, user data, and device ID management.

**Key Functions:**
- `markAsUnsynced()` / `needsSync()` / `clearSyncFlag()` — Manage a boolean flag to track if local changes need syncing
- `clearAllLocalData()` — Removes all app data from AsyncStorage (used on logout, language change)
- `getDeviceId()` — Returns or generates a persistent device identifier

### 4.9 i18n.ts

**Role:** Initializes `i18next` with a custom async language detector.

**Detection Order:**
1. Check `@user_language` in AsyncStorage (manually selected)
2. Check device locale via `expo-localization`
3. Fall back to `'en'`

**Features:**
- `getDeviceLanguage()` — Returns device locale if supported, else `'en'`
- `setToDeviceLanguage()` — Removes saved preference, reverts to device locale
- `isUsingSystemLanguage()` — Returns `true` if no manual override is saved

### Error Handling Strategy Across Services

| Service | Strategy |
|---------|----------|
| vocabularyService | Returns empty arrays on failure. Logs errors via `console.error`. |
| progressService | Returns empty objects/defaults on read failure. Write failures are logged but silently ignored. |
| notificationService | Wraps all operations in try/catch. Returns gracefully (e.g., `0` processed) on failure. |
| SyncService | Returns `false` on sync failure. Does not retry automatically. |
| favoritesService | Returns empty arrays on failure. Migration errors are caught and logged. |
| groqService | Throws errors to caller. The calling screen (`ExampleSentencesScreen`) catches and displays error state. |
| adMobService | Catches all errors. Never allows ad failures to crash the app. |
| storage | Returns defaults on failure. Individual operations wrapped in try/catch. |

---

## 5. Scheduled Notifications System

### Overview

VocBee uses Expo's `expo-notifications` library to schedule local push notifications containing vocabulary words. Notifications are scheduled as one-time triggers (not repeating), up to the iOS/Android system limit of 64 pending notifications.

### Permission Request Flow

```
Setup Step 4 (or SettingsScreen toggle)
  → requestNotificationPermissions()
  → getPermissionsAsync() → check existing status
  → If not granted: requestPermissionsAsync()
  → If still denied: show alert with "Open Settings" option
     → User navigates to system settings
     → App polls every 2 seconds to detect permission grant
  → On Android: creates 'vocabulary' notification channel (HIGH importance)
  → Returns boolean
```

### Scheduling Logic

**`scheduleVocabularyNotifications()`** — Full reschedule (called on settings change, setup completion):

1. Read `NotificationSettings` from AsyncStorage
2. Cancel all existing notifications (`cancelAllScheduledNotificationsAsync`)
3. Clear all tracked notifications
4. Calculate `notificationsPerDay = floor((endMinutes - startMinutes) / frequency) + 1`
5. Calculate `daysToSchedule = ceil(64 / notificationsPerDay)`
6. For each day, for each time slot:
   - Skip if time is in the past
   - Pick a random unlearned word from current level
   - Schedule using `TIME_INTERVAL` trigger: `seconds = (targetTime - now) / 1000`
   - Store a `TrackedNotification` record with word data and scheduled timestamp
7. Save all tracked notifications to AsyncStorage

**`refillNotifications()`** — Incremental top-up (called when app returns to foreground):

1. Get count of currently scheduled system notifications
2. If already at 64, skip
3. Find the last scheduled notification time
4. Schedule new notifications AFTER that time, preserving existing schedule
5. Append new tracked notifications to storage

### Time Calculation

Notifications use `TIME_INTERVAL` triggers, not calendar triggers. The service calculates the number of seconds from `Date.now()` to the desired notification time:

```typescript
seconds = Math.max(1, Math.floor((notificationTime.getTime() - now.getTime()) / 1000))
```

The system converts the user's time preferences (startHour/startMinute, endHour/endMinute, frequency) into absolute timestamps for each notification slot.

### Notification Content

```
Title: "VocBee"
Body:  "{word} - {translation}, Tap to see example sentences"
```

Notification content is hardcoded in English (not localized).

### Processing Delivered Notifications

**`processDeliveredNotifications()`** — Called when app comes to foreground:

1. Load tracked notifications from AsyncStorage
2. Find unprocessed notifications with `scheduledTime < now`
3. For each delivered notification:
   - Check if it was delivered while app was in foreground (compare `scheduledTime` with `lastForegroundTime`)
   - If delivered in foreground → skip (user didn't see it as a notification)
   - If delivered in background AND `autoMarkLearned` enabled → mark word as learned
4. Remove processed notifications from tracking
5. Return count (used by `refillNotifications` to know how many slots to fill)

### Notification Response Handling

When user taps a notification:

1. `handleNotificationResponse()` extracts word data from notification payload
2. If `autoMark` was enabled, the word gets **unmarked** (so user can review it again)
3. Word ID is stored as `pendingNotificationWord` in AsyncStorage
4. HomeScreen reads and clears this pending word to navigate to it

### Cancellation and Update Logic

- **Full cancel:** `cancelAllNotifications()` — Cancels all system-scheduled notifications AND clears tracked notifications. Called when notifications are disabled or settings change.
- **Settings change:** `saveNotificationSettings()` triggers a full reschedule if enabled, or full cancel if disabled.
- **Language/progress reset:** Does not explicitly cancel/reschedule notifications. Existing scheduled notifications may show words from the old language pair until next reschedule.

### App Lifecycle Behavior

| State | Behavior |
|-------|----------|
| **Foreground** | `handleNotification` handler returns `shouldShowAlert: false`, `shouldShowList: true`. Notifications appear in notification center but NOT as in-app alerts. |
| **Background** | Notifications fire normally. Tracked and processed when app returns to foreground. |
| **Killed** | Scheduled notifications fire at their absolute time (TIME_INTERVAL from scheduling moment). When app is reopened, `processDeliveredNotifications` handles all accumulated deliveries. |
| **App update/reinstall** | Scheduled notifications may be cleared by the OS. No recovery mechanism beyond the next `refillNotifications` call. |

### Platform-Specific Behavior

| Aspect | iOS | Android |
|--------|-----|---------|
| Notification limit | 64 scheduled | 64 scheduled |
| Notification channel | N/A | `vocabulary` channel with HIGH importance |
| Permission model | One-time prompt, then Settings | Granted by default on Android <13; prompt on 13+ |
| Background delivery | Delivered silently | Delivered with sound/vibration per channel settings |
| `TIME_INTERVAL` accuracy | May be delayed by low-power mode | May be delayed by Doze mode / battery optimization |

---

## 6. State & Data Flow

### Local vs. Global State

| State Type | Mechanism | Scope | Examples |
|------------|-----------|-------|----------|
| Global auth state | `AuthContext` | App-wide | `user`, `userData`, `isLoading`, `connectionError`, `profile`, `notificationSettings` |
| Global theme | `ThemeContext` | App-wide | `isDarkMode`, `colors` (derived from `useColorScheme()`) |
| Global alert | `AlertContext` | App-wide | `showAlert()`, `hideAlert()` — replaces `Alert.alert` |
| Screen-local state | `useState` | Per screen | Selected word, card index, modal visibility, form inputs |
| Persisted state | AsyncStorage | Across sessions | Progress, vocabulary, settings, profile, sync flags |
| Cloud state | Firestore | Across devices | User document with progress, preferences, favorites |

### Async Data Loading Patterns

**AuthContext (startup):**
```
onAuthStateChanged fires
  → Load notification settings (always)
  → If user exists:
     → Load local cache
     → Compare device IDs (local vs. Firebase)
     → If same device → use cache (fast path)
     → If different device → fetchAndSaveUserData() from Firestore (slow path)
     → Load profile from AsyncStorage
  → Set isLoading = false
```

**HomeScreen:**
```
useEffect on mount
  → getStoredVocabulary(currentLevel)
  → getLearnedWords()
  → Filter to unlearned words
  → Shuffle with Fisher-Yates
  → Check for pendingNotificationWord (from tapped notification)
  → Set cards state
```

**SettingsScreen:**
Reads most data from `AuthContext` (profile, notification settings). Level and language data loaded from AsyncStorage on mount.

### Side-Effect Management

All async side effects are managed via `useEffect` hooks in screens and contexts. There is no middleware layer (no Redux, no MobX). The `AuthContext` is the primary coordinator of side effects.

Key side effects in `App.tsx`:
1. `autoSync(user.uid)` — Triggered when user changes and on foreground return
2. `handleNotificationResponse` — Listener for notification taps
3. `setLastForegroundTime()` + `processDeliveredNotifications()` + `refillNotifications()` — On foreground return
4. Font loading and splash screen management

### Loading and Error States

| Screen | Loading State | Error State |
|--------|--------------|-------------|
| App root | `SplashScreen` while `isAppReady === false` | `ConnectionErrorScreen` when `connectionError === true` |
| HomeScreen | Lottie animation while loading vocabulary | "No vocabulary" empty state if no data |
| AuthScreens | Disabled inputs + loading text on buttons | Alert with auth error message |
| ExampleSentencesScreen | "Analyzing grammar..." shimmer while Groq API loads | Error toast if API call fails |
| SettingsScreen | Optimistic updates for all toggles and pickers | Alert on save failure |
| SetupScreen | Full-screen Lottie overlay during vocabulary generation | Errors logged but not shown to user |

---

## 7. Localization (i18n)

### Translation Structure

21 locale files located in `locales/`, each exporting a flat-to-nested JavaScript object. The English file (`en.ts`) is the source of truth with **274 translation keys** organized across **16 sections**:

| Section | Key Count | Purpose |
|---------|-----------|---------|
| `common` | 9 | Shared buttons/labels (OK, Cancel, Continue, etc.) |
| `auth` | 19 | Login, signup screens |
| `onboarding` | 9 | Onboarding carousel |
| `setup` | 34 | Setup wizard steps |
| `home` | 17 | Home/flashcard screen |
| `favorites` | 5 | Favorites screen |
| `settings` | 57 | Settings screen and modals |
| `level` | 8 | Level names and descriptions |
| `levelTest` | 10 | Level test screen |
| `forgotPassword` | 6 | Password reset screen |
| `example` | 10 | Example sentences screen |
| `help` | 17 | FAQ items |
| `offline` | 1 | Offline notice |
| `connection` | 3 | Connection error screen |
| `errorBoundary` | 3 | Error boundary |
| `notification` | Varies | Notification-related texts |

### How Text Keys are Resolved

1. `useTranslation()` hook provides `t()` function in functional components
2. `i18n.t()` used directly in class components (ErrorBoundary)
3. Keys are resolved against the current language resource
4. Missing keys fall back to English (`fallbackLng: 'en'`)
5. Language is auto-detected on first launch, or manually set by user

### Risks Related to Translations

1. **Notification content is not localized** — The notification body always says `"Tap to see example sentences"` in English (hardcoded in `getNotificationContent()`).
2. **Level test questions only have Turkish translations** — The `LEVEL_TEST_QUESTIONS` in `constants.ts` only include `translations.tr`, making the level test unusable for non-Turkish native speakers.
3. **Auth error messages are in English** — The `getAuthErrorMessage()` function in `AuthContext.tsx` returns hardcoded English strings.
4. **AdMob mock alerts are in Turkish** — Development mode alerts in `adMobService.ts` contain Turkish text.
5. **`VocBee v1.0.0`** in SettingsScreen is hardcoded (acceptable — app name/version are typically not translated).

---

## 8. Configuration & Environment

### Expo Configuration (`app.json`)

| Setting | Value | Notes |
|---------|-------|-------|
| `slug` | `vocbee` | Used in Expo URLs |
| `scheme` | `vocbee` | Deep linking scheme |
| `orientation` | `portrait` | Locked to portrait |
| `userInterfaceStyle` | `automatic` | Respects system dark/light mode |
| iOS bundle ID | `com.vocbee.app` | |
| Android package | `com.vocbee.app` | |

### Plugins

- `expo-font` — Custom font loading
- `expo-asset` — Bundled asset management
- `expo-notifications` — Local notification scheduling
- `react-native-google-mobile-ads` — AdMob integration (with app IDs)
- `expo-localization` — Device locale detection

### Environment Variables

| Variable | Source | Usage |
|----------|--------|-------|
| `EXPO_PUBLIC_GROQ_API_KEY` | `.env` file (not committed) | Groq LLM API key for grammar explanations |

### Firebase Configuration

Firebase config (API key, project ID, etc.) is hardcoded in `config/firebase.ts`. Auth uses React Native persistence via AsyncStorage.

### EAS Build Profiles (`eas.json`)

| Profile | Distribution | Build Type | Use Case |
|---------|-------------|------------|----------|
| `development` | Internal | Dev client | Debugging |
| `preview` | Internal | APK (Android) | Testing |
| `production` | Default | AAB (Android) | Store release |

### Platform-Specific Runtime Settings

- **Android navigation bar:** Set to transparent with absolute positioning (`expo-navigation-bar`)
- **Android notification channel:** Created with `HIGH` importance, custom vibration pattern, gold light color
- **AdMob:** Skipped entirely in Expo Go (detected via `Constants.executionEnvironment`)

---

## 9. Potential Issues & Risk Analysis

### 9.1 Scheduled Notifications

#### NOTIF-01: Incorrect Absolute Time Calculation with TIME_INTERVAL Triggers

**What can go wrong:** Notifications use `TIME_INTERVAL` triggers calculated as seconds from scheduling time. If the device clock changes (manual time change, timezone travel, DST), the actual delivery time will drift from the intended wall-clock time.

**When it can happen:** User crosses time zones, or DST transition occurs between scheduling and delivery.

**Severity:** **Medium**

---

#### NOTIF-02: No Timezone or DST Handling

**What can go wrong:** The scheduling logic uses `new Date()` and sets hours / minutes directly. No timezone offset is stored or compensated for. A user who schedules notifications at 9 AM in UTC+3 and travels to UTC+0 will still receive them at approximate UTC+3 offset from the scheduling moment, which maps to 9 AM in the old timezone (potentially 6 AM local).

**When it can happen:** User travels across time zones. DST changes shift local time by ±1 hour.

**Severity:** **Medium**

---

#### NOTIF-03: Duplicate Words in Notifications

**What can go wrong:** `getRandomUnlearnedWord()` picks a random unlearned word each time a notification is scheduled. There is no deduplication. The same word can appear in multiple notifications within the same batch of 64.

**When it can happen:** Always, especially when the pool of unlearned words is small relative to the number of scheduled notifications.

**Severity:** **Low**

---

#### NOTIF-04: Orphaned Notifications After Language or Level Change

**What can go wrong:** When the user changes language or resets progress in SettingsScreen, `cancelAllNotifications()` is not explicitly called. The 64 already-scheduled notifications still contain words from the old language. They will fire with stale content until the next `refillNotifications()` replaces them.

**When it can happen:** User changes language or resets progress via SettingsScreen.

**Severity:** **High**

---

#### NOTIF-05: Notification Permission Denial Without Graceful Fallback

**What can go wrong:** If the user denies notification permission during setup, the app shows an alert with "Open Settings" and "Continue Without" options. If the user selects "Continue Without," `handleFinalStep()` is called directly, skipping steps 5-7 (time configuration). However, if the user later enables notifications in SettingsScreen, the notification schedule will use default times rather than user-configured times.

**When it can happen:** User denies permission during setup, later enables via SettingsScreen toggle.

**Severity:** **Low**

---

#### NOTIF-06: Processing Logic Race Condition with lastForegroundTime

**What can go wrong:** `processDeliveredNotifications()` compares `scheduledTime` with `lastForegroundTime` to skip notifications delivered while the app was open. The comparison `notification.scheduledTime > lastForegroundTime` is inverted — it skips notifications that arrived AFTER the last foreground time, which is the opposite of the intended behavior. The comment says "skip if delivered while app was open," but the logic skips when `scheduledTime > lastForegroundTime` — meaning it skips notifications scheduled for the future relative to when the user last used the app, which is correct because if the notification time is AFTER the user opened the app, the user was in-app when it fired.

**When it can happen:** Edge cases around app state transitions and timing boundaries.

**Severity:** **Low**

---

#### NOTIF-07: End Time Before Start Time Not Validated

**What can go wrong:** The scheduling calculation `dailyEndMinutes - dailyStartMinutes` assumes end time is after start time. If the user sets start time to 21:00 and end time to 09:00 (overnight), the calculated `dailyTimeRangeMinutes` will be negative, resulting in `notificationsPerDay` being 0 or negative, and no notifications will be scheduled.

**When it can happen:** User sets an overnight notification window in SetupScreen or SettingsScreen.

**Severity:** **Medium**

---

#### NOTIF-08: Notification Body Not Localized

**What can go wrong:** The notification body text `"Tap to see example sentences"` is always in English regardless of the user's language setting. The word and translation are in the correct languages, but the instructional text is not.

**When it can happen:** Always, for non-English users.

**Severity:** **Low**

---

### 9.2 Services

#### SVC-01: Groq API Key Exposed in Client Bundle

**What can go wrong:** The Groq API key is loaded from `EXPO_PUBLIC_GROQ_API_KEY`, which means it is embedded in the client-side JavaScript bundle. Anyone who decompiles the app can extract and abuse the key.

**When it can happen:** After app distribution.

**Severity:** **High**

---

#### SVC-02: Vocabulary Merge Assumes Index Alignment

**What can go wrong:** `mergeVocabulary()` pairs words by array index: `targetWords[i]` with `nativeWords[i]`. If vocabulary files for different languages have different word counts or different word ordering, the translation mapping will be incorrect.

**When it can happen:** If vocabulary files are updated independently for different languages, or if some languages have more/fewer words at a given level.

**Severity:** **High**

---

#### SVC-03: AsyncStorage Size Limits

**What can go wrong:** AsyncStorage has a 6MB limit on Android. The app stores all vocabulary (21 languages × 5 levels of word lists), progress data, tracked notifications, favorites, and profile data. Large vocabulary datasets could approach this limit.

**When it can happen:** As vocabulary data grows, or when tracked notifications accumulate.

**Severity:** **Medium**

---

#### SVC-04: SyncService Missing Retry Logic

**What can go wrong:** `syncToFirestore()` makes a single attempt. If the Firestore write fails (network error, quota exceeded), progress is not synced and data loss can occur on device change.

**When it can happen:** Intermittent network during background sync.

**Severity:** **Medium**

---

#### SVC-05: Daily Sync Interval May Be Too Infrequent

**What can go wrong:** `shouldSync()` only returns `true` if 24+ hours have passed since last sync. If a user actively learns on one device and switches to another within 24 hours, the second device may not have the latest progress.

**When it can happen:** Multi-device usage within the same day.

**Severity:** **Medium**

---

#### SVC-06: No Offline Queue for Firestore Writes

**What can go wrong:** When the device is offline, Firestore writes in `syncToFirestore`, `createUserDocument`, and `fetchAndSaveUserData` will fail immediately. There is no queue-and-retry mechanism.

**When it can happen:** Any sync operation while offline.

**Severity:** **Medium**

---

#### SVC-07: Grammar Cache is In-Memory Only

**What can go wrong:** The grammar explanation cache in `groqService.ts` is a plain `Map` that is cleared on every app restart. Users will see the loading state and consume API quota for the same sentences on each fresh session.

**When it can happen:** Every app restart.

**Severity:** **Low**

---

#### SVC-08: Notification Settings Key Mismatch

**What can go wrong:** `storageKeys.ts` defines `NOTIFICATION_SETTINGS: '@VocBee:notificationSettings'` but `notificationService.ts` uses `'@notification_settings'` as the actual key. This means two different key namespaces exist. Any code that uses `STORAGE_KEYS.NOTIFICATION_SETTINGS` will read/write a different location than the notification service.

**When it can happen:** If any future code references `STORAGE_KEYS.NOTIFICATION_SETTINGS` instead of the hardcoded key in `notificationService.ts`.

**Severity:** **Low** (currently `storageKeys.ts` is not used by notification code, but it's a latent inconsistency)

---

#### SVC-09: Multiple Storage Key Systems

**What can go wrong:** The app has three overlapping key naming conventions:
1. `storageKeys.ts`: `@VocBee:...` prefix
2. `storage.ts`: `@vocbee_...` prefix
3. Individual services: bare `@...` prefix (e.g., `@user_progress`, `@notification_settings`)

`clearAllLocalData()` in `storage.ts` explicitly lists keys from convention #3 but not from #1. If code later uses `storageKeys.ts` keys, they won't be cleaned up on language change or logout.

**When it can happen:** Future development that references `storageKeys.ts`.

**Severity:** **Low** (currently only convention #3 is used for actual data)

---

### 9.3 Navigation

#### NAV-01: Unsafe Type Casting of Route Names

**What can go wrong:** Several navigation calls use `as any` casting: `navigation.reset({ routes: [{ name: 'Login' as any }] })`. This bypasses TypeScript's route parameter validation and could cause runtime crashes if route names change.

**When it can happen:** If route names in `RootStackParamList` are refactored.

**Severity:** **Low**

---

#### NAV-02: SetupScreen Routes Registered but Unused

**What can go wrong:** `types.ts` defines `TargetLanguage` and `LevelSelection` routes, but there is no `Stack.Screen` registered for them in `App.tsx`. The `SetupScreen` handles all setup steps internally. If any code attempts to navigate to these routes, it will crash.

**When it can happen:** If legacy code or deep links reference these routes.

**Severity:** **Low**

---

#### NAV-03: Google Sign-In Loses userData Context

**What can go wrong:** During Google Sign-In, `fetchAndSaveUserData` is called. If it returns `null` (first-time Google user), `setUserData(fetchedData)` sets state to `null`. The `determineInitialRoute` logic then sees `userData` as null and may route to login instead of setup.

**When it can happen:** First-time Google Sign-In. The code does create a user document if `fetchedData` is `null`, but `setUserData(fetchedData)` is called with the original `null` return value before the document creation block runs.

**Severity:** **Medium**

---

#### NAV-04: initialRouteName Only Evaluated Once

**What can go wrong:** The `initialRouteName` prop of `Stack.Navigator` is only read on first render. If the auth state changes while the navigation tree is mounted (e.g., session expires), the user will remain on their current screen. There is no automatic redirect to Login on auth state loss.

**When it can happen:** Token expiry or account deletion from another device while app is running.

**Severity:** **Medium**

---

### 9.4 Lifecycle Edge Cases

#### LIFE-01: State Loss on App Kill During Setup

**What can go wrong:** The SetupScreen stores all selections in local React state (`useState`). If the app is killed by the OS between language selection and the final save step, all progress is lost and the user must restart setup.

**When it can happen:** Low memory situations, OS-initiated app termination during setup.

**Severity:** **Low**

---

#### LIFE-02: clearAllLocalData Called on Every Sign-In

**What can go wrong:** `signIn()` in AuthContext calls `clearAllLocalData()` BEFORE `signInWithEmailAndPassword()`. If sign-in fails (wrong password), all local data has already been wiped. On the next successful login, the app fetches fresh data from Firebase, but cached data (shuffle order, notification tracking) is lost.

**When it can happen:** Every sign-in attempt, even failed ones.

**Severity:** **Medium**

---

#### LIFE-03: No Data Migration on App Update

**What can go wrong:** When the app is updated, AsyncStorage data persists but its schema may change. There is no version tracking or migration system. Adding new required fields or changing key names could leave users with stale or incompatible data.

**When it can happen:** Any app update that changes data schema.

**Severity:** **Medium**

---

#### LIFE-04: Vocabulary Not Regenerated on Level Change

**What can go wrong:** When a user changes their level in Settings, only `@user_level` and `@current_level` are updated. The vocabulary data in `@vocabulary` is already generated for all 5 CEFR levels during setup, so this works correctly. However, if vocabulary data becomes corrupted or was partially generated, there is no mechanism to regenerate it from Settings.

**When it can happen:** Only if initial vocabulary generation was incomplete.

**Severity:** **Low**

---

#### LIFE-05: signUp Hardcodes Default Preferences

**What can go wrong:** In `AuthContext.signUp()`, a `newUserData` object is created with hardcoded preferences `nativeLanguage: 'turkish', targetLanguage: 'english', level: 'A1'`. This is saved locally before the user goes through setup. If the setup flow is interrupted, these defaults persist and may conflict with what the user actually selects later.

**When it can happen:** Every signup, though setup typically overwrites these values.

**Severity:** **Low**

---

### 9.5 Authentication

#### AUTH-01: Firebase Config Hardcoded in Source

**What can go wrong:** Firebase configuration including `apiKey`, `projectId`, and client IDs are hardcoded in `config/firebase.ts` and `AuthContext.tsx`. While Firebase API keys are designed to be public, the Firestore security rules become the sole line of defense. If rules are misconfigured, data is exposed.

**When it can happen:** If Firestore security rules are not properly configured.

**Severity:** **Medium**

---

#### AUTH-02: Delete Account May Fail for Long-Lived Sessions

**What can go wrong:** `deleteUser()` from Firebase Auth requires a recent authentication. If the session is old, Firebase throws `auth/requires-recent-login`. The current code does not handle re-authentication before deletion.

**When it can happen:** User attempts to delete account after being logged in for an extended period without re-authenticating.

**Severity:** **Medium**

---

### 9.6 Level Test

#### TEST-01: Level Test Only Works for Turkish Native Speakers

**What can go wrong:** `LEVEL_TEST_QUESTIONS` in `constants.ts` only includes a `tr` (Turkish) key in the `translations` object. The `LevelTestScreen` attempts to match the user's native language to find translations. For any language other than Turkish, the question options will be undefined or empty.

**When it can happen:** Any non-Turkish user who takes the level test.

**Severity:** **High**

---

## 10. Production Readiness Assessment

### Overall Stability Evaluation

The application demonstrates a well-structured architecture with clear separation of concerns between screens, services, and contexts. The core vocabulary learning loop (flashcards, progress tracking, level advancement) is solid and well-implemented. Error handling is consistently applied across services with graceful degradation patterns.

**Stability Rating: 7/10**

The app is functional for its primary use case but has several gaps that would affect non-Turkish users and multi-device scenarios.

### High-Risk Areas Before Release

| Priority | Issue | Risk |
|----------|-------|------|
| 🔴 Critical | Level test only works in Turkish (TEST-01) | Completely broken feature for 20 of 21 supported languages |
| 🔴 Critical | Groq API key in client bundle (SVC-01) | API key can be extracted and abused; financial risk |
| 🔴 Critical | Orphaned notifications after language change (NOTIF-04) | Users receive notifications in wrong language |
| 🟡 High | Vocabulary merge assumes index alignment (SVC-02) | Potential incorrect translations across all languages |
| 🟡 High | clearAllLocalData on every sign-in attempt (LIFE-02) | Data loss on failed login attempts |
| 🟡 High | Google Sign-In userData null race (NAV-03) | New Google users may see incorrect initial routing |
| 🟡 High | No end-time-before-start-time validation (NOTIF-07) | Silent notification failure for overnight users |
| 🟡 Medium | Delete account requires-recent-login not handled (AUTH-02) | Feature may fail with cryptic error |
| 🟡 Medium | No data migration system (LIFE-03) | Risk grows with each subsequent update |

### Long-Term Maintainability Concerns

1. **Storage key fragmentation** — Three different naming conventions (`@VocBee:*`, `@vocbee_*`, `@*`) create confusion and risk of orphaned data during cleanup operations.

2. **Single AsyncStorage bottleneck** — All data (vocabulary for 21 languages × 5 levels, progress, notifications, favorites, settings) flows through AsyncStorage. As the app grows, this will hit size limits and performance ceilings. Consider migrating large datasets (vocabulary) to a local SQLite database.

3. **No crash/analytics reporting** — The `ErrorBoundary` has a comment placeholder for Sentry/Crashlytics integration but no actual implementation. Production issues will be invisible.

4. **Notification system complexity** — The tracking/processing/refilling pipeline for notifications is intricate and hard to debug. Each step depends on correct timing and state. Consider simplifying with repeating triggers or a backend push notification system.

5. **Auth error messages in English** — The `getAuthErrorMessage()` function returns hardcoded English strings instead of using the i18n system. This affects all non-English users.

6. **Ad unit IDs are test IDs** — The AdMob unit IDs in `adMobService.ts` are Google test IDs (`ca-app-pub-3940256099942544/...`). These must be replaced with production IDs before release.

7. **No unit test coverage for services** — The `__tests__` directories exist under `screens/`, `components/`, and `services/` but service-level test coverage for the notification scheduling logic, progress tracking, and sync flow would significantly reduce regression risk.

---

*End of document.*
