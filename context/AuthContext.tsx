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
    signInWithCredential,
} from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { auth } from '../config/firebase';
import {
    getLocalUserData,
    saveUserDataLocally,
    clearAllLocalData,
    UserData,
} from '../services/storage';
import {
    createUserDocument,
    fetchAndSaveUserData,
    forceSync,
} from '../services/SyncService';
import { resetProgress } from '../services/progressService';
import {
    NotificationSettings,
    DEFAULT_NOTIFICATION_SETTINGS,
    getNotificationSettings,
    saveNotificationSettings
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
    signUp: (email: string, password: string, displayName?: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<{ setupCompleted: boolean }>;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    refreshUserData: () => Promise<void>;
    profile: ProfileData;
    updateProfileData: (data: Partial<ProfileData>) => Promise<void>;
    notificationSettings: NotificationSettings;
    updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
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

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            // Load Global Settings (Notifications) immediately
            // This ensures they are ready for SettingsScreen without extra loading state
            try {
                const settings = await getNotificationSettings();
                setNotificationSettings(settings);
            } catch (e) {
                console.error('Error loading initial notification settings:', e);
            }

            if (firebaseUser) {
                // Cache-first strategy: Use local cache if available
                // Only fetch from Firebase on first login or when cache is cleared
                const localData = await getLocalUserData();

                if (localData && localData.uid === firebaseUser.uid && localData.setupCompleted) {
                    // Use cached data - faster startup, no network request
                    setUserData(localData);
                    console.log('[AuthContext] Using cached user data (setupCompleted:', localData.setupCompleted, ')');
                } else {
                    // No valid cache - fetch from Firebase (first login or cache cleared)
                    console.log('[AuthContext] No valid cache, fetching from Firebase...');
                    const fetchedData = await fetchAndSaveUserData(firebaseUser.uid);
                    if (fetchedData) {
                        setUserData(fetchedData);
                        console.log('[AuthContext] Loaded user data from Firebase:', fetchedData.setupCompleted ? 'setup completed' : 'setup not completed');
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
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Update display name if provided
            if (displayName) {
                await updateProfile(userCredential.user, { displayName });
            }

            // Create user document in Firestore
            await createUserDocument(userCredential.user.uid, email, displayName);

            // Save locally
            const newUserData: UserData = {
                uid: userCredential.user.uid,
                email,
                displayName,
                preferences: {
                    nativeLanguage: 'turkish',
                    targetLanguage: 'english',
                    level: 'A1',
                },
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

            // Clear local storage first to prevent old data from persisting
            await clearAllLocalData();

            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Fetch user data from Firestore and save locally
            const fetchedData = await fetchAndSaveUserData(userCredential.user.uid);
            setUserData(fetchedData);

            // Return setup status
            return { setupCompleted: !!fetchedData?.preferences };

        } catch (error: any) {
            console.error('Sign in error:', error);
            throw new Error(getAuthErrorMessage(error.code));
        } finally {
            setIsLoading(false);
        }
    };

    // Google OAuth Client IDs
    const GOOGLE_WEB_CLIENT_ID = '540292978044-pjka45r8ej0k63564hicngf1prip5ctu.apps.googleusercontent.com';

    // Google Sign-In request
    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: GOOGLE_WEB_CLIENT_ID,
        iosClientId: GOOGLE_WEB_CLIENT_ID,
        androidClientId: GOOGLE_WEB_CLIENT_ID,
        webClientId: GOOGLE_WEB_CLIENT_ID,
    });

    // Handle Google Sign-In response
    useEffect(() => {
        const handleGoogleResponse = async () => {
            if (response?.type === 'success') {
                const { id_token } = response.params;

                try {
                    setIsLoading(true);

                    // Clear local storage first
                    await clearAllLocalData();

                    // Create Firebase credential with Google ID token
                    const credential = GoogleAuthProvider.credential(id_token);
                    const userCredential = await signInWithCredential(auth, credential);

                    // Check if user exists in Firestore, if not create document
                    const fetchedData = await fetchAndSaveUserData(userCredential.user.uid);

                    if (!fetchedData) {
                        // New user - create document
                        await createUserDocument(
                            userCredential.user.uid,
                            userCredential.user.email || '',
                            userCredential.user.displayName || undefined
                        );
                    }

                    setUserData(fetchedData);

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

    // Sign Out
    const signOut = async () => {
        try {
            setIsLoading(true);

            // Force sync before logout to save any pending changes
            if (user) {
                await forceSync(user.uid);
            }

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
            const fetchedData = await fetchAndSaveUserData(user.uid);
            setUserData(fetchedData);
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
    };

    const value: AuthContextType = {
        user,
        userData,
        isLoading,
        isAuthenticated: !!user,
        signUp,
        signIn,
        signOut,
        signInWithGoogle,
        resetPassword,
        refreshUserData,
        profile,
        updateProfileData,
        notificationSettings,
        updateNotificationSettings,
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
