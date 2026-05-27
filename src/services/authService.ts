import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  signInAnonymously,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

// Register a new user and create their Firestore profile
export const register = async (
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);

  // Set display name on Firebase Auth profile
  await updateProfile(user, { displayName });

  // Create user document in Firestore
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    displayName,
    email,
    avatarUrl: '',
    xp: 0,
    level: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return user;
};

// Login with email and password
export const login = async (
  email: string,
  password: string
): Promise<FirebaseUser> => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
};

// Guest / anonymous sign-in (for public browsing)
export const loginAsGuest = async (): Promise<FirebaseUser> => {
  const { user } = await signInAnonymously(auth);
  return user;
};

// Logout
export const logout = async (): Promise<void> => {
  await signOut(auth);
};

// Listen to auth state changes (use in useAuth hook)
export const subscribeToAuthState = (
  callback: (user: FirebaseUser | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};
