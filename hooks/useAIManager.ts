import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { CharacterProfile, DialogueLine, ToneTag } from '../types';
import { SAFETY_SETTINGS, FALLBACK_TEMPLATES, FallbackType } from '../components/TimerConfig';
import { cleanDialogue, getTimePeriod, getSeason } from '../components/TimerUtils';
import { buildRefillPrompt } from '../components/AIPromptTemplates';
import { FIXED_DIALOGUES } from '../CharacterDialogues';
import { KEYWORD_TO_TAGS } from '../components/SetupConfig';
import { CLICK_SITUATIONS, ActionSituation } from '../CharacterSituations';

const COOLDOWN_MS = 30000;
const API_TIMEOUT_MS = 15000; // 15초 타임아웃 설정

const REFILL_CONFIG: Record<string, { max: number; threshold: number }> = {
  click: { max: 20, threshold: 15 },
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

  const usedSituationIdsRef = useRef<string[]>([]);

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
      return a === 'click' ? -1 : 1;
    });
  }, []);

  const selectSituationsForRefill = useCallback((level: number): ActionSituation[] => {
    const available = CLICK_SITUATIONS.filter(s => s.level <= level);
    const fresh = available.filter(s => !usedSituationIdsRef.current.includes(s.id));
    const pool = fresh.length >= 3 ? fresh : available;
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    const newUsedIds = [...selected.map(s => s.id), ...usedSituationIdsRef.current].slice(0, 15);
    usedSituationIdsRef.current = newUsedIds;
    return selected;
  }, []);

  const refillCategory = useCallback(async (category: keyof typeof profile.dialogueCache) => {
    if (isRefillingRef.current[category]) return;
    isRefillingRef.current[category] = true;
    
    try {
      const currentProfile = profileRef.current;
      const situations = category === 'click' ? selectSituationsForRefill(currentProfile.level) : undefined;
      const ai = new GoogleGenAI({ apiKey: currentProfile.apiKey || process.env.API_KEY });
      const prompt = buildRefillPrompt(currentProfile, category, getTimePeriod(), getSeason(), situations);
      
      const fetchPromise = ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: prompt, 
        config: { safetySettings: SAFETY_SETTINGS, temperature: 0.85 } 
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), API_TIMEOUT_MS)
      );

      const result = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (result && result.text) {
        const limit = category === 'click' ? 3 : 5;
        const newLines = result.text
          .split('\n')
          .map((l: string) => l.replace(/^[0-9]\.\s*/, '').replace(/["']/g, '').trim())
          .filter((l: string) => l.length >= 5)
          .slice(0, limit); 
        
        onUpdateProfile({ 
          dialogueCache: { 
            ...profileRef.current.dialogueCache, 
            [category]: [...profileRef.current.dialogueCache[category], ...newLines] 
          } 
        });
      }
    } catch (e: any) {
      console.warn(`Refill failed for ${category}:`, e.message);
      if (e.message?.includes('API_KEY_INVALID') || [401, 403, 429].includes(e.status)) {
        setPendingExpiryAlert(true);
      }
    } finally {
      isRefillingRef.current[category] = false;
    }
  }, [onUpdateProfile, selectSituationsForRefill]);

  const processRefillQueue = useCallback(async () => {
    if (isGlobalApiLockedRef.current || refillQueueRef.current.length === 0) return;
    const category = refillQueueRef.current.shift()!;
    if (profileRef.current.dialogueCache[category].length > REFILL_CONFIG[category].threshold) return;
    
    isGlobalApiLockedRef.current = true;
    
    try {
      await refillCategory(category);
    } finally {
      setTimeout(() => { 
        isGlobalApiLockedRef.current = false; 
      }, 15000);
    }
  }, [refillCategory]);

  useEffect(() => {
    const categories = Object.keys(REFILL_CONFIG) as Array<keyof typeof profile.dialogueCache>;
    categories.forEach(cat => {
      if (profileRef.current.dialogueCache[cat].length <= REFILL_CONFIG[cat].threshold) addToRefillQueue(cat);
    });
    const queueTimer = setInterval(processRefillQueue, 5000);
    return () => clearInterval(queueTimer);
  }, [processRefillQueue, addToRefillQueue]);

  const triggerAIResponse = useCallback((type: string) => {
    const userDisplayName = profile.honorific || profile.userName || "너";
    const toneKey = profile.personality[0] || "존댓말";
    const currentLevel = profile.level || 1;
    const allowedTags: ToneTag[] = profile.personality.slice(1).flatMap(k => KEYWORD_TO_TAGS[k] || []);

    if (['START', 'PAUSE'].includes(type)) {
      const allLines = FIXED_DIALOGUES[toneKey]?.[type as 'START' | 'PAUSE'] || [];
      const lvLines = allLines.filter(l => currentLevel >= l.levelRange[0] && currentLevel <= l.levelRange[1]);
      const tagLines = lvLines.filter(l => l.tones.some(t => allowedTags.includes(t)));
      const pool = tagLines.length > 0 ? tagLines : (lvLines.length > 0 ? lvLines : allLines);
      if (pool.length > 0) {
        setMessage(cleanDialogue(pool[Math.floor(Math.random() * pool.length)].text, userDisplayName));
        return;
      }
    }

    const categoryKey = ({ 'CLICK': 'click', 'SCOLDING': 'scolding' } as any)[type];
    if (!categoryKey) return;

    const cachedList = profile.dialogueCache[categoryKey];
    if (cachedList && cachedList.length > 0) {
      const idx = Math.floor(Math.random() * cachedList.length);
      setMessage(cleanDialogue(cachedList[idx], userDisplayName));
      const newList = [...cachedList];
      newList.splice(idx, 1);
      onUpdateProfile({ dialogueCache: { ...profile.dialogueCache, [categoryKey]: newList } });
    } else {
      const fallbackToneKey = profile.personality.find(p => FALLBACK_TEMPLATES[p]) || "존댓말";
      const allFallbackLines = FALLBACK_TEMPLATES[fallbackToneKey]?.[type as FallbackType] || [];
      
      const lvFiltered = allFallbackLines.filter(l => currentLevel >= l.levelRange[0] && currentLevel <= l.levelRange[1]);
      const tagFiltered = lvFiltered.filter(l => l.tones.some(t => allowedTags.includes(t)));
      const pool = tagFiltered.length > 0 ? tagFiltered : (lvFiltered.length > 0 ? lvFiltered : allFallbackLines);
      
      if (pool.length > 0) {
        const picked = pool[Math.floor(Math.random() * pool.length)];
        setMessage(cleanDialogue(picked.text, userDisplayName));
      } else {
        setMessage("..."); 
      }
      
      addToRefillQueue(categoryKey);
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
