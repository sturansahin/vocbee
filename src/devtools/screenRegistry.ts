// src/devtools/screenRegistry.ts
// Declarative list of existing production screens that the Developer Test Panel can open.
// This module only IMPORTS screens (read-only reference) — it never modifies them.
//
// Route params: some screens require navigation params to render meaningfully (LevelTestScreen,
// ExampleSentencesScreen). `sampleParams` supplies harmless fixture params so DevToolsNavigator can
// push them directly. Screens with no required params use `undefined`.

import type { ComponentType } from 'react';
import OnboardingScreen from '../../screens/OnboardingScreen';
import { LoginScreen, SignUpScreen } from '../../screens/AuthScreens';
import { SetupScreen } from '../../screens/SetupScreens';
import HomeScreen from '../../screens/HomeScreen';
import SettingsScreen from '../../screens/SettingsScreen';
import FavoritesScreen from '../../screens/FavoritesScreen';
import ExampleSentencesScreen from '../../screens/ExampleSentencesScreen';
import LevelTestScreen from '../../screens/LevelTestScreen';
import ForgotPasswordScreen from '../../screens/ForgotPasswordScreen';

export interface ScreenRegistryEntry {
  /** Stable unique id — used as the DevTools stack route name. Must be unique across the registry. */
  id: string;
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
  { id: 'Onboarding', label: 'Onboarding', component: OnboardingScreen },
  { id: 'Login', label: 'Login', component: LoginScreen },
  { id: 'SignUp', label: 'Sign Up', component: SignUpScreen },
  { id: 'ForgotPassword', label: 'Forgot Password', component: ForgotPasswordScreen },
  { id: 'NativeLanguage', label: 'Setup (Native Language / steps)', component: SetupScreen },
  {
    id: 'LevelTest',
    label: 'Level Test',
    component: LevelTestScreen,
    sampleParams: { nativeLanguage: 'turkish', targetLanguage: 'english' },
    notes: 'Requires nativeLanguage/targetLanguage route params — sample params supplied.',
  },
  { id: 'Home', label: 'Home (main learning screen)', component: HomeScreen, notes: 'Reads useAuth/useMonetization from real providers.' },
  { id: 'Settings', label: 'Settings', component: SettingsScreen, notes: 'Reads useAuth/useMonetization from real providers.' },
  { id: 'Favorites', label: 'Favorites', component: FavoritesScreen },
  {
    id: 'ExampleSentences',
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
