import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAl20myfYyyqdSrVvC6d1yTelz0Rv-fYAQ",
  authDomain: "questlog-bb940.firebaseapp.com",
  projectId: "questlog-bb940",
  storageBucket: "questlog-bb940.firebasestorage.app",
  messagingSenderId: "926635259474",
  appId: "1:926635259474:web:8974086f61a2d621f5d18b"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;