
import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { CharacterProfile } from '../types';
import { SAFETY_SETTINGS, FALLBACK_TEMPLATES } from '../components/TimerConfig';
import { cleanDialogue } from '../components/TimerUtils';

const COOLDOWN_MS = 16000;

export const useAIManager = (
  profile: CharacterProfile,
  onUpdateProfile: (updates: Partial<CharacterProfile>) => void
) => {
  // '쉬는 시간' 상태로 복귀할 때는 시작 버튼 유도 멘트가 나오지 않도록 초기값 설정
  const [message, setMessage] = useState(profile.savedIsBreak ? "" : (profile.initialGreeting || "시작할까?"));
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [pendingExpiryAlert, setPendingExpiryAlert] = useState(false);
  
  const cooldownIntervalRef = useRef<any>(null);
  const isRefillingRef = useRef<Record<string, boolean>>({});
  const isGlobalApiLockedRef = useRef<boolean>(false);
  const refillQueueRef = useRef<Array<keyof typeof profile.dialogueCache>>([]);
  const profileRef = useRef(profile);

  useEffect(() => { profileRef.current = profile; }, [profile]);

  // 대사 자동 숨김 로직: 7초 후 투명하게 사라짐
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const refillCategory = useCallback(async (category: keyof typeof profile.dialogueCache, count: number = 5) => {
    const categoryKey = String(category);
    if (isRefillingRef.current[categoryKey]) return;
    isRefillingRef.current[categoryKey] = true;
    
    try {
      const currentProfile = profileRef.current;
      const ai = new GoogleGenAI({ apiKey: currentProfile.apiKey || process.env.API_KEY });
      const getMood = () => {
        if (currentProfile.level <= 3) return "Cold, Strict, Minimalist";
        if (currentProfile.level <= 7) return "Friendly, Warm, Helpful";
        return "Deeply Affointed, Loving, Obsessive";
      };
      const situations: Record<string, string> = { 
        scolding: 'slacking off', praising: 'finished focus', 
        idle: 'mid-focus', click: 'user clicked', 
        pause: 'paused', start: 'started' 
      };
      
      const prompt = `Roleplay as ${currentProfile.name}. User: ${currentProfile.userName}. Mood: ${getMood()}. Personality: ${currentProfile.personality.join(', ')}. Situation: ${situations[categoryKey]}. Write ${count} Korean sentences (10-20 chars). Use {honorific}. Separate by Newline.`;
      
      const result = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: prompt, 
        config: { safetySettings: SAFETY_SETTINGS } 
      });

      if (result.text) {
        const newLines = result.text.split('\n').map(l => l.trim()).filter(l => l.length >= 8);
        onUpdateProfile({ 
          dialogueCache: { 
            ...currentProfile.dialogueCache, 
            [category]: [...currentProfile.dialogueCache[category], ...newLines] 
          } 
        });
      }
    } catch (e: any) {
      if (e.message?.includes('API_KEY_INVALID') || e.status === 401 || e.status === 403) {
        setPendingExpiryAlert(true);
      }
    } finally {
      isRefillingRef.current[categoryKey] = false;
    }
  }, [onUpdateProfile]);

  const addToRefillQueue = useCallback((category: keyof typeof profile.dialogueCache) => {
    if (profileRef.current.dialogueCache[category].length > 10) return;
    if (!refillQueueRef.current.includes(category)) refillQueueRef.current.push(category);
  }, []);

  const processRefillQueue = useCallback(async () => {
    if (isGlobalApiLockedRef.current || refillQueueRef.current.length === 0) return;
    const category = refillQueueRef.current.shift()!;
    isGlobalApiLockedRef.current = true;
    await refillCategory(category, 5);
    setTimeout(() => { isGlobalApiLockedRef.current = false; }, 15000);
  }, [refillCategory]);

  useEffect(() => {
    const queueTimer = setInterval(processRefillQueue, 2000);
    return () => clearInterval(queueTimer);
  }, [processRefillQueue]);

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
      addToRefillQueue(key);
    } else {
      const toneKey = profile.personality.find(p => FALLBACK_TEMPLATES[p]) || "존댓말";
      const template = FALLBACK_TEMPLATES[toneKey];
      const rawMsgs = template[type] || ["..."];
      setMessage(cleanDialogue(rawMsgs[Math.floor(Math.random() * rawMsgs.length)], userDisplayName));
      addToRefillQueue(key);
    }
  }, [profile, onUpdateProfile, addToRefillQueue]);

  const handleInteraction = useCallback((isActive: boolean, isBreak: boolean) => {
    if (isBreak) return;
    if (cooldownRemaining > 0) {
      // "가만히 바라보는 중..." 대사 노출 로직 삭제 (이미지 테두리 애니메이션으로만 인지)
      return true;
    }
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
