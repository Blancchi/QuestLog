import { Timestamp } from 'firebase/firestore';

export type QuestStatus = 'active' | 'completed' | 'failed';
export type QuestDifficulty = 'daily' | 'side_quest' | 'boss_fight';

export interface Quest {
  questId: string;
  uid: string;
  title: string;
  description: string;
  status: QuestStatus;
  difficulty: QuestDifficulty;
  category: string;
  deadline: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isArchived: boolean;
}

export type CreateQuestInput = Omit<Quest, 'questId' | 'createdAt' | 'updatedAt'>;
export type UpdateQuestInput = Partial<Omit<Quest, 'questId' | 'uid' | 'createdAt'>>;
