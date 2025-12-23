
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
      
      const parsed = JSON.parse(saved) as CharacterProfile;
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
        initialGreeting: "준비되셨나요? 시작 버튼을 눌러주세요.",
        cycleStats: { distractions: 0, clicks: 0 }
      };

      const dialogueCache = { ...defaults.dialogueCache, ...parsed.dialogueCache };
      let restoredProfile = { ...defaults, ...parsed, dialogueCache };

      // --- 시간 및 사이클 유지 로직 ---
      // 이전에는 1시간 경과 시 강제 리셋했으나, 이제 마지막 상태를 그대로 불러옵니다.
      
      return restoredProfile;
    } catch (e) {
      return null;
    }
  });

  // --- Critical Bug Fix: LocalStorage Quota Management (Smart Storage Manager) ---
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

    // 1단계: 정상 저장 시도
    if (!saveToStorage(profile)) {
      console.warn("Storage Full! Attempting smart recovery (FIFO stage)...");

      // 2단계: 대사 캐시를 카테고리당 5개로 축소 (FIFO 정책 - 최신순 보존)
      const slimCache = { ...profile.dialogueCache };
      (Object.keys(slimCache) as Array<keyof typeof slimCache>).forEach(key => {
        if (slimCache[key].length > 5) {
          slimCache[key] = slimCache[key].slice(-5);
        }
      });
      
      const slimProfile = { ...profile, dialogueCache: slimCache };
      
      if (saveToStorage(slimProfile)) {
        console.log("Recovered by trimming dialogue cache (FIFO).");
        setProfile(slimProfile); 
      } else {
        // 3단계: 대사 캐시 완전 삭제 (이미지 보존을 위한 최후의 수단)
        const extraSlimProfile = { 
          ...profile, 
          dialogueCache: { scolding: [], praising: [], idle: [], click: [], pause: [], start: [] } 
        };
        
        if (saveToStorage(extraSlimProfile)) {
          console.warn("Recovered by clearing ALL dialogue cache.");
          setProfile(extraSlimProfile);
        } else {
          // 4단계: 이미지까지 삭제 (텍스트 데이터라도 살리기 위함)
          const noImageProfile = { ...extraSlimProfile, imageSrc: null };
          if (saveToStorage(noImageProfile)) {
             alert("저장 공간이 부족하여 이미지가 삭제되었습니다. 더 작은 용량의 이미지로 다시 설정해주세요.");
             setProfile(noImageProfile);
          } else {
             alert("브라우저 저장 공간이 가득 찼습니다. 다른 탭을 닫거나 브라우저 캐시를 정리해주세요.");
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

      // 대사 캐시 용량 제한 강제 적용
      if (updates.dialogueCache) {
        const currentCache = { ...newProfile.dialogueCache };
        (Object.keys(currentCache) as Array<keyof typeof currentCache>).forEach(key => {
          if (Array.isArray(currentCache[key]) && currentCache[key].length > MAX_CACHE_PER_CATEGORY) {
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
