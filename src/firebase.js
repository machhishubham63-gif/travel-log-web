import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// NEW: Import the offline caching tools instead of getFirestore
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDPxWCiZJLtfb9uC5JM9oymGbiU2nB_aiI",
  authDomain: "travel-log-e100c.firebaseapp.com",
  projectId: "travel-log-e100c",
  storageBucket: "travel-log-e100c.firebasestorage.app",
  messagingSenderId: "70640769799",
  appId: "1:70640769799:web:75c41a674290efffc543a2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// NEW: Initialize Firestore with Offline Persistence enabled
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
