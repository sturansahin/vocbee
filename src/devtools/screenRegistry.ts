// src/devtools/screenRegistry.ts
// Declarative list of existing production screens that the Developer Test Panel can open.
// This module only IMPORTS screens (read-only reference) — it never modifies them.
//
// Route params: some screens require navigation params to render meaningfully (LevelTestScreen,
// ExampleSentencesScreen). `sampleParams` supplies harmless fixture params so DevToolsNavigator can
// push them directly. Screens with no required params use `undefined`.

import type { ComponentType } from 'react';
import { ForgotPasswordScreen, LoginScreen, SignUpScreen } from '@features/auth';
import { FavoritesScreen } from '@features/favorites';
import { ExampleSentencesScreen, HomeScreen } from '@features/learning';
import OnboardingScreen from '@features/onboarding';
import SettingsScreen from '@features/settings';
import { LevelTestScreen, SetupScreen } from '@features/setup';
import type { RootStackParamList } from '../app/navigation/types';

export interface ScreenRegistryEntry {
  /** Stable unique id used by the Screen Tester list and test IDs. */
  id: string;
  /** Production route name so navigation inside the real screen works in the test stack. */
  routeName: keyof RootStackParamList;
  /** Human-readable label shown in the ScreenTesterPanel list. */
  label: string;
  /** The real, unmodified screen component. */
  component: ComponentType<any>;
  /** Harmless sample params to pass via navigation for screens that require a route param. */
  sampleParams?: Record<string, unknown>;
  /** Short note on what this screen needs (auth state, params) to render meaningfully. */
  notes?: string;
}

export const SCREEN_REGISTRY: ScreenRegistryEntry[] = [
  {
    id: 'Onboarding',
    routeName: 'Onboarding',
    label: 'Onboarding',
    component: OnboardingScreen,
  },
  { id: 'Login', routeName: 'Login', label: 'Login', component: LoginScreen },
  { id: 'SignUp', routeName: 'SignUp', label: 'Sign Up', component: SignUpScreen },
  {
    id: 'ForgotPassword',
    routeName: 'ForgotPassword',
    label: 'Forgot Password',
    component: ForgotPasswordScreen,
  },
  {
    id: 'NativeLanguage',
    routeName: 'NativeLanguage',
    label: 'Setup (Native Language / steps)',
    component: SetupScreen,
  },
  {
    id: 'LevelTest',
    routeName: 'LevelTest',
    label: 'Level Test',
    component: LevelTestScreen,
    sampleParams: { nativeLanguage: 'turkish', targetLanguage: 'english' },
    notes: 'Requires nativeLanguage/targetLanguage route params — sample params supplied.',
  },
  {
    id: 'Home',
    routeName: 'MainTabs',
    label: 'Home (main learning screen)',
    component: HomeScreen,
    notes: 'Reads useAuth/useMonetization from real providers.',
  },
  {
    id: 'Settings',
    routeName: 'Settings',
    label: 'Settings',
    component: SettingsScreen,
    notes: 'Reads useAuth/useMonetization from real providers.',
  },
  {
    id: 'Favorites',
    routeName: 'Favorites',
    label: 'Favorites',
    component: FavoritesScreen,
  },
  {
    id: 'ExampleSentences',
    routeName: 'ExampleSentences',
    label: 'Example Sentences',
    component: ExampleSentencesScreen,
    sampleParams: {
      word: 'hello',
      pronunciation: null,
      translation: 'merhaba',
      sentence1: 'Hello, how are you?',
      sentence2: 'She said hello to everyone.',
      nativeSentence1: 'Merhaba, nasılsın?',
      nativeSentence2: 'Herkese merhaba dedi.',
    },
    notes: 'Requires word/translation/sentence route params — sample params supplied.',
  },
];

export function assertNoDuplicateScreenIds(entries: ScreenRegistryEntry[] = SCREEN_REGISTRY): void {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.id)) {
      throw new Error(`[DevTools] Duplicate screenRegistry id detected: "${entry.id}"`);
    }
    seen.add(entry.id);
  }
}
