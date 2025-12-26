import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { CharacterProfile } from '../types';
import { SAFETY_SETTINGS, FALLBACK_TEMPLATES } from '../components/TimerConfig';
import { cleanDialogue, getTimePeriod, getSeason } from '../components/TimerUtils';
import { buildRefillPrompt } from '../components/AIPromptTemplates';
import { FIXED_DIALOGUES } from '../CharacterDialogues';

const COOLDOWN_MS = 16000;

// 오직 click과 scolding만 API를 통해 리필하도록 설정
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

  useEffect(() => { profileRef.current = profile; }, [profile]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 7000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const addToRefillQueue = useCallback((category: keyof typeof profile.dialogueCache) => {
    const currentCache = profileRef.current.dialogueCache[category];
    const config = REFILL_CONFIG[category as string];
    // 10개 초과이거나 이미 리필 중이면 큐에 넣지 않음
    if (!config || currentCache.length > config.threshold || isRefillingRef.current[category]) return;
    
    if (!refillQueueRef.current.includes(category)) {
      refillQueueRef.current.push(category);
    }
    
    // 리필 우선순위 로직: 
    // 1. 현재 캐시 개수가 더 적은 쪽을 먼저 리필
    // 2. 개수가 같다면 'click'을 우선 순위로 정렬
    refillQueueRef.current.sort((a, b) => {
      const lenA = profileRef.current.dialogueCache[a].length;
      const lenB = profileRef.current.dialogueCache[b].length;
      if (lenA !== lenB) return lenA - lenB;
      return a === 'click' ? -1 : 1;
    });
  }, []);

  const refillCategory = useCallback(async (category: keyof typeof profile.dialogueCache) => {
    if (isRefillingRef.current[category]) return;
    isRefillingRef.current[category] = true;
    
    try {
      const currentProfile = profileRef.current;
      const ai = new GoogleGenAI({ apiKey: currentProfile.apiKey || process.env.API_KEY });
      const prompt = buildRefillPrompt(currentProfile, category, getTimePeriod(), getSeason());
      
      const result = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: prompt, 
        config: { safetySettings: SAFETY_SETTINGS, temperature: 0.8 } 
      });

      if (result.text) {
        const newLines = result.text.split('\n').map(l => l.replace(/["']/g, '').trim()).filter(l => l.length >= 5);
        onUpdateProfile({ 
          dialogueCache: { 
            ...currentProfile.dialogueCache, 
            [category]: [...currentProfile.dialogueCache[category], ...newLines] 
          } 
        });
      }
    } catch (e: any) {
      if (e.message?.includes('API_KEY_INVALID') || e.status === 401 || e.status === 403 || e.status === 429) {
        setPendingExpiryAlert(true);
      }
    } finally {
      isRefillingRef.current[category] = false;
    }
  }, [onUpdateProfile]);

  const processRefillQueue = useCallback(async () => {
    if (isGlobalApiLockedRef.current || refillQueueRef.current.length === 0) return;
    const category = refillQueueRef.current.shift()!;
    isGlobalApiLockedRef.current = true;
    await refillCategory(category);
    // 호출 간 시간차를 두기 위해 일정 시간 후 잠금 해제
    setTimeout(() => { isGlobalApiLockedRef.current = false; }, 15000);
  }, [refillCategory]);

  useEffect(() => {
    const categories = Object.keys(REFILL_CONFIG) as Array<keyof typeof profile.dialogueCache>;
    const isBrandNew = categories.every(cat => profileRef.current.dialogueCache[cat].length === 0);

    if (isBrandNew) {
      // 1. 타이머 페이지 진입 시 캐시가 비어있다면 click 5개부터 즉시 가져오기 시작
      isGlobalApiLockedRef.current = true;
      refillCategory('click').finally(() => {
        setTimeout(() => { isGlobalApiLockedRef.current = false; }, 15000);
      });
      // 2. scolding은 큐에 넣어 정해진 시간차(processRefillQueue)를 두고 가져오게 함
      ['scolding'].forEach(cat => addToRefillQueue(cat as any));
    } else {
      // 기존 유저인 경우 부족한 카테고리만 큐에 추가
      categories.forEach(cat => addToRefillQueue(cat));
    }
    
    const queueTimer = setInterval(processRefillQueue, 5000);
    return () => clearInterval(queueTimer);
  }, [processRefillQueue, refillCategory, addToRefillQueue]);

  const triggerAIResponse = useCallback((type: string) => {
    const userDisplayName = profile.honorific || profile.userName || "너";
    const toneKey = profile.personality[0] || "존댓말";

    // START, PAUSE, READY 상황은 절대 API를 호출하지 않고 로컬 고정 대사에서 즉시 처리
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
      onUpdateProfile({ dialogueCache: { ...profile.dialogueCache, [key]: newCacheList } });
      
      // 소진 후 개수가 임계값 이하라면 리필 큐에 등록
      if (REFILL_CONFIG[key] && newCacheList.length <= REFILL_CONFIG[key].threshold) {
        addToRefillQueue(key);
      }
    } else {
      // 캐시가 비었을 때만 예외적으로 폴백 템플릿 사용 및 즉시 리필 큐 등록
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
