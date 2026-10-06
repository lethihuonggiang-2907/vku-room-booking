import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  Auth,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Kiểm tra xem các biến môi trường cấu hình Firebase đã được cung cấp đầy đủ chưa.
 * Dự án hỗ trợ cơ chế song song: Nếu thiếu biến môi trường, hệ thống tự động
 * fallback về LocalAuthService (Offline Demo) để người dùng tải repo về có thể chạy ngay.
 */
export const isFirebaseConfigured = (): boolean => {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;

  return Boolean(
    apiKey &&
    apiKey.trim().length > 0 &&
    projectId &&
    projectId.trim().length > 0 &&
    appId &&
    appId.trim().length > 0
  );
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (isFirebaseConfigured()) {
  try {
    // 1. Khởi tạo Firebase App (nếu chưa có instance nào)
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

    // 2. Khởi tạo Firebase Auth với cơ chế lưu phiên (Persistence) phù hợp
    try {
      if (Platform.OS === 'web') {
        // Trên nền tảng Web: sử dụng browserLocalPersistence và browserPopupRedirectResolver để hỗ trợ signInWithPopup
        authInstance = initializeAuth(appInstance, {
          persistence: browserLocalPersistence,
          popupRedirectResolver: browserPopupRedirectResolver,
        });
      } else {
        // Trên thiết bị di động (React Native iOS/Android trong Expo Go):
        // Dùng getReactNativePersistence cùng AsyncStorage theo chuẩn Firebase v9-v12
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const authModule = require('firebase/auth') as any;
        const getPersistence = authModule.getReactNativePersistence;
        if (typeof getPersistence === 'function') {
          authInstance = initializeAuth(appInstance, {
            persistence: getPersistence(AsyncStorage),
          });
        } else {
          authInstance = initializeAuth(appInstance);
        }
      }
    } catch {
      // Nếu Auth đã được khởi tạo trước đó, lấy lại instance hiện có
      authInstance = getAuth(appInstance);
    }

    // 3. Khởi tạo Firestore Database
    dbInstance = getFirestore(appInstance);
  } catch (error) {
    console.warn('[Firebase] Khởi tạo Firebase thất bại, sẽ fallback về LocalAuthService:', error);
    appInstance = null;
    authInstance = null;
    dbInstance = null;
  }
}

export const firebaseApp = appInstance;
export const firebaseAuth = authInstance;
export const firestoreDb = dbInstance;

export const getFirebaseApp = (): FirebaseApp | null => firebaseApp;
export const getFirebaseAuth = (): Auth | null => firebaseAuth;
export const getFirestoreDb = (): Firestore | null => firestoreDb;
