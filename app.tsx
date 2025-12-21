
import './index.css'
import React, { useState, useEffect, useCallback } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { TimerScreen } from './components/TimerScreen';
import { CharacterProfile } from './types';

const LEVEL_XP_TABLE = [0, 10, 20, 30, 50, 80, 120, 170, 230, 300, 400]; 
const MAX_CACHE_PER_CATEGORY = 20;

function App() {
  const [profile, setProfile] = useState<CharacterProfile | null>(() => {
    try {
      const saved = localStorage.getItem('pomodoro_profile');
      if (!saved) return null;
      
      const parsed = JSON.parse(saved);
      const defaults = {
        userName: "유저",
        dialogueCache: { 
          scolding: [], 
          praising: [], 
          idle: [],
          click: [],
          pause: [],
          start: []
        },
        streak: 0,
        totalFocusMinutes: 0,
        receivedNotes: [],
        xp: 0,
        level: 1,
        maxXpForNextLevel: 10,
        personality: ["존댓말"],
        initialGreeting: "준비되셨나요? 시작 버튼을 눌러주세요."
      };

      const dialogueCache = { ...defaults.dialogueCache, ...parsed.dialogueCache };
      
      return { ...defaults, ...parsed, dialogueCache };
    } catch (e) {
      return null;
    }
  });

  // --- Critical Bug Fix: LocalStorage Quota Management ---
  useEffect(() => {
    if (!profile) {
      localStorage.removeItem('pomodoro_profile');
      return;
    }

    try {
      localStorage.setItem('pomodoro_profile', JSON.stringify(profile));
    } catch (e) {
      console.error("Storage Full!", e);
      // 긴급 조치: 대사 캐시를 완전히 비우고 다시 저장 시도
      const lightProfile = { 
        ...profile, 
        dialogueCache: { 
          scolding: [], 
          praising: [], 
          idle: [], 
          click: [], 
          pause: [], 
          start: [] 
        } 
      };
      
      try {
        localStorage.setItem('pomodoro_profile', JSON.stringify(lightProfile));
        console.warn("Cleared dialogue cache to save space.");
      } catch (e2) {
        // 이미지 용량이 너무 커서 캐시를 비워도 안 되는 경우
        alert("저장 공간이 부족하여 설정을 저장할 수 없습니다. 이미지가 너무 크거나 브라우저 저장소가 가득 찼습니다.");
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

      // 대사 캐시 용량 제한 강제 적용 (FIFO: 최신 20개 유지)
      if (updates.dialogueCache) {
        const currentCache = { ...newProfile.dialogueCache };
        (Object.keys(currentCache) as Array<keyof typeof currentCache>).forEach(key => {
          if (Array.isArray(currentCache[key]) && currentCache[key].length > MAX_CACHE_PER_CATEGORY) {
            // 오래된 데이터를 버리고 최신 데이터만 남김
            currentCache[key] = currentCache[key].slice(-MAX_CACHE_PER_CATEGORY);
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
