// Navigation contract shared by the app shell and feature presentation screens.
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  NativeLanguage: { detectedLevel?: string } | undefined;
  LevelTest: { nativeLanguage: string; targetLanguage: string };
  MainTabs: undefined;
  Settings: undefined;
  Favorites: undefined;
  Game: undefined;
  ExampleSentences: {
    word: string;
    pronunciation?: string | null;
    translation: string;
    sentence1: string;
    sentence2: string;
    nativeSentence1: string;
    nativeSentence2: string;
  };
};

export interface Language {
  id: string;
  name: string;
  nativeName?: string;
  flag: string;
}

export interface Level {
  id: string;
  title: string;
  range: string;
  description: string;
  color: string;
}
