// Authentication Context for VocBee
// Handles user authentication state and Firebase Auth operations

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
} from 'firebase/auth';
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
    refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Props
interface AuthProviderProps {
    children: ReactNode;
}

// Auth Provider Component
export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                // Try to load local data first
                const localData = await getLocalUserData();
                if (localData && localData.uid === firebaseUser.uid) {
                    setUserData(localData);
                } else {
                    // Fetch from Firestore if no local data
                    const fetchedData = await fetchAndSaveUserData(firebaseUser.uid);
                    setUserData(fetchedData);
                }
            } else {
                setUserData(null);
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

    // Sign In with Google - TODO: Implement when expo-auth-session works
    const signInWithGoogle = async () => {
        // Google Sign-In temporarily disabled due to expo-auth-session build issues
        console.log('Google Sign-In not yet implemented');
        throw new Error('Google Sign-In coming soon!');
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

    // Refresh user data from Firestore
    const refreshUserData = async () => {
        if (user) {
            const fetchedData = await fetchAndSaveUserData(user.uid);
            setUserData(fetchedData);
        }
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
        refreshUserData,
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
