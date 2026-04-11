// Authentication Context for VocBee
// Handles user authentication state and Firebase Auth operations

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithCredential,
    deleteUser,
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import { auth } from '../config/firebase';
import {
    configureNativeGoogleSignIn,
    disconnectNativeGoogleSession,
    getNativeGoogleSignInErrorMessage,
    signInWithNativeGoogle,
} from '../services/nativeGoogleSignIn';
import {
    getLocalUserData,
    saveUserDataLocally,
    clearAllLocalData,
    UserData,
    getDeviceId,
} from '../services/storage';
import {
    createUserDocument,
    fetchAndSaveUserData,
    forceSync,
    getActiveDeviceIdFromFirebase,
    syncAuthProfileToFirestore,
    syncNotificationSettingsToFirestore,
} from '../services/SyncService';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { resetProgress } from '../services/progressService';
import {
    NotificationSettings,
    DEFAULT_NOTIFICATION_SETTINGS,
    getNotificationSettings,
    saveNotificationSettings,
    cancelAllNotifications,
    clearTrackedNotifications,
} from '../services/notificationService';
import {
    buildStoredProfileFromAuth,
    StoredProfile,
} from '../services/socialAuthProfile';
import { STORAGE_KEYS } from '../services/storageKeys';

interface ProfileData {
    name: string;
    image: string | null;
    email: string;
}

// Types
interface AuthContextType {
    user: User | null;
    userData: UserData | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    connectionError: boolean;
    signUp: (email: string, password: string, displayName?: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<{ setupCompleted: boolean }>;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<{ setupCompleted: boolean }>;
    signInWithApple: () => Promise<{ setupCompleted: boolean }>;
    resetPassword: (email: string) => Promise<void>;
    refreshUserData: () => Promise<void>;
    retryConnection: () => Promise<void>;
    deleteAccount: () => Promise<void>;
    profile: ProfileData;
    updateProfileData: (data: Partial<ProfileData>) => Promise<void>;
    notificationSettings: NotificationSettings;
    updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
    refreshNotificationSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SOCIAL_AUTH_CANCELLED_ERROR = 'AUTH_CANCELLED';

// Provider Props
interface AuthProviderProps {
    children: ReactNode;
}

// Auth Provider Component
export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [profile, setProfile] = useState<ProfileData>({
        name: '',
        image: null,
        email: ''
    });
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [connectionError, setConnectionError] = useState(false);

    useEffect(() => {
        try {
            configureNativeGoogleSignIn();
        } catch (error) {
            console.error('Google Sign-In configuration error:', error);
        }
    }, []);

    const loadStoredProfile = async (uid: string): Promise<StoredProfile | null> => {
        try {
            const storedProfile = await AsyncStorage.getItem(`${STORAGE_KEYS.PROFILE_PREFIX}${uid}`);
            return storedProfile ? JSON.parse(storedProfile) : null;
        } catch (error) {
            console.error('Error loading stored profile:', error);
            return null;
        }
    };

    const persistProfileState = async (uid: string, nextProfile: StoredProfile): Promise<void> => {
        setProfile(nextProfile);
        await AsyncStorage.setItem(`${STORAGE_KEYS.PROFILE_PREFIX}${uid}`, JSON.stringify(nextProfile));
    };

    const hydrateProfileFromAuthState = async (
        firebaseUser: User
    ): Promise<StoredProfile> => {
        const storedProfile = await loadStoredProfile(firebaseUser.uid);
        const nextProfile = buildStoredProfileFromAuth({
            existingProfile: storedProfile,
            email: firebaseUser.email,
            authDisplayName: firebaseUser.displayName,
            authPhotoURL: firebaseUser.photoURL,
        });
        await persistProfileState(firebaseUser.uid, nextProfile);
        return nextProfile;
    };

    const finalizeFetchedUserData = async (
        firebaseUser: User,
        fallbackProfile: StoredProfile
    ): Promise<{ setupCompleted: boolean }> => {
        const fetchedData = await applyFetchedUserData(firebaseUser.uid);

        if (fetchedData) {
            const refreshedProfile = await loadStoredProfile(firebaseUser.uid);
            if (refreshedProfile) {
                setProfile(refreshedProfile);
            } else {
                setProfile(fallbackProfile);
            }

            return { setupCompleted: hasCompletedSetup(fetchedData) };
        }

        const fallbackUserData: UserData = {
            uid: firebaseUser.uid,
            email: fallbackProfile.email,
            displayName: fallbackProfile.name || undefined,
        };
        await saveUserDataLocally(fallbackUserData);
        setUserData(fallbackUserData);
        await persistProfileState(firebaseUser.uid, fallbackProfile);

        return { setupCompleted: false };
    };

    const completeSocialSignIn = async (
        firebaseUser: User,
        profileInput: {
            email?: string | null;
            displayName?: string | null;
            photoURL?: string | null;
        }
    ): Promise<{ setupCompleted: boolean }> => {
        const storedProfile = await loadStoredProfile(firebaseUser.uid);
        const nextProfile = buildStoredProfileFromAuth({
            existingProfile: storedProfile,
            email: profileInput.email ?? firebaseUser.email,
            authDisplayName: firebaseUser.displayName,
            authPhotoURL: firebaseUser.photoURL,
            preferredDisplayName: profileInput.displayName,
            preferredPhotoURL: profileInput.photoURL,
        });

        const normalizedProviderDisplayName =
            typeof profileInput.displayName === 'string' && profileInput.displayName.trim()
                ? profileInput.displayName.trim()
                : null;
        const normalizedProviderPhoto =
            typeof profileInput.photoURL === 'string' && profileInput.photoURL.trim()
                ? profileInput.photoURL.trim()
                : null;

        const authProfileUpdate: { displayName?: string; photoURL?: string } = {};
        if (normalizedProviderDisplayName && normalizedProviderDisplayName !== firebaseUser.displayName) {
            authProfileUpdate.displayName = normalizedProviderDisplayName;
        }
        if (normalizedProviderPhoto && normalizedProviderPhoto !== firebaseUser.photoURL) {
            authProfileUpdate.photoURL = normalizedProviderPhoto;
        }
        if (Object.keys(authProfileUpdate).length > 0) {
            await updateProfile(firebaseUser, authProfileUpdate);
        }

        // Clear local storage AFTER successful sign-in
        await clearAllLocalData();
        await cancelAllNotifications();
        await clearTrackedNotifications();

        await createUserDocument(
            firebaseUser.uid,
            nextProfile.email,
            nextProfile.name,
            nextProfile.image
        );
        await syncAuthProfileToFirestore(firebaseUser.uid, {
            email: nextProfile.email,
            displayName: nextProfile.name,
            photoURL: nextProfile.image,
        });
        await persistProfileState(firebaseUser.uid, nextProfile);

        return finalizeFetchedUserData(firebaseUser, nextProfile);
    };

    const loadNotificationSettingsIntoState = async (): Promise<NotificationSettings> => {
        const settings = await getNotificationSettings();
        setNotificationSettings(settings);
        return settings;
    };

    const applyFetchedUserData = async (uid: string): Promise<UserData | null> => {
        const fetchedData = await fetchAndSaveUserData(uid);
        setUserData(fetchedData);
        await loadNotificationSettingsIntoState();
        return fetchedData;
    };

    const hasCompletedSetup = (data: UserData | null): boolean =>
        !!(data?.setupCompleted || (data?.preferences?.nativeLanguage && data?.preferences?.targetLanguage));

    const clearNativeGoogleSession = async (): Promise<void> => {
        try {
            await disconnectNativeGoogleSession();
        } catch (error) {
            console.warn('Failed to clear native Google session:', error);
        }
    };

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            // Load Global Settings (Notifications) immediately
            // This ensures they are ready for SettingsScreen without extra loading state
            try {
                await loadNotificationSettingsIntoState();
            } catch (e) {
                console.error('Error loading initial notification settings:', e);
            }

            if (firebaseUser) {
                // Cache-first strategy with device ID check
                // Fetch from Firebase if: no cache, different user, different device, or setup not completed
                const localData = await getLocalUserData();
                const currentDeviceId = await getDeviceId();
                const firebaseDeviceId = await getActiveDeviceIdFromFirebase(firebaseUser.uid);

                const shouldUseCache = localData &&
                    localData.uid === firebaseUser.uid &&
                    localData.setupCompleted &&
                    // If Firebase device ID is null (offline), trust local cache if user matches
                    (firebaseDeviceId === null || currentDeviceId === firebaseDeviceId);

                if (shouldUseCache) {
                    // Use cached data - same device or offline, faster startup
                    setUserData(localData);
                    setConnectionError(firebaseDeviceId === null); // Mark as offline if device ID check failed
                    console.log('[AuthContext] Using cached user data', firebaseDeviceId === null ? '(offline)' : '(same device)');
                } else {
                    // Different device or no valid cache - fetch from Firebase
                    const reason = !localData ? 'no cache' :
                        localData.uid !== firebaseUser.uid ? 'different user' :
                            !localData.setupCompleted ? 'setup not completed' :
                                currentDeviceId !== firebaseDeviceId ? 'different device' : 'unknown';
                    console.log(`[AuthContext] Fetching from Firebase (reason: ${reason})`);

                    try {
                        const fetchedData = await applyFetchedUserData(firebaseUser.uid);
                        if (fetchedData) {
                            setConnectionError(false);
                            console.log('[AuthContext] Loaded user data from Firebase');
                        } else {
                            // No data returned - could be new user (no preferences yet) or connection issue
                            // For new users after signup, this is expected - treat as new user, not error
                            console.log('[AuthContext] No user data from Firebase - treating as new user');

                            // Create minimal user data for new user
                            const newUserData: UserData = {
                                uid: firebaseUser.uid,
                                email: firebaseUser.email || '',
                                displayName: firebaseUser.displayName || undefined,
                                // No preferences means setupCompleted will be false
                            };
                            await saveUserDataLocally(newUserData);
                            setUserData(newUserData);
                            setConnectionError(false);
                        }
                    } catch (error: any) {
                        // Connection error during fetch
                        console.error('[AuthContext] Error fetching user data:', error);

                        // Fallback to local cache if available and setup was completed
                        if (localData && localData.setupCompleted) {
                            console.log('[AuthContext] Using cached data as offline fallback');
                            setUserData(localData);
                            setConnectionError(true); // Show offline banner but allow app usage
                        } else {
                            // No valid cache - must show connection error screen
                            console.log('[AuthContext] No valid cache, showing connection error');
                            setConnectionError(true);
                        }
                    }
                }

                // Load profile data (after fetchAndSaveUserData may have updated it)
                try {
                    await hydrateProfileFromAuthState(firebaseUser);
                } catch (e) {
                    console.error('Error loading profile:', e);
                }

            } else {
                setUserData(null);
                setProfile({
                    name: '',
                    image: null,
                    email: ''
                });
            }
            setIsLoading(false);
        });

        return unsubscribe;
    }, []);

    // Sign Up
    const signUp = async (email: string, password: string, displayName?: string) => {
        try {
            setIsLoading(true);

            // Cancel any existing notifications (in case of previous user on device)
            await cancelAllNotifications();
            await clearTrackedNotifications();

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Update display name if provided
            if (displayName) {
                await updateProfile(userCredential.user, { displayName });
            }

            // Create user document in Firestore
            await createUserDocument(userCredential.user.uid, email, displayName);

            // Save locally (no preferences yet — user goes through setup)
            const newUserData: UserData = {
                uid: userCredential.user.uid,
                email,
                displayName,
            };
            await saveUserDataLocally(newUserData);
            setUserData(newUserData);

        } catch (error: any) {
            console.error('Sign up error:', error);
            throw new Error(getAuthErrorMessage(error.code));
        } finally {
            setIsLoading(false);
        }
    };

    // Sign In
    const signIn = async (email: string, password: string): Promise<{ setupCompleted: boolean }> => {
        try {
            setIsLoading(true);

            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Clear local storage AFTER successful sign-in (not before, to avoid data loss on failure)
            await clearAllLocalData();

            // Cancel all scheduled notifications for previous user
            await cancelAllNotifications();
            await clearTrackedNotifications();

            // Fetch user data from Firestore and save locally
            const fetchedData = await applyFetchedUserData(userCredential.user.uid);

            // Return setup status
            return { setupCompleted: hasCompletedSetup(fetchedData) };

        } catch (error: any) {
            console.error('Sign in error:', error);
            throw new Error(getAuthErrorMessage(error.code));
        } finally {
            setIsLoading(false);
        }
    };

    // Sign In with Google
    const signInWithGoogle = async (): Promise<{ setupCompleted: boolean }> => {
        try {
            setIsLoading(true);

            const googleResult = await signInWithNativeGoogle();
            if (googleResult.type === 'cancelled') {
                throw new Error(SOCIAL_AUTH_CANCELLED_ERROR);
            }

            const credential = GoogleAuthProvider.credential(googleResult.idToken);
            const userCredential = await signInWithCredential(auth, credential);

            return await completeSocialSignIn(userCredential.user, {
                email: googleResult.profile.email || userCredential.user.email,
                displayName: googleResult.profile.displayName ?? userCredential.user.displayName,
                photoURL: googleResult.profile.photoURL ?? userCredential.user.photoURL,
            });
        } catch (error: any) {
            if (error.message === SOCIAL_AUTH_CANCELLED_ERROR) {
                throw error;
            }

            console.error('Google Sign-In error:', error);
            throw new Error(getNativeGoogleSignInErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    // Sign In with Apple
    const signInWithApple = async (): Promise<{ setupCompleted: boolean }> => {
        try {
            setIsLoading(true);
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            if (credential.identityToken) {
                const provider = new OAuthProvider('apple.com');
                const authCredential = provider.credential({
                    idToken: credential.identityToken,
                });
                const userCredential = await signInWithCredential(auth, authCredential);

                let displayName = userCredential.user.displayName;
                if (!displayName && credential.fullName?.givenName) {
                    displayName = `${credential.fullName.givenName} ${credential.fullName.familyName || ''}`.trim();
                }

                return await completeSocialSignIn(userCredential.user, {
                    email: userCredential.user.email || credential.email || '',
                    displayName: displayName || undefined,
                    photoURL: userCredential.user.photoURL,
                });
            } else {
                throw new Error('No identity token.');
            }
        } catch (error: any) {
            if (error.code === 'ERR_REQUEST_CANCELED') {
                throw new Error(SOCIAL_AUTH_CANCELLED_ERROR);
            }
            if (error.message === SOCIAL_AUTH_CANCELLED_ERROR) {
                throw error;
            }
            console.error('Apple Sign-In error:', error);
            throw new Error('Failed to sign in with Apple. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Sign Out
    const signOut = async () => {
        try {
            setIsLoading(true);

            // Force sync before logout to save any pending changes
            if (user) {
                await forceSync(user.uid);
            }

            // Cancel all scheduled notifications
            await cancelAllNotifications();
            await clearTrackedNotifications();

            // Clear local data
            await clearAllLocalData();
            await resetProgress();

            // Sign out from Firebase
            await firebaseSignOut(auth);
            await clearNativeGoogleSession();

            setUserData(null);
        } catch (error: any) {
            console.error('Sign out error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Reset Password
    const resetPassword = async (email: string) => {
        try {
            // Configure redirection URL
            const actionCodeSettings = {
                url: 'https://vocbee-6fe24.firebaseapp.com',
                handleCodeInApp: false,
            };

            await sendPasswordResetEmail(auth, email, actionCodeSettings);
            console.log('Password reset email sent successfully to:', email);
        } catch (error: any) {
            console.error('Password reset error:', error);
            throw new Error(getAuthErrorMessage(error.code));
        }
    };

    // Refresh user data from Firestore
    const refreshUserData = async () => {
        if (user) {
            await applyFetchedUserData(user.uid);
        }
    };

    // Update profile data
    const updateProfileData = async (data: Partial<ProfileData>) => {
        if (!user) return;

        const newProfile = { ...profile, ...data };
        setProfile(newProfile);

        try {
            await AsyncStorage.setItem(`${STORAGE_KEYS.PROFILE_PREFIX}${user.uid}`, JSON.stringify(newProfile));
        } catch (error) {
            console.error('Error updating profile data:', error);
            throw error;
        }
    };

    // Update notification settings
    const updateNotificationSettings = async (settings: Partial<NotificationSettings>) => {
        const newSettings = { ...notificationSettings, ...settings };
        setNotificationSettings(newSettings); // Optimistic update
        await saveNotificationSettings(settings);
        const persistedSettings = await getNotificationSettings();
        setNotificationSettings(persistedSettings);

        if (user) {
            syncNotificationSettingsToFirestore(user.uid, persistedSettings).catch(error => {
                console.error('Error syncing notification settings to Firestore:', error);
            });
        }
    };

    // Refresh notification settings from storage
    const refreshNotificationSettings = async () => {
        try {
            await loadNotificationSettingsIntoState();
        } catch (e) {
            console.error('Error refreshing notification settings:', e);
        }
    };

    // Retry connection when user taps retry button
    const retryConnection = async () => {
        if (!user) return;

        setIsLoading(true);
        setConnectionError(false);

        try {
            const fetchedData = await applyFetchedUserData(user.uid);
            if (fetchedData) {
                console.log('[AuthContext] Retry successful - loaded user data');
            } else {
                console.log('[AuthContext] Retry failed - no data returned');
                setConnectionError(true);
            }
        } catch (error: any) {
            console.error('[AuthContext] Retry failed with error:', error);
            setConnectionError(true);
        } finally {
            setIsLoading(false);
        }
    };

    // Delete Account
    const deleteAccount = async () => {
        try {
            if (!user) {
                throw new Error('No user is currently signed in');
            }

            setIsLoading(true);

            // 1. Delete user document from Firestore
            const userDocRef = doc(db, 'users', user.uid);
            await deleteDoc(userDocRef);

            // 2. Cancel all scheduled notifications
            await cancelAllNotifications();
            await clearTrackedNotifications();

            // 3. Clear local data
            await clearAllLocalData();
            await resetProgress();

            // 4. Delete Firebase Auth user
            await deleteUser(user);
            await clearNativeGoogleSession();

            // 5. Clear state
            setUserData(null);
            setProfile({
                name: '',
                image: null,
                email: ''
            });
        } catch (error: any) {
            console.error('Delete account error:', error);
            // Handle requires-recent-login: user must re-authenticate before deleting
            if (error.code === 'auth/requires-recent-login') {
                throw new Error('Please log out and log in again before deleting your account.');
            }
            throw error;
        } finally {
            setIsLoading(false);
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
        resetPassword,
        refreshUserData,
        retryConnection,
        deleteAccount,
        profile,
        updateProfileData,
        notificationSettings,
        updateNotificationSettings,
        refreshNotificationSettings,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Helper function to get user-friendly error messages
function getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
        case 'auth/email-already-in-use':
            return 'This email is already registered. Please sign in.';
        case 'auth/invalid-email':
            return 'Invalid email address.';
        case 'auth/operation-not-allowed':
            return 'Email/password sign in is not enabled.';
        case 'auth/weak-password':
            return 'Password is too weak. Please use at least 6 characters.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/invalid-credential':
            return 'Invalid email or password.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please try again later.';
        default:
            return 'An error occurred. Please try again.';
    }
}
