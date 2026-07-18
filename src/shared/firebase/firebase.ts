// Firebase configuration for VocBee
import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-expect-error - React Native persistence is provided by Firebase's RN entrypoint at runtime.
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDhEet6mAsGNmar__PEnNDxdKPuqr27ByY',
  authDomain: 'vocbee-6fe24.firebaseapp.com',
  projectId: 'vocbee-6fe24',
  storageBucket: 'vocbee-6fe24.firebasestorage.app',
  messagingSenderId: '540292978044',
  appId: '1:540292978044:web:06e01166324cc50e6f00f9',
  measurementId: 'G-5Y719CDVY7',
};

// Initialize Firebase (prevent re-initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with React Native persistence
let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error: any) {
  // Auth already initialized, get existing instance
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    auth = getAuth(app);
  }
}

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
export default app;
