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
  vocabularySchemaVersion: number;
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
    lastSync?: unknown;
  } | null;
  activeLevel?: string;
  schemaVersion?: number;
  /** Runtime-only resolved v2 view assembled by FirestoreSyncRepository; never stored on the main doc. */
  progressV2?: {
    learnedWords: Record<string, number[]>;
    currentLevel: string;
    lastWordId: number;
    source: 'v2' | 'legacy-reconciled';
  };
  notificationSettings?: SyncNotificationSettings | { enabled: false } | null;
  streak?: unknown;
  lastActiveDeviceId?: string | null;
  [key: string]: unknown;
}
