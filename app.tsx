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
        cycleStats: { distractions: 0, clicks: 0 }
      };

      const dialogueCache = { ...defaults.dialogueCache, ...parsed.dialogueCache };
      let restoredProfile = { ...defaults, ...parsed, dialogueCache };

      // 4세션 완료 상태(100%)로 저장되어 있다면 캐릭터 성장은 보존하되 타이머 상태만 0으로 초기화하여 불러옴
      // 이는 완료 후 새로고침이나 재진입 시 유저가 "할 게 없는" 완료 화면에 갇히는 것을 방지함
      if (restoredProfile.savedSessionInCycle === 4) {
        restoredProfile.savedSessionInCycle = 0;
        restoredProfile.savedTimeLeft = 25 * 60;
        restoredProfile.savedIsBreak = false;
        restoredProfile.savedIsActive = false;
        // 보고서용 통계도 다음 세션을 위해 초기화
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
      // 용량 부족 시 모든 캐시를 최소치(3개)로 압축
      const slimCache = { ...profile.dialogueCache };
      (Object.keys(slimCache) as Array<keyof typeof slimCache>).forEach(key => {
        if (slimCache[key].length > 3) {
          slimCache[key] = slimCache[key].slice(-3);
        }
      });
      
      const slimProfile = { ...profile, dialogueCache: slimCache };
      if (saveToStorage(slimProfile)) {
        setProfile(slimProfile); 
      } else {
        const extraSlimProfile = { 
          ...profile, 
          dialogueCache: { scolding: [], click: [], pause: [], start: [] } 
        };
        if (saveToStorage(extraSlimProfile)) {
          setProfile(extraSlimProfile);
        } else {
          const noImageProfile = { ...extraSlimProfile, imageSrc: null };
          if (saveToStorage(noImageProfile)) {
             alert("저장 공간 부족으로 이미지가 삭제되었습니다.");
             setProfile(noImageProfile);
          }
        }
      }
    }
  }, [profile]);

  const handleSetupComplete = (newProfile: CharacterProfile) => {
    setProfile(newProfile);
  };

  const handleReset = useCallback(() => {
    if (window.confirm("정말 캐릭터를 초기화하시겠습니까? 모든 호감도와 수집한 쪽지가 삭제됩니다.")) {
      setProfile(null);
      localStorage.removeItem('pomodoro_profile');
    }
  }, []);

  const handleUpdateProfile = useCallback((updates: Partial<CharacterProfile>) => {
    setProfile(prev => {
      if (!prev) return null;
      let newProfile = { ...prev, ...updates };

      // 카테고리별 차등 용량 제한 강제 적용
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
    <div className="w-full h-screen bg-[#f8fafc] overflow-hidden">
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