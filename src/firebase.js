import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

export { auth, db };
