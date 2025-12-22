export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  SignUp: undefined;
  NativeLanguage: { detectedLevel?: string } | undefined;
  TargetLanguage: undefined;
  LevelSelection: undefined;
  LevelTest: undefined;
  MainTabs: undefined;
  Settings: undefined;
  ExampleSentences: { word: string; translation: string; definition: string };
};

export interface Language {
  id: string;
  name: string;
  nativeName?: string;
  flag: string; // Emoji or URL
}

export interface Level {
  id: string;
  title: string;
  range: string;
  description: string;
  color: string;
}

