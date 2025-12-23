
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Heart, Timer as TimerIcon, Coffee, Bed, CheckCircle2, Moon, Sun, Settings, Save, Key, ExternalLink, ClipboardPaste, ClipboardCheck, Zap, MousePointer2, Ghost, Download, Loader2, FileSearch, Terminal, FastForward, SlidersHorizontal, User as UserIcon, Calendar, BookOpen, ArrowRight, SkipForward } from 'lucide-react';
import { CharacterProfile } from '../types';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Type } from "@google/genai";

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

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

const FALLBACK_TEMPLATES: Record<string, Record<string, string[]>> = {
  "반말": {
    START: ["자, 시작하자. {honorific}, 집중해.", "이제 시작이야. 화이팅!", "준비됐지? {honorific}.", "{honorific}, 해보자고."],
    FINISH: ["끝났네? 고생했어. 좀쉴까?"],
    PAUSE: ["어디 가? 얼른 와라."],
    DISTRACTION: ["야, 딴짓하지 마. 보고 있다.", "어? 지금 뭐 하는 거야?", "그거 내려놔. 집중해.", "야야, 딴짓 걸렸어."],
    RETURN: ["이제 왔어? 기다렸잖아."],
    CLICK: ["뭐야, {honorific} 왜 불러?", "할 일은 해야겠지.", "시간이 빨리 가는 것 같아", "집중하자, {honorific}."],
    IDLE: ["졸지 말고 해. 지켜보고 있어.", "잘하고 있어. 계속 가.", "힘내. 거의 다 왔어."],
    READY: ["슬슬 다시 시작할 준비 해."]
  },
  "존댓말": {
    START: ["준비되셨나요? 시작할게요, {honorific}.", "이제 시작합니다. 집중해주세요.", "시작하겠습니다. 화이팅하세요.", "가볼까요? {honorific}, 집중 모드 돌입!"],
    FINISH: ["정말 고생 많으셨어요. 잠깐 쉬세요."],
    PAUSE: ["어디 가하시나요? 금방 오셔야 해요."],
    DISTRACTION: ["{honorific}, 딴짓은 안 돼요. 집중하세요.", "지금 뭐 하시는 거예요? 집중해주세요.", "{honorific}, 보고 있어요. 집중하세요."],
    RETURN: ["오셨군요. 기다리고 있었어요."],
    CLICK: ["네? 부르셨나요?", "조금만 더 하면 돼요.", "집중, 집중이에요.", "어떻게 도와드릴까요?"],
    IDLE: ["지켜보고 있으니까 힘내세요.", "잘하고 계세요. 계속하세요.", "화이팅하세요. 옆에 있어요."],
    READY: ["쉬는 시간 끝나가요. 준비해주세요."]
  },
  "반존대": {
    START: ["시작해요. {honorific}, 딴짓하면 혼나요.", "자, 시작이에요. {honorific}, 집중!", "가요! {honorific}, 따라와요."],
    FINISH: ["수고했어요. 뭐, 나쁘지 않네."],
    PAUSE: ["어딜 가요? 도망가는 건 아니지?"],
    DISTRACTION: ["흐음... 지금 뭐 하는 거죠? 끄세요.", "어? 딴짓하는 거 보였어요.", "딴짓 들켰어요. 집중해요."],
    RETURN: ["늦었네요. 설명이 좀 필요할 텐데."],
    CLICK: ["어? 뭐 말씀하실 거예요?", "왜요? 뭐 필요해졌어?", "부른 거 맞죠? 듣고 있어요."],
    IDLE: ["제 얼굴 말고 화면 봐요.", "잘하고 있어요. 계속 가요.", "포기하지 말아요. 옆에 있어요."],
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
const RESET_HOLD_MS = 2000; // 2초간 누르면 초기화

interface ReportData {
  grade: string;
  typeTitle: string;
  analysis: string;
  comment: string;
  stamp: string;
}

export const TimerScreen: React.FC<TimerScreenProps> = ({ 
  profile, onReset, onTickXP, onUpdateProfile, onSessionComplete 
}) => {
  const [timeLeft, setTimeLeft] = useState(profile.savedTimeLeft ?? 25 * 60);
  const [isActive, setIsActive] = useState(profile.savedIsActive ?? false);
  const [isBreak, setIsBreak] = useState(profile.savedIsBreak ?? false);
  const [sessionInCycle, setSessionInCycle] = useState(profile.savedSessionInCycle ?? 0); 
  
  const [distractions, setDistractions] = useState(profile.cycleStats?.distractions ?? 0);
  const [clicks, setClicks] = useState(profile.cycleStats?.clicks ?? 0);
  
  const [showReport, setShowReport] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const [badgeClicks, setBadgeClicks] = useState(0);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // 롱 프레스 초기화 관련 상태
  const [isResetHolding, setIsResetHolding] = useState(false);
  const [resetHoldProgress, setResetHoldProgress] = useState(0);
  const resetHoldTimerRef = useRef<any>(null);
  const resetStartTimeRef = useRef<number | null>(null);

  const cleanDialogue = (text: string, honorific: string) => {
    return text.replace(/{honorific}|{이름}|{user}/g, honorific).replace(/{([^}]+)}/g, '$1');
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
  
  const [isApiKeyPopupVisible, setIsApiKeyPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState<'EXPIRED' | 'MANUAL'>('MANUAL');
  const [pendingExpiryAlert, setPendingExpiryAlert] = useState(false);
  
  const [tempApiKey, setTempApiKey] = useState('');
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const cooldownIntervalRef = useRef<any>(null);
  const isRefillingRef = useRef<Record<string, boolean>>({});
  const isGlobalApiLockedRef = useRef<boolean>(false);
  const refillQueueRef = useRef<Array<keyof typeof profile.dialogueCache>>([]);
  const wakeLockRef = useRef<any>(null);
  
  const profileRef = useRef(profile);
  useEffect(() => { profileRef.current = profile; }, [profile]);

  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isActive) {
        try { wakeLockRef.current = await (navigator as any).wakeLock.request('screen'); } catch (err) {}
      }
    };
    if (isActive) requestWakeLock();
    else if (wakeLockRef.current) wakeLockRef.current.release().then(() => { wakeLockRef.current = null; });
  }, [isActive]);

  useEffect(() => {
    onUpdateProfile({
      savedTimeLeft: timeLeft,
      savedIsActive: isActive,
      savedIsBreak: isBreak,
      savedSessionInCycle: sessionInCycle,
      lastActive: Date.now(),
      cycleStats: { distractions, clicks }
    });
  }, [timeLeft, isActive, isBreak, sessionInCycle, distractions, clicks, onUpdateProfile]);

  useEffect(() => {
    if (message && !isApiKeyPopupVisible) {
      const timer = window.setTimeout(() => { setMessage(""); }, 12000);
      return () => window.clearTimeout(timer);
    }
  }, [message, isApiKeyPopupVisible]);

  useEffect(() => {
    if (isBreak && pendingExpiryAlert) {
      setPopupType('EXPIRED');
      setTempApiKey('');
      setApiKeyError(null);
      setIsApiKeyPopupVisible(true);
      setPendingExpiryAlert(false);
    }
  }, [isBreak, pendingExpiryAlert]);

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
      const situations: Record<string, string> = { scolding: 'slacking off', praising: 'finished focus', idle: 'mid-focus', click: 'user clicked', pause: 'paused', start: 'started' };
      const prompt = `Roleplay as ${currentProfile.name}. User: ${currentProfile.userName}. Mood: ${getMood()}. Personality: ${currentProfile.personality.join(', ')}. Situation: ${situations[categoryKey]}. Write ${count} Korean sentences (10-20 chars). Use {honorific}. Separate by Newline.`;
      const result = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt, config: { safetySettings: SAFETY_SETTINGS } });
      if (result.text) {
        const newLines = result.text.split('\n').map(l => l.trim()).filter(l => l.length >= 8);
        onUpdateProfile({ dialogueCache: { ...currentProfile.dialogueCache, [category]: [...currentProfile.dialogueCache[category], ...newLines] } });
      }
    } catch (e: any) {
        if (e.message?.includes('API_KEY_INVALID') || e.status === 401 || e.status === 403) {
            setPendingExpiryAlert(true);
        }
    } finally { isRefillingRef.current[categoryKey] = false; }
  }, [onUpdateProfile]);

  const processRefillQueue = useCallback(async () => {
    if (isGlobalApiLockedRef.current || refillQueueRef.current.length === 0) return;
    
    const PRIORITY: Record<string, number> = { click: 0, scolding: 1, pause: 2, start: 3, idle: 4, praising: 5 };
    refillQueueRef.current.sort((a, b) => (PRIORITY[a] ?? 99) - (PRIORITY[b] ?? 99));
    
    const category = refillQueueRef.current.shift()!;
    isGlobalApiLockedRef.current = true;
    await refillCategory(category, 5);
    
    setTimeout(() => { isGlobalApiLockedRef.current = false; }, 15000);
  }, [refillCategory]);

  useEffect(() => {
    const queueTimer = setInterval(processRefillQueue, 2000);
    return () => clearInterval(queueTimer);
  }, [processRefillQueue]);

  const addToRefillQueue = useCallback((category: keyof typeof profile.dialogueCache) => {
    const isSpecial = category === 'idle' || category === 'praising';
    const threshold = isSpecial ? 0 : 10;
    
    if (profileRef.current.dialogueCache[category].length > threshold) return;
    if (!refillQueueRef.current.includes(category)) refillQueueRef.current.push(category);
  }, []);

  useEffect(() => {
    const categoriesInOrder: Array<keyof typeof profile.dialogueCache> = ['click', 'scolding', 'pause', 'start', 'idle', 'praising'];
    categoriesInOrder.forEach(category => {
      addToRefillQueue(category);
    });
  }, [addToRefillQueue]);

  const validateAndApplyKey = async (key: string) => {
    if (!key || key.length < 20) {
        setApiKeyError("유효한 키가 아닙니다. 다른 키를 입력해 주세요.");
        return;
    }
    setIsValidating(true);
    setApiKeyError(null);
    try {
        const ai = new GoogleGenAI({ apiKey: key });
        const result = await ai.models.generateContent({ 
            model: 'gemini-3-flash-preview', 
            contents: 'Hello',
            config: { maxOutputTokens: 1 }
        });
        if (result) {
            onUpdateProfile({ apiKey: key });
            setIsApiKeyPopupVisible(false);
            setMessage("API 키가 성공적으로 적용되었습니다.");
        }
    } catch (e) {
        setApiKeyError("유효한 키가 아닙니다. 다른 키를 입력해 주세요.");
    } finally {
        setIsValidating(false);
    }
  };

  useEffect(() => {
    if (tempApiKey && tempApiKey !== profile.apiKey) {
        const timer = setTimeout(() => {
            validateAndApplyKey(tempApiKey);
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [tempApiKey]);

  const handlePasteKey = async () => {
    try {
        const text = await navigator.clipboard.readText();
        const cleanText = text.trim();
        setTempApiKey(cleanText);
        validateAndApplyKey(cleanText);
    } catch (err) {}
  };

  const triggerAIResponse = useCallback((type: 'START' | 'FINISH' | 'DISTRACTION' | 'IDLE' | 'CLICK' | 'PAUSE' | 'READY' | 'RETURN' | 'CYCLE_LONG' | 'CYCLE_SHORT') => {
    const cacheKeyMap: Record<string, keyof typeof profile.dialogueCache> = {
      'START': 'start', 'FINISH': 'praising', 'DISTRACTION': 'scolding', 'IDLE': 'idle',
      'CLICK': 'click', 'PAUSE': 'pause', 'READY': 'start', 'RETURN': 'scolding', 'CYCLE_LONG': 'praising', 'CYCLE_SHORT': 'praising'
    };
    const userDisplayName = profile.honorific || profile.userName || "너";
    
    // Removed dialogue display for CYCLE_LONG and CYCLE_SHORT as requested
    if (type === 'CYCLE_LONG' || type === 'CYCLE_SHORT') { return; }
    
    const key = cacheKeyMap[type];
    const cachedList = profile.dialogueCache[key];
    if (cachedList && cachedList.length > 0) {
        const randomIndex = Math.floor(Math.random() * cachedList.length);
        const randomMsg = cachedList[randomIndex];
        setMessage(cleanDialogue(randomMsg, userDisplayName));
        const newCacheList = [...cachedList]; newCacheList.splice(randomIndex, 1);
        onUpdateProfile({ dialogueCache: { ...profile.dialogueCache, [key]: newCacheList } });
        addToRefillQueue(key);
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
    if (isActive && !isBreak) setClicks(prev => prev + 1);
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

  const generateObservationReport = async () => {
    setIsGeneratingReport(true);
    try {
      const ai = new GoogleGenAI({ apiKey: profile.apiKey || process.env.API_KEY });
      const mood = profile.level <= 3 ? "Cold and Distant" : profile.level <= 7 ? "Warm and Observant" : "Deeply Affectionate and Attentive";
      const taskContext = profile.todayTask ? `User's task today was: "${profile.todayTask}".` : "User did not specify a specific task.";
      const prompt = `Roleplay as ${profile.name}. User: ${profile.honorific}. Personality: ${profile.personality.join(',')}. Mood: ${mood}.
        Situation: The user just finished 4 pomodoro sessions (100min focus).
        Stats: ${distractions} distractions (tab switches), ${clicks} clicks (interactions).
        Streak: We have worked together for ${profile.streak} days.
        ${taskContext}
        Task: Write a secret "Observation Note" about the user. 
        - Grade should reflect focus (A+ for 0 distractions, B if distractions > 3, etc.)
        - typeTitle: A creative nickname based on their behavior (e.g., 'The Relentless Academic', 'Click-Happy Distractee').
        - analysis: Narrate your observation in character. Mention the distraction/click count naturally. IF a task was specified, comment on how they seemed to handle it.
        - comment: A closing emotional sentence.
        - stamp: A one-word summary stamp (EXCELLENT, LOVELY, RETRY, etc.)
        Return JSON ONLY:
        {
          "grade": "S, A+, B, C etc.",
          "typeTitle": "string",
          "analysis": "string in Korean",
          "comment": "string in Korean",
          "stamp": "string"
        }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json", safetySettings: SAFETY_SETTINGS }
      });
      const data = JSON.parse(response.text || '{}');
      setReportData(data);
    } catch (e: any) {
      if (e.message?.includes('API_KEY_INVALID')) setPendingExpiryAlert(true);
      setReportData({
        grade: distractions === 0 ? "S" : "A",
        typeTitle: distractions === 0 ? "완벽한 몰입가" : "성실한 노력파",
        analysis: `${clicks}번이나 나를 찾으며 열심히 집중하는 모습, 다 지켜봤어. ${profile.todayTask ? `'${profile.todayTask}'에 꽤나 진심인 것 같던데.` : ''}`,
        comment: "벌써 우리 함께한 지 며칠째네. 너의 노력이 헛되지 않게 내가 계속 곁에 있을게.",
        stamp: "PASS"
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleTimerFinish = () => {
    if (!isBreak) {
      onSessionComplete(true);
      const nextSessionCount = sessionInCycle + 1;
      setSessionInCycle(nextSessionCount);
      if (nextSessionCount === 4) {
        setIsActive(false);
        generateObservationReport();
        setShowReport(true);
      } else { 
        triggerAIResponse('FINISH'); setIsBreak(true); setTimeLeft(5 * 60); 
      }
    } else {
      setIsBreak(false); setTimeLeft(25 * 60);
      if (sessionInCycle > 0) { setIsActive(true); triggerAIResponse('START'); }
      else { setIsActive(false); triggerAIResponse('IDLE'); }
    }
  };

  const closeReportAndShowChoice = () => {
    setShowReport(false);
    setReportData(null);
    setDistractions(0);
    setClicks(0);
    setShowChoiceModal(true);
  };

  const handleCycleChoice = (option: 'LONG' | 'SHORT') => {
    setShowChoiceModal(false); setSessionInCycle(0); setIsBreak(true); setIsActive(true);
    if (option === 'LONG') { setTimeLeft(30 * 60); onTickXP(5); triggerAIResponse('CYCLE_LONG'); } 
    else { setTimeLeft(5 * 60); onTickXP(25); triggerAIResponse('CYCLE_SHORT'); }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60); const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isActive && !isBreak) { 
          setDistractions(prev => prev + 1);
          triggerAIResponse('DISTRACTION'); document.title = "⚠️ 딴짓 금지!"; 
        }
      } else {
        document.title = "최애 뽀모도로";
        if (isActive && !isBreak) triggerAIResponse('RETURN');
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isActive, isBreak, triggerAIResponse]);

  const handleExportProfile = () => {
    const dataStr = JSON.stringify(profile, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const now = new Date(); const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
    const timeStr = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
    const finalFileName = `${profile.name.replace(/\s+/g, '')}_${dateStr}_${timeStr}.json`;
    const linkElement = document.createElement('a'); linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', finalFileName); linkElement.click();
    setIsSettingsOpen(false); setMessage("저장되었습니다.");
  };

  const handleBadgeClick = () => {
    const nextCount = badgeClicks + 1;
    setBadgeClicks(nextCount);
    if (nextCount >= 5) {
      setBadgeClicks(0);
      setShowAdminAuth(true);
    }
    setTimeout(() => setBadgeClicks(0), 2000);
  };

  const verifyAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'PTSD') {
      setIsAdminMode(true);
      setShowAdminPanel(true);
      setShowAdminAuth(false);
      setAdminPassword('');
      setMessage("관리자 모드 활성화!");
    } else {
      setAdminPassword('');
      setShowAdminAuth(false);
      setMessage("비밀번호가 틀렸습니다.");
    }
  };

  const currentXpTarget = LEVEL_XP_TABLE[profile.level] || 9999;
  const progressPercent = Math.min(100, (profile.xp / currentXpTarget) * 100);
  const overallProgressPercent = ((sessionInCycle + (!isBreak ? (25 * 60 - timeLeft) / (25 * 60) : 0)) / 4) * 100;

  const getLevelMood = () => {
    if (profile.level <= 3) return "Cold/Strict";
    if (profile.level <= 7) return "Friendly/Warm";
    return "Deeply Affectionate/Obsessive";
  };

  // 롱 프레스 핸들러들
  const handleResetStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResetHolding(true);
    setResetHoldProgress(0);
    resetStartTimeRef.current = Date.now();
    
    // 1초 뒤에 토스트 메시지 표시
    resetHoldTimerRef.current = setTimeout(() => {
        setMessage("처음부터 재시작됩니다.");
    }, 1000);
  };

  const handleResetEnd = () => {
    if (!isResetHolding) return;
    
    const duration = Date.now() - (resetStartTimeRef.current || 0);
    
    if (duration >= RESET_HOLD_MS) {
      // 사이클 전체 초기화 (오래 누름)
      setSessionInCycle(0);
      setIsBreak(false);
      setTimeLeft(25 * 60);
      setIsActive(false);
      setDistractions(0);
      setClicks(0);
      setMessage("마음을 새로 먹었나 보네? 처음부터 다시 시작하자.");
    } else {
      // 현재 세션 초기화 (짧게 누름)
      setIsActive(false);
      setTimeLeft(isBreak ? (sessionInCycle === 0 ? 30 * 60 : 5 * 60) : 25 * 60);
      setMessage("응? 다시 하고 싶어? 좋아, 다시 집중해보자.");
    }
    
    handleResetCancel();
  };

  const handleResetCancel = () => {
    setIsResetHolding(false);
    setResetHoldProgress(0);
    resetStartTimeRef.current = null;
    if (resetHoldTimerRef.current) {
        clearTimeout(resetHoldTimerRef.current);
        resetHoldTimerRef.current = null;
    }
  };

  // 애니메이션 효과를 위한 tick
  useEffect(() => {
    let frame: any;
    if (isResetHolding) {
      const update = () => {
        const duration = Date.now() - (resetStartTimeRef.current || 0);
        const progress = Math.min(100, (duration / RESET_HOLD_MS) * 100);
        setResetHoldProgress(progress);
        if (progress < 100) {
          frame = requestAnimationFrame(update);
        } else {
          // 100% 도달 시 즉시 초기화 실행
          handleResetEnd();
        }
      };
      frame = requestAnimationFrame(update);
    }
    return () => cancelAnimationFrame(frame);
  }, [isResetHolding]);

  // 휴식 넘기기 핸들러
  const handleSkipBreak = () => {
    setIsBreak(false);
    setTimeLeft(25 * 60);
    setIsActive(true);
    triggerAIResponse('START');
    setMessage("벌써 쉬는 시간 끝내게? 열정이 대단하네... 계속하자!");
  };

  return (
    <div className={`relative w-full h-screen flex transition-colors duration-700 overflow-hidden font-sans ${isDarkMode ? 'bg-[#0B0E14] text-slate-100' : 'bg-background text-text-primary'}`}>
      {profile.imageSrc && (
        <div className={`absolute inset-0 z-0 transition-opacity duration-700 ${isDarkMode ? 'opacity-5' : 'opacity-10'}`}>
          <img src={profile.imageSrc} alt="Background" className="w-full h-full object-cover blur-md scale-110" />
        </div>
      )}

      {showAdminAuth && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <form onSubmit={verifyAdmin} className="w-full max-w-xs bg-surface border border-border p-6 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-tighter">
              <Terminal size={16} /> God Mode Access
            </div>
            <input 
              type="password" 
              autoFocus
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="ENTER PASSWORD"
              className="w-full bg-background border-2 border-border focus:border-primary outline-none px-4 py-3 rounded-xl text-center font-mono tracking-widest text-lg"
            />
            <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20">VERIFY</button>
            <button type="button" onClick={() => setShowAdminAuth(false)} className="w-full text-[10px] font-bold text-text-secondary uppercase">Cancel</button>
          </form>
        </div>
      )}

      {isAdminMode && showAdminPanel && (
        <div className="fixed bottom-6 left-6 z-[150] w-72 bg-slate-900/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in slide-in-from-left-4 duration-500">
          <div className="bg-primary/20 px-5 py-3 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-primary-light" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Admin Control</span>
            </div>
            <button onClick={() => setShowAdminPanel(false)} className="text-white/40 hover:text-white transition-colors"><X size={14} /></button>
          </div>
          <div className="p-5 space-y-5">
            <div className="space-y-2">
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Time Manipulation</p>
              <button onClick={() => setTimeLeft(10)} className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group">
                <span className="text-xs font-bold text-white group-hover:text-primary-light">시간 도약 (10초)</span>
                <FastForward size={16} className="text-primary-light" />
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Affinity Level</p>
                <span className="text-xs font-black text-primary-light">Lv.{profile.level}</span>
              </div>
              <input 
                type="range" min="1" max="10" step="1" 
                value={profile.level}
                onChange={(e) => onUpdateProfile({ level: parseInt(e.target.value), xp: 0 })}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary-light" 
              />
              <div className="flex justify-between text-[8px] font-bold text-white/20 px-1 uppercase">
                <span>Stranger</span>
                <span>Lover</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <FileSearch size={10} /> Internal Diagnostics
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                  <p className="text-white/30 text-[8px] font-bold uppercase mb-0.5">Judgment</p>
                  <p className="text-primary-light font-black">{getLevelMood()}</p>
                </div>
                <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                  <p className="text-white/30 text-[8px] font-bold uppercase mb-0.5">Interactions</p>
                  <p className="text-white font-black">{clicks} Clicks</p>
                </div>
              </div>
              <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 space-y-1">
                <p className="text-white/30 text-[8px] font-bold uppercase border-b border-white/5 pb-1 mb-1.5">Dialogue Cache Status</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-bold text-white/60">
                  <span>Start: {profile.dialogueCache.start.length}</span>
                  <span>Finish: {profile.dialogueCache.praising.length}</span>
                  <span>Scold: {profile.dialogueCache.scolding.length}</span>
                  <span>Click: {profile.dialogueCache.click.length}</span>
                  <span>Idle: {profile.dialogueCache.idle.length}</span>
                  <span>Pause: {profile.dialogueCache.pause.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReport && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-primary-dark/70 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="w-full max-w-lg bg-[#FAF9F6] text-[#2D3436] rounded-lg shadow-2xl overflow-hidden relative border-[12px] border-white/80 transform animate-in zoom-in-95 duration-500 flex flex-col h-[85vh]">
            <div className="bg-[#E9E4D4]/50 px-8 py-5 border-b-2 border-[#D1CAB0] flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]"></div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <div className="bg-[#5D5747] text-[#E9E4D4] text-[8px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase">Secret Log</div>
                  <h3 className="font-serif italic font-bold text-xl text-[#5D5747] tracking-tight">Observation Note</h3>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8B836C]">
                  <Calendar size={12} />
                  <span>Together for {profile.streak} Days</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-[#8B836C] uppercase tracking-widest">{new Date().toLocaleDateString()}</span>
                <span className="text-[9px] font-bold text-primary italic">Affinity Lv.{profile.level}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#FAF9F6] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] relative">
              {isGeneratingReport ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-[#8B836C]">
                  <Loader2 className="animate-spin" size={40} />
                  <p className="font-bold text-sm animate-pulse tracking-tight">{profile.name}이(가) 당신의 기록을 정리하는 중...</p>
                </div>
              ) : reportData ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-8">
                  <div className="flex justify-between items-start gap-6">
                    <div className="space-y-4 flex-1">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-[#8B836C] uppercase tracking-tighter">Subject of Observation</p>
                        <h4 className="text-3xl font-bold font-serif border-b-2 border-[#D1CAB0] pb-1 inline-block min-w-[120px]">{profile.honorific || profile.userName}</h4>
                      </div>
                      
                      {profile.todayTask && (
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-[#8B836C] uppercase tracking-tighter">Current Assignment</p>
                          <div className="flex items-center gap-2 text-[#4A4434] font-bold text-sm bg-[#E9E4D4]/30 p-2 rounded-md border border-[#D1CAB0]/40">
                             <BookOpen size={14} className="text-[#8B836C]" />
                             <span>{profile.todayTask}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-white p-1.5 shadow-md border border-[#D1CAB0] rotate-2 flex-shrink-0 group relative">
                       <img src={profile.imageSrc || ''} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700" alt="Passport" />
                       <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 py-6 border-y-2 border-dashed border-[#D1CAB0]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-[#E9E4D4] flex items-center justify-center text-[#5D5747] mb-1 shadow-inner"><TimerIcon size={20} /></div>
                      <span className="text-[9px] font-black uppercase text-[#8B836C] tracking-widest">Focus</span>
                      <span className="font-bold text-sm">100:00</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-400 mb-1 shadow-inner"><Ghost size={20} /></div>
                      <span className="text-[9px] font-black uppercase text-[#8B836C] tracking-widest">Wander</span>
                      <span className="font-bold text-sm text-rose-500">{distractions} Times</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-1 shadow-inner"><MousePointer2 size={20} /></div>
                      <span className="text-[9px] font-black uppercase text-[#8B836C] tracking-widest">Connect</span>
                      <span className="font-bold text-sm text-primary">{clicks} Times</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                       <div className="space-y-1">
                         <span className="inline-block bg-[#5D5747] px-2.5 py-0.5 rounded text-[10px] font-bold text-[#E9E4D4] uppercase tracking-widest">Focus Analysis</span>
                         <h5 className="text-lg font-black text-[#2D3436] tracking-tight">{reportData.typeTitle}</h5>
                       </div>
                       <div className="text-right">
                         <p className="text-[9px] font-black text-[#8B836C] uppercase tracking-widest mb-1">Efficiency Rating</p>
                         <div className="text-5xl font-black text-primary italic leading-none select-none drop-shadow-sm">{reportData.grade}</div>
                       </div>
                    </div>
                    
                    <div className="relative p-7 bg-[#E9E4D4]/20 rounded-xl border border-[#D1CAB0] italic text-[15px] leading-relaxed text-[#4A4434] shadow-inner font-serif">
                      <p className="mb-6 whitespace-pre-wrap leading-relaxed">"{reportData.analysis}"</p>
                      <p className="font-bold text-[#2D3436] border-t border-[#D1CAB0] pt-4">"{reportData.comment}"</p>
                      
                      <div className="absolute -bottom-4 -right-4 transform -rotate-12 select-none pointer-events-none opacity-60">
                        <div className="w-24 h-24 rounded-full border-4 border-rose-500 flex items-center justify-center">
                           <div className="text-rose-500 font-black text-xs text-center leading-tight uppercase tracking-tighter">
                             {reportData.stamp}<br/>STAMP
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="bg-[#E9E4D4] px-8 py-5 flex items-center justify-between border-t-2 border-[#D1CAB0] z-20">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full border border-[#B2A88E] overflow-hidden bg-white flex-shrink-0">
                    <img src={profile.imageSrc || ''} className="w-full h-full object-cover" alt="Author" />
                 </div>
                 <div className="flex flex-col">
                   <p className="text-[9px] font-black text-[#8B836C] uppercase">Written by</p>
                   <p className="text-sm font-black text-[#5D5747] tracking-tight">{profile.name}</p>
                 </div>
              </div>
              <button 
                onClick={closeReportAndShowChoice} 
                className="px-6 py-3 bg-[#2D3436] text-white rounded-xl font-black text-xs hover:bg-black transition-all active:scale-95 shadow-lg shadow-black/20 flex items-center gap-2 group"
              >
                쪽지 닫기 <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
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
              <button onClick={handleExportProfile} className={`w-full py-4 px-6 border rounded-2xl text-sm font-bold transition-all active:scale-95 flex flex-col items-center gap-1 group ${isDarkMode ? 'bg-[#0B0E14] border-[#30363D] hover:bg-slate-800' : 'bg-background border-border hover:bg-border'}`}>
                <span className={isDarkMode ? 'text-slate-100' : 'text-text-primary'}>저장하고 다음에 만나기</span>
                <span className="text-[10px] text-primary-light font-black uppercase tracking-widest opacity-60">백업 파일 다운로드</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {(isSettingsOpen || isApiKeyPopupVisible) && <div className="fixed inset-0 z-30" onClick={() => { setIsSettingsOpen(false); setIsApiKeyPopupVisible(false); }} />}

      <main className="w-full h-full flex flex-col items-center justify-center relative p-4 md:p-8">
          <div className="mb-[-1px] z-20 animate-in slide-in-from-top-4 duration-700">
            <div 
              onClick={handleBadgeClick}
              className={`px-5 py-2 rounded-t-2xl border border-b-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] flex items-center gap-2.5 cursor-pointer active:scale-95 transition-all ${isDarkMode ? 'bg-[#161B22] border-[#30363D]' : 'bg-surface border-border'} ${badgeClicks > 0 ? 'ring-2 ring-primary/20' : ''}`}
            >
                <Heart size={12} className={`text-accent fill-accent ${badgeClicks > 0 ? 'animate-bounce' : 'animate-pulse'}`} />
                <span className={`text-[11px] font-black tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>
                  Lv.{profile.level} <span className="ml-1 text-primary">{LEVEL_TITLES[profile.level] || "운명의 동반자"}</span>
                </span>
                {isAdminMode && <div className="w-1.5 h-1.5 bg-primary rounded-full ml-1" />}
            </div>
          </div>

          <div className={`w-full max-w-md backdrop-blur-xl border p-6 md:p-8 rounded-[40px] shadow-[0_20px_50px_rgba(74,95,122,0.1)] flex flex-col items-center gap-6 md:gap-8 animate-in fade-in zoom-in duration-500 relative transition-colors duration-700 ${isDarkMode ? 'bg-[#161B22]/90 border-[#30363D]' : 'bg-surface/90 border-border'} ${isApiKeyPopupVisible || isSettingsOpen ? 'overflow-visible z-40' : 'overflow-hidden'}`}>
            <div className={`absolute top-2.5 inset-x-8 h-1.5 z-10 ${isDarkMode ? 'bg-slate-700/20' : 'bg-border/20'} rounded-full overflow-hidden`}>
              <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="w-full flex justify-between items-start mt-2 px-2 relative z-50">
                <div className="relative">
                  <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`p-2.5 rounded-full transition-all border shadow-sm ${isSettingsOpen ? 'bg-primary text-white border-primary-dark rotate-45 scale-110' : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100')}`} title="설정"><Settings size={20} /></button>
                  <div className={`absolute top-full left-0 mt-3.5 flex flex-col gap-3.5 transition-all duration-500 origin-top z-50 ${isSettingsOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                      <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); setIsDarkMode(!isDarkMode); }}><div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-800 text-yellow-400 border-slate-700' : 'bg-white border-slate-200'}`}>{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</div><span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border shadow-sm whitespace-nowrap min-w-[60px] text-center ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-surface/90 border-border'}`}>{isDarkMode ? '라이트' : '다크'}</span></div>
                      <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleExportProfile(); }}><div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-800 text-slate-100 border-slate-700' : 'bg-white border-slate-200'}`}><Save size={20} /></div><span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border shadow-sm whitespace-nowrap min-w-[60px] text-center ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-surface/90 border-border'}`}>저장</span></div>
                      <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); setPopupType('MANUAL'); setTempApiKey(profile.apiKey || ''); setApiKeyError(null); setIsApiKeyPopupVisible(true); setIsSettingsOpen(false); }}><div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200'}`}><Key size={20} /></div><span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border shadow-sm bg-slate-800 border-slate-700 text-slate-100 whitespace-nowrap min-w-[60px] text-center`}>API키</span></div>
                      {isAdminMode && (
                        <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowAdminPanel(!showAdminPanel); setIsSettingsOpen(false); }}><div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 bg-primary text-white border-primary-dark`}><Terminal size={20} /></div><span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border shadow-sm bg-primary border-primary-dark text-white whitespace-nowrap min-w-[60px] text-center`}>패널</span></div>
                      )}
                  </div>
                </div>
                <button onClick={onReset} className={`p-2.5 rounded-full transition-all border border-transparent ${isDarkMode ? 'text-slate-400 hover:bg-rose-900/30 hover:text-rose-400' : 'text-text-secondary hover:bg-rose-50 hover:text-rose-500'}`} title="초기화"><X size={20} /></button>
            </div>

            <div className={`relative mt-9 md:mt-11 min-h-[180px] md:min-h-[220px] flex items-center justify-center w-full transition-all ${isApiKeyPopupVisible ? 'z-50' : 'z-20'}`}>
                <div className="relative">
                  {isBreak ? (
                    <div className="flex flex-col items-center gap-4 animate-pulse text-primary-light/40 mb-4">
                      <Bed size={60} className="md:size-20" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Sleeping...</p>
                    </div>
                  ) : (
                    <>
                      {cooldownRemaining > 0 && (
                        <div className="absolute -inset-3 pointer-events-none z-10">
                          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path 
                              d="M 50 2 H 86 A 12 12 0 0 1 98 14 V 86 A 12 12 0 0 1 86 98 H 14 A 12 12 0 0 1 2 86 V 14 A 12 12 0 0 1 14 2 H 50"
                              fill="none" stroke="currentColor" strokeWidth="3" pathLength="100" strokeDasharray="100" 
                              strokeDashoffset={100 * (cooldownRemaining / COOLDOWN_MS)} strokeLinecap="round" 
                              className={`transition-all duration-150 ease-linear ${isDarkMode ? 'text-emerald-400' : 'text-primary'}`} 
                            />
                          </svg>
                        </div>
                      )}
                      <div onClick={handleCharacterClick} className={`w-32 h-32 md:w-44 md:h-44 rounded-2xl border-4 overflow-hidden shadow-xl mx-auto transition-all duration-500 group-hover:scale-105 group-hover:border-primary cursor-pointer active:scale-95 ${isDarkMode ? 'border-slate-800' : 'border-border'}`}>
                        <img src={profile.imageSrc || ''} alt={profile.name} className="w-full h-full object-cover" />
                      </div>
                      {cooldownRemaining > 0 && (<div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary/90 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg animate-pulse whitespace-nowrap z-20">가만히 바라보는 중...</div>)}
                    </>
                  )}

                  {isApiKeyPopupVisible && (
                     <div className="absolute -top-32 left-1/2 transform -translate-x-1/2 w-[340px] md:w-[380px] z-50 animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
                        <div className={`p-7 rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border backdrop-blur-2xl space-y-6 ${isDarkMode ? 'bg-slate-900/95 border-white/10' : 'bg-white/95 border-slate-200'}`}>
                           <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1">
                                    <h3 className={`text-sm font-black leading-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                        {popupType === 'EXPIRED' ? 'API 키가 만료 되었습니다.\n새로운 API 키를 입력해 주세요.' : 'API 키를 새로 입력하시겠어요?'}
                                    </h3>
                                </div>
                                <button onClick={() => setIsApiKeyPopupVisible(false)} className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white/40' : 'hover:bg-slate-100 text-slate-400'}`}><X size={18} /></button>
                           </div>

                           <div className="flex gap-2">
                                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className={`flex-1 h-10 flex items-center justify-center gap-1.5 rounded-xl border text-[10px] font-black transition-all ${isDarkMode ? 'bg-slate-800/50 border-white/5 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                                    키 발급받기 <ExternalLink size={12} />
                                </a>
                                <button onClick={handlePasteKey} className="flex-1 h-10 bg-primary hover:bg-primary-light text-white text-[10px] font-black rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-1.5 transition-all active:scale-95">
                                    복사해 온 키 붙여넣기 <ClipboardPaste size={12} />
                                </button>
                           </div>

                           <div className="space-y-2">
                                <div className="relative group">
                                    <input 
                                        type="password" 
                                        value={tempApiKey} 
                                        onChange={(e) => setTempApiKey(e.target.value)} 
                                        placeholder="API 키를 입력하세요" 
                                        className={`w-full h-12 px-5 pr-12 rounded-xl border-2 outline-none font-mono text-[13px] transition-all ${isDarkMode ? 'bg-black/40 border-white/5 focus:border-primary text-slate-100' : 'bg-slate-50 border-slate-100 focus:border-primary text-slate-800'}`} 
                                    />
                                    {tempApiKey && (
                                        <button onClick={() => setTempApiKey('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"><RotateCcw size={14} /></button>
                                    )}
                                </div>
                                {apiKeyError && <p className="text-[10px] text-rose-500 font-bold px-1 animate-in fade-in slide-in-from-top-1">{apiKeyError}</p>}
                                {isValidating && <div className="flex items-center gap-2 px-1"><Loader2 size={12} className="animate-spin text-primary" /><p className="text-[10px] text-primary font-bold animate-pulse">키 유효성 검사 중...</p></div>}
                           </div>

                           {popupType === 'EXPIRED' && (
                               <div className={`space-y-1 pt-2 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                                    <p className={`text-[9px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>*지금 당장 키를 입력하지 않아도 계속 사용할 수 있어요.</p>
                                    <p className={`text-[9px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>*설정에서 API키 입력 메뉴로 다시 키를 설정할 수 있어요.</p>
                               </div>
                           )}
                        </div>
                     </div>
                  )}
                  
                  {message && !isApiKeyPopupVisible && (
                    <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-64 text-center z-20 animate-in fade-in slide-in-from-bottom-2 pointer-events-none">
                      <div className={`text-xs md:text-sm font-medium px-6 py-3 rounded-[20px] shadow-2xl backdrop-blur-lg border ${isDarkMode ? 'bg-slate-900/80 border-white/10 text-slate-100' : 'bg-surface/80 border-white/50 text-text-primary'}`}>
                        "{message}"
                      </div>
                    </div>
                  )}
                </div>
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
              
              <div className="w-full max-w-[320px] flex items-center gap-4 mt-2 px-2 relative">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-text-secondary/60'}`}>진행률</span>
                <div className={`relative h-2 flex-1 rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-border/40'} overflow-hidden`}>
                  <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${isBreak ? 'bg-gradient-to-r from-success to-emerald-400 animate-pulse-slow' : 'bg-gradient-to-r from-primary to-primary-light'}`} style={{ width: `${overallProgressPercent}%` }} />
                  
                  {/* 롱 프레스 리셋 애니메이션 레이어: 우측(4번 지점)에서 좌측(0번)으로 */}
                  {isResetHolding && (
                    <div 
                        className="absolute top-0 right-0 h-full bg-rose-500 z-10 transition-all duration-75 ease-linear"
                        style={{ width: `${resetHoldProgress}%` }}
                    />
                  )}
                </div>
                {[1, 2, 3, 4].map((i) => { 
                    const pos = i * 25; 
                    const isReached = overallProgressPercent >= pos; 
                    return (
                        <div key={i} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-20 pointer-events-none" style={{ left: `calc(52px + ${i * 18.2}%)` }}>
                            <div className={`transform rotate-45 transition-all border-2 ${isReached ? (isBreak && sessionInCycle === i ? 'bg-success border-success scale-125' : 'bg-primary border-primary scale-110') : (isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-surface border-border')} ${i === 4 ? 'w-3 h-3' : 'w-2 h-2'}`} />
                            <span className={`text-[9px] font-black absolute -bottom-4 ${isReached ? 'text-primary' : (isDarkMode ? 'text-slate-600' : 'text-text-secondary/40')}`}>{i}</span>
                        </div>
                    ); 
                })}
              </div>

              <div className="flex items-center gap-6 md:gap-8 mt-4">
                  {!isBreak ? (
                    <button onClick={() => { if(!isActive) triggerAIResponse('START'); else triggerAIResponse('PAUSE'); setIsActive(!isActive); }} className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 ${isActive ? 'bg-warning text-white' : 'bg-primary text-white hover:bg-primary-light'}`}>
                      {isActive ? <Pause className="w-7 h-7 md:w-8 md:h-8" fill="currentColor" /> : <Play className="w-7 h-7 md:w-8 md:h-8 ml-1" fill="currentColor" />}
                    </button>
                  ) : (
                    /* 휴식 중에도 버튼 표시 - 스킵 기능 */
                    <button onClick={handleSkipBreak} title="휴식 건너뛰기" className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 bg-emerald-500 text-white hover:bg-emerald-600">
                      <SkipForward className="w-7 h-7 md:w-8 md:h-8" fill="currentColor" />
                    </button>
                  )}
                  
                  <button 
                    onMouseDown={handleResetStart}
                    onMouseUp={handleResetEnd}
                    onMouseLeave={handleResetCancel}
                    onTouchStart={handleResetStart}
                    onTouchEnd={handleResetEnd}
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all border active:scale-95 shadow-sm overflow-hidden relative ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200' : 'bg-background border-border text-text-secondary hover:text-text-primary'}`}
                  >
                    <RotateCcw className={`w-5 h-5 md:w-6 md:h-6 relative z-10 transition-transform ${isResetHolding ? 'rotate-[-120deg]' : ''}`} />
                  </button>
              </div>
            </div>
          </div>
      </main>
    </div>
  );
};
