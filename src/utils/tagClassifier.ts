import { QuestDifficulty } from '../models/Quest';

// Finals: this will call the Claude API to suggest a difficulty tag
// based on the quest title and description keywords.
//
// For now it uses a simple keyword-matching fallback.

export const classifyQuestDifficulty = (
  title: string,
  description: string = ''
): QuestDifficulty => {
  const text = `${title} ${description}`.toLowerCase();

  const bossKeywords = ['fix', 'build', 'implement', 'deploy', 'debug', 'refactor', 'exam', 'presentation', 'deadline', 'urgent'];
  const dailyKeywords = ['daily', 'read', 'exercise', 'run', 'review', 'check', 'water', 'clean', 'routine'];

  if (bossKeywords.some(k => text.includes(k))) return 'boss_fight';
  if (dailyKeywords.some(k => text.includes(k))) return 'daily';
  return 'side_quest';
};

// TODO (Finals): replace above with Claude API call
// export const classifyQuestDifficultyAI = async (...) => { ... }
