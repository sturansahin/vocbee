import React, {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
} from '@features/notifications';
import type { Profile } from '@features/profile';
import type { UserData } from '@shared/storage';

import type { AuthFacade, AuthActionResult } from '../application/contracts';
import type { AuthUser } from '../domain/types';

const EMPTY_PROFILE: Profile = { name: '', image: null, email: '' };

export interface AuthContextType {
  user: AuthUser | null;
  userData: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  connectionError: boolean;
  signUp(email: string, password: string, displayName?: string): Promise<void>;
  signIn(email: string, password: string): Promise<{ setupCompleted: boolean }>;
  signOut(): Promise<void>;
  signInWithGoogle(): Promise<{ setupCompleted: boolean }>;
  signInWithApple(): Promise<{ setupCompleted: boolean }>;
  resetPassword(email: string): Promise<void>;
  refreshUserData(): Promise<void>;
  retryConnection(): Promise<void>;
  deleteAccount(): Promise<void>;
  profile: Profile;
  updateProfileData(data: Partial<Profile>): Promise<void>;
  notificationSettings: NotificationSettings;
  updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void>;
  refreshNotificationSettings(): Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthStateProviderProps {
  children: ReactNode;
  facade: AuthFacade;
}

export function AuthStateProvider({ children, facade }: AuthStateProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [notificationSettings, setNotificationSettings] = useState(DEFAULT_NOTIFICATION_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const sessionGeneration = useRef(0);

  useEffect(() => {
    facade.initialize();
    return facade.subscribe(nextUser => {
      const generation = ++sessionGeneration.current;
      setUser(nextUser);
      void facade
        .bootstrapSession(nextUser)
        .then(snapshot => {
          if (generation !== sessionGeneration.current) return;
          setUserData(snapshot.userData);
          setProfile(snapshot.profile);
          setNotificationSettings(snapshot.notificationSettings);
          setConnectionError(snapshot.connectionError);
        })
        .catch(error => {
          if (generation !== sessionGeneration.current) return;
          console.error('[AuthProvider] Session bootstrap failed:', error);
          setConnectionError(!!nextUser);
        })
        .finally(() => {
          if (generation === sessionGeneration.current) setIsLoading(false);
        });
    });
  }, [facade]);

  const applyAuthAction = (result: AuthActionResult): { setupCompleted: boolean } => {
    setUserData(result.userData);
    setProfile(result.profile);
    setNotificationSettings(result.notificationSettings);
    setConnectionError(result.connectionError);
    return { setupCompleted: result.setupCompleted };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    setIsLoading(true);
    try {
      setUserData(await facade.signUp(email, password, displayName));
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      return applyAuthAction(await facade.signIn(email, password));
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      return applyAuthAction(await facade.signInWithGoogle());
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithApple = async () => {
    setIsLoading(true);
    try {
      return applyAuthAction(await facade.signInWithApple());
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await facade.signOut(user);
      setUserData(null);
      setProfile(EMPTY_PROFILE);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = async () => {
    if (!user) return;
    const result = await facade.refreshUserData(user);
    setUserData(result.userData);
    setNotificationSettings(result.notificationSettings);
    setConnectionError(result.connectionError);
  };

  const retryConnection = async () => {
    if (!user) return;
    setIsLoading(true);
    setConnectionError(false);
    try {
      const result = await facade.retryConnection(user);
      setUserData(result.userData);
      setNotificationSettings(result.notificationSettings);
      setConnectionError(result.connectionError);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async () => {
    setIsLoading(true);
    try {
      await facade.deleteAccount(user);
      setUserData(null);
      setProfile(EMPTY_PROFILE);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfileData = async (patch: Partial<Profile>) => {
    const optimistic = { ...profile, ...patch };
    setProfile(optimistic);
    setProfile(await facade.updateProfileData(user, profile, patch));
  };

  const updateNotificationSettings = async (patch: Partial<NotificationSettings>) => {
    setNotificationSettings(current => ({ ...current, ...patch }));
    setNotificationSettings(
      await facade.updateNotificationSettings(user, notificationSettings, patch)
    );
  };

  const refreshNotificationSettings = async () => {
    try {
      setNotificationSettings(await facade.refreshNotificationSettings());
    } catch (error) {
      console.error('Error refreshing notification settings:', error);
    }
  };

  const value: AuthContextType = {
    user,
    userData,
    isLoading,
    isAuthenticated: !!user,
    connectionError,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    signInWithApple,
    resetPassword: email => facade.resetPassword(email),
    refreshUserData,
    retryConnection,
    deleteAccount,
    profile,
    updateProfileData,
    notificationSettings,
    updateNotificationSettings,
    refreshNotificationSettings,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
