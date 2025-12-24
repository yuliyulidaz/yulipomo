import { useMemo } from 'react';
import { CharacterProfile } from '../types';
import { LEVEL_XP_TABLE, LEVEL_TITLES } from '../components/TimerConfig';
import { calculateXPProgress } from '../components/TimerUtils';

export const useXPManager = (profile: CharacterProfile) => {
  const currentXpTarget = useMemo(() => 
    LEVEL_XP_TABLE[profile.level] || 9999, 
  [profile.level]);

  const progressPercent = useMemo(() => 
    calculateXPProgress(profile.xp, currentXpTarget), 
  [profile.xp, currentXpTarget]);

  const levelTitle = useMemo(() => 
    LEVEL_TITLES[profile.level] || "동반자", 
  [profile.level]);

  return {
    currentXpTarget,
    progressPercent,
    levelTitle
  };
};