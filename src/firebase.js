import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// IMPORTANT: Keep YOUR actual Firebase config here! Do not overwrite this block with empty strings.
const firebaseConfig = {
  apiKey: "AIzaSyDPxWCiZJLtfb9uC5JM9oymGbiU2nB_aiI",
  authDomain: "travel-log-e100c.firebaseapp.com",
  projectId: "travel-log-e100c",
  storageBucket: "travel-log-e100c.firebasestorage.app",
  messagingSenderId: "70640769799",
  appId: "1:70640769799:web:75c41a674290efffc543a2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- NEW: FIREBASE OFFLINE ENGINE ---
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn("Multiple tabs open, offline mode only works in one tab at a time.");
  } else if (err.code === 'unimplemented') {
    console.warn("Your browser doesn't support offline storage.");
  }
});

export { auth, db };
