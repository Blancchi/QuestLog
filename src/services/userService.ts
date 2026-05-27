import {
  doc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../models/User';

// GET user profile
export const getUser = async (uid: string): Promise<User | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as User;
};

// ADD XP and auto-level up if threshold is reached
export const addXP = async (uid: string, xpAmount: number): Promise<void> => {
  const user = await getUser(uid);
  if (!user) return;

  const newXP = user.xp + xpAmount;
  const newLevel = getLevelFromXP(newXP);

  await updateDoc(doc(db, 'users', uid), {
    xp: newXP,
    level: newLevel,
    updatedAt: serverTimestamp(),
  });
};

// UPDATE display name or avatar
export const updateUserProfile = async (
  uid: string,
  updates: Partial<Pick<User, 'displayName' | 'avatarUrl'>>
): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// HELPER — level thresholds (every 200 XP = 1 level)
export const getLevelFromXP = (xp: number): number => {
  return Math.floor(xp / 200) + 1;
};

// HELPER — XP needed to reach next level
export const getXPToNextLevel = (xp: number): number => {
  const currentLevel = getLevelFromXP(xp);
  return currentLevel * 200 - xp;
};

// HELPER — progress percentage within current level (0–1)
export const getLevelProgress = (xp: number): number => {
  const xpInLevel = xp % 200;
  return xpInLevel / 200;
};
