
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Heart, Timer as TimerIcon, Coffee, Bed, CheckCircle2, Moon, Sun, Settings, Save, Key, ExternalLink, ClipboardPaste } from 'lucide-react';
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

// 검열 기준 완화: BLOCK_ONLY_HIGH
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

const FALLBACK_TEMPLATES: Record<string, Record<string, string[]>> = {
  "반말": {
    START: [
      "자, 시작하자. {honorific}, 집중해.",
      "이제 시작이야. 화이팅!",
      "준비됐지? {honorific}.",
      "{honorific}, 해보자고."
    ],
    FINISH: ["끝났네? 고생했어. 좀 쉴까?"],
    PAUSE: ["어디 가? 얼른 와라."],
    DISTRACTION: [
      "야, 딴짓하지 마. 보고 있다.",
      "어? 지금 뭐 하는 거야?",
      "그거 내려놔. 집중해.",
      "야야, 딴짓 걸렸어."
    ],
    RETURN: ["이제 왔어? 기다렸잖아."],
    CLICK: [
      "뭐야, {honorific} 왜 불러?",
      "할 일은 해야겠지.",
      "시간이 빨리 가는 것 같아",
      "집중하자, {honorific}."
    ],
    IDLE: [
      "졸지 말고 해. 지켜보고 있어.",
      "잘하고 있어. 계속 가.",
      "힘내. 거의 다 왔어."
    ],
    READY: ["슬슬 다시 시작할 준비 해."]
  },
  "존댓말": {
    START: [
      "준비되셨나요? 시작할게요, {honorific}.",
      "이제 시작합니다. 집중해주세요.",
      "시작하겠습니다. 화이팅하세요.",
      "가볼까요? {honorific}, 집중 모드 돌입!"
    ],
    FINISH: ["정말 고생 많으셨어요. 잠깐 쉬세요."],
    PAUSE: ["어디 가하시나요? 금방 오셔야 해요."],
    DISTRACTION: [
      "{honorific}, 딴짓은 안 돼요. 집중하세요.",
      "지금 뭐 하시는 거예요? 집중해주세요.",
      "{honorific}, 보고 있어요. 집중하세요."
    ],
    RETURN: ["오셨군요. 기다리고 있었어요."],
    CLICK: [
      "네? 부르셨나요?",
      "조금만 더 하면 돼요.",
      "집중, 집중이에요.",
      "어떻게 도와드릴까요?"
    ],
    IDLE: [
      "지켜보고 있으니까 힘내세요.",
      "잘하고 계세요. 계속하세요.",
      "화이팅하세요. 옆에 있어요."
    ],
    READY: ["쉬는 시간 끝나가요. 준비해주세요."]
  },
  "반존대": {
    START: [
      "시작해요. {honorific}, 딴짓하면 혼나요.",
      "자, 시작이에요. {honorific}, 집중!",
      "가요! {honorific}, 따라와요."
    ],
    FINISH: ["수고했어요. 뭐, 나쁘지 않네."],
    PAUSE: ["어딜 가요? 도망가는 건 아니지?"],
    DISTRACTION: [
      "흐음... 지금 뭐 하는 거죠? 끄세요.",
      "어? 딴짓하는 거 보였어요.",
      "딴짓 들켰어요. 집중해요."
    ],
    RETURN: ["늦었네요. 설명이 좀 필요할 텐데."],
    CLICK: [
      "어? 뭐 말씀하실 거예요?",
      "왜요? 뭐 필요해졌어?",
      "부른 거 맞죠? 듣고 있어요."
    ],
    IDLE: [
      "제 얼굴 말고 화면 봐요.",
      "잘하고 있어요. 계속 가요.",
      "포기하지 말아요. 옆에 있어요."
    ],
    READY: ["쉬는 시간 끝나가요. 준비해."]
  },
  "사극/하오체": {
    START: ["시작하겠소. {honorific}, 부디 집중하시오."],
    FINISH: ["노고가 많았소. 차라도 한 잔 드시오."],
    PAUSE: ["어딜 가는 게요? 자리를 비우지 마시오."],
    DISTRACTION: ["그것은 수행에 방해가 되오. 덮으시오."],
    RETURN: ["이제야 오는구려. 목이 빠지는 줄 알았소."],
    CLICK: ["무슨 일이오? 내가 필요하오?"],
    IDLE: ["내가 여기 있으니 염려 마시오. 잘하고 있소."],
    READY: ["다시 정진할 시간이오. 채비하시오."]
  },
  "다나까": {
    START: ["작전 시작합니다. {honorific}, 집중하십시오!"],
    FINISH: ["임무 완료! 수고하셨습니다. 휴식하십시오."],
    PAUSE: ["이탈입니까? 신속히 복귀하십시오."],
    DISTRACTION: ["전방 주시! 딴짓은 허용하지 않습니다."],
    RETURN: ["복귀 신고합니다! 늦으셨습니다."],
    CLICK: ["용건 있으십니까? 호출에 응답합니다."],
    IDLE: ["제가 후방을 맡겠습니다. 계속하십시오."],
    READY: ["휴식 종료 임박! 위치로 돌아가십시오."]
  }
};

const COOLDOWN_MS = 16000; 

export const TimerScreen: React.FC<TimerScreenProps> = ({ 
  profile, onReset, onTickXP, onUpdateProfile, onSessionComplete 
}) => {
  const [timeLeft, setTimeLeft] = useState(profile.savedTimeLeft ?? 25 * 60);
  const [isActive, setIsActive] = useState(profile.savedIsActive ?? false);
  const [isBreak, setIsBreak] = useState(profile.savedIsBreak ?? false);
  const [sessionInCycle, setSessionInCycle] = useState(profile.savedSessionInCycle ?? 0); 
  
  // 이름 중괄호 제거 헬퍼 함수
  const cleanDialogue = (text: string, honorific: string) => {
    return text
      .replace(/{honorific}|{이름}|{user}/g, honorific)
      .replace(/{([^}]+)}/g, '$1'); // 남아있는 {엘라라} 형태의 중괄호 싹 제거
  };

  const [message, setMessage] = useState(() => {
    const userDisplayName = profile.honorific || profile.userName || "너";
    if (profile.savedIsActive && !profile.savedIsBreak) {
      const scolding = profile.dialogueCache.scolding;
      if (scolding && scolding.length > 0) {
        return cleanDialogue(scolding[Math.floor(Math.random() * scolding.length)], userDisplayName);
      }
      return "어디 갔다 왔어? 계속 집중해야지.";
    }
    return profile.initialGreeting || "시작할까?";
  });

  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isApiKeyInputVisible, setIsApiKeyInputVisible] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const cooldownIntervalRef = useRef<any>(null);
  const isRefillingRef = useRef<Record<string, boolean>>({});
  const isGlobalApiLockedRef = useRef<boolean>(false);
  const refillQueueRef = useRef<Array<keyof typeof profile.dialogueCache>>([]);
  const randomEncouragementTimerRef = useRef<any>(null);
  const wakeLockRef = useRef<any>(null);
  
  const profileRef = useRef(profile);
  useEffect(() => { profileRef.current = profile; }, [profile]);

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
    if (isActive) requestWakeLock();
    else if (wakeLockRef.current) wakeLockRef.current.release().then(() => { wakeLockRef.current = null; });
    return () => { if (wakeLockRef.current) wakeLockRef.current.release(); };
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
      const timer = window.setTimeout(() => { setMessage(""); }, 12000);
      return () => window.clearTimeout(timer);
    }
  }, [message, isApiKeyInputVisible]);

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
      const prompt = `Roleplay as ${currentProfile.name}. User: ${currentProfile.userName}. Mood: ${getMood()}. 
        Personality: ${currentProfile.personality.join(', ')}. Situation: ${situations[categoryKey]}. 
        Task: Write ${count} DIFFERENT immersive Korean sentences. 
        Length: 10~20 characters. Use {honorific} for the user's name/title. No numbers, no quotes. Separate by Newline.`;

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
      console.error(`Refill failed for ${categoryKey}`, e);
    } finally {
      isRefillingRef.current[categoryKey] = false;
    }
  }, [onUpdateProfile]);

  const processRefillQueue = useCallback(async () => {
    if (isGlobalApiLockedRef.current || refillQueueRef.current.length === 0) return;
    const PRIORITY: Record<string, number> = { click: 0, start: 1, scolding: 1, praising: 2, pause: 2, idle: 3 };
    refillQueueRef.current.sort((a, b) => (PRIORITY[a] ?? 99) - (PRIORITY[b] ?? 99));
    const currentProfile = profileRef.current;
    if (currentProfile.dialogueCache.click.length === 0 && refillQueueRef.current.includes('click')) {
        const idx = refillQueueRef.current.indexOf('click');
        refillQueueRef.current.splice(idx, 1);
        isGlobalApiLockedRef.current = true;
        await refillCategory('click', 5);
    } else {
        const category = refillQueueRef.current.shift()!;
        isGlobalApiLockedRef.current = true;
        await refillCategory(category, 5);
    }
    setTimeout(() => { isGlobalApiLockedRef.current = false; }, 15000);
  }, [refillCategory]);

  useEffect(() => {
    const queueTimer = setInterval(processRefillQueue, 2000);
    return () => clearInterval(queueTimer);
  }, [processRefillQueue]);

  const addToRefillQueue = useCallback((category: keyof typeof profile.dialogueCache) => {
    if (profileRef.current.dialogueCache[category].length >= 10) return;
    if (!refillQueueRef.current.includes(category)) {
      refillQueueRef.current.push(category);
    }
  }, []);

  const triggerAIResponse = useCallback((type: 'START' | 'FINISH' | 'DISTRACTION' | 'IDLE' | 'CLICK' | 'PAUSE' | 'READY' | 'RETURN' | 'CYCLE_LONG' | 'CYCLE_SHORT') => {
    const cacheKeyMap: Record<string, keyof typeof profile.dialogueCache> = {
      'START': 'start', 'FINISH': 'praising', 'DISTRACTION': 'scolding', 'IDLE': 'idle',
      'CLICK': 'click', 'PAUSE': 'pause', 'READY': 'start', 'RETURN': 'scolding',
      'CYCLE_LONG': 'praising', 'CYCLE_SHORT': 'praising'
    };
    const userDisplayName = profile.honorific || profile.userName || "너";
    if (type === 'CYCLE_LONG') { setMessage("그래, 푹 자고 와. 깨워줄게."); return; }
    if (type === 'CYCLE_SHORT') { setMessage("뭐? 무리하는 거 아냐? ...걱정되게 진짜."); return; }

    const key = cacheKeyMap[type];
    const cachedList = profile.dialogueCache[key];
    if (cachedList && cachedList.length > 0) {
        const randomIndex = Math.floor(Math.random() * cachedList.length);
        const randomMsg = cachedList[randomIndex];
        setMessage(cleanDialogue(randomMsg, userDisplayName));
        const newCacheList = [...cachedList];
        newCacheList.splice(randomIndex, 1);
        onUpdateProfile({ dialogueCache: { ...profile.dialogueCache, [key]: newCacheList } });
        if (newCacheList.length < 10) addToRefillQueue(key);
    } else {
        const toneKey = profile.personality.find(p => FALLBACK_TEMPLATES[p]) || "존댓말";
        const template = FALLBACK_TEMPLATES[toneKey];
        const rawMsgs = template[type] || ["..."];
        const rawMsg = rawMsgs[Math.floor(Math.random() * rawMsgs.length)];
        setMessage(cleanDialogue(rawMsg, userDisplayName));
        addToRefillQueue(key);
    }
  }, [profile, onUpdateProfile, addToRefillQueue]);

  const handleCharacterClick = () => {
    if (isBreak) return;
    if (cooldownRemaining > 0) { setMessage("가만히 바라보는 중..."); return; }
    triggerAIResponse('CLICK');
    setCooldownRemaining(COOLDOWN_MS);
    const start = Date.now();
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    cooldownIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const left = Math.max(0, COOLDOWN_MS - (now - start));
      setCooldownRemaining(left);
      if (left <= 0 && cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    }, 100);
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
        if (!isBreak && timeLeft % 60 === 0) onTickXP(1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) handleTimerFinish();
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isBreak, onTickXP]);

  useEffect(() => {
    Object.keys(profile.dialogueCache).forEach(cat => {
      const category = cat as keyof typeof profile.dialogueCache;
      if (profile.dialogueCache[category].length < 10) addToRefillQueue(category);
    });
    if (isActive && !isBreak) {
      const startTimer = () => {
        randomEncouragementTimerRef.current = window.setTimeout(() => {
          triggerAIResponse('IDLE');
          startTimer();
        }, (Math.floor(Math.random() * 6) + 5) * 60 * 1000);
      };
      startTimer();
    } else if (randomEncouragementTimerRef.current) window.clearTimeout(randomEncouragementTimerRef.current);
    return () => { if (randomEncouragementTimerRef.current) window.clearTimeout(randomEncouragementTimerRef.current); };
  }, [isActive, isBreak, triggerAIResponse, addToRefillQueue]);

  useEffect(() => {
    if (isBreak) ['click', 'idle', 'scolding', 'praising', 'start', 'pause'].forEach(cat => addToRefillQueue(cat as any));
  }, [isBreak, addToRefillQueue]);

  useEffect(() => { if (isBreak && timeLeft === 60) triggerAIResponse('READY'); }, [isBreak, timeLeft, triggerAIResponse]);

  const handleTimerFinish = () => {
    if (!isBreak) {
      onSessionComplete(true);
      const nextSessionCount = sessionInCycle + 1;
      setSessionInCycle(nextSessionCount);
      if (nextSessionCount === 4) { setIsActive(false); setShowChoiceModal(true); } 
      else { triggerAIResponse('FINISH'); setIsBreak(true); setTimeLeft(5 * 60); }
    } else {
      setIsBreak(false); setTimeLeft(25 * 60);
      if (sessionInCycle > 0) { setIsActive(true); triggerAIResponse('START'); }
      else { setIsActive(false); triggerAIResponse('IDLE'); }
    }
  };

  const handleCycleChoice = (option: 'LONG' | 'SHORT') => {
    setShowChoiceModal(false); setSessionInCycle(0); setIsBreak(true); setIsActive(true);
    if (option === 'LONG') { setTimeLeft(30 * 60); onTickXP(5); triggerAIResponse('CYCLE_LONG'); } 
    else { setTimeLeft(5 * 60); onTickXP(25); triggerAIResponse('CYCLE_SHORT'); }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isActive && !isBreak) { triggerAIResponse('DISTRACTION'); document.title = "⚠️ 딴짓 금지!"; }
      } else {
        document.title = "최애 뽀모도로";
        if (isActive && !isBreak) triggerAIResponse('RETURN');
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isActive, isBreak, triggerAIResponse]);

  useEffect(() => {
    if (!isApiKeyInputVisible || !tempApiKey || tempApiKey === profile.apiKey) return;
    const timer = setTimeout(async () => {
      setApiKeyError(null); setIsValidating(true);
      try {
        const ai = new GoogleGenAI({ apiKey: tempApiKey });
        await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: 'hi', config: { maxOutputTokens: 1, thinkingConfig: { thinkingBudget: 0 } } });
        onUpdateProfile({ apiKey: tempApiKey }); setIsApiKeyInputVisible(false);
        setTimeout(() => addToRefillQueue('idle'), 500);
      } catch (err) { setApiKeyError('유효한 키가 아닙니다. 다른 키를 입력해 주세요.'); } 
      finally { setIsValidating(false); }
    }, 800);
    return () => clearTimeout(timer);
  }, [tempApiKey, isApiKeyInputVisible, profile.apiKey, onUpdateProfile, addToRefillQueue]);

  const handlePasteApiKey = async () => {
    try { const text = await navigator.clipboard.readText(); setTempApiKey(text.trim()); } 
    catch (err) { console.error('Clipboard read failed', err); }
  };

  const handleExportProfile = () => {
    const dataStr = JSON.stringify(profile, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
    const timeStr = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
    const sanitizedName = profile.name.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '');
    const finalFileName = sanitizedName ? `${sanitizedName}_${dateStr}_${timeStr}.json` : `${dateStr}_${timeStr}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', finalFileName);
    linkElement.click();
    setIsSettingsOpen(false);
    setMessage("저장되었습니다. API키가 포함되어 있으니 공유에 주의하세요.");
  };

  const currentXpTarget = LEVEL_XP_TABLE[profile.level] || 9999;
  const progressPercent = Math.min(100, (profile.xp / currentXpTarget) * 100);
  const shouldHideCharacter = isBreak && timeLeft > 60;
  const overallProgressPercent = ((sessionInCycle + (!isBreak ? (25 * 60 - timeLeft) / (25 * 60) : 0)) / 4) * 100;

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
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto text-primary"><CheckCircle2 size={48} /></div>
            <div className="space-y-2">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>1사이클 달성!</h3>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-text-secondary'}`}>열심히 한 당신을 위해 선택지를 준비했어요.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 pt-2">
              <button onClick={() => handleCycleChoice('LONG')} className={`w-full py-4 px-6 border rounded-2xl text-sm font-bold transition-all active:scale-95 flex flex-col items-center gap-1 group ${isDarkMode ? 'bg-[#0B0E14] border-[#30363D] hover:bg-slate-800' : 'bg-background border-border hover:bg-border'}`}>
                <span className={isDarkMode ? 'text-slate-100' : 'text-text-primary'}>푹 쉴게 (30분)</span>
                <span className="text-[10px] text-primary font-black uppercase tracking-widest opacity-60">XP +10</span>
              </button>
              <button onClick={() => handleCycleChoice('SHORT')} className="w-full py-4 px-6 bg-primary hover:bg-primary-light border border-primary-dark/10 rounded-2xl text-sm font-bold transition-all active:scale-95 flex flex-col items-center gap-1 group shadow-lg shadow-primary/20">
                <span className="text-white">5분만 쉴래 (열공 모드)</span>
                <span className="text-[10px] text-accent-soft font-black uppercase tracking-widest">XP +30 🔥</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {(isSettingsOpen || isApiKeyInputVisible) && <div className="fixed inset-0 z-30" onClick={() => { setIsSettingsOpen(false); setIsApiKeyInputVisible(false); }} />}

      <main className="w-full h-full flex flex-col items-center justify-center relative p-4 md:p-8">
          <div className="mb-[-1px] z-20 animate-in slide-in-from-top-4 duration-700">
            <div className={`px-5 py-2 rounded-t-2xl border border-b-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] flex items-center gap-2.5 ${isDarkMode ? 'bg-[#161B22] border-[#30363D]' : 'bg-surface border-border'}`}>
                <Heart size={12} className="text-accent fill-accent animate-pulse" />
                <span className={`text-[11px] font-black tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>
                  Lv.{profile.level} <span className="ml-1 text-primary">{LEVEL_TITLES[profile.level] || "운명의 동반자"}</span>
                </span>
            </div>
          </div>

          <div className={`w-full max-w-md backdrop-blur-xl border p-6 md:p-8 rounded-[40px] shadow-[0_20px_50px_rgba(74,95,122,0.1)] flex flex-col items-center gap-6 md:gap-8 animate-in fade-in zoom-in duration-500 relative transition-colors duration-700 ${isDarkMode ? 'bg-[#161B22]/90 border-[#30363D]' : 'bg-surface/90 border-border'} ${isApiKeyInputVisible || isSettingsOpen ? 'overflow-visible z-40' : 'overflow-hidden'}`}>
            <div className={`absolute top-2.5 inset-x-8 h-1.5 z-10 ${isDarkMode ? 'bg-slate-700/20' : 'bg-border/20'} rounded-full overflow-hidden`}>
              <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="w-full flex justify-between items-start mt-2 px-2 relative z-50">
                <div className="relative">
                  <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`p-2.5 rounded-full transition-all border shadow-sm ${isSettingsOpen ? 'bg-primary text-white border-primary-dark rotate-45 scale-110' : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100')}`} title="설정"><Settings size={20} /></button>
                  <div className={`absolute top-full left-0 mt-3.5 flex flex-col gap-3.5 transition-all duration-500 origin-top z-50 ${isSettingsOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                      <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); setIsDarkMode(!isDarkMode); }}><div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-800 text-yellow-400 border-slate-700' : 'bg-white border-slate-200'}`}>{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</div><span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border shadow-sm whitespace-nowrap min-w-[60px] text-center ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-surface/90 border-border'}`}>{isDarkMode ? '라이트' : '다크'}</span></div>
                      <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleExportProfile(); }}><div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-800 text-slate-100 border-slate-700' : 'bg-white border-slate-200'}`}><Save size={20} /></div><span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border shadow-sm whitespace-nowrap min-w-[60px] text-center ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-surface/90 border-border'}`}>저장</span></div>
                      <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); setTempApiKey(''); setIsApiKeyInputVisible(true); setIsSettingsOpen(false); }}><div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white border-slate-200'}`}><Key size={20} /></div><span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border shadow-sm whitespace-nowrap min-w-[60px] text-center ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-surface/90 border-border'}`}>API키</span></div>
                  </div>
                </div>
                <button onClick={onReset} className={`p-2.5 rounded-full transition-all border border-transparent ${isDarkMode ? 'text-slate-400 hover:bg-rose-900/30 hover:text-rose-400' : 'text-text-secondary hover:bg-rose-50 hover:text-rose-500'}`} title="초기화"><X size={20} /></button>
            </div>

            <div className={`relative mt-9 md:mt-11 min-h-[180px] md:min-h-[220px] flex items-center justify-center w-full transition-all ${isApiKeyInputVisible ? 'z-50' : 'z-20'}`}>
                {shouldHideCharacter ? (<div className="flex flex-col items-center gap-4 animate-pulse text-primary-light/40"><Bed size={60} className="md:size-20" /><p className="text-[10px] font-bold uppercase tracking-widest">Sleeping...</p></div>) : (
                  <div className="relative">
                    {cooldownRemaining > 0 && (
                      <div className="absolute -inset-3 pointer-events-none z-10">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <path 
                            d="M 50 2 H 86 A 12 12 0 0 1 98 14 V 86 A 12 12 0 0 1 86 98 H 14 A 12 12 0 0 1 2 86 V 14 A 12 12 0 0 1 14 2 H 50"
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="3" 
                            pathLength="100"
                            strokeDasharray="100" 
                            strokeDashoffset={100 * (cooldownRemaining / COOLDOWN_MS)} 
                            strokeLinecap="round" 
                            className={`transition-all duration-150 ease-linear ${isDarkMode ? 'text-emerald-400' : 'text-primary'}`} 
                          />
                        </svg>
                      </div>
                    )}
                    <div onClick={handleCharacterClick} className={`w-32 h-32 md:w-44 md:h-44 rounded-2xl border-4 overflow-hidden shadow-xl mx-auto transition-all duration-500 group-hover:scale-105 group-hover:border-primary cursor-pointer active:scale-95 ${isDarkMode ? 'border-slate-800' : 'border-border'}`}><img src={profile.imageSrc || ''} alt={profile.name} className="w-full h-full object-cover" /></div>
                    {cooldownRemaining > 0 && (<div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary/90 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg animate-pulse whitespace-nowrap z-20">가만히 바라보는 중...</div>)}
                    {isApiKeyInputVisible && (
                       <div className="absolute -top-32 left-1/2 transform -translate-x-1/2 w-[340px] md:w-[400px] z-50 animate-in fade-in slide-in-from-bottom-4" onClick={(e) => e.stopPropagation()}>
                          <div className={`p-6 rounded-[28px] shadow-2xl border backdrop-blur-xl space-y-5 ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-surface border-border'}`}>
                             <div className="flex justify-between items-center"><p className={`text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-text-primary'}`}>API 키 변경</p><button onClick={() => setIsApiKeyInputVisible(false)}><X size={16} /></button></div>
                             <div className="flex gap-2"><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className={`flex-1 h-9 flex items-center justify-center rounded-xl border text-[10px] font-black ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-border text-text-secondary'}`}>키 발급 <ExternalLink size={12} /></a><button onClick={handlePasteApiKey} className="flex-1 h-9 bg-primary text-white text-[10px] font-black rounded-xl">붙여넣기 <ClipboardPaste size={12} /></button></div>
                             <input type="password" value={tempApiKey} onChange={(e) => setTempApiKey(e.target.value)} placeholder="키를 붙여넣으세요" className={`w-full h-11 px-4 rounded-xl border outline-none font-mono text-[12px] ${isDarkMode ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-background border-border text-text-primary'}`} />
                             {apiKeyError && <p className="text-[10px] text-rose-500 font-black">{apiKeyError}</p>}
                             {isValidating && <p className="text-[10px] text-primary font-black animate-pulse">검사 중...</p>}
                          </div>
                       </div>
                    )}
                    {message && !isApiKeyInputVisible && (<div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-64 text-center z-20 animate-in fade-in slide-in-from-bottom-2 pointer-events-none"><div className={`text-xs md:text-sm font-medium px-6 py-3 rounded-[20px] shadow-2xl backdrop-blur-lg border ${isDarkMode ? 'bg-slate-900/80 border-white/10 text-slate-100' : 'bg-surface/80 border-white/50 text-text-primary'}`}>"{message}"</div></div>)}
                  </div>
                )}
            </div>

            <div className="text-center space-y-1 -mt-10">
                <h2 className={`text-3xl md:text-4xl font-bold tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>{profile.name}</h2>
                <p className={`text-[10px] font-bold tracking-widest uppercase ${isDarkMode ? 'text-slate-400' : 'text-text-secondary'}`}>To. {profile.honorific || profile.userName || "나"}</p>
            </div>

            <div className="w-full flex flex-col items-center gap-6 mt-4 pb-4">
              <div className="flex items-center gap-4 md:gap-6">
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all duration-500 ${isBreak ? (isDarkMode ? 'bg-emerald-900/20 border-emerald-800 text-emerald-400' : 'bg-success/10 border-success/20 text-success') : (isDarkMode ? 'bg-slate-800/50 border-slate-700 text-primary-light' : 'bg-primary/5 border-primary/10 text-primary')}`}>{isBreak ? <Coffee size={18} /> : <TimerIcon size={18} />}<div className="flex flex-col items-center leading-tight"><span className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter">{isBreak ? "Break" : "Focus"}</span><span className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter">Mode</span></div></div>
                <div className={`text-6xl md:text-7xl font-bold tracking-tighter tabular-nums ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>{formatTime(timeLeft)}</div>
              </div>
              <div className="w-full max-w-[320px] flex items-center gap-4 mt-2 px-2"><span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-text-secondary/60'}`}>진행률</span><div className={`relative h-2 flex-1 rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-border/40'}`}><div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${isBreak ? 'bg-gradient-to-r from-success to-emerald-400 animate-pulse-slow' : 'bg-gradient-to-r from-primary to-primary-light'}`} style={{ width: `${overallProgressPercent}%` }} />{[1, 2, 3, 4].map((i) => { const pos = i * 25; const isReached = overallProgressPercent >= pos; return (<div key={i} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5" style={{ left: `${pos}%` }}><div className={`transform rotate-45 transition-all border-2 ${isReached ? (isBreak && sessionInCycle === i ? 'bg-success border-success scale-125' : 'bg-primary border-primary scale-110') : (isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-surface border-border')} ${i === 4 ? 'w-3 h-3' : 'w-2 h-2'}`} /><span className={`text-[9px] font-black ${isReached ? 'text-primary' : (isDarkMode ? 'text-slate-600' : 'text-text-secondary/40')}`}>{i}</span></div>); })}</div></div>
              <div className="flex items-center gap-6 md:gap-8 mt-4">
                  {!isBreak && (<button onClick={() => { if(!isActive) triggerAIResponse('START'); else triggerAIResponse('PAUSE'); setIsActive(!isActive); }} className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 ${isActive ? 'bg-warning text-white' : 'bg-primary text-white hover:bg-primary-light'}`}>{isActive ? <Pause className="w-7 h-7 md:w-8 md:h-8" fill="currentColor" /> : <Play className="w-7 h-7 md:w-8 md:h-8 ml-1" fill="currentColor" />}</button>)}
                  <button onClick={() => { setIsActive(false); setTimeLeft(isBreak ? (sessionInCycle === 0 ? 30 * 60 : 5 * 60) : 25 * 60); }} className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all border active:scale-95 shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200' : 'bg-background border-border text-text-secondary hover:text-text-primary'}`}><RotateCcw className="w-5 h-5 md:w-6 md:h-6" /></button>
              </div>
            </div>
          </div>
      </main>
    </div>
  );
};
