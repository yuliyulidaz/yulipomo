import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { CharacterProfile, DialogueLine, ToneTag } from '../types';
import { SAFETY_SETTINGS, FALLBACK_TEMPLATES } from '../components/TimerConfig';
import { cleanDialogue, getTimePeriod, getSeason } from '../components/TimerUtils';
import { buildRefillPrompt } from '../components/AIPromptTemplates';
import { FIXED_DIALOGUES } from '../CharacterDialogues';
import { KEYWORD_TO_TAGS } from '../components/SetupConfig';

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
          .slice(0, 5); 

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
    if (isGlobalApiLockedRef.current || refillQueueRef.current.length === 0) return;
    const category = refillQueueRef.current.shift()!;
    const currentLen = profileRef.current.dialogueCache[category].length;
    if (currentLen > REFILL_CONFIG[category].threshold) return;

    isGlobalApiLockedRef.current = true;
    await refillCategory(category);
    setTimeout(() => { isGlobalApiLockedRef.current = false; }, 15000);
  }, [refillCategory]);

  useEffect(() => {
    const categories = Object.keys(REFILL_CONFIG) as Array<keyof typeof profile.dialogueCache>;
    categories.forEach(cat => {
      if (profileRef.current.dialogueCache[cat].length <= REFILL_CONFIG[cat].threshold) {
        addToRefillQueue(cat);
      }
    });
    const queueTimer = setInterval(processRefillQueue, 5000);
    return () => clearInterval(queueTimer);
  }, [processRefillQueue, addToRefillQueue]);

  // 새로운 대사 선택 엔진
  const triggerAIResponse = useCallback((type: string) => {
    const userDisplayName = profile.honorific || profile.userName || "너";
    const toneKey = profile.personality[0] || "존댓말";
    const currentLevel = profile.level || 1;

    // 성격 키워드들로부터 허용된 태그들 추출 (예: ["sweet", "soft", "tsundere"])
    const selectedKeywords = profile.personality.slice(1);
    const allowedTags: ToneTag[] = selectedKeywords.flatMap(k => KEYWORD_TO_TAGS[k] || []);

    if (type === 'START' || type === 'PAUSE' || type === 'READY') {
      const situation = type === 'READY' ? 'START' : type;
      const allPossibleLines: DialogueLine[] = FIXED_DIALOGUES[toneKey]?.[situation as 'START' | 'PAUSE'] || [];
      
      // 1. 레벨 필터링
      const levelFiltered = allPossibleLines.filter(line => 
        currentLevel >= line.levelRange[0] && currentLevel <= line.levelRange[1]
      );

      // 2. 성격 태그 필터링
      const tagFiltered = levelFiltered.filter(line => 
        line.tones.some(t => allowedTags.includes(t))
      );

      // 3. 우선순위 결정: 성격 일치 > 레벨 일치 > 전체 랜덤
      const finalPool = tagFiltered.length > 0 
        ? tagFiltered 
        : (levelFiltered.length > 0 ? levelFiltered : allPossibleLines);

      if (finalPool.length > 0) {
        const picked = finalPool[Math.floor(Math.random() * finalPool.length)];
        setMessage(cleanDialogue(picked.text, userDisplayName));
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
      if (newCacheList.length <= REFILL_CONFIG[key].threshold) addToRefillQueue(key);
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
