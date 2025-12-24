
import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { CharacterProfile } from '../types';
import { SAFETY_SETTINGS, FALLBACK_TEMPLATES } from '../components/TimerConfig';
import { cleanDialogue } from '../components/TimerUtils';

const COOLDOWN_MS = 16000;

// 카테고리별 임계점 설정
const REFILL_CONFIG: Record<string, { max: number; threshold: number }> = {
  click: { max: 20, threshold: 10 },
  pause: { max: 20, threshold: 10 },
  start: { max: 20, threshold: 10 },
  scolding: { max: 20, threshold: 10 },
  idle: { max: 10, threshold: 5 },
  praising: { max: 10, threshold: 5 }
};

export const useAIManager = (
  profile: CharacterProfile,
  onUpdateProfile: (updates: Partial<CharacterProfile>) => void
) => {
  const [message, setMessage] = useState(profile.savedIsBreak ? "" : (profile.initialGreeting || "시작할까?"));
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [pendingExpiryAlert, setPendingExpiryAlert] = useState(false);
  
  const cooldownIntervalRef = useRef<any>(null);
  const isRefillingRef = useRef<Record<string, boolean>>({});
  const isGlobalApiLockedRef = useRef<boolean>(false);
  const refillQueueRef = useRef<Array<keyof typeof profile.dialogueCache>>([]);
  const profileRef = useRef(profile);

  useEffect(() => { profileRef.current = profile; }, [profile]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 7000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // 대기열에 추가하고 우선순위 재정렬
  const addToRefillQueue = useCallback((category: keyof typeof profile.dialogueCache) => {
    const currentCache = profileRef.current.dialogueCache[category];
    const config = REFILL_CONFIG[category];
    
    // 이미 임계점을 넘었거나 채우는 중이면 무시
    if (currentCache.length > config.threshold || isRefillingRef.current[category]) return;
    
    if (!refillQueueRef.current.includes(category)) {
      refillQueueRef.current.push(category);
    }

    // 우선순위 정렬: 1. 개수가 0개인 것 우선, 2. 남은 개수가 적은 순
    refillQueueRef.current.sort((a, b) => {
      const lenA = profileRef.current.dialogueCache[a].length;
      const lenB = profileRef.current.dialogueCache[b].length;
      if (lenA === 0 && lenB !== 0) return -1;
      if (lenB === 0 && lenA !== 0) return 1;
      return lenA - lenB;
    });
  }, []);

  const refillCategory = useCallback(async (category: keyof typeof profile.dialogueCache, count: number = 5): Promise<boolean> => {
    if (isRefillingRef.current[category]) return false;
    isRefillingRef.current[category] = true;
    
    try {
      const currentProfile = profileRef.current;
      const ai = new GoogleGenAI({ apiKey: currentProfile.apiKey || process.env.API_KEY });
      const getMood = () => {
        if (currentProfile.level <= 3) return "Cold, Strict, Minimalist";
        if (currentProfile.level <= 7) return "Friendly, Warm, Helpful";
        return "Deeply Affointed, Loving, Obsessive";
      };
      const situations: Record<string, string> = { 
        scolding: 'slacking off', praising: 'finished focus session', 
        idle: 'mid-focus encouragement', click: 'interaction with user', 
        pause: 'user paused focus', start: 'user started focus' 
      };
      
      const prompt = `Roleplay as ${currentProfile.name}. User: ${currentProfile.userName}. Mood: ${getMood()}. Personality: ${currentProfile.personality.join(', ')}. Situation: ${situations[category]}. Write ${count} short Korean sentences (10-20 chars). Use {honorific}. Separate by Newline.`;
      
      const result = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: prompt, 
        config: { safetySettings: SAFETY_SETTINGS } 
      });

      if (result.text) {
        const newLines = result.text.split('\n').map(l => l.trim()).filter(l => l.length >= 5);
        onUpdateProfile({ 
          dialogueCache: { 
            ...currentProfile.dialogueCache, 
            [category]: [...currentProfile.dialogueCache[category], ...newLines] 
          } 
        });
        return true;
      }
      return false;
    } catch (e: any) {
      if (e.message?.includes('API_KEY_INVALID') || e.status === 401 || e.status === 403) {
        setPendingExpiryAlert(true);
      }
      return false;
    } finally {
      isRefillingRef.current[category] = false;
    }
  }, [onUpdateProfile]);

  const processRefillQueue = useCallback(async () => {
    if (isGlobalApiLockedRef.current || refillQueueRef.current.length === 0) return;
    
    // shift 대신 인덱스로 먼저 가져옴
    const category = refillQueueRef.current[0];
    isGlobalApiLockedRef.current = true;
    
    try {
      const success = await refillCategory(category, 5);
      // 성공했을 때만 대기열에서 제거
      if (success) {
        refillQueueRef.current.shift();
      }
    } catch (e) {
      // 에러 발생 시 대기열에 유지 (다음 주기에 재시도)
    } finally {
      // 15초(4 RPM) 안전 잠금 - 성공 여부와 상관없이 락을 걸어 API 안정을 도모
      setTimeout(() => { isGlobalApiLockedRef.current = false; }, 15000);
    }
  }, [refillCategory]);

  // 초기 로드 및 15초 주기 루프
  useEffect(() => {
    const categories = Object.keys(REFILL_CONFIG) as Array<keyof typeof profile.dialogueCache>;
    const isBrandNew = categories.every(cat => profileRef.current.dialogueCache[cat].length === 0);

    if (isBrandNew) {
      // 전략 A: 캐릭터 생성 직후 즉시 click 대사 1회 호출 (UX 만족도)
      isGlobalApiLockedRef.current = true;
      refillCategory('click', 5).finally(() => {
        setTimeout(() => { isGlobalApiLockedRef.current = false; }, 15000);
      });
      // 나머지 카테고리 큐에 등록
      const others: Array<keyof typeof profile.dialogueCache> = ['pause', 'start', 'scolding', 'idle', 'praising'];
      others.forEach(cat => addToRefillQueue(cat));
    } else {
      // 전략 B: 새로고침 시 부족한 것들 큐에 등록
      categories.forEach(cat => addToRefillQueue(cat));
    }

    const queueTimer = setInterval(processRefillQueue, 5000); // 큐 확인은 자주 하되, 실행은 15초 락에 걸림
    return () => clearInterval(queueTimer);
  }, [processRefillQueue, refillCategory, addToRefillQueue]);

  const triggerAIResponse = useCallback((type: string) => {
    const cacheKeyMap: Record<string, keyof typeof profile.dialogueCache> = { 
      'START': 'start', 'FINISH': 'praising', 'DISTRACTION': 'scolding', 
      'IDLE': 'idle', 'CLICK': 'click', 'PAUSE': 'pause', 
      'READY': 'start', 'RETURN': 'scolding' 
    };
    
    const userDisplayName = profile.honorific || profile.userName || "너";
    const key = cacheKeyMap[type];
    if (!key) return;

    const cachedList = profile.dialogueCache[key];
    if (cachedList?.length > 0) {
      const randomIndex = Math.floor(Math.random() * cachedList.length);
      const randomMsg = cachedList[randomIndex];
      setMessage(cleanDialogue(randomMsg, userDisplayName));
      
      const newCacheList = [...cachedList];
      newCacheList.splice(randomIndex, 1);
      onUpdateProfile({ dialogueCache: { ...profile.dialogueCache, [key]: newCacheList } });
      
      // 대사 사용 후 즉시 큐 체크 및 우선순위 재정렬
      if (newCacheList.length <= REFILL_CONFIG[key].threshold) {
        addToRefillQueue(key);
      }
    } else {
      const toneKey = profile.personality.find(p => FALLBACK_TEMPLATES[p]) || "존댓말";
      const template = FALLBACK_TEMPLATES[toneKey];
      const rawMsgs = template[type] || ["..."];
      setMessage(cleanDialogue(rawMsgs[Math.floor(Math.random() * rawMsgs.length)], userDisplayName));
      
      // 개수 0개이므로 최우선순위로 큐 등록
      addToRefillQueue(key);
    }
  }, [profile, onUpdateProfile, addToRefillQueue]);

  const handleInteraction = useCallback((isActive: boolean, isBreak: boolean) => {
    if (isBreak) return;
    if (cooldownRemaining > 0) return true;
    
    triggerAIResponse('CLICK');
    setCooldownRemaining(COOLDOWN_MS);
    const start = Date.now();
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    cooldownIntervalRef.current = setInterval(() => {
      const left = Math.max(0, COOLDOWN_MS - (Date.now() - start));
      setCooldownRemaining(left);
      if (left <= 0) clearInterval(cooldownIntervalRef.current);
    }, 100);
    return false;
  }, [cooldownRemaining, triggerAIResponse]);

  return {
    message,
    setMessage,
    cooldownRemaining,
    setCooldownRemaining,
    triggerAIResponse,
    handleInteraction,
    pendingExpiryAlert,
    setPendingExpiryAlert,
    COOLDOWN_MS
  };
};
