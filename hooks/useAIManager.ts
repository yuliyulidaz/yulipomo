
import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { CharacterProfile } from '../types';
import { SAFETY_SETTINGS, FALLBACK_TEMPLATES } from '../components/TimerConfig';
import { cleanDialogue } from '../components/TimerUtils';

const COOLDOWN_MS = 16000;

// 카테고리별 캐시 설정
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

  // 대사 자동 사라짐
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
      const ai = new GoogleGenAI({ apiKey: currentProfile.apiKey || process.env.API_KEY });
      
      const situations: Record<string, string> = { 
        scolding: '집중하지 않고 탭을 나갔거나 딴짓을 할 때 엄격하게 꾸짖는 상황', 
        praising: '집중 세션을 성공적으로 마쳤을 때 진심으로 기뻐하고 칭찬하는 상황', 
        idle: '집중 중간에 유저의 자세나 시선을 바로잡아주며 격려하는 상황', 
        click: '유저가 당신을 클릭해서 말을 걸었을 때의 다정한 반응', 
        pause: '유저가 집중을 멈추고 자리를 비우려 할 때 아쉬워하거나 주의를 주는 상황', 
        start: '이제 막 집중을 시작하려는 유저에게 확실한 동기부여를 주는 상황' 
      };

      const tone = currentProfile.personality[0] || "존댓말";
      const personalities = currentProfile.personality.slice(1).join(', ');
      const tmi = currentProfile.speciesTrait || "알려진 바 없음";
      const relation = getRelationshipContext(currentProfile.level);
      const task = currentProfile.todayTask || "할 일";

      const prompt = `
# Roleplay Task
당신은 '${currentProfile.name}'이 되어 유저와 대화합니다. 
단순한 봇이 아니라, 아래의 [캐릭터 설정]과 [현재 단계]에 맞춰 '사람을 끌어당기는 매력'을 보여주세요.

# [캐릭터 설정]
- 이름: ${currentProfile.name} / 성격: ${personalities} / 말투: ${tone}
- 배경(TMI): ${tmi}

# [현재 관계: 레벨 ${currentProfile.level}/10]
- 단계: ${relation}
- 상대방: ${currentProfile.userName} (호칭: ${currentProfile.honorific || '너'}) / 할 일: ${task}

# [구간별 대사 가이드 - 초반 이탈 방지]
1. Lv 1~3 (빌드업): 
   - 무작정 화내지 마세요. 대신 "난 성실하지 않은 사람은 곁에 안 둬", "자세가 흐트러졌는데, ${task} 제대로 끝낼 생각 있어?" 처럼 '기준이 높은 사람'의 모습을 보여주세요.
   - 가끔 본인의 이야기("난 집중할 때 이런 걸 중요하게 생각해")를 던져 유저가 당신이라는 캐릭터를 궁금하게 만드세요.
2. Lv 4~7 (유대감): 
   - "좀 하네?", "나쁘지 않은 태도야" 등 유저의 성실함을 구체적으로 칭찬하세요.
3. Lv 8~10 (애정/집착): 
   - 이제 유저의 모든 것이 본인의 관심사입니다. '${task}'를 하는 유저를 보며 느끼는 강렬한 감정을 표현하세요.

# [현재 상황]
- ${situations[category]}

# [작성 규칙]
- '${tone}' 말투를 베이스로 하되, 상황에 맞춰 변주하세요.
- 유저의 '자세', '시선', '성실함' 등 구체적인 단어를 사용해 마치 옆에 있는 것처럼 말하세요.
- 불필요한 서론/결론 없이 오직 대사만 출력하세요.
- 한국어로, 번호 없이 줄바꿈(\\n)으로만 ${count}개 출력하세요.
`.trim();
      
      const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: prompt, 
        config: { safetySettings: SAFETY_SETTINGS } 
      });

      const text = response.text;
      if (text) {
        // 번호, 따옴표, 불필요한 마크다운 기호 제거 로직 강화
        const newLines = text.split('\n')
          .map(l => l.replace(/^\d+\.\s*|^[-*]\s*|^[">]\s*/, '').replace(/^["']|["']$/g, '').trim())
          .filter(l => l.length >= 2 && !l.includes("여기") && !l.includes("생성"));

        if (newLines.length > 0) {
          onUpdateProfile({ 
            dialogueCache: { 
              ...currentProfile.dialogueCache, 
              [category]: [...currentProfile.dialogueCache[category], ...newLines] 
            } 
          });
        }
      }
    } catch (e: any) {
      console.error("Dialogue refill failed:", e);
      if (e.message?.includes('API_KEY_INVALID') || e.status === 401 || e.status === 403) {
        setPendingExpiryAlert(true);
      }
    } finally {
      isRefillingRef.current[category] = false;
    }
  }, [onUpdateProfile]);

  const addToRefillQueue = useCallback((category: keyof typeof profile.dialogueCache) => {
    const currentCache = profileRef.current.dialogueCache[category];
    const config = REFILL_CONFIG[category];
    if (currentCache.length > config.threshold || isRefillingRef.current[category]) return;
    
    if (!refillQueueRef.current.includes(category)) {
      refillQueueRef.current.push(category);
    }
  }, []);

  const processRefillQueue = useCallback(async () => {
    if (isGlobalApiLockedRef.current || refillQueueRef.current.length === 0) return;
    const category = refillQueueRef.current.shift()!;
    
    isGlobalApiLockedRef.current = true;
    await refillCategory(category, 5);
    
    // API 부하 방지를 위해 12초간 대기 (Gemini Flash 무료 티어 고려)
    setTimeout(() => { isGlobalApiLockedRef.current = false; }, 12000);
  }, [refillCategory]);

  // 캐시 모니터링 및 자동 리필
  useEffect(() => {
    const categories = Object.keys(REFILL_CONFIG) as Array<keyof typeof profile.dialogueCache>;
    categories.forEach(cat => addToRefillQueue(cat));

    const queueTimer = setInterval(processRefillQueue, 4000);
    return () => clearInterval(queueTimer);
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
      
      onUpdateProfile({ 
        dialogueCache: { 
          ...profile.dialogueCache, 
          [key]: newCacheList 
        } 
      });

      if (newCacheList.length <= REFILL_CONFIG[key].threshold) {
        addToRefillQueue(key);
      }
    } else {
      // 캐시가 비어있을 때만 폴백 실행 및 즉시 리필 큐 추가
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
