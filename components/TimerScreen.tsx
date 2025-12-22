
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Heart, Timer as TimerIcon, Coffee, Bed, CheckCircle2, Moon, Sun, Settings, Save, Key, ExternalLink } from 'lucide-react';
import { CharacterProfile } from '../types';
// Import HarmCategory and HarmBlockThreshold for correct typing
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

interface TimerScreenProps {
  profile: CharacterProfile;
  onReset: () => void;
  onTickXP: (amount: number) => void;
  onUpdateProfile: (updates: Partial<CharacterProfile>) => void;
  onSessionComplete: (wasSuccess: boolean) => void;
}

const LEVEL_XP_TABLE = [0, 10, 20, 30, 50, 80, 120, 170, 230, 300, 400]; 

const LEVEL_TITLES: Record<number, string> = {
  1: "완전한 타인",
  2: "약간의 호기심",
  3: "낯가리는 파트너",
  4: "편안한 동료",
  5: "정이 든 사이",
  6: "신뢰하는 관계",
  7: "특별한 호감",
  8: "소중한 사람",
  9: "애틋한 연인",
  10: "영원한 반려"
};

// Use HarmCategory and HarmBlockThreshold enums for correct typing
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
];

const FALLBACK_TEMPLATES: Record<string, Record<string, string[]>> = {
  "반말": {
    START: [
      "자, 시작하자. {honorific}, 집중해.",
      "이제 시작이야. {honorific}, 할 수 있어.",
      "출발! {honorific}, 할 수 있어.",
      "드디어 시작이네. 화이팅!",
      "시작한다. {honorific}, 따라와.",
      "자, 갈 거야? {honorific}, 집중!",
      "준비됐지? {honorific}, 가자.",
      "이제부터 진짜야. {honorific}, 파이팅.",
      "출발선이야. {honorific}, 각오해.",
      "시작이다! {honorific}, 해보자고."
    ],
    FINISH: ["끝났네? 고생했어. 좀 쉴까?"],
    PAUSE: ["어디 가? 얼른 와라."],
    DISTRACTION: [
      "야, 딴짓하지 마. 보고 있다.",
      "어? 지금 뭐 하는 거야?",
      "그거 내려놔. 집중해.",
      "야야, 딴짓 걸렸어.",
      "뭐 하냐? 다 보여.",
      "그거 끄고 집중해.",
      "딴 데 보지 마. 들켰어.",
      "어이, 지금 장난해?",
      "그거 하지 말라고. 보고 있어.",
      "딴짓 적발! 당장 멈춰."
    ],
    RETURN: ["이제 왔어? 기다렸잖아."],
    CLICK: [
      "뭐야, {honorific} 왜 불러?",
      "할 일은 해야겠지.",
      "시간이 빨리 가는 것 같아",
      "그만하고 이제 집중 하자.",
      "왜 그래, 궁금한 거 있어?",
      "집중하자, {honorific}.",
      "혹시 졸려서 그래?",
      "차근차근 하다보면 언젠간 끝나겠지.",
      "뭐 필요해? 커피? 사탕?",
      "나도 물 좀 마셔야겠어."
    ],
    IDLE: [
      "졸지 말고 해. 지켜보고 있어.",
      "잘하고 있어. 계속 가.",
      "힘내. 거의 다 왔어.",
      "집중하고 있네. 좋아.",
      "괜찮아, 할 수 있어.",
      "조금만 더. 파이팅.",
      "잘하고 있어. 그대로 가.",
      "쉬지 말고. 지켜볼게.",
      "좋은 페이스야. 계속해.",
      "포기하지 마. 옆에 있어."
    ],
    READY: ["슬슬 다시 시작할 준비 해."]
  },
  "존댓말": {
    START: [
      "준비되셨나요? 시작할게요, {honorific}.",
      "이제 시작합니다. {honorific}, 집중해주세요.",
      "시작하겠습니다. {honorific}, 화이팅하세요.",
      "출발할게요. {honorific}, 힘내세요.",
      "자, 시작이에요. {honorific}, 할 수 있어요.",
      "준비 완료. {honorific}, 집중 부탁드려요.",
      "이제부터 본격적이에요. {honorific}, 파이팅!",
      "시작합니다! {honorific}, 최선을 다해주세요.",
      "출발선에 섰어요. {honorific}, 시작해볼까요?",
      "가볼까요? {honorific}, 집중 모드 돌입!"
    ],
    FINISH: ["정말 고생 많으셨어요. 잠깐 쉬세요."],
    PAUSE: ["어디 가하시나요? 금방 오셔야 해요."],
    DISTRACTION: [
      "{honorific}, 딴짓은 안 돼요. 집중하세요.",
      "지금 뭐 하시는 거예요? 집중해주세요.",
      "{honorific}, 그건 잠시 내려놓으세요.",
      "다른 거 보시면 안 돼요. 집중 부탁드려요.",
      "{honorific}, 딴짓 들켰어요. 다시 집중해주세요.",
      "잠깐요, {honorific}. 그건 나중에 하세요.",
      "{honorific}, 지금은 집중할 시간이에요.",
      "그거 끄시고 다시 집중해주세요, {honorific}.",
      "{honorific}, 보고 있어요. 집중하세요.",
      "딴짓은 안 됩니다, {honorific}. 다시 시작하세요."
    ],
    RETURN: ["오셨군요. 기다리고 있었어요."],
    CLICK: [
      "네? 부르셨나요?",
      "조금만 더 하면 돼요.",
      "집중, 집중이에요.",
      "천천히 해도 괜찮아요.",
      "어떻게 도와드릴까요?",
      "네, 여기 있어요.",
      "궁금하신 게 있으세요?",
      "잠깐만요, 무엇을 도와드릴까요?",
      "쉬엄쉬엄 해요.",
      "네, 잘하고 계세요."
    ],
    IDLE: [
      "지켜보고 있으니까 힘내세요.",
      "잘하고 계세요. 계속하세요.",
      "거의 다 오셨어요. 조금만 더요.",
      "집중하시는 모습 좋아요.",
      "괜찮아요, 할 수 있어요.",
      "포기하지 마세요. 응원할게요.",
      "좋은 페이스예요. 그대로 가세요.",
      "쉬지 말고 계속하세요. 지켜보고 있어요.",
      "화이팅하세요. 옆에 있어요.",
      "조금만 더 힘내세요. 거의 끝났어요."
    ],
    READY: ["쉬는 시간 끝나가요. 준비해주세요."]
  },
  "반존대": {
    START: [
      "시작해요. {honorific}, 딴짓하면 혼나요.",
      "자, 시작이에요. {honorific}, 집중!",
      "출발해요. {honorific}, 힘내요.",
      "이제 시작할게요. {honorific}, 준비됐죠?",
      "가요! {honorific}, 따라와요.",
      "시작합니다. {honorific}, 할 수 있어요.",
      "준비됐어요? {honorific}, 집중 모드!",
      "출발이에요. {honorific}, 파이팅!",
      "자, 갈 거예요? {honorific}, 각오해요.",
      "시작한다! {honorific}, 해봐요."
    ],
    FINISH: ["수고했어요. 뭐, 나쁘지 않네."],
    PAUSE: ["어딜 가요? 도망가는 건 아니지?"],
    DISTRACTION: [
      "흐음... 지금 뭐 하는 거죠? 끄세요.",
      "어? 딴짓하는 거 보였어요.",
      "{honorific}, 그거 내려놔요. 집중!",
      "뭐 하는 거예요? 다 보여요.",
      "딴짓 들켰어요. 집중해요.",
      "그거 끄고 다시 해요.",
      "어이, {honorific}. 지금 장난하는 거죠?",
      "딴 데 보지 말아요. 들켰어요.",
      "{honorific}, 그건 안 돼요. 집중해요.",
      "적발! 당장 멈추고 집중해요."
    ],
    RETURN: ["늦었네요. 설명이 좀 필요할 텐데."],
    CLICK: [
      "어? 뭐 말씀하실 거예요?",
      "음... 뭐 하지?",
      "왜요? 뭐 필요해졌어?",
      "아, 시간 빨리 가네...",
      "쉬엄쉬엄 해요.",
      "왜 그래요, 무슨 일이에요?",
      "뭔가 궁금한 거 있어요?",
      "부른 거 맞죠? 듣고 있어요.",
      "여긴 꽤 조용하네요.",
      "또 뭐예요? 말해봐요."
    ],
    IDLE: [
      "제 얼굴 말고 화면 봐요.",
      "잘하고 있어요. 계속 가요.",
      "힘내요. 거의 다 왔어요.",
      "집중하는 거 보기 좋아요.",
      "괜찮아요, 할 수 있어요.",
      "조금만 더요. 파이팅!",
      "좋아요, 그대로 계속해요.",
      "쉬지 말고요. 지켜보고 있어요.",
      "포기하지 말아요. 옆에 있어요.",
      "잘하고 있어요. 화이팅!"
    ],
    READY: ["슬슬 앉아요. 다시 해야지."]
  },
  "사극/하오체": {
    START: [
      "시작하겠소. {honorific}, 부디 집중하시오.",
      "이제 출발하오. {honorific}, 마음을 가다듬으시오.",
      "수행을 시작하겠소. {honorific}, 정진하시오.",
      "준비되었소? {honorific}, 시작하시오.",
      "자, 가보시오. {honorific}, 집중하시게.",
      "출발하겠소. {honorific}, 힘을 내시오.",
      "시작이오. {honorific}, 따라오시게.",
      "이제부터 본격이오. {honorific}, 각오하시오.",
      "수행에 임하시오. {honorific}, 최선을 다하시게.",
      "가보시오! {honorific}, 정신 차리시게."
    ],
    FINISH: ["노고가 많았소. 차라도 한 잔 드시오."],
    PAUSE: ["어딜 가는 게요? 자리를 비우지 마시오."],
    DISTRACTION: [
      "그것은 수행에 방해가 되오. 덮으시오.",
      "흠, 무엇을 하고 있는 게요? 그만두시오.",
      "{honorific}, 그것을 내려놓으시오.",
      "딴청을 부리시는 게요? 집중하시게.",
      "다른 데 눈길 주지 마시오. 정신 차리시게.",
      "수행을 방해하는 것은 삼가시오.",
      "{honorific}, 그것은 지금 할 일이 아니오.",
      "잡념을 버리시오. 집중하시게.",
      "그것을 치우시오. 보고 있소.",
      "딴 생각 말고 정진하시오, {honorific}."
    ],
    RETURN: ["이제야 오는구려. 목이 빠지는 줄 알았소."],
    CLICK: [
      "무슨 일이오? 내가 필요하오?",
      "시간이 빠르구려.",
      "조금만 더 하면 되오.",
      "어허, 벌써 이 시각이오?",
      "천천히 해도 괜찮소.",
      "용건이 있으신 게요?",
      "집중, 집중이오.",
      "창밖이 보고 싶구려.",
      "조용하구려.",
      "서두르지 마시게."
    ],
    IDLE: [
      "내가 여기 있으니 염려 마시오.",
      "잘하고 있소. 계속 정진하시게.",
      "조금만 더 힘내시오. 거의 다 되었소.",
      "집중하시는 모습이 보기 좋소.",
      "마음 편히 가지시오. 지켜보고 있소.",
      "포기하지 마시오. 곁에 있소.",
      "좋은 기운이오. 그대로 가하시게.",
      "쉬지 말고 정진하시오. 함께 있소.",
      "잘하고 있소. 힘을 내시게.",
      "염려 마시오. 내가 지켜보고 있소."
    ],
    READY: ["다시 정진할 시간이오. 채비하시오."]
  },
  "다나까": {
    START: [
      "작전 시작합니다. {honorific}, 집중하십시오!",
      "출격합니다. {honorific}, 준비 완료하십시오.",
      "작전 개시! {honorific}, 전념하십시오.",
      "임무 시작. {honorific}, 집중 바랍니다.",
      "가동합니다. {honorific}, 따라와 주십시오.",
      "출발 명령! {honorific}, 각오하십시오.",
      "작전 돌입. {honorific}, 힘내십시오.",
      "시작 신호 발동. {honorific}, 집중 모드!",
      "임무 개시합니다. {honorific}, 최선을 다하십시오.",
      "작전 수행! {honorific}, 전방 주시 바랍니다."
    ],
    FINISH: ["임무 완료! 수고하셨습니다. 휴식하십시오."],
    PAUSE: ["이탈입니까? 신속히 복귀하십시오."],
    DISTRACTION: [
      "전방 주시! 딴짓은 허용하지 않습니다.",
      "경고! 집중력이 흐트러졌습니다.",
      "그것을 차단하십시오. 임무에 집중!",
      "딴짓 감지. 즉시 중단 바랍니다.",
      "{honorific}, 시선을 돌리지 마십시오.",
      "경고 발령. 다시 집중해주십시오.",
      "방해 요소 제거 바랍니다. 집중!",
      "임무 이탈 감지. 복귀하십시오.",
      "그것은 금지입니다. 즉각 중단하십시오.",
      "집중 해제 감지! 재집중 명령!"
    ],
    RETURN: ["복귀 신고합니다! 늦으셨습니다."],
    CLICK: [
      "용건 있으십니까?",
      "호출에 응답합니다.",
      "명령을 기다립니다.",
      "무엇을 도와드릴까요?",
      "대기 중입니다. 말씀하십시오.",
      "보고합니다. 준비 완료.",
      "어떤 지시사항이십니까?",
      "여기 있습니다. 분부를 내려주십시오.",
      "네, 듣고 있습니다.",
      "명령 대기 중. 말씀하십시오."
    ],
    IDLE: [
      "제가 후방을 맡겠습니다. 계속하십시오.",
      "양호합니다. 그대로 진행하십시오.",
      "임무 수행 중. 지원하고 있습니다.",
      "집중력 유지 중. 좋습니다.",
      "후방 지원 중입니다. 계속하십시오.",
      "거의 완료 단계입니다. 조금만 더!",
      "상황 양호. 그대로 가하십시오.",
      "지원 사격 중입니다. 힘내십시오.",
      "임무 진행 순조롭습니다. 파이팅!",
      "제가 지키고 있습니다. 끝까지 가하십시오."
    ],
    READY: ["휴식 종료 임박! 위치로 돌아가십시오."]
  }
};

const COOLDOWN_MS = 10000; // 10 seconds cooldown

export const TimerScreen: React.FC<TimerScreenProps> = ({ 
  profile, onReset, onTickXP, onUpdateProfile, onSessionComplete 
}) => {
  const [timeLeft, setTimeLeft] = useState(profile.savedTimeLeft ?? 25 * 60);
  const [isActive, setIsActive] = useState(profile.savedIsActive ?? false);
  const [isBreak, setIsBreak] = useState(profile.savedIsBreak ?? false);
  const [sessionInCycle, setSessionInCycle] = useState(profile.savedSessionInCycle ?? 0); 
  const [message, setMessage] = useState(profile.initialGreeting || "시작할까?");
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Settings UI states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isApiKeyInputVisible, setIsApiKeyInputVisible] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(profile.apiKey || '');
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Click Cooldown State
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cooldownIntervalRef = useRef<any>(null);

  const isRefillingRef = useRef<Record<string, boolean>>({});
  const isGlobalApiLockedRef = useRef<boolean>(false);
  const refillQueueRef = useRef<Array<keyof typeof profile.dialogueCache>>([]);
  const randomEncouragementTimerRef = useRef<any>(null);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isActive) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err) {
          console.error("Wake Lock failed", err);
        }
      }
    };
    
    if (isActive) {
      requestWakeLock();
    } else {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null;
        });
      }
    }

    return () => {
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, [isActive]);

  useEffect(() => {
    onUpdateProfile({
      savedTimeLeft: timeLeft,
      savedIsActive: isActive,
      savedIsBreak: isBreak,
      savedSessionInCycle: sessionInCycle,
      lastActive: Date.now()
    });
  }, [timeLeft, isActive, isBreak, sessionInCycle, onUpdateProfile]);

  useEffect(() => {
    if (message && !isApiKeyInputVisible) {
      const timer = window.setTimeout(() => {
        setMessage(""); 
      }, 7000);
      return () => window.clearTimeout(timer);
    }
  }, [message, isApiKeyInputVisible]);

  const refillCategory = useCallback(async (category: keyof typeof profile.dialogueCache, count: number = 5) => {
    const categoryKey = String(category);
    if (isRefillingRef.current[categoryKey]) return;
    isRefillingRef.current[categoryKey] = true;

    try {
      const ai = new GoogleGenAI({ apiKey: profile.apiKey || process.env.API_KEY });
      const getMood = () => {
        if (profile.level <= 3) return "Cold, Strict, Minimalist";
        if (profile.level <= 7) return "Friendly, Warm, Helpful";
        return "Deeply Affectionate, Loving, Obsessive";
      };

      const situations: Record<string, string> = {
        scolding: 'user is slacking off or just returned from distraction',
        praising: 'user successfully finished a focus session',
        idle: 'random mid-focus encouragement',
        click: 'user clicked on character to talk',
        pause: 'user paused the timer',
        start: 'user started focus mode'
      };

      const prompt = `Roleplay as ${profile.name}. User: ${profile.userName}. Mood: ${getMood()}. 
        Personality: ${profile.personality.join(', ')}. Situation: ${situations[categoryKey]}. 
        Task: Write ${count} DIFFERENT immersive Korean sentences. 
        
        Constraints:
        - Length: Each sentence must be AT LEAST 10 characters and AT MOST 20 characters long.
        - Safety: This is an educational app for students. ABSOLUTELY FORBID sexual, 18+, violent, or inappropriate content.
        - Format: Use {honorific} for the user's name/title. No numbers, no quotes. Separate by Newline.
        Make them unique and creative, never repeat existing ones.`;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          safetySettings: SAFETY_SETTINGS
        }
      });

      if (result.text) {
        const newLines = result.text.split('\n').map(l => l.trim()).filter(l => l.length >= 8);
        onUpdateProfile({
          dialogueCache: {
            ...profile.dialogueCache,
            [category]: [...profile.dialogueCache[category], ...newLines]
          }
        });
      }
    } catch (e: any) {
      console.error(`Refill failed for ${categoryKey}`, e);
    } finally {
      isRefillingRef.current[categoryKey] = false;
    }
  }, [profile, onUpdateProfile]);

  const processRefillQueue = useCallback(async () => {
    if (isGlobalApiLockedRef.current || refillQueueRef.current.length === 0) return;

    let targetIndex = refillQueueRef.current.indexOf('click');
    if (targetIndex === -1) targetIndex = 0;

    const category = refillQueueRef.current.splice(targetIndex, 1)[0];
    
    isGlobalApiLockedRef.current = true;
    await refillCategory(category, 5);

    setTimeout(() => {
      isGlobalApiLockedRef.current = false;
    }, 12000);
  }, [refillCategory]);

  useEffect(() => {
    const queueTimer = setInterval(processRefillQueue, 2000);
    return () => clearInterval(queueTimer);
  }, [processRefillQueue]);

  const addToRefillQueue = useCallback((category: keyof typeof profile.dialogueCache) => {
    if (!refillQueueRef.current.includes(category)) {
      refillQueueRef.current.push(category);
    }
  }, []);

  const triggerAIResponse = useCallback((type: 'START' | 'FINISH' | 'DISTRACTION' | 'IDLE' | 'CLICK' | 'PAUSE' | 'READY' | 'RETURN' | 'CYCLE_LONG' | 'CYCLE_SHORT') => {
    const cacheKeyMap: Record<string, keyof typeof profile.dialogueCache> = {
      'START': 'start',
      'FINISH': 'praising',
      'DISTRACTION': 'scolding',
      'IDLE': 'idle',
      'CLICK': 'click',
      'PAUSE': 'pause',
      'READY': 'start',
      'RETURN': 'scolding',
      'CYCLE_LONG': 'praising',
      'CYCLE_SHORT': 'praising'
    };

    const userDisplayName = profile.honorific || profile.userName || "너";

    if (type === 'CYCLE_LONG') {
        setMessage("그래, 푹 자고 와. 깨워줄게.");
        return;
    }
    if (type === 'CYCLE_SHORT') {
        setMessage("뭐? 무리하는 거 아냐? ...걱정되게 진짜.");
        return;
    }

    const key = cacheKeyMap[type];
    const cachedList = profile.dialogueCache[key];

    if (cachedList && cachedList.length > 0) {
        const randomIndex = Math.floor(Math.random() * cachedList.length);
        const randomMsg = cachedList[randomIndex];
        const finalMsg = randomMsg
          .replace(/{honorific}/g, userDisplayName)
          .replace(/{이름}/g, userDisplayName)
          .replace(/{user}/g, userDisplayName);
        setMessage(finalMsg);
        
        const newCacheList = [...cachedList];
        newCacheList.splice(randomIndex, 1);
        onUpdateProfile({ dialogueCache: { ...profile.dialogueCache, [key]: newCacheList } });

        if (newCacheList.length <= 2) {
          addToRefillQueue(key);
        }
    } else {
        const toneKey = profile.personality.find(p => FALLBACK_TEMPLATES[p]) || "존댓말";
        const template = FALLBACK_TEMPLATES[toneKey];
        const rawMsgs = template[type] || ["..."];
        const rawMsg = rawMsgs[Math.floor(Math.random() * rawMsgs.length)];
        const finalMsg = rawMsg
          .replace(/{honorific}/g, userDisplayName)
          .replace(/{이름}/g, userDisplayName)
          .replace(/{user}/g, userDisplayName);
        
        setMessage(finalMsg);
        addToRefillQueue(key);
    }
  }, [profile, onUpdateProfile, addToRefillQueue]);

  // Click handler with Cooldown and Staring mode
  const handleCharacterClick = () => {
    if (isBreak) return;
    
    if (cooldownRemaining > 0) {
      setMessage("가만히 바라보는 중...");
      return;
    }
    
    triggerAIResponse('CLICK');
    
    setCooldownRemaining(COOLDOWN_MS);
    const start = Date.now();
    
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    cooldownIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const left = Math.max(0, COOLDOWN_MS - (now - start));
      setCooldownRemaining(left);
      if (left <= 0) {
        if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
      }
    }, 100);
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
        if (!isBreak && timeLeft % 60 === 0) onTickXP(1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleTimerFinish();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isBreak, onTickXP]);

  useEffect(() => {
    Object.keys(profile.dialogueCache).forEach(cat => {
      const category = cat as keyof typeof profile.dialogueCache;
      if (profile.dialogueCache[category].length < 3) {
        addToRefillQueue(category);
      }
    });

    if (isActive && !isBreak) {
      const startTimer = () => {
        const randomMinutes = Math.floor(Math.random() * 6) + 5;
        randomEncouragementTimerRef.current = window.setTimeout(() => {
          triggerAIResponse('IDLE');
          startTimer();
        }, randomMinutes * 60 * 1000);
      };
      startTimer();
    } else {
      if (randomEncouragementTimerRef.current) window.clearTimeout(randomEncouragementTimerRef.current);
    }
    return () => { if (randomEncouragementTimerRef.current) window.clearTimeout(randomEncouragementTimerRef.current); };
  }, [isActive, isBreak, triggerAIResponse, addToRefillQueue]);

  useEffect(() => {
    if (isBreak) {
      ['click', 'idle', 'scolding', 'praising', 'start', 'pause'].forEach(cat => {
        addToRefillQueue(cat as any);
      });
    }
  }, [isBreak, addToRefillQueue]);

  useEffect(() => {
    if (isBreak && timeLeft === 60) {
      triggerAIResponse('READY');
    }
  }, [isBreak, timeLeft, triggerAIResponse]);

  const handleTimerFinish = () => {
    if (!isBreak) {
      onSessionComplete(true);
      const nextSessionCount = sessionInCycle + 1;
      setSessionInCycle(nextSessionCount);
      
      if (nextSessionCount === 4) {
        setIsActive(false);
        setShowChoiceModal(true);
      } else {
        triggerAIResponse('FINISH');
        setIsBreak(true);
        setTimeLeft(5 * 60); 
      }
    } else {
      setIsBreak(false);
      setTimeLeft(25 * 60);
      
      if (sessionInCycle > 0) {
        setIsActive(true);
        triggerAIResponse('START');
      } else {
        setIsActive(false);
        triggerAIResponse('IDLE');
      }
    }
  };

  const handleCycleChoice = (option: 'LONG' | 'SHORT') => {
    setShowChoiceModal(false);
    setSessionInCycle(0);
    setIsBreak(true);
    setIsActive(true);
    
    if (option === 'LONG') {
      setTimeLeft(30 * 60);
      onTickXP(5); 
      triggerAIResponse('CYCLE_LONG');
    } else {
      setTimeLeft(5 * 60);
      onTickXP(25); 
      triggerAIResponse('CYCLE_SHORT');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isActive && !isBreak) {
          triggerAIResponse('DISTRACTION');
          document.title = "⚠️ 딴짓 금지!";
        }
      } else {
        document.title = "최애 뽀모도로";
        if (isActive && !isBreak) {
          triggerAIResponse('RETURN');
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isActive, isBreak, triggerAIResponse]);

  useEffect(() => {
    if (!isApiKeyInputVisible || !tempApiKey || tempApiKey === profile.apiKey) return;

    const timer = setTimeout(async () => {
      setApiKeyError(null);
      setIsValidating(true);
      try {
        const ai = new GoogleGenAI({ apiKey: tempApiKey });
        await ai.models.generateContent({
           model: 'gemini-3-flash-preview',
           contents: 'hi',
           config: { maxOutputTokens: 1, thinkingConfig: { thinkingBudget: 0 } }
        });
        
        onUpdateProfile({ apiKey: tempApiKey });
        setIsApiKeyInputVisible(false);
        setTimeout(() => addToRefillQueue('idle'), 500);
      } catch (err) {
        setApiKeyError('유효한 키가 아닙니다. 다른 키를 입력해 주세요.');
      } finally {
        setIsValidating(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [tempApiKey, isApiKeyInputVisible, profile.apiKey, onUpdateProfile, addToRefillQueue]);

  // 저장(Export) 기능 구현
  const handleExportProfile = () => {
    const dataStr = JSON.stringify(profile, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    const timeStr = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0'); // HHMM
    
    // 파일명 형식 지정: 최애이름_YYMMDD_HHMM.json
    const sanitizedName = profile.name.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '');
    const finalFileName = sanitizedName ? `${sanitizedName}_${dateStr}_${timeStr}.json` : `${dateStr}_${timeStr}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', finalFileName);
    linkElement.click();

    // 메뉴 닫기 및 토스트 알림 표시
    setIsSettingsOpen(false);
    setMessage("저장되었습니다. 소중한 API키가 함께 저장 되었으니, 절대로 타인과 공유하지 마세요.");
  };

  const currentXpTarget = LEVEL_XP_TABLE[profile.level] || 9999;
  const progressPercent = Math.min(100, (profile.xp / currentXpTarget) * 100);
  const shouldHideCharacter = isBreak && timeLeft > 60;

  const focusTimeTotal = 25 * 60;
  const currentSegmentProgress = !isBreak ? (focusTimeTotal - timeLeft) / focusTimeTotal : 0;
  const overallProgressPercent = ((sessionInCycle + currentSegmentProgress) / 4) * 100;

  return (
    <div className={`relative w-full h-screen flex transition-colors duration-700 overflow-hidden font-sans ${isDarkMode ? 'bg-[#0B0E14] text-slate-100' : 'bg-background text-text-primary'}`}>
      {profile.imageSrc && (
        <div className={`absolute inset-0 z-0 transition-opacity duration-700 ${isDarkMode ? 'opacity-5' : 'opacity-10'}`}>
          <img src={profile.imageSrc} alt="Background" className="w-full h-full object-cover blur-md scale-110" />
        </div>
      )}

      {showChoiceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary-dark/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-sm border p-8 rounded-3xl shadow-2xl text-center space-y-6 transform animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-[#161B22] border-[#30363D]' : 'bg-surface border-border'}`}>
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto text-primary">
              <CheckCircle2 size={48} />
            </div>
            <div className="space-y-2">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>1사이클(4세트) 달성!</h3>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-text-secondary'}`}>
                정말 대단해요! 이제 어떻게 할까요?<br/>
                열심히 한 당신을 위해 선택지를 준비했어요.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 pt-2">
              <button 
                onClick={() => handleCycleChoice('LONG')}
                className={`w-full py-4 px-6 border rounded-2xl text-sm font-bold transition-all active:scale-95 flex flex-col items-center gap-1 group ${isDarkMode ? 'bg-[#0B0E14] border-[#30363D] hover:bg-slate-800' : 'bg-background border-border hover:bg-border'}`}
              >
                <span className={isDarkMode ? 'text-slate-100' : 'text-text-primary'}>푹 쉴게 (30분 휴식)</span>
                <span className="text-[10px] text-primary font-black uppercase tracking-widest opacity-60">Reward: XP +10</span>
              </button>
              <button 
                onClick={() => handleCycleChoice('SHORT')}
                className="w-full py-4 px-6 bg-primary hover:bg-primary-light border border-primary-dark/10 rounded-2xl text-sm font-bold transition-all active:scale-95 flex flex-col items-center gap-1 group shadow-lg shadow-primary/20"
              >
                <span className="text-white">아냐, 5분만 쉴래 (열공 모드)</span>
                <span className="text-[10px] text-accent-soft font-black uppercase tracking-widest">Bonus: XP +30 🔥</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {(isSettingsOpen || isApiKeyInputVisible) && (
        <div className="fixed inset-0 z-40" onClick={() => { setIsSettingsOpen(false); setIsApiKeyInputVisible(false); }} />
      )}

      <main className="w-full h-full flex flex-col items-center justify-center relative p-4 md:p-8">
          
          <div className="mb-[-1px] z-20 animate-in slide-in-from-top-4 duration-700">
            <div className={`px-5 py-2 rounded-t-2xl border border-b-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] flex items-center gap-2.5 ${isDarkMode ? 'bg-[#161B22] border-[#30363D]' : 'bg-surface border-border'}`}>
                <Heart size={12} className="text-accent fill-accent animate-pulse" />
                <span className={`text-[11px] font-black tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>
                  Lv.{profile.level} <span className="ml-1 text-primary">{LEVEL_TITLES[profile.level] || "운명의 동반자"}</span>
                </span>
            </div>
          </div>

          <div className={`w-full max-w-md backdrop-blur-xl border p-6 md:p-8 rounded-[40px] shadow-[0_20px_50px_rgba(74,95,122,0.1)] flex flex-col items-center gap-6 md:gap-8 animate-in fade-in zoom-in duration-500 relative transition-colors duration-700 ${isDarkMode ? 'bg-[#161B22]/90 border-[#30363D]' : 'bg-surface/90 border-border'} ${isApiKeyInputVisible || isSettingsOpen ? 'overflow-visible' : 'overflow-hidden'}`}>
            
            <div className={`absolute top-0 left-0 w-full h-1.5 z-10 ${isDarkMode ? 'bg-slate-700/20' : 'bg-border/20'}`}>
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>

            <div className="w-full flex justify-between items-start mt-2 px-2 relative z-50">
                <div className="relative">
                  <button 
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
                    className={`p-2.5 rounded-full transition-all border shadow-sm ${isSettingsOpen ? 'bg-primary text-white border-primary-dark rotate-45 scale-110' : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100')}`}
                    title="설정"
                  >
                      <Settings size={20} />
                  </button>
                  
                  <div className={`absolute top-full left-0 mt-3 flex flex-col gap-2.5 transition-all duration-500 origin-top z-50 ${isSettingsOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                      <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsDarkMode(!isDarkMode)}>
                          <div className={`w-10 h-10 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-800 text-yellow-400 border-slate-700' : 'bg-white text-slate-500 border-slate-200'}`}>
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                          </div>
                          <span className={`text-[10px] font-black px-2 py-1 rounded-lg border border-border bg-surface/90 backdrop-blur-sm shadow-sm transition-opacity ${isSettingsOpen ? 'opacity-100' : 'opacity-0'} whitespace-nowrap`}>
                            {isDarkMode ? '라이트 모드' : '다크 모드'}
                          </span>
                      </div>
                      
                      <div className="flex items-center gap-2 group cursor-pointer" onClick={handleExportProfile}>
                          <div className={`w-10 h-10 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-800 text-slate-100 border-slate-700' : 'bg-white text-slate-600 border-slate-200'}`}>
                            <Save size={18} />
                          </div>
                          <span className={`text-[10px] font-black px-2 py-1 rounded-lg border border-border bg-surface/90 backdrop-blur-sm shadow-sm transition-opacity ${isSettingsOpen ? 'opacity-100' : 'opacity-0'} whitespace-nowrap`}>
                            저장하기
                          </span>
                      </div>

                      <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setIsApiKeyInputVisible(true); setIsSettingsOpen(false); }}>
                          <div className={`w-10 h-10 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-200'}`}>
                            <Key size={18} />
                          </div>
                          <span className={`text-[10px] font-black px-2 py-1 rounded-lg border border-border bg-surface/90 backdrop-blur-sm shadow-sm transition-opacity ${isSettingsOpen ? 'opacity-100' : 'opacity-0'} whitespace-nowrap`}>
                            API키 변경
                          </span>
                      </div>
                  </div>
                </div>

                <button 
                  onClick={onReset} 
                  className={`p-2.5 rounded-full transition-all border border-transparent ${isDarkMode ? 'text-slate-400 hover:bg-rose-900/30 hover:text-rose-400 hover:border-rose-900/50' : 'text-text-secondary hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100'}`}
                  title="초기화"
                >
                    <X size={20} />
                </button>
            </div>

            <div className={`relative group mt-9 md:mt-11 min-h-[180px] md:min-h-[220px] flex items-center justify-center w-full transition-all ${isApiKeyInputVisible ? 'z-50' : 'z-20'}`}>
                {shouldHideCharacter ? (
                  <div className="flex flex-col items-center gap-4 animate-pulse text-primary-light/40">
                    <Bed size={60} className="md:size-20" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Sleeping...</p>
                  </div>
                ) : (
                  <div className="relative">
                    {cooldownRemaining > 0 && (
                      <div className="absolute -inset-3 pointer-events-none z-10">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="cooldownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor={isDarkMode ? '#34D399' : '#4A5F7A'} />
                              <stop offset="100%" stopColor={isDarkMode ? '#6B7FA0' : '#FF6B9D'} />
                            </linearGradient>
                          </defs>
                          <rect 
                            x="2" y="2" width="96" height="96" rx="12" 
                            fill="none" 
                            stroke="url(#cooldownGradient)" 
                            strokeWidth="3"
                            strokeDasharray="384"
                            strokeDashoffset={384 - (384 * (cooldownRemaining / COOLDOWN_MS))}
                            strokeLinecap="round"
                            className="transition-all duration-150 ease-linear"
                          />
                        </svg>
                      </div>
                    )}
                    
                    <div 
                      onClick={handleCharacterClick}
                      className={`w-32 h-32 md:w-44 md:h-44 rounded-2xl border-4 overflow-hidden shadow-xl mx-auto transition-all duration-500 group-hover:scale-105 group-hover:border-primary cursor-pointer active:scale-95 ${isDarkMode ? 'border-slate-800' : 'border-border'}`}
                    >
                        <img src={profile.imageSrc || ''} alt={profile.name} className="w-full h-full object-cover" />
                    </div>

                    {cooldownRemaining > 0 && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary/90 text-white text-[9px] font-black px-3 py-1 rounded-full whitespace-nowrap shadow-lg backdrop-blur-sm z-20 border border-white/20 animate-pulse">
                            가만히 바라보는 중...
                        </div>
                    )}

                    {isApiKeyInputVisible && (
                       <div className="absolute -top-32 left-1/2 transform -translate-x-1/2 w-[340px] md:w-[380px] z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                          <div className={`p-5 rounded-[24px] shadow-2xl border backdrop-blur-xl relative space-y-3 ${isDarkMode ? 'bg-slate-900/90 border-white/10 shadow-black/40' : 'bg-surface/95 border-border shadow-slate-200/50'}`}>
                             <p className={`text-xs font-bold leading-tight ${isDarkMode ? 'text-slate-200' : 'text-text-primary'}`}>
                                API 키가 만료되었어요. 새로운 키를 입력해 주세요.
                             </p>
                             
                             <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                   <input 
                                      type="password"
                                      value={tempApiKey}
                                      onChange={(e) => setTempApiKey(e.target.value)}
                                      placeholder="새로운 API 키를 여기에 붙여넣으세요"
                                      className={`w-full h-10 px-3 pr-9 rounded-xl border outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono text-[11px] ${isDarkMode ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-background border-border text-text-primary'}`}
                                   />
                                   <button 
                                      onClick={() => setIsApiKeyInputVisible(false)}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-rose-500 transition-colors"
                                   >
                                      <X size={14} />
                                   </button>
                                </div>
                                <a 
                                  href="https://aistudio.google.com/app/apikey" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-[10px] font-black text-primary hover:underline shrink-0"
                                >
                                   키 발급받기 <ExternalLink size={10} />
                                </a>
                             </div>

                             <div className="space-y-1">
                                <p className="text-[9px] text-text-secondary/80 font-medium">*지금 당장 키를 입력하지 않아도 계속 사용할 수 있어요.</p>
                                <p className="text-[9px] text-text-secondary/80 font-medium">*설정에서 API키 입력 메뉴로 다시 키를 설정할 수 있어요.</p>
                                {apiKeyError && (
                                   <p className="text-[9px] text-rose-500 font-black animate-pulse pt-1">{apiKeyError}</p>
                                )}
                                {isValidating && (
                                   <p className="text-[9px] text-primary font-black animate-pulse pt-1">키 유효성 검사 중...</p>
                                )}
                             </div>
                          </div>
                       </div>
                    )}

                    {message && !isApiKeyInputVisible && (
                      <div className="absolute -top-20 md:-top-20 left-1/2 transform -translate-x-1/2 w-64 md:w-72 text-center z-20 transition-all duration-500 animate-in fade-in slide-in-from-bottom-2 pointer-events-none">
                          <div className={`text-xs md:text-sm font-medium px-6 md:px-8 py-3 md:py-4 rounded-[20px] shadow-2xl leading-relaxed relative backdrop-blur-lg border transition-colors duration-500 ${isDarkMode ? 'bg-slate-900/80 border-white/10 text-slate-100 shadow-slate-900/50' : 'bg-surface/80 border-white/50 text-text-primary shadow-slate-200/50'}`}>
                              "{message}"
                          </div>
                      </div>
                    )}
                  </div>
                )}
            </div>

            <div className="text-center space-y-1 -mt-10 md:-mt-10">
                <h2 className={`text-3xl md:text-4xl font-bold tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>{profile.name}</h2>
                <p className={`text-[10px] md:text-[11px] font-bold tracking-widest uppercase ${isDarkMode ? 'text-slate-400' : 'text-text-secondary'}`}>To. {profile.honorific || profile.userName || "나"}</p>
            </div>

            <div className="w-full flex flex-col items-center gap-6 mt-4 pb-4">
              
              <div className="flex items-center gap-4 md:gap-6">
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all duration-500 shadow-sm ${
                    isBreak 
                    ? (isDarkMode ? 'bg-emerald-900/20 border-emerald-800 text-emerald-400' : 'bg-success/10 border-success/20 text-success') 
                    : (isDarkMode ? 'bg-slate-800/50 border-slate-700 text-primary-light' : 'bg-primary/5 border-primary/10 text-primary')
                }`}>
                    {isBreak ? <Coffee size={18} /> : <TimerIcon size={18} />}
                    <div className="flex flex-col items-center leading-tight">
                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter">{isBreak ? "Break" : "Focus"}</span>
                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter">Mode</span>
                    </div>
                </div>

                <div className={`text-6xl md:text-7xl font-bold tracking-tighter tabular-nums leading-none transition-colors duration-700 ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>
                    {formatTime(timeLeft)}
                </div>
              </div>

              <div className="w-full max-w-[320px] flex items-center gap-4 mt-2 px-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest shrink-0 ${isDarkMode ? 'text-slate-500' : 'text-text-secondary/60'}`}>
                      진행률
                  </span>
                  <div className={`relative h-2 flex-1 rounded-full overflow-visible ${isDarkMode ? 'bg-slate-800' : 'bg-border/40'}`}>
                      <div 
                          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${
                              isBreak 
                              ? 'bg-gradient-to-r from-success to-emerald-400 animate-pulse-slow' 
                              : 'bg-gradient-to-r from-primary to-primary-light'
                          }`}
                          style={{ width: `${overallProgressPercent}%` }}
                      />
                      
                      {[1, 2, 3, 4].map((i) => {
                          const pos = i * 25;
                          const isReached = overallProgressPercent >= pos;
                          const isLast = i === 4;
                          return (
                              <div 
                                  key={i}
                                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
                                  style={{ left: `${pos}%` }}
                              >
                                  <div className={`transform rotate-45 transition-all duration-700 border-2 ${
                                      isReached 
                                      ? (isBreak && sessionInCycle === i ? 'bg-success border-success scale-125 shadow-lg' : 'bg-primary border-primary scale-110') 
                                      : (isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-surface border-border')
                                  } ${isLast ? 'w-3 h-3' : 'w-2 h-2'}`} />
                                  <span className={`text-[9px] font-black transition-colors duration-500 ${isReached ? 'text-primary' : (isDarkMode ? 'text-slate-600' : 'text-text-secondary/40')}`}>
                                      {i}
                                  </span>
                              </div>
                          );
                      })}
                  </div>
              </div>

              <div className="flex items-center gap-6 md:gap-8 mt-4">
                  {!isBreak && (
                    <button 
                        onClick={() => {
                            if(!isActive) triggerAIResponse('START');
                            else triggerAIResponse('PAUSE');
                            setIsActive(!isActive);
                        }}
                        className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 group relative overflow-hidden ${isActive ? 'bg-warning text-white' : 'bg-primary text-white hover:bg-primary-light'}`}
                    >
                        {isActive ? <Pause className="w-7 h-7 md:w-8 md:h-8" fill="currentColor" /> : <Play className="w-7 h-7 md:w-8 md:h-8 ml-1" fill="currentColor" />}
                    </button>
                  )}
                  <button 
                      onClick={() => {
                          setIsActive(false);
                          setTimeLeft(isBreak ? (sessionInCycle === 0 ? 30 * 60 : 5 * 60) : 25 * 60);
                      }}
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all border active:scale-95 shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200' : 'bg-background border-border text-text-secondary hover:bg-border hover:text-text-primary'}`}
                  >
                      <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
              </div>

            </div>
          </div>
      </main>
    </div>
  );
};
