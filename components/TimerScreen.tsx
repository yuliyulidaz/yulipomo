
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Heart, Timer as TimerIcon, Coffee, Bed, CheckCircle2, Pencil } from 'lucide-react';
import { CharacterProfile } from '../types';
import { GoogleGenAI } from "@google/genai";

interface TimerScreenProps {
  profile: CharacterProfile;
  onReset: () => void;
  onTickXP: (amount: number) => void;
  onUpdateProfile: (updates: Partial<CharacterProfile>) => void;
  onSessionComplete: (wasSuccess: boolean) => void;
}

const LEVEL_XP_TABLE = [0, 10, 20, 30, 50, 80, 120, 170, 230, 300, 400]; 

const FALLBACK_TEMPLATES: Record<string, Record<string, string>> = {
  "반말": {
    START: "자, 시작하자. {honorific}, 집중해.",
    FINISH: "끝났네? 고생했어. 좀 쉴까?",
    PAUSE: "어디 가? 얼른 와라.",
    DISTRACTION: "야, 딴짓하지 마. 보고 있다.",
    RETURN: "이제 왔어? 기다렸잖아.",
    CLICK: "왜? 심심해?",
    IDLE: "졸지 말고 해. 지켜보고 있어.",
    READY: "슬슬 다시 시작할 준비 해."
  },
  "존댓말": {
    START: "준비되셨나요? 시작할게요, {honorific}.",
    FINISH: "정말 고생 많으셨어요. 잠깐 쉬세요.",
    PAUSE: "어디 가시나요? 금방 오셔야 해요.",
    DISTRACTION: "{honorific}, 딴짓은 안 돼요. 집중하세요.",
    RETURN: "오셨군요. 기다리고 있었어요.",
    CLICK: "네? 부르셨나요?",
    IDLE: "지켜보고 있으니까 힘내세요.",
    READY: "쉬는 시간 끝나가요. 준비해주세요."
  },
  "반존대": {
    START: "시작해요. {honorific}, 딴짓하면 혼나요.",
    FINISH: "수고했어요. 뭐, 나쁘지 않네.",
    PAUSE: "어딜 가요? 도망가는 건 아니지?",
    DISTRACTION: "흐음... 지금 뭐 하는 거죠? 끄세요.",
    RETURN: "늦었네요. 설명이 좀 필요할 텐데.",
    CLICK: "왜요. 할 말 있어요?",
    IDLE: "제 얼굴 말고 화면 봐요.",
    READY: "슬슬 앉아요. 다시 해야지."
  },
  "사극/하오체": {
    START: "시작하겠소. {honorific}, 부디 집중하시오.",
    FINISH: "노고가 많았소. 차라도 한 잔 드시오.",
    PAUSE: "어딜 가는 게요? 자리를 비우지 마시오.",
    DISTRACTION: "그것은 수행에 방해가 되오. 덮으시오.",
    RETURN: "이제야 오는구려. 목이 빠지는 줄 알았소.",
    CLICK: "무슨 일이오? 내가 필요하오?",
    IDLE: "내가 여기 있으니 염려 마시오.",
    READY: "다시 정진할 시간이오. 채비하시오."
  },
  "다나까": {
    START: "작전 시작합니다. {honorific}, 집중하십시오!",
    FINISH: "임무 완료! 수고하셨습니다. 휴식하십시오.",
    PAUSE: "이탈입니까? 신속히 복귀하십시오.",
    DISTRACTION: "전방 주시! 딴짓은 허용하지 않습니다.",
    RETURN: "복귀 신고합니다! 늦으셨습니다.",
    CLICK: "용건 있으십니까?",
    IDLE: "제가 후방을 맡겠습니다. 계속하십시오.",
    READY: "휴식 종료 임박! 위치로 돌아가십시오."
  }
};

export const TimerScreen: React.FC<TimerScreenProps> = ({ 
  profile, onReset, onTickXP, onUpdateProfile, onSessionComplete 
}) => {
  const [timeLeft, setTimeLeft] = useState(profile.savedTimeLeft ?? 25 * 60);
  const [isActive, setIsActive] = useState(profile.savedIsActive ?? false);
  const [isBreak, setIsBreak] = useState(profile.savedIsBreak ?? false);
  const [sessionInCycle, setSessionInCycle] = useState(profile.savedSessionInCycle ?? 0); 
  const [message, setMessage] = useState(profile.initialGreeting || "시작할까?");
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  
  const isRefillingRef = useRef<Record<string, boolean>>({});
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
    if (message) {
      const timer = window.setTimeout(() => {
        setMessage(""); 
      }, 7000);
      return () => window.clearTimeout(timer);
    }
  }, [message]);

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
        Task: Write ${count} DIFFERENT short immersive Korean sentences. 
        Use {honorific} for the user's name/title. No numbers, no quotes. Separate by Newline.
        Make them unique and creative, never repeat existing ones.`;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      if (result.text) {
        const newLines = result.text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
        onUpdateProfile({
          dialogueCache: {
            ...profile.dialogueCache,
            [category]: [...profile.dialogueCache[category], ...newLines]
          }
        });
      }
    } catch (e) {
      console.error(`Refill failed for ${categoryKey}`, e);
    } finally {
      isRefillingRef.current[categoryKey] = false;
    }
  }, [profile, onUpdateProfile]);

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
          refillCategory(key, 3);
        }
    } else {
        const toneKey = profile.personality.find(p => FALLBACK_TEMPLATES[p]) || "존댓말";
        const template = FALLBACK_TEMPLATES[toneKey];
        const rawMsg = template[type] || "...";
        const finalMsg = rawMsg
          .replace(/{honorific}/g, userDisplayName)
          .replace(/{이름}/g, userDisplayName)
          .replace(/{user}/g, userDisplayName);
        
        setMessage(finalMsg);
        refillCategory(key, 5);
    }
  }, [profile, onUpdateProfile, refillCategory]);

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
      if (profile.dialogueCache[cat as keyof typeof profile.dialogueCache].length < 3) {
        refillCategory(cat as keyof typeof profile.dialogueCache, 5);
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
  }, [isActive, isBreak, triggerAIResponse, refillCategory]);

  useEffect(() => {
    if (isBreak) {
      ['click', 'idle', 'scolding', 'praising', 'start', 'pause'].forEach(cat => {
        refillCategory(cat as any, 5);
      });
    }
  }, [isBreak, refillCategory]);

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

  const currentXpTarget = LEVEL_XP_TABLE[profile.level] || 9999;
  const progressPercent = Math.min(100, (profile.xp / currentXpTarget) * 100);
  const shouldHideCharacter = isBreak && timeLeft > 60;

  return (
    <div className="relative w-full h-screen flex bg-background text-text-primary overflow-hidden font-sans">
      {profile.imageSrc && (
        <div className="absolute inset-0 z-0 opacity-10">
          <img src={profile.imageSrc} alt="Background" className="w-full h-full object-cover blur-md scale-110" />
        </div>
      )}

      {showChoiceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary-dark/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-surface border border-border p-8 rounded-3xl shadow-2xl text-center space-y-6 transform animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto text-primary">
              <CheckCircle2 size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-text-primary">1사이클(4세트) 달성!</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                정말 대단해요! 이제 어떻게 할까요?<br/>
                열심히 한 당신을 위해 선택지를 준비했어요.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 pt-2">
              <button 
                onClick={() => handleCycleChoice('LONG')}
                className="w-full py-4 px-6 bg-background hover:bg-border border border-border rounded-2xl text-sm font-bold transition-all active:scale-95 flex flex-col items-center gap-1 group"
              >
                <span className="text-text-primary">푹 쉴게 (30분 휴식)</span>
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

      <main className="w-full h-full flex flex-col items-center justify-center relative z-10 p-4 md:p-8">
          <div className="w-full max-w-md bg-surface/90 backdrop-blur-xl border border-border p-6 md:p-8 rounded-[40px] shadow-[0_20px_50px_rgba(74,95,122,0.1)] flex flex-col items-center gap-6 md:gap-8 animate-in fade-in zoom-in duration-500 relative">
            <div className="w-full flex justify-between items-center">
                <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-full border border-border shadow-inner">
                    <Heart size={14} className="text-accent fill-accent animate-pulse" />
                    <span className="text-sm font-bold tracking-tight text-text-primary">Lv.{profile.level}</span>
                </div>
                <button onClick={onReset} className="p-2.5 hover:bg-rose-50 rounded-full transition-all text-text-secondary hover:text-rose-500 border border-transparent hover:border-rose-100">
                    <X size={20} />
                </button>
            </div>

            <div className="relative group mt-2 md:mt-4 min-h-[180px] md:min-h-[220px] flex items-center justify-center w-full">
                {shouldHideCharacter ? (
                  <div className="flex flex-col items-center gap-4 animate-pulse text-primary-light/40">
                    <Bed size={60} className="md:size-20" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Sleeping...</p>
                  </div>
                ) : (
                  <>
                    <div 
                      onClick={() => !isBreak && triggerAIResponse('CLICK')}
                      className="w-32 h-32 md:w-44 md:h-44 rounded-2xl border-4 border-border overflow-hidden shadow-xl mx-auto transition-all duration-500 group-hover:scale-105 group-hover:border-primary cursor-pointer active:scale-95"
                    >
                        <img src={profile.imageSrc || ''} alt={profile.name} className="w-full h-full object-cover" />
                    </div>
                    {message && (
                      <div className="absolute -top-14 md:-top-16 left-1/2 transform -translate-x-1/2 w-64 md:w-72 text-center z-20 transition-all duration-500 animate-in fade-in slide-in-from-bottom-2 pointer-events-none">
                          <div className="bg-text-primary text-surface text-xs md:text-sm font-medium px-6 md:px-8 py-3 md:py-4 rounded-2xl shadow-xl leading-relaxed relative">
                              "{message}"
                              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-text-primary rotate-45"></div>
                          </div>
                      </div>
                    )}
                  </>
                )}
            </div>

            <div className="text-center space-y-1">
                <h2 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">{profile.name}</h2>
                <p className="text-text-secondary text-[10px] md:text-[11px] font-bold tracking-widest uppercase">To. {profile.honorific || profile.userName || "나"}</p>
            </div>

            <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className={`w-2 h-2 rounded-full transition-all duration-500 ${i <= sessionInCycle ? 'bg-primary scale-125' : 'bg-border'}`} 
                    />
                  ))}
                </div>
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Current Cycle</span>
            </div>

            <div className="text-6xl md:text-7xl font-bold tracking-tighter text-text-primary tabular-nums">
                {formatTime(timeLeft)}
            </div>

            <div className="w-full space-y-2">
                <div className="flex justify-between text-[9px] font-bold text-text-secondary uppercase tracking-widest">
                    <span>Affinity Progress</span>
                    <span className="text-accent">{progressPercent.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out" 
                      style={{ width: `${progressPercent}%` }} 
                    />
                </div>
            </div>

            <div className="flex items-center gap-6 md:gap-8 mt-2">
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
                    className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-background hover:bg-border flex items-center justify-center transition-all border border-border text-text-secondary hover:text-text-primary active:scale-95 shadow-sm"
                >
                    <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
                </button>
            </div>

            <div className={`mt-2 px-6 py-2 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 border ${isBreak ? 'bg-success/10 border-success/20 text-success' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                {isBreak ? <Coffee size={14} /> : <TimerIcon size={14} />}
                {isBreak ? "Break Time" : "Focus Mode"}
            </div>
          </div>
      </main>

      <style>{`
        .drop-shadow-glow {
          filter: drop-shadow(0 0 10px rgba(74, 95, 122, 0.3));
        }
      `}</style>
    </div>
  );
};
