import { useState, useEffect, useCallback } from 'react';
import { Quest, QuestStatus, QuestDifficulty } from '../models/Quest';
import {
  getUserQuests,
  getQuestsByStatus,
  getQuestsByDifficulty,
  getQuestsSortedByDeadline,
  searchQuests,
} from '../services/questService';

type SortMode = 'newest' | 'deadline';

interface UseQuestsOptions {
  uid: string | null;
  filterStatus?: QuestStatus | null;
  filterDifficulty?: QuestDifficulty | null;
  sortMode?: SortMode;
  searchQuery?: string;
}

interface UseQuestsReturn {
  quests: Quest[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useQuests = ({
  uid,
  filterStatus = null,
  filterDifficulty = null,
  sortMode = 'newest',
  searchQuery = '',
}: UseQuestsOptions): UseQuestsReturn => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuests = useCallback(async () => {
    if (!uid) return;

    setLoading(true);
    setError(null);

    try {
      let data: Quest[];

      if (filterStatus) {
        data = await getQuestsByStatus(uid, filterStatus);
      } else if (filterDifficulty) {
        data = await getQuestsByDifficulty(uid, filterDifficulty);
      } else if (sortMode === 'deadline') {
        data = await getQuestsSortedByDeadline(uid);
      } else {
        data = await getUserQuests(uid);
      }

      // Client-side search (Firestore doesn't support full-text)
      if (searchQuery) {
        data = searchQuests(data, searchQuery);
      }

      setQuests(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load quests');
    } finally {
      setLoading(false);
    }
  }, [uid, filterStatus, filterDifficulty, sortMode, searchQuery]);

  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  return { quests, loading, error, refresh: fetchQuests };
};
