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

export const getTimePeriod = (): string => {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5) return "고요한 새벽의 정적";
  if (hour >= 5 && hour < 11) return "싱그러운 아침 공기";
  if (hour >= 11 && hour < 17) return "나른한 오후의 햇살";
  if (hour >= 17 && hour < 21) return "짙게 물드는 노을빛 저녁";
  return "깊고 고요한 밤의 분위기";
};

export const getSeason = (): string => {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "꽃잎이 날리는 봄";
  if (month >= 6 && month <= 8) return "매미 소리가 들리는 여름";
  if (month >= 9 && month <= 11) return "단풍이 물드는 가을";
  return "찬 바람이 부는 겨울";
};
