import './index.css'
import React, { useState, useEffect, useCallback } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { TimerScreen } from './components/TimerScreen';
import { CharacterProfile } from './types';

const LEVEL_XP_TABLE = [0, 10, 20, 30, 50, 80, 120, 170, 230, 300, 400];

// 카테고리별 최대 저장 설정
const CACHE_LIMITS: Record<string, number> = {
  click: 20,
  pause: 20,
  start: 20,
  scolding: 20
};

function App() {
  const [profile, setProfile] = useState<CharacterProfile | null>(() => {
    try {
      const saved = localStorage.getItem('pomodoro_profile');
      if (!saved) return null;

      const parsed = JSON.parse(saved) as CharacterProfile;
      const defaults = {
        userName: "유저",
        charJob: "",
        userJob: "",
        dialogueCache: {
          scolding: [],
          click: [],
          pause: [],
          start: []
        },
        streak: 0,
        totalFocusMinutes: 0,
        totalCompletedCycles: 0,
        receivedNotes: [],
        xp: 0,
        level: 1,
        maxXpForNextLevel: 10,
        personality: ["존댓말"],
        initialGreeting: "준비되셨나요? 시작 버튼을 눌러주세요.",
        cycleStats: { distractions: 0, clicks: 0 },
        diaryHistory: []
      };

      const dialogueCache = { ...defaults.dialogueCache, ...parsed.dialogueCache };
      let restoredProfile = { ...defaults, ...parsed, dialogueCache };

      // 4세션 완료 상태(100%)로 저장되어 있다면 캐릭터 성장은 보존하되 타이머 상태만 0으로 초기화하여 불러옴
      if (restoredProfile.savedSessionInCycle === 4) {
        restoredProfile.savedSessionInCycle = 0;
        restoredProfile.savedTimeLeft = 25 * 60;
        restoredProfile.savedIsBreak = false;
        restoredProfile.savedIsActive = false;
        restoredProfile.cycleStats = { distractions: 0, clicks: 0 };
      }

      return restoredProfile;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (!profile) {
      localStorage.removeItem('pomodoro_profile');
      return;
    }

    const saveToStorage = (data: CharacterProfile) => {
      try {
        localStorage.setItem('pomodoro_profile', JSON.stringify(data));
        return true;
      } catch (e) {
        return false;
      }
    };

    if (!saveToStorage(profile)) {
      console.warn("Storage Full! Attempting smart recovery...");

      // 1순위: 일기 내역을 최신 3개로 축소
      let slimProfile = {
        ...profile,
        diaryHistory: profile.diaryHistory.slice(0, 3)
      };

      if (!saveToStorage(slimProfile)) {
        // 2순위: 대사 캐시 축소
        const slimCache = { ...slimProfile.dialogueCache };
        (Object.keys(slimCache) as Array<keyof typeof slimCache>).forEach(key => {
          if (slimCache[key].length > 3) {
            slimCache[key] = slimCache[key].slice(-3);
          }
        });
        slimProfile = { ...slimProfile, dialogueCache: slimCache };

        if (saveToStorage(slimProfile)) {
          setProfile(slimProfile);
        } else {
          // 3순위: 대사 캐시 및 일기 완전 삭제
          const extraSlimProfile = {
            ...profile,
            dialogueCache: { scolding: [], click: [], pause: [], start: [] },
            diaryHistory: []
          };
          if (saveToStorage(extraSlimProfile)) {
            setProfile(extraSlimProfile);
          } else {
            // 4순위: 이미지 삭제 (최후의 수단)
            const noImageProfile = { ...extraSlimProfile, imageSrc: null };
            if (saveToStorage(noImageProfile)) {
              alert("저장 공간 부족으로 이미지와 기록이 삭제되었습니다.");
              setProfile(noImageProfile);
            }
          }
        }
      } else {
        setProfile(slimProfile);
      }
    }
  }, [profile]);



  const handleSetupComplete = (newProfile: CharacterProfile) => {
    setProfile(newProfile);
  };

  const handleReset = useCallback(() => {
    setProfile(null);
    localStorage.removeItem('pomodoro_profile');
  }, []);

  const handleUpdateProfile = useCallback((updates: Partial<CharacterProfile>) => {
    setProfile(prev => {
      if (!prev) return null;
      let newProfile = { ...prev, ...updates };

      if (updates.dialogueCache) {
        const currentCache = { ...newProfile.dialogueCache };
        (Object.keys(currentCache) as Array<keyof typeof currentCache>).forEach(key => {
          const limit = CACHE_LIMITS[key as string] || 20;
          if (Array.isArray(currentCache[key]) && currentCache[key].length > limit) {
            currentCache[key] = currentCache[key].slice(-limit);
          }
        });
        newProfile.dialogueCache = currentCache;
      }
      return newProfile;
    });
  }, []);

  const handleTickXP = useCallback((amount: number) => {
    setProfile(prev => {
      if (!prev || prev.level >= 10) return prev;
      let { xp, level } = prev;
      xp += amount;
      const needed = LEVEL_XP_TABLE[level] || 9999;
      if (xp >= (needed - 0.0001) && level < 10) {
        xp = Math.max(0, xp - needed);
        level += 1;
        return { ...prev, xp, level, maxXpForNextLevel: LEVEL_XP_TABLE[level] || 9999 };
      }
      return { ...prev, xp };
    });
  }, []);

  const handleSessionFinished = useCallback((wasSuccess: boolean) => {
    if (wasSuccess) {
      setProfile(prev => {
        if (!prev) return null;
        const streakBonus = 5;
        let { xp, level } = prev;
        xp += streakBonus;
        while (level < 10 && xp >= (LEVEL_XP_TABLE[level] || 9999)) {
          xp -= (LEVEL_XP_TABLE[level] || 9999);
          level += 1;
        }
        return {
          ...prev,
          streak: (prev.streak || 0) + 1,
          xp,
          level,
          totalFocusMinutes: (prev.totalFocusMinutes || 0) + 25,
          maxXpForNextLevel: LEVEL_XP_TABLE[level] || 9999
        };
      });
    } else {
      setProfile(prev => prev ? { ...prev, streak: 0 } : null);
    }
  }, []);

  return (
    <div className="w-full min-h-[100dvh] bg-[#f8fafc] overflow-x-hidden">
      {!profile ? (
        <SetupScreen onComplete={handleSetupComplete} />
      ) : (
        <TimerScreen
          profile={profile}
          onReset={handleReset}
          onTickXP={handleTickXP}
          onUpdateProfile={handleUpdateProfile}
          onSessionComplete={handleSessionFinished}
        />
      )}
    </div>
  );
}

export default App;