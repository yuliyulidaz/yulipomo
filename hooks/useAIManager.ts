
import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { CharacterProfile } from '../types';
import { SAFETY_SETTINGS, FALLBACK_TEMPLATES } from '../components/TimerConfig';
import { cleanDialogue, getTimePeriod, getSeason } from '../components/TimerUtils';
import { buildRefillPrompt } from '../components/AIPromptTemplates';
import { FIXED_DIALOGUES } from '../CharacterDialogues';

const COOLDOWN_MS = 30000;

const REFILL_CONFIG: Record<string, { max: number; threshold: number }> = {
  click: { max: 20, threshold: 10 },
  scolding: { max: 20, threshold: 10 }
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

  // 항상 최신 프로필 정보를 참조하기 위함
  useEffect(() => { 
    profileRef.current = profile; 
  }, [profile]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 7000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const addToRefillQueue = useCallback((category: keyof typeof profile.dialogueCache) => {
    const config = REFILL_CONFIG[category as string];
    if (!config || isRefillingRef.current[category]) return;
    
    if (!refillQueueRef.current.includes(category)) {
      refillQueueRef.current.push(category);
    }
    
    // 우선순위 정렬: 
    // 1. 대사 개수가 부족한 순서
    // 2. 개수가 같다면 'click'을 'scolding'보다 무조건 앞에 배치
    refillQueueRef.current.sort((a, b) => {
      const lenA = profileRef.current.dialogueCache[a].length;
      const lenB = profileRef.current.dialogueCache[b].length;
      if (lenA !== lenB) return lenA - lenB;
      if (a === 'click') return -1;
      if (b === 'click') return 1;
      return 0;
    });
  }, []);

  const refillCategory = useCallback(async (category: keyof typeof profile.dialogueCache) => {
    if (isRefillingRef.current[category]) return;
    isRefillingRef.current[category] = true;
    
    try {
      // 호출 직전의 최신 상태를 가져옴
      const currentProfile = profileRef.current;
      const ai = new GoogleGenAI({ apiKey: currentProfile.apiKey || process.env.API_KEY });
      const prompt = buildRefillPrompt(currentProfile, category, getTimePeriod(), getSeason());
      
      const result = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: prompt, 
        config: { safetySettings: SAFETY_SETTINGS, temperature: 0.8 } 
      });

      if (result.text) {
        const newLines = result.text
          .split('\n')
          .map(l => l.replace(/["']/g, '').trim())
          .filter(l => l.length >= 5)
          .slice(0, 5); // 한 번에 최대 5개씩만

        // 업데이트 시점에 한 번 더 최신 캐시 상태를 확인하여 다른 카테고리 데이터가 유실되지 않도록 병합
        onUpdateProfile({ 
          dialogueCache: { 
            ...profileRef.current.dialogueCache, 
            [category]: [...profileRef.current.dialogueCache[category], ...newLines] 
          } 
        });
      }
    } catch (e: any) {
      console.error(`Refill failed for ${category}:`, e);
      if (e.message?.includes('API_KEY_INVALID') || e.status === 401 || e.status === 403 || e.status === 429) {
        setPendingExpiryAlert(true);
      }
    } finally {
      isRefillingRef.current[category] = false;
    }
  }, [onUpdateProfile]);

  const processRefillQueue = useCallback(async () => {
    // 이미 진행 중이거나 큐가 비어있으면 중단
    if (isGlobalApiLockedRef.current || refillQueueRef.current.length === 0) return;

    const category = refillQueueRef.current.shift()!;
    
    // 현재 카테고리의 대사가 이미 충분하다면 건너뜀
    const currentLen = profileRef.current.dialogueCache[category].length;
    if (currentLen > REFILL_CONFIG[category].threshold) {
      return;
    }

    isGlobalApiLockedRef.current = true;
    await refillCategory(category);
    
    // API 과부하 방지 및 순차적 느낌을 위해 15초 대기 후 락 해제
    setTimeout(() => { 
      isGlobalApiLockedRef.current = false; 
    }, 15000);
  }, [refillCategory]);

  useEffect(() => {
    // 초기 진입 시 부족한 카테고리 파악하여 큐에 삽입
    const categories = Object.keys(REFILL_CONFIG) as Array<keyof typeof profile.dialogueCache>;
    categories.forEach(cat => {
      if (profileRef.current.dialogueCache[cat].length <= REFILL_CONFIG[cat].threshold) {
        addToRefillQueue(cat);
      }
    });
    
    // 5초마다 큐를 확인하여 리필 진행
    const queueTimer = setInterval(processRefillQueue, 5000);
    return () => clearInterval(queueTimer);
  }, [processRefillQueue, addToRefillQueue]);

  const triggerAIResponse = useCallback((type: string) => {
    const userDisplayName = profile.honorific || profile.userName || "너";
    const toneKey = profile.personality[0] || "존댓말";

    // START, PAUSE, READY 상황은 로컬 고정 대사 사용
    if (type === 'START' || type === 'PAUSE' || type === 'READY') {
      const situation = type === 'READY' ? 'START' : type;
      const list = FIXED_DIALOGUES[toneKey]?.[situation as 'START' | 'PAUSE'];
      if (list && list.length > 0) {
        const line = list[Math.floor(Math.random() * list.length)];
        setMessage(cleanDialogue(line, userDisplayName));
        return;
      }
    }

    const cacheKeyMap: Record<string, keyof typeof profile.dialogueCache> = { 
      'DISTRACTION': 'scolding', 
      'CLICK': 'click', 
      'RETURN': 'scolding' 
    };
    
    const key = cacheKeyMap[type];
    if (!key) return;

    const cachedList = profile.dialogueCache[key];
    if (cachedList?.length > 0) {
      const randomIndex = Math.floor(Math.random() * cachedList.length);
      setMessage(cleanDialogue(cachedList[randomIndex], userDisplayName));
      
      const newCacheList = [...cachedList];
      newCacheList.splice(randomIndex, 1);
      
      onUpdateProfile({ 
        dialogueCache: { ...profile.dialogueCache, [key]: newCacheList } 
      });
      
      // 소진 후 부족해지면 큐에 추가
      if (newCacheList.length <= REFILL_CONFIG[key].threshold) {
        addToRefillQueue(key);
      }
    } else {
      // 캐시가 비었을 때 폴백 사용
      const fallbackTone = profile.personality.find(p => FALLBACK_TEMPLATES[p]) || "존댓말";
      const rawMsgs = FALLBACK_TEMPLATES[fallbackTone][type] || ["..."];
      setMessage(cleanDialogue(rawMsgs[Math.floor(Math.random() * rawMsgs.length)], userDisplayName));
      addToRefillQueue(key);
    }
  }, [profile, onUpdateProfile, addToRefillQueue]);

  const triggerCooldown = useCallback(() => {
    setCooldownRemaining(COOLDOWN_MS);
    const start = Date.now();
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    cooldownIntervalRef.current = setInterval(() => {
      const left = Math.max(0, COOLDOWN_MS - (Date.now() - start));
      setCooldownRemaining(left);
      if (left <= 0) clearInterval(cooldownIntervalRef.current);
    }, 100);
  }, []);

  const handleInteraction = useCallback((isActive: boolean, isBreak: boolean) => {
    if (isBreak || cooldownRemaining > 0) return true;
    triggerAIResponse('CLICK');
    triggerCooldown();
    return false;
  }, [cooldownRemaining, triggerAIResponse, triggerCooldown]);

  return { message, setMessage, cooldownRemaining, setCooldownRemaining, triggerAIResponse, triggerCooldown, handleInteraction, pendingExpiryAlert, setPendingExpiryAlert, COOLDOWN_MS };
};
