
import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { CharacterProfile } from '../types';
import { SAFETY_SETTINGS, FALLBACK_TEMPLATES } from '../components/TimerConfig';
import { cleanDialogue } from '../components/TimerUtils';

const COOLDOWN_MS = 16000;
const GLOBAL_API_COOLDOWN = 6000; // API 호출 간격 6초 (무료 티어 15 RPM 대비 매우 안전한 10 RPM 설정)

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
  const lastApiCallTimeRef = useRef<number>(0);
  const isProcessingQueueRef = useRef<boolean>(false);
  const refillQueueRef = useRef<Array<keyof typeof profile.dialogueCache>>([]);
  const profileRef = useRef(profile);

  useEffect(() => { profileRef.current = profile; }, [profile]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 7000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const getRelationshipContext = (level: number) => {
    if (level <= 3) return "관심 없는 척하지만 사실은 유저에게 매우 높은 기준을 요구하며 지켜보는 단계 (Lv 1~3)";
    if (level <= 7) return "유대감이 쌓여 유저의 성실함을 인정하고 본격적으로 응원하기 시작하는 단계 (Lv 4~7)";
    return "깊은 애정과 신뢰, 혹은 강한 소유욕과 집착이 섞인 특별하고 친밀한 단계 (Lv 8~10)";
  };

  const refillCategory = useCallback(async (category: keyof typeof profile.dialogueCache, count: number = 5) => {
    if (isRefillingRef.current[category]) return;
    isRefillingRef.current[category] = true;
    
    try {
      const currentProfile = profileRef.current;
      const key = currentProfile.apiKey && currentProfile.apiKey.length > 10 ? currentProfile.apiKey : process.env.API_KEY;
      const ai = new GoogleGenAI({ apiKey: key });
      
      const situations: Record<string, string> = { 
        scolding: '집중하지 않고 딴짓(이탈)을 했을 때 엄격하게 꾸짖는 상황', 
        praising: '집중 세션을 성공적으로 마쳤을 때 진심으로 칭찬하는 상황', 
        idle: '집중 중간에 유저의 자세나 시선을 바로잡아주며 격려하는 상황', 
        click: '유저가 당신을 클릭해서 말을 걸었을 때의 반응', 
        pause: '유저가 집중을 멈추고 자리를 비우려 할 때 아쉬워하거나 경고하는 상황', 
        start: '이제 막 집중을 시작하려는 유저에게 동기부여를 주는 상황' 
      };

      const tone = currentProfile.personality[0] || "존댓말";
      const personalities = currentProfile.personality.slice(1).join(', ') || "매력적인";
      const tmi = currentProfile.speciesTrait || "알려진 바 없음";
      const relation = getRelationshipContext(currentProfile.level);
      const task = currentProfile.todayTask || "할 일";

      const prompt = `
# Roleplay Task
당신은 '${currentProfile.name}'이 되어 유저와 대화합니다. 
아래 설정에 맞춰 '사람을 끌어당기는 매력'을 보여주세요.

# [캐릭터 설정]
- 이름: ${currentProfile.name} / 성격: ${personalities} / 말투: ${tone}
- 배경: ${tmi}

# [현재 관계: 레벨 ${currentProfile.level}/10]
- 단계: ${relation}
- 상대방: ${currentProfile.userName} (호칭: ${currentProfile.honorific || '너'}) / 목표: ${task}

# [구간별 대사 가이드]
1. Lv 1~3: 무작정 화내지 마세요. "난 성실하지 않은 사람은 곁에 안 둬" 처럼 기준이 높은 모습을 보여주세요.
2. Lv 4~7: 유저의 성실함을 구체적인 단어로 칭찬하세요.
3. Lv 8~10: 유저의 모든 것에 집착하거나 깊은 애정을 표현하세요.

# [현재 상황]
- ${situations[category]}

# [출력 규칙]
- '${tone}' 말투를 반드시 유지하세요.
- 불필요한 서론(예: "네, 생성하겠습니다")이나 설명 없이 **오직 대사만** 출력하세요.
- 각 대사는 한 줄에 하나씩, 번호 없이 작성하세요.
- 한국어로 총 ${count}개의 대사를 생성하세요.
`.trim();
      
      const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: prompt, 
        config: { safetySettings: SAFETY_SETTINGS } 
      });

      const rawText = response.text;
      if (rawText) {
        const newLines = rawText.split('\n')
          .map(line => line.trim())
          .map(line => line.replace(/^(\d+[\.\)\:]?\s*)+/, '')) // 번호(1. 2: 3)) 제거
          .map(line => line.replace(/^[-*+•]\s*/, '')) // 불렛 제거
          .map(line => line.replace(/^["'「“](.*)["'」”]$/, '$1')) // 따옴표 제거
          .filter(line => {
            if (line.length < 2 || line.startsWith('#') || line.includes('```')) return false;
            // AI의 불필요한 노이즈 문장 필터링
            const noise = ['알겠습니다', '생성하겠', '대사입니', '상황에 맞춰', '출력합니다', '다음은'];
            return !noise.some(word => line.includes(word));
          });

        if (newLines.length > 0) {
          onUpdateProfile({ 
            dialogueCache: { 
              ...profileRef.current.dialogueCache, 
              [category]: [...profileRef.current.dialogueCache[category], ...newLines].slice(-20) 
            } 
          });
        }
      }
    } catch (e: any) {
      console.error(`[AI REFILL FAIL - ${category}]:`, e);
      if (e.message?.includes('429')) {
        lastApiCallTimeRef.current = Date.now() + 10000; // 429 에러 시 10초 추가 대기
      }
      if (e.message?.includes('API_KEY_INVALID') || e.status === 401 || e.status === 403) {
        setPendingExpiryAlert(true);
      }
    } finally {
      isRefillingRef.current[category] = false;
      lastApiCallTimeRef.current = Date.now();
    }
  }, [onUpdateProfile]);

  const addToRefillQueue = useCallback((category: keyof typeof profile.dialogueCache) => {
    const currentCache = profileRef.current.dialogueCache[category];
    const config = REFILL_CONFIG[category];
    if (currentCache.length > config.threshold || isRefillingRef.current[category]) return;
    
    if (!refillQueueRef.current.includes(category)) {
      if (['scolding', 'click', 'start'].includes(category)) {
        refillQueueRef.current.unshift(category); // 중요한 상황 우선 순위
      } else {
        refillQueueRef.current.push(category);
      }
    }
  }, []);

  const processRefillQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || refillQueueRef.current.length === 0) return;
    
    const now = Date.now();
    if (now - lastApiCallTimeRef.current < GLOBAL_API_COOLDOWN) return;

    const category = refillQueueRef.current.shift()!;
    isProcessingQueueRef.current = true;
    
    try {
      await refillCategory(category, 5);
    } finally {
      // 어떤 오류가 발생해도 반드시 락을 해제하여 큐가 멈추지 않게 함
      isProcessingQueueRef.current = false;
    }
  }, [refillCategory]);

  useEffect(() => {
    const monitor = setInterval(() => {
      (Object.keys(REFILL_CONFIG) as Array<keyof typeof profile.dialogueCache>).forEach(cat => {
        addToRefillQueue(cat);
      });
    }, 8000);

    const processor = setInterval(processRefillQueue, 2000);
    
    return () => {
      clearInterval(monitor);
      clearInterval(processor);
    };
  }, [processRefillQueue, addToRefillQueue]);

  const triggerAIResponse = useCallback((type: string) => {
    const cacheKeyMap: Record<string, keyof typeof profile.dialogueCache> = { 
      'START': 'start', 'FINISH': 'praising', 'DISTRACTION': 'scolding', 
      'IDLE': 'idle', 'CLICK': 'click', 'PAUSE': 'pause', 
      'READY': 'start', 'RETURN': 'scolding' 
    };
    
    const key = cacheKeyMap[type];
    if (!key) return;

    const userDisplayName = profile.honorific || profile.userName || "너";
    const cachedList = profile.dialogueCache[key];

    if (cachedList && cachedList.length > 0) {
      const randomIndex = Math.floor(Math.random() * cachedList.length);
      const randomMsg = cachedList[randomIndex];
      setMessage(cleanDialogue(randomMsg, userDisplayName));
      
      const newCacheList = [...cachedList];
      newCacheList.splice(randomIndex, 1);
      onUpdateProfile({ dialogueCache: { ...profile.dialogueCache, [key]: newCacheList } });
      
      if (newCacheList.length <= REFILL_CONFIG[key].threshold) {
        addToRefillQueue(key);
      }
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
    message, setMessage,
    cooldownRemaining, setCooldownRemaining,
    triggerAIResponse, handleInteraction,
    pendingExpiryAlert, setPendingExpiryAlert,
    COOLDOWN_MS
  };
};
