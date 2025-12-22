
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Heart, Timer as TimerIcon, Coffee, Bed, CheckCircle2, Moon, Sun, Settings, Save, Key, ExternalLink, ClipboardCheck, Zap, MousePointer2, Ghost, Download, Loader2, FileSearch, Terminal, FastForward, SlidersHorizontal, AlertCircle } from 'lucide-react';
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
    FINISH: ["끝났네? 고생했어. 좀 쉴까?"],
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
  }
};

const COOLDOWN_MS = 16000; 

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

  const [message, setMessage] = useState("");
  const [showChoiceModal, setShowChoiceModal] = useState(false);

  const [badgeClicks, setBadgeClicks] = useState(0);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const [isApiKeyInputVisible, setIsApiKeyInputVisible] = useState(false);
  const [isApiKeyExpiredMode, setIsApiKeyExpiredMode] = useState(false);
  const [hasPendingKeyError, setHasPendingKeyError] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const cooldownIntervalRef = useRef<any>(null);
  const isRefillingRef = useRef<Record<string, boolean>>({});
  const isGlobalApiLockedRef = useRef<boolean>(false);
  const refillQueueRef = useRef<Array<keyof typeof profile.dialogueCache>>([]);
  const wakeLockRef = useRef<any>(null);
  
  const profileRef = useRef(profile);
  useEffect(() => { profileRef.current = profile; }, [profile]);

  const cleanDialogue = useCallback((text: string, honorific: string) => {
    return text.replace(/{honorific}/g, honorific);
  }, []);

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
      const situations: Record<string, string> = { scolding: 'slacking off', praising: 'finished focus', idle: 'mid-focus', click: 'user clicked', pause: 'paused', start: 'started' };
      const prompt = `Roleplay as ${currentProfile.name}. User: ${currentProfile.userName}. Mood: ${getMood()}. Personality: ${currentProfile.personality.join(', ')}. Situation: ${situations[categoryKey]}. Write ${count} Korean sentences (10-20 chars). Use {honorific}. Separate by Newline.`;
      const result = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt, config: { safetySettings: SAFETY_SETTINGS } });
      if (result.text) {
        const newLines = result.text.split('\n').map(l => l.trim()).filter(l => l.length >= 8);
        onUpdateProfile({ dialogueCache: { ...currentProfile.dialogueCache, [category]: [...currentProfile.dialogueCache[category], ...newLines] } });
      }
    } catch (e: any) {
      if (e?.message?.includes('API_KEY_INVALID') || e?.message?.includes('API key not found')) {
        setHasPendingKeyError(true);
      }
    } finally { isRefillingRef.current[categoryKey] = false; }
  }, [onUpdateProfile]);

  const processRefillQueue = useCallback(async () => {
    if (isGlobalApiLockedRef.current || refillQueueRef.current.length === 0) return;
    const PRIORITY: Record<string, number> = { click: 0, start: 1, scolding: 1, praising: 2, pause: 2, idle: 3 };
    refillQueueRef.current.sort((a, b) => (PRIORITY[a] ?? 99) - (PRIORITY[b] ?? 99));
    const currentProfile = profileRef.current;
    if (currentProfile.dialogueCache.click.length === 0 && refillQueueRef.current.includes('click')) {
        const idx = refillQueueRef.current.indexOf('click'); refillQueueRef.current.splice(idx, 1);
        isGlobalApiLockedRef.current = true; await refillCategory('click', 5);
    } else {
        const category = refillQueueRef.current.shift()!; isGlobalApiLockedRef.current = true; await refillCategory(category, 5);
    }
    setTimeout(() => { isGlobalApiLockedRef.current = false; }, 15000);
  }, [refillCategory]);

  useEffect(() => {
    const queueTimer = setInterval(processRefillQueue, 2000);
    return () => clearInterval(queueTimer);
  }, [processRefillQueue]);

  const addToRefillQueue = useCallback((category: keyof typeof profile.dialogueCache) => {
    if (profileRef.current.dialogueCache[category].length >= 10) return;
    if (!refillQueueRef.current.includes(category)) refillQueueRef.current.push(category);
  }, []);

  const triggerAIResponse = useCallback((type: 'START' | 'FINISH' | 'DISTRACTION' | 'IDLE' | 'CLICK' | 'PAUSE' | 'READY' | 'RETURN' | 'CYCLE_LONG' | 'CYCLE_SHORT') => {
    const cacheKeyMap: Record<string, keyof typeof profile.dialogueCache> = {
      'START': 'start', 'FINISH': 'praising', 'DISTRACTION': 'scolding', 'IDLE': 'idle',
      'CLICK': 'click', 'PAUSE': 'pause', 'READY': 'start', 'RETURN': 'scolding', 'CYCLE_LONG': 'praising', 'CYCLE_SHORT': 'praising'
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
        const newCacheList = [...cachedList]; newCacheList.splice(randomIndex, 1);
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
  }, [profile, onUpdateProfile, addToRefillQueue, cleanDialogue]);

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
      const mood = profile.level <= 3 ? "Cold" : profile.level <= 7 ? "Warm" : "Obsessive";
      const prompt = `Roleplay as ${profile.name}. User: ${profile.honorific}. Personality: ${profile.personality.join(',')}. Mood: ${mood}.
        Situation: The user just finished 4 pomodoro sessions (100min focus). Stats: ${distractions} distractions, ${clicks} clicks. JSON ONLY: { "grade": "S..F", "typeTitle": "..", "analysis": "..", "comment": "..", "stamp": ".." }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json", safetySettings: SAFETY_SETTINGS }
      });
      const data = JSON.parse(response.text || '{}');
      setReportData(data);
    } catch (e: any) {
      if (e?.message?.includes('API_KEY_INVALID')) setHasPendingKeyError(true);
      setReportData({ grade: "A", typeTitle: "성실한 노력파", analysis: "꾸준함이 돋보입니다.", comment: "고생했어요.", stamp: "PASS" });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleTimerFinish = () => {
    if (!isBreak) {
      onSessionComplete(true);
      const nextSessionCount = sessionInCycle + 1;
      setSessionInCycle(nextSessionCount);
      
      if (hasPendingKeyError) {
        setIsApiKeyExpiredMode(true);
        setTempApiKey('');
        setIsApiKeyInputVisible(true);
      }

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
    const linkElement = document.createElement('a'); linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `${profile.name}_profile.json`); linkElement.click();
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

  const validateAndApplyApiKey = async (key: string) => {
    if (!key.trim()) return;
    setIsValidating(true);
    setApiKeyError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: 'Hi' });
      onUpdateProfile({ apiKey: key });
      setHasPendingKeyError(false);
      setIsApiKeyInputVisible(false);
      setMessage("적용 완료!");
    } catch (err) {
      setApiKeyError("사용할 수 없는 키입니다. 새로운 키를 입력해주세요.");
    } finally {
      setIsValidating(false);
    }
  };

  const handlePasteApiKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const trimmed = text.trim();
        setTempApiKey(trimmed);
        validateAndApplyApiKey(trimmed);
      }
    } catch (err) {}
  };

  const currentXpTarget = LEVEL_XP_TABLE[profile.level] || 9999;
  const progressPercent = Math.min(100, (profile.xp / currentXpTarget) * 100);
  const overallProgressPercent = ((sessionInCycle + (!isBreak ? (25 * 60 - timeLeft) / (25 * 60) : 0)) / 4) * 100;

  return (
    <div className={`relative w-full h-screen flex transition-colors duration-700 overflow-hidden font-sans ${isDarkMode ? 'bg-[#0B0E14] text-slate-100' : 'bg-background text-text-primary'}`}>
      {profile.imageSrc && (
        <div className={`absolute inset-0 z-0 transition-opacity duration-700 ${isDarkMode ? 'opacity-5' : 'opacity-10'}`}>
          <img src={profile.imageSrc} alt="Background" className="w-full h-full object-cover blur-md scale-110" />
        </div>
      )}

      {/* 관리자 모드 관련 (유지) */}
      {showAdminAuth && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <form onSubmit={verifyAdmin} className="w-full max-w-xs bg-surface border border-border p-6 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-tighter"><Terminal size={16} /> God Mode</div>
            <input type="password" autoFocus value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="PASSWORD" className="w-full bg-background border-2 border-border focus:border-primary outline-none px-4 py-3 rounded-xl text-center font-mono tracking-widest text-lg" />
            <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20">VERIFY</button>
            <button type="button" onClick={() => setShowAdminAuth(false)} className="w-full text-[10px] font-bold text-text-secondary uppercase">Cancel</button>
          </form>
        </div>
      )}

      {isAdminMode && showAdminPanel && (
        <div className="fixed bottom-6 left-6 z-[150] w-72 bg-slate-900/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in slide-in-from-left-4 duration-500">
          <div className="bg-primary/20 px-5 py-3 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-2"><Terminal size={14} className="text-primary-light" /><span className="text-[10px] font-black text-white uppercase tracking-widest">Admin Panel</span></div>
            <button onClick={() => setShowAdminPanel(false)} className="text-white/40 hover:text-white transition-colors"><X size={14} /></button>
          </div>
          <div className="p-5 space-y-5">
            <button onClick={() => setTimeLeft(10)} className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group">
              <span className="text-xs font-bold text-white group-hover:text-primary-light">시간 도약 (10초)</span>
              <FastForward size={16} className="text-primary-light" />
            </button>
            <input type="range" min="1" max="10" step="1" value={profile.level} onChange={(e) => onUpdateProfile({ level: parseInt(e.target.value), xp: 0 })} className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary-light" />
          </div>
        </div>
      )}

      {/* 보고서 & 선택지 모달 (유지) */}
      {showReport && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-primary-dark/60 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="w-full max-w-lg bg-[#FAF9F6] text-[#2D3436] rounded-[2rem] shadow-2xl overflow-hidden relative border-8 border-white/50 transform animate-in zoom-in-95 duration-500">
            <div className="bg-[#E9E4D4] px-8 py-4 border-b-2 border-dashed border-[#B2A88E] flex justify-between items-center">
              <div className="flex items-center gap-2"><h3 className="font-serif italic font-bold text-lg text-[#5D5747]">Observation Log</h3></div>
              <span className="text-[10px] font-black text-[#8B836C] uppercase tracking-widest">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="p-8 space-y-8 min-h-[400px] flex flex-col items-center justify-center text-center">
              {isGeneratingReport ? <Loader2 className="animate-spin text-primary" size={40} /> : reportData ? <>
                <h4 className="text-4xl font-black italic text-primary">{reportData.grade}</h4>
                <p className="font-bold text-[#2D3436] italic">"{reportData.comment}"</p>
                <button onClick={closeReportAndShowChoice} className="mt-8 px-12 py-4 bg-[#2D3436] text-white rounded-2xl font-black text-sm shadow-xl">닫기</button>
              </> : null}
            </div>
          </div>
        </div>
      )}

      {showChoiceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary-dark/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-sm border p-10 rounded-[3rem] shadow-2xl text-center space-y-8 transform animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-[#161B22] border-[#30363D]' : 'bg-surface border-border'}`}>
            <h3 className={`text-2xl font-black ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>1사이클 달성!</h3>
            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => handleCycleChoice('LONG')} className="w-full py-5 bg-background border border-border rounded-2xl text-sm font-black hover:bg-slate-50 transition-all">푹 쉴게 (30분)</button>
              <button onClick={() => handleCycleChoice('SHORT')} className="w-full py-5 bg-primary text-white rounded-2xl text-sm font-black hover:bg-primary-light transition-all shadow-lg shadow-primary/20">5분만 쉴래 (열공)</button>
            </div>
          </div>
        </div>
      )}

      {(isSettingsOpen || isApiKeyInputVisible) && <div className="fixed inset-0 z-30" onClick={() => { setIsSettingsOpen(false); setIsApiKeyInputVisible(false); }} />}

      <main className="w-full h-full flex flex-col items-center justify-center relative p-4 md:p-8">
          <div className="mb-[-1px] z-20 animate-in slide-in-from-top-4 duration-700">
            <div onClick={handleBadgeClick} className={`px-6 py-2.5 rounded-t-[1.5rem] border border-b-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] flex items-center gap-3 cursor-pointer active:scale-95 transition-all ${isDarkMode ? 'bg-[#161B22] border-[#30363D]' : 'bg-surface border-border'}`}>
                <Heart size={14} className="text-accent fill-accent animate-pulse" />
                <span className={`text-[12px] font-black tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>Lv.{profile.level} <span className="ml-1 text-primary">{LEVEL_TITLES[profile.level] || "동반자"}</span></span>
                {isAdminMode && <div className="w-2 h-2 bg-primary rounded-full" />}
            </div>
          </div>

          <div className={`w-full max-w-md backdrop-blur-xl border p-8 md:p-10 rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] flex flex-col items-center gap-10 animate-in fade-in zoom-in duration-500 relative transition-colors duration-700 ${isDarkMode ? 'bg-[#161B22]/90 border-[#30363D]' : 'bg-surface/90 border-border'} ${isApiKeyInputVisible || isSettingsOpen ? 'overflow-visible z-40' : 'overflow-hidden'}`}>
            <div className={`absolute top-3 inset-x-10 h-2 z-10 ${isDarkMode ? 'bg-slate-700/20' : 'bg-border/20'} rounded-full overflow-hidden`}>
              <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="w-full flex justify-between items-start mt-4 px-2 relative z-50">
                <div className="relative">
                  <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`p-3 rounded-full transition-all border shadow-sm ${isSettingsOpen ? 'bg-primary text-white border-primary-dark rotate-45 scale-110' : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200')}`} title="설정"><Settings size={24} /></button>
                  <div className={`absolute top-full left-0 mt-5 flex flex-col gap-4 transition-all duration-500 origin-top z-50 ${isSettingsOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                      <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); setIsDarkMode(!isDarkMode); }}><div className={`w-14 h-14 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-800 text-yellow-400 border-slate-700' : 'bg-white border-slate-200'}`}>{isDarkMode ? <Sun size={24} /> : <Moon size={24} />}</div></div>
                      <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleExportProfile(); }}><div className={`w-14 h-14 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-800 text-slate-100 border-slate-700' : 'bg-white border-slate-200'}`}><Save size={24} /></div></div>
                      <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); setTempApiKey(profile.apiKey || ''); setIsApiKeyExpiredMode(false); setIsApiKeyInputVisible(true); setIsSettingsOpen(false); }}><div className={`w-14 h-14 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white border-slate-200'}`}><Key size={24} /></div></div>
                  </div>
                </div>
                <button onClick={onReset} className={`p-3 rounded-full transition-all border border-transparent ${isDarkMode ? 'text-slate-400 hover:text-rose-400' : 'text-text-secondary hover:text-rose-500'}`} title="초기화"><X size={24} /></button>
            </div>

            <div className={`relative mt-12 min-h-[220px] flex items-center justify-center w-full transition-all ${isApiKeyInputVisible ? 'z-50' : 'z-20'}`}>
                {isBreak && timeLeft > 60 && !isApiKeyInputVisible ? (
                  <div className="flex flex-col items-center gap-4 animate-pulse text-primary-light/40"><Bed size={80} /><p className="text-[12px] font-black uppercase tracking-widest">Sleeping...</p></div>
                ) : (
                  <div className="relative">
                    {cooldownRemaining > 0 && (
                      <div className="absolute -inset-4 pointer-events-none z-10">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <path d="M 50 2 H 86 A 12 12 0 0 1 98 14 V 86 A 12 12 0 0 1 86 98 H 14 A 12 12 0 0 1 2 86 V 14 A 12 12 0 0 1 14 2 H 50" fill="none" stroke="currentColor" strokeWidth="2" pathLength="100" strokeDasharray="100" strokeDashoffset={100 * (cooldownRemaining / COOLDOWN_MS)} strokeLinecap="round" className={`transition-all duration-150 ease-linear ${isDarkMode ? 'text-emerald-400' : 'text-primary'}`} />
                        </svg>
                      </div>
                    )}
                    <div onClick={handleCharacterClick} className={`w-40 h-40 md:w-52 md:h-52 rounded-[2.5rem] border-4 overflow-hidden shadow-2xl mx-auto transition-all duration-500 hover:scale-105 hover:border-primary cursor-pointer active:scale-95 ${isDarkMode ? 'border-slate-800' : 'border-border'}`}><img src={profile.imageSrc || ''} alt={profile.name} className="w-full h-full object-cover" /></div>
                    {message && !isApiKeyInputVisible && (<div className="absolute -top-24 left-1/2 transform -translate-x-1/2 w-72 text-center z-20 animate-in fade-in slide-in-from-bottom-2 pointer-events-none"><div className={`text-sm md:text-base font-bold px-8 py-4 rounded-[2rem] shadow-2xl backdrop-blur-lg border ${isDarkMode ? 'bg-slate-900/80 border-white/10 text-slate-100' : 'bg-surface/80 border-white/50 text-text-primary'}`}>"{message}"</div></div>)}
                  </div>
                )}

                {/* API 키 팝업 - 요청하신 '이미지 2'의 미학적 디테일 반영 */}
                {isApiKeyInputVisible && (
                   <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[500px] z-[120] animate-in fade-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                      <div className={`p-10 md:p-14 rounded-[3.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.18)] border-2 transition-colors ${isDarkMode ? 'bg-[#1B212E] border-white/10' : 'bg-white border-[#F0F2F5]'}`}>
                         <div className="flex justify-between items-start mb-10">
                            <h2 className={`text-2xl md:text-3xl font-extrabold leading-[1.3] break-keep ${isDarkMode ? 'text-slate-100' : 'text-[#2D3436]'}`}>
                              {isApiKeyExpiredMode ? "API 키가 만료되었어요.\n새로운 키를 입력해 주세요." : "API 키를 새로\n입력하시겠어요?"}
                            </h2>
                            <button onClick={() => setIsApiKeyInputVisible(false)} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-100 text-[#B2BEC3]'}`}>
                               <X size={28} />
                            </button>
                         </div>

                         <div className="flex gap-4 mb-10">
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className={`flex-[1.2] h-16 flex items-center justify-center gap-2 rounded-[1.5rem] border-[1.5px] text-[13px] font-black tracking-tight transition-all ${isDarkMode ? 'bg-[#262D3D] border-white/10 text-slate-300 hover:bg-[#2F374A]' : 'bg-[#F9FAFB] border-[#E9ECEF] text-[#636E72] hover:bg-[#F1F3F5]'}`}>
                               키 발급받기 <ExternalLink size={18} />
                            </a>
                            <button onClick={handlePasteApiKey} className={`flex-[1.8] h-16 flex items-center justify-center gap-2 rounded-[1.5rem] text-[13px] font-black tracking-tight text-white shadow-xl transition-all active:scale-95 ${isDarkMode ? 'bg-primary-dark hover:bg-primary shadow-primary/10' : 'bg-[#4A5F7A] hover:bg-[#3A4F6A] shadow-primary/20'}`}>
                               복사해 온 키 붙여넣기 <ClipboardCheck size={18} />
                            </button>
                         </div>

                         <div className="relative mb-10">
                            <input 
                               type="password" 
                               value={tempApiKey} 
                               onChange={(e) => {setTempApiKey(e.target.value); setApiKeyError(null);}} 
                               placeholder={isApiKeyExpiredMode ? "여기에 새로운 키를 붙여넣으세요" : "●●●●●●●●●●●●●●●●"}
                               className={`w-full h-20 pl-10 pr-16 rounded-[2rem] border-[1.5px] outline-none font-mono text-[16px] transition-all ${isDarkMode ? 'bg-[#0F1219] border-white/5 focus:border-primary text-slate-200' : 'bg-[#F9FAFB] border-[#E9ECEF] focus:border-[#4A5F7A] text-[#2D3436]'}`}
                            />
                            {tempApiKey && (
                               <button onClick={() => {setTempApiKey(''); setApiKeyError(null);}} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                  <X size={24} />
                               </button>
                            )}
                         </div>

                         {apiKeyError && (
                            <p className="text-[13px] text-rose-500 font-extrabold mb-8 px-2 animate-in fade-in slide-in-from-top-1 flex items-center gap-2">
                               <AlertCircle size={16} /> {apiKeyError}
                            </p>
                         )}

                         {isValidating && (
                            <p className="text-[13px] text-primary font-black animate-pulse mb-8 px-2">
                               키를 검증하고 있습니다...
                            </p>
                         )}

                         {isApiKeyExpiredMode && (
                            <div className="space-y-2.5 mb-10 px-2 opacity-60">
                               <p className={`text-[12px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-[#A4B0BE]'}`}>* 지금 당장 키를 입력하지 않아도 계속 사용할 수 있어요.</p>
                               <p className={`text-[12px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-[#A4B0BE]'}`}>* 설정에서 API키 입력 메뉴로 다시 키를 설정할 수 있어요.</p>
                            </div>
                         )}

                         <button 
                            disabled={isValidating || !tempApiKey.trim()}
                            onClick={() => validateAndApplyApiKey(tempApiKey)}
                            className={`w-full h-20 rounded-[2rem] text-[17px] font-black tracking-widest text-white shadow-2xl transition-all active:scale-[0.98] disabled:opacity-30 ${isDarkMode ? 'bg-primary shadow-primary/20' : 'bg-[#4A5F7A] shadow-[#4A5F7A]/30'}`}
                         >
                            {isValidating ? '검증 중...' : '저장 및 적용하기'}
                         </button>
                      </div>
                   </div>
                )}
            </div>

            <div className="text-center space-y-1 -mt-14">
                <h2 className={`text-4xl md:text-5xl font-black tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>{profile.name}</h2>
                <p className={`text-[12px] font-black tracking-[0.2em] uppercase opacity-40 ${isDarkMode ? 'text-slate-400' : 'text-text-secondary'}`}>To. {profile.honorific || profile.userName || "나"}</p>
            </div>

            <div className="w-full flex flex-col items-center gap-8 mt-4 pb-4">
              <div className="flex items-center gap-8 md:gap-10">
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-[2rem] flex flex-col items-center justify-center gap-1 border transition-all duration-500 ${isBreak ? (isDarkMode ? 'bg-emerald-900/20 border-emerald-800 text-emerald-400' : 'bg-success/10 border-success/20 text-success') : (isDarkMode ? 'bg-slate-800/50 border-slate-700 text-primary-light' : 'bg-primary/5 border-primary/10 text-primary')}`}>{isBreak ? <Coffee size={24} /> : <TimerIcon size={24} />}<span className="text-[10px] font-black uppercase tracking-tighter">{isBreak ? "Break" : "Focus"}</span></div>
                <div className={`text-7xl md:text-8xl font-black tracking-tighter tabular-nums ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>{formatTime(timeLeft)}</div>
              </div>
              <div className="flex items-center gap-10 mt-6">
                  {!isBreak && (<button onClick={() => { if(!isActive) triggerAIResponse('START'); else triggerAIResponse('PAUSE'); setIsActive(!isActive); }} className={`w-20 h-20 md:w-24 md:h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-all active:scale-90 ${isActive ? 'bg-warning text-white' : 'bg-primary text-white hover:bg-primary-light'}`}>{isActive ? <Pause className="w-10 h-10" fill="currentColor" /> : <Play className="w-10 h-10 ml-2" fill="currentColor" />}</button>)}
                  <button onClick={() => { setIsActive(false); setTimeLeft(isBreak ? (sessionInCycle === 0 ? 30 * 60 : 5 * 60) : 25 * 60); }} className={`w-16 h-16 md:w-20 md:h-20 rounded-[2rem] flex items-center justify-center transition-all border active:scale-95 shadow-lg ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-background border-border text-text-secondary'}`}><RotateCcw className="w-8 h-8" /></button>
              </div>
            </div>
          </div>
      </main>
    </div>
  );
};
