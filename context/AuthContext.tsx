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
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { auth } from '../config/firebase';
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
    signInWithGoogle: () => Promise<void>;
    signInWithApple: () => Promise<void>;
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

WebBrowser.maybeCompleteAuthSession();

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
                    const storedProfile = await AsyncStorage.getItem(`profile_${firebaseUser.uid}`);
                    if (storedProfile) {
                        const parsedProfile = JSON.parse(storedProfile);
                        // Ensure email is always set from Firebase Auth if missing
                        if (!parsedProfile.email && firebaseUser.email) {
                            parsedProfile.email = firebaseUser.email;
                            await AsyncStorage.setItem(`profile_${firebaseUser.uid}`, JSON.stringify(parsedProfile));
                        }
                        setProfile(parsedProfile);
                    } else {
                        // Initialize profile from Firebase Auth data
                        const initialProfile = {
                            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                            image: firebaseUser.photoURL,
                            email: firebaseUser.email || ''
                        };
                        setProfile(initialProfile);
                        await AsyncStorage.setItem(`profile_${firebaseUser.uid}`, JSON.stringify(initialProfile));
                    }
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

    // Google OAuth Client IDs
    const GOOGLE_WEB_CLIENT_ID = '540292978044-pjka45r8ej0k63564hicngf1prip5ctu.apps.googleusercontent.com';
    const GOOGLE_ANDROID_CLIENT_ID = '540292978044-2c8urh00ip44furlns58hq4ieil3bfno.apps.googleusercontent.com';

    // Google Sign-In request
    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: GOOGLE_WEB_CLIENT_ID,
        iosClientId: GOOGLE_WEB_CLIENT_ID,
        androidClientId: GOOGLE_ANDROID_CLIENT_ID,
        webClientId: GOOGLE_WEB_CLIENT_ID,
    });

    // Handle Google Sign-In response
    useEffect(() => {
        const handleGoogleResponse = async () => {
            if (response?.type === 'success') {
                const { id_token } = response.params;

                try {
                    setIsLoading(true);

                    // Create Firebase credential with Google ID token
                    const credential = GoogleAuthProvider.credential(id_token);
                    const userCredential = await signInWithCredential(auth, credential);

                    // Clear local storage AFTER successful sign-in
                    await clearAllLocalData();

                    // Cancel all scheduled notifications for previous user
                    await cancelAllNotifications();
                    await clearTrackedNotifications();

                    // Check if user exists in Firestore, if not create document
                    let fetchedData = await applyFetchedUserData(userCredential.user.uid);

                    if (!fetchedData) {
                        // New user - create document then re-fetch to populate local data
                        await createUserDocument(
                            userCredential.user.uid,
                            userCredential.user.email || '',
                            userCredential.user.displayName || undefined
                        );
                        fetchedData = await applyFetchedUserData(userCredential.user.uid);
                    }

                } catch (error: any) {
                    console.error('Google Sign-In error:', error);
                    throw new Error('Failed to sign in with Google. Please try again.');
                } finally {
                    setIsLoading(false);
                }
            }
        };

        handleGoogleResponse();
    }, [response]);

    // Sign In with Google
    const signInWithGoogle = async () => {
        if (!request) {
            console.error('Google Auth request not ready');
            throw new Error('Google Sign-In is not available right now. Please try again.');
        }

        try {
            await promptAsync();
        } catch (error: any) {
            console.error('Google Sign-In error:', error);
            throw new Error('Failed to start Google Sign-In. Please try again.');
        }
    };

    // Sign In with Apple
    const signInWithApple = async () => {
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

                // Clear local storage AFTER successful sign-in
                await clearAllLocalData();
                await cancelAllNotifications();
                await clearTrackedNotifications();

                // Check if user exists in Firestore, if not create document
                let fetchedData = await applyFetchedUserData(userCredential.user.uid);

                if (!fetchedData) {
                    // Assemble reasonable display name from Apple's fullName if available
                    let displayName = userCredential.user.displayName;
                    if (!displayName && credential.fullName?.givenName) {
                        displayName = `${credential.fullName.givenName} ${credential.fullName.familyName || ''}`.trim();
                    }

                    await createUserDocument(
                        userCredential.user.uid,
                        userCredential.user.email || credential.email || '',
                        displayName || undefined
                    );
                    fetchedData = await applyFetchedUserData(userCredential.user.uid);
                }

            } else {
                throw new Error('No identity token.');
            }
        } catch (error: any) {
            if (error.code === 'ERR_REQUEST_CANCELED') {
                return;
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
            await AsyncStorage.setItem(`profile_${user.uid}`, JSON.stringify(newProfile));
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
