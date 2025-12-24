export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const cleanDialogue = (text: string, honorific: string): string => {
  return text
    .replace(/{honorific}|{이름}|{user}/g, honorific)
    .replace(/{([^}]+)}/g, '$1');
};

export const calculateXPProgress = (xp: number, targetXp: number): number => {
  return Math.min(100, (xp / targetXp) * 100);
};

export const calculateOverallProgress = (sessionInCycle: number, isBreak: boolean, timeLeft: number): number => {
  const sessionBase = sessionInCycle;
  const currentSessionProgress = !isBreak ? (25 * 60 - timeLeft) / (25 * 60) : 0;
  return ((sessionBase + currentSessionProgress) / 4) * 100;
};