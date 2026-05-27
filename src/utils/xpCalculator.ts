// XP thresholds and level math — shared between UI and services

export const XP_PER_LEVEL = 200;

export const getLevelFromXP = (xp: number): number =>
  Math.floor(xp / XP_PER_LEVEL) + 1;

export const getXPToNextLevel = (xp: number): number => {
  const currentLevel = getLevelFromXP(xp);
  return currentLevel * XP_PER_LEVEL - xp;
};

export const getLevelProgress = (xp: number): number => {
  return (xp % XP_PER_LEVEL) / XP_PER_LEVEL;
};

export const getLevelTitle = (level: number): string => {
  if (level <= 2) return 'Novice';
  if (level <= 4) return 'Adventurer';
  if (level <= 6) return 'Veteran';
  if (level <= 9) return 'Champion';
  return 'Legendary';
};
