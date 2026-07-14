export interface SyncNotificationSettings {
  enabled: boolean;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  frequencyMinutes: number;
  autoMarkLearned: boolean;
}

export interface AuthProfileSyncInput {
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
}

export interface LocalSyncSnapshot {
  currentLevel: string;
  userLevel: string;
  lastWordId: number | null;
  learnedWords: Record<string, number[]>;
  profileName?: string;
  profileImage?: string | null;
  hasProfileImage: boolean;
  notificationSettings: SyncNotificationSettings | null;
  streak: unknown;
  preferences: {
    nativeLanguage: string;
    targetLanguage: string;
    level: string;
  } | null;
}

export interface RemoteUserDocument {
  email?: string;
  displayName?: string | null;
  photoURL?: string | null;
  setupCompleted?: boolean;
  preferences?: {
    nativeLanguage: string;
    targetLanguage: string;
    level: string;
  } | null;
  progress?: {
    learnedWords?: Record<string, number[]>;
    currentLevel?: string;
    lastWordIndex?: number;
  } | null;
  notificationSettings?: SyncNotificationSettings | null;
  streak?: unknown;
  lastActiveDeviceId?: string | null;
  [key: string]: unknown;
}
