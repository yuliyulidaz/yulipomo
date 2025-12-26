import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { CharacterProfile } from '../types';
import { SAFETY_SETTINGS, FALLBACK_TEMPLATES } from '../components/TimerConfig';
import { cleanDialogue, getTimePeriod, getSeason } from '../components/TimerUtils';
import { buildRefillPrompt } from '../components/AIPromptTemplates';
import { FIXED_DIALOGUES } from '../CharacterDialogues';

const COOLDOWN_MS = 16000;

// start, pause를 리필 설정에서 제거하여 API 호출 보호
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
    const config = REFILL_CONFIG[category];
    // 리필 설정에 없는 카테고리는 큐에 추가하지 않음 (start, pause 보호)
    if (!config || currentCache.length > config.threshold || isRefillingRef.current[category]) return;
    if (!refillQueueRef.current.includes(category)) refillQueueRef.current.push(category);
    refillQueueRef.current.sort((a, b) => profileRef.current.dialogueCache[a].length - profileRef.current.dialogueCache[b].length);
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
    setTimeout(() => { isGlobalApiLockedRef.current = false; }, 15000);
  }, [refillCategory]);

  useEffect(() => {
    const categories = Object.keys(REFILL_CONFIG) as Array<keyof typeof profile.dialogueCache>;
    const isBrandNew = categories.every(cat => profileRef.current.dialogueCache[cat].length === 0);

    if (isBrandNew) {
      isGlobalApiLockedRef.current = true;
      refillCategory('click').finally(() => setTimeout(() => { isGlobalApiLockedRef.current = false; }, 15000));
      ['scolding'].forEach(cat => addToRefillQueue(cat as any));
    } else {
      categories.forEach(cat => addToRefillQueue(cat));
    }
    const queueTimer = setInterval(processRefillQueue, 5000);
    return () => clearInterval(queueTimer);
  }, [processRefillQueue, refillCategory, addToRefillQueue]);

  const triggerAIResponse = useCallback((type: string) => {
    const userDisplayName = profile.honorific || profile.userName || "너";
    const toneKey = profile.personality[0] || "존댓말";

    // START와 PAUSE는 고정 대사 파일에서 즉시 반환 (API 호출 차단)
    if (type === 'START' || type === 'PAUSE' || type === 'READY') {
      const fixedSituation = type === 'READY' ? 'START' : type;
      const fixedList = FIXED_DIALOGUES[toneKey]?.[fixedSituation as 'START' | 'PAUSE'];
      
      if (fixedList && fixedList.length > 0) {
        const randomIndex = Math.floor(Math.random() * fixedList.length);
        setMessage(cleanDialogue(fixedList[randomIndex], userDisplayName));
        return;
      }
    }

    // 그 외 (DISTRACTION, CLICK, RETURN)는 캐시된 대사 사용
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
      if (REFILL_CONFIG[key] && newCacheList.length <= REFILL_CONFIG[key].threshold) addToRefillQueue(key);
    } else {
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
