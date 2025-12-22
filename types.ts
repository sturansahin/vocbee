export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  SignUp: undefined;
  NativeLanguage: undefined;
  TargetLanguage: undefined;
  LevelSelection: undefined;
  MainTabs: undefined;
  ExampleSentences: { word: string; translation: string; definition: string };
};

export type MainTabParamList = {
  Home: undefined;
  Flashcards: undefined;
  Settings: undefined;
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
