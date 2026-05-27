import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Quest, CreateQuestInput, UpdateQuestInput, QuestStatus, QuestDifficulty } from '../models/Quest';

const QUESTS = 'quests';

// CREATE — add a new quest
export const createQuest = async (input: CreateQuestInput): Promise<string> => {
  const ref = await addDoc(collection(db, QUESTS), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

// READ — get single quest by ID
export const getQuest = async (questId: string): Promise<Quest | null> => {
  const snap = await getDoc(doc(db, QUESTS, questId));
  if (!snap.exists()) return null;
  return { questId: snap.id, ...snap.data() } as Quest;
};

// READ — get all quests for a user (non-archived)
export const getUserQuests = async (uid: string): Promise<Quest[]> => {
  const q = query(
    collection(db, QUESTS),
    where('uid', '==', uid),
    where('isArchived', '==', false),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ questId: d.id, ...d.data() } as Quest));
};

// READ — filter by status
export const getQuestsByStatus = async (
  uid: string,
  status: QuestStatus
): Promise<Quest[]> => {
  const q = query(
    collection(db, QUESTS),
    where('uid', '==', uid),
    where('status', '==', status),
    where('isArchived', '==', false),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ questId: d.id, ...d.data() } as Quest));
};

// READ — filter by difficulty
export const getQuestsByDifficulty = async (
  uid: string,
  difficulty: QuestDifficulty
): Promise<Quest[]> => {
  const q = query(
    collection(db, QUESTS),
    where('uid', '==', uid),
    where('difficulty', '==', difficulty),
    where('isArchived', '==', false),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ questId: d.id, ...d.data() } as Quest));
};

// READ — sort by deadline (soonest first)
export const getQuestsSortedByDeadline = async (uid: string): Promise<Quest[]> => {
  const q = query(
    collection(db, QUESTS),
    where('uid', '==', uid),
    where('isArchived', '==', false),
    orderBy('deadline', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ questId: d.id, ...d.data() } as Quest));
};

// UPDATE — edit quest fields
export const updateQuest = async (
  questId: string,
  updates: UpdateQuestInput
): Promise<void> => {
  await updateDoc(doc(db, QUESTS, questId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// UPDATE — mark quest as complete and return XP earned
export const completeQuest = async (questId: string): Promise<number> => {
  await updateDoc(doc(db, QUESTS, questId), {
    status: 'completed',
    updatedAt: serverTimestamp(),
  });
  const quest = await getQuest(questId);
  return getXPForDifficulty(quest?.difficulty ?? 'daily');
};

// DELETE (soft) — archive instead of hard delete
export const archiveQuest = async (questId: string): Promise<void> => {
  await updateDoc(doc(db, QUESTS, questId), {
    isArchived: true,
    updatedAt: serverTimestamp(),
  });
};

// SEARCH — client-side title search (Firestore doesn't support full-text natively)
export const searchQuests = (quests: Quest[], query: string): Quest[] => {
  const lower = query.toLowerCase().trim();
  if (!lower) return quests;
  return quests.filter(q =>
    q.title.toLowerCase().includes(lower) ||
    q.description.toLowerCase().includes(lower)
  );
};

// HELPER — XP values per difficulty
export const getXPForDifficulty = (difficulty: QuestDifficulty): number => {
  const xpMap: Record<QuestDifficulty, number> = {
    daily: 50,
    side_quest: 100,
    boss_fight: 150,
  };
  return xpMap[difficulty];
};
