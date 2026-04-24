import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// getAuth ki jagah hum initializeAuth aur persistence import karenge
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDwHK6dscXeZSCVuIHNRAI2k0xW-xZfGlc",
  authDomain: "orpl-interns.firebaseapp.com",
  projectId: "orpl-interns",
  storageBucket: "orpl-interns.firebasestorage.app",
  messagingSenderId: "413988765184",
  appId: "1:413988765184:web:538257d01045f34038e2e5",
  measurementId: "G-V8RHTWKGVH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Database
export const db = getFirestore(app);

// Initialize Auth with AsyncStorage (Ab login hamesha yaad rahega)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});