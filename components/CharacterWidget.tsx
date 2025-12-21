
import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2, Play, Pause, X, Coffee, MessageSquareHeart } from 'lucide-react';
import { CharacterProfile } from '../types';
import { GoogleGenAI } from "@google/genai";

const INITIAL_SEEDS: Record<string, string[]> = {
  "다정함/스윗": ["오늘도 함께 힘내봐요. 곁에 있을게요.", "무리는 하지 마세요, 당신은 소중하니까요.", "집중하는 모습이 좋아요."],
  "츤데레": ["딱히 도와주는 건 아니니까 착각 마.", "딴짓하지 말고 집중이나 해.", "졸리면 말해. 커피라도 타 줄 테니까."],
  "엄격/냉철": ["계획대로 진행 중입니까? 오차는 없어야 합니다.", "시간은 기다려주지 않습니다. 속도를 높이세요.", "당신의 목표에만 집중하십시오."],
  "능글/플러팅": ["우리 좀 더 가까워진 것 같지 않아요?", "일하는 모습도 섹시하네요. 계속 봐도 되죠?", "나보다 일이 더 중요한 건 아니죠?"],
  "default": ["오셨나요? 기다리고 있었어요.", "이제 시작해볼까요?", "당신의 집중을 도와드릴게요."]
};

interface CharacterWidgetProps {
  profile: CharacterProfile;
  simulatedWindow: string;
  onReset: () => void;
  onTickXP: (amount: number) => void;
  onUpdateProfile: (updates: Partial<CharacterProfile>) => void;
  onModeChange: (isBreak: boolean) => void;
  onSessionComplete: (wasSuccess: boolean) => void;
}

type TriggerType = 'CLICK' | 'TIMER_START' | 'TIMER_PAUSE' | 'TIMER_FINISHED' | 'IDLE' | 'DISTRACTION' | 'LEVEL_UP' | 'APP_START' | 'BREAK_RETURN' | 'PROACTIVE' | 'CONFESSION';

const DISTRACTION_KEYWORDS = ['YouTube', 'Netflix', 'LoL', 'Steam', 'Instagram', 'Twitch'];

export const CharacterWidget: React.FC<CharacterWidgetProps> = ({ profile, simulatedWindow, onReset, onTickXP, onUpdateProfile, onModeChange, onSessionComplete }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const [message, setMessage] = useState<string>(profile.initialGreeting || "..."); 
  const [isMessageVisible, setIsMessageVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [mode, setMode] = useState<'WORK' | 'BREAK'>('WORK');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isCharacterAway, setIsCharacterAway] = useState(false);
  const [isDisappointed, setIsDisappointed] = useState(false);

  const distractionTimeoutRef = useRef<any>(null);
  const messageTimeoutRef = useRef<any>(null);
  const preFetchIntervalRef = useRef<any>(null);
  const proactiveTriggerTimeRef = useRef<any>(null);
  const isCallingAPI = useRef(false);

  const setTimedMessage = (msg: string, duration = 7000) => {
    setMessage(msg);
    setIsMessageVisible(true);
    if (messageTimeoutRef.current) window.clearTimeout(messageTimeoutRef.current);
    messageTimeoutRef.current = window.setTimeout(() => setIsMessageVisible(false), duration);
  };

  useEffect(() => {
    if (!profile) return;
    if (profile.initialGreeting) {
      if (messageTimeoutRef.current) window.clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = window.setTimeout(() => setIsMessageVisible(false), 7000);
      return;
    }
    const firstPersonality = profile.personality.find(p => INITIAL_SEEDS[p]);
    const seeds = INITIAL_SEEDS[firstPersonality || "default"];
    const randomSeed = seeds[Math.floor(Math.random() * seeds.length)];
    setTimedMessage(randomSeed);
  }, []);

  useEffect(() => {
    if (mode === 'BREAK' && !preFetchIntervalRef.current) {
        preFetchIntervalRef.current = window.setInterval(() => {
            if (!profile?.dialogueCache) return;
            if (profile.dialogueCache.idle.length < 3) {
                backgroundFetchDialogue('idle');
            } else if (profile.dialogueCache.praising.length < 3) {
                backgroundFetchDialogue('praising');
            } else {
                if (preFetchIntervalRef.current) clearInterval(preFetchIntervalRef.current);
                preFetchIntervalRef.current = null;
            }
        }, 45000);
    }
    return () => {
        if (preFetchIntervalRef.current) clearInterval(preFetchIntervalRef.current);
        preFetchIntervalRef.current = null;
    };
  }, [mode, profile?.dialogueCache]);

  const backgroundFetchDialogue = async (type: 'scolding' | 'praising' | 'idle') => {
    if (isCallingAPI.current) return;
    isCallingAPI.current = true;
    try {
        const ai = new GoogleGenAI({ apiKey: profile.apiKey || process.env.API_KEY });
        const levelMood = getLevelMood();
        const prompt = `Roleplay as ${profile.name} (${levelMood}). 
            Speech Style: ${profile.personality[0]}. Type: ${type} message for user. 
            Short 1 sentence. Korean. No quotes.`;
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
        if (response.text) {
            const newCache = { ...profile.dialogueCache };
            newCache[type] = [...newCache[type], response.text.trim()];
            onUpdateProfile({ dialogueCache: newCache });
        }
    } catch (e) {} finally { isCallingAPI.current = false; }
  };

  const getLevelMood = () => {
    const lv = profile?.level || 1;
    if (lv <= 3) return "Cold, Distant, Business-like";
    if (lv <= 7) return "Friendly, Supportive, Reliable";
    return "Deeply Affectionate, Protective, Loving";
  };

  useEffect(() => {
    if (timerActive && mode === 'WORK') {
        proactiveTriggerTimeRef.current = Math.floor(Math.random() * (20 * 60 - 5 * 60) + 5 * 60);
    } else {
        proactiveTriggerTimeRef.current = null;
    }
  }, [timerActive, mode]);

  useEffect(() => {
    let interval: any;
    if (timerActive) {
      interval = window.setInterval(() => {
        setTimeLeft(prev => {
            if (prev <= 0) return 0;
            if (proactiveTriggerTimeRef.current && prev === proactiveTriggerTimeRef.current) {
                triggerAIResponse('PROACTIVE');
                proactiveTriggerTimeRef.current = null;
            }
            if (mode === 'WORK' && !isDisappointed) {
                onTickXP(15 / (25 * 60));
            }
            if (mode === 'BREAK' && prev === 61) {
                setIsCharacterAway(false);
                triggerAIResponse('BREAK_RETURN');
            }
            return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, mode, isDisappointed]);

  useEffect(() => {
    if (mode === 'BREAK' || !timerActive) return;
    const isDistracted = DISTRACTION_KEYWORDS.some(k => simulatedWindow.toLowerCase().includes(k.toLowerCase()));

    if (isDistracted) {
        if (!distractionTimeoutRef.current) {
            triggerAIResponse('DISTRACTION', simulatedWindow);
            distractionTimeoutRef.current = window.setTimeout(() => setIsDisappointed(true), 60000);
        }
    } else {
        if (distractionTimeoutRef.current) {
            window.clearTimeout(distractionTimeoutRef.current);
            distractionTimeoutRef.current = null;
            if (isDisappointed) {
                setIsDisappointed(false);
                triggerAIResponse('APP_START');
            }
        }
    }
  }, [simulatedWindow, timerActive, mode]);

  const triggerAIResponse = async (triggerType: TriggerType, extraInfo?: string) => {
    if (triggerType === 'PROACTIVE' && profile?.dialogueCache?.idle?.length > 0) {
        const cached = profile.dialogueCache.idle[0];
        const remaining = profile.dialogueCache.idle.slice(1);
        onUpdateProfile({ dialogueCache: { ...profile.dialogueCache, idle: remaining } });
        setTimedMessage(cached);
        return;
    }

    if (isCallingAPI.current) return;
    
    let scenario = "";
    switch(triggerType) {
        case 'DISTRACTION': scenario = `User is using ${extraInfo} instead of working.`; break;
        case 'LEVEL_UP': scenario = `Level up to ${profile.level}.`; break;
        case 'PROACTIVE': scenario = `Posture, hydration, or encouragement.`; break;
        case 'TIMER_FINISHED': scenario = `Session success! Heartfelt praise.`; break;
        case 'APP_START': scenario = `User returned to focus.`; break;
        default: scenario = `Interaction state.`; break;
    }

    fetchNewDialogue(triggerType, scenario);
  };

  const fetchNewDialogue = async (triggerType: TriggerType, scenario: string) => {
    isCallingAPI.current = true;
    setIsThinking(true);
    try {
        const ai = new GoogleGenAI({ apiKey: profile.apiKey || process.env.API_KEY });
        const style = profile.personality[0] || "존댓말";
        const mood = getLevelMood();
        const prompt = `Roleplay as ${profile.name}. User: ${profile.honorific}. Current Level: ${profile.level}. Mood: ${mood}. Personality: ${profile.personality.join(',')}. Use ${style}. Situation: ${scenario}. Short 1 Korean sentence.`;
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
        if (response.text) setTimedMessage(response.text.trim());
    } catch (e) { 
        setTimedMessage("..."); 
    } finally {
        isCallingAPI.current = false;
        setIsThinking(false);
    }
  };

  useEffect(() => {
    if (timeLeft === 0 && timerActive) {
        if (mode === 'WORK') {
            setMode('BREAK');
            onModeChange(true);
            setTimeLeft(5 * 60);
            setIsCharacterAway(true);
            onSessionComplete(true);
            triggerAIResponse("TIMER_FINISHED");
        } else {
            setMode('WORK');
            onModeChange(false);
            setTimerActive(false);
            setTimeLeft(25 * 60);
            triggerAIResponse('APP_START');
        }
    }
  }, [timeLeft, timerActive]);

  const toggleTimer = () => {
    setTimerActive(!timerActive);
    if (!timerActive) triggerAIResponse('TIMER_START');
  };

  if (isMinimized) return (
    <div className="fixed bottom-4 right-4 z-50">
      <button onClick={() => setIsMinimized(false)} className="bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform pointer-events-auto border-4 border-white">
        <Maximize2 size={24} />
      </button>
    </div>
  );

  return (
    <div className="fixed bottom-0 right-0 p-8 z-50 flex flex-col items-end pointer-events-none w-96">
      <div className={`bg-white/95 backdrop-blur-sm px-6 py-4 rounded-3xl rounded-tr-none shadow-2xl mb-4 relative transform transition-all duration-500 pointer-events-auto border-2 ${
            (isMessageVisible && !isDisappointed) ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
        } ${isDisappointed ? 'border-rose-400 bg-rose-50' : 'border-slate-100'}`}>
        <div className="text-sm text-center text-slate-700 break-keep min-h-[1.5rem] flex items-center justify-center font-bold">
            {isThinking ? <span className="animate-pulse text-indigo-400">생각 중...</span> : message}
        </div>
        <div className={`absolute -bottom-2 right-8 w-4 h-4 transform rotate-45 border-r-2 border-b-2 ${isDisappointed ? 'bg-rose-50 border-rose-400' : 'bg-white border-slate-100'}`}></div>
      </div>

      <div className={`relative pointer-events-auto flex flex-col items-center transition-all duration-1000 ${isCharacterAway ? 'opacity-30 scale-90 translate-y-10 grayscale' : 'opacity-100 scale-100 translate-y-0'}`}>
        <div className={`absolute -top-14 flex gap-2 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} onMouseEnter={() => setIsHovered(true)}>
          <button onClick={toggleTimer} className={`p-3 rounded-full text-white shadow-lg transition-transform hover:scale-110 active:scale-95 ${timerActive ? 'bg-amber-500' : 'bg-emerald-500'}`}>
            {timerActive ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button onClick={() => setIsMinimized(true)} className="p-3 bg-slate-700 text-white rounded-full shadow-lg hover:bg-slate-800 transition-colors"><Minimize2 size={20} /></button>
          <button onClick={onReset} className="p-3 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-colors"><X size={20} /></button>
        </div>
        
        <div className="relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            <img 
                src={profile.imageSrc || ''} 
                alt={profile.name} 
                className={`w-56 h-56 object-contain drop-shadow-2xl cursor-pointer transition-all duration-300 
                  ${isThinking ? 'brightness-75 saturate-150' : ''} 
                  ${isDisappointed ? 'animate-shake saturate-[0.2] contrast-150 brightness-75' : ''}`} 
                onClick={() => !isCharacterAway && triggerAIResponse('CLICK')} 
            />
            {profile.level >= 7 && <MessageSquareHeart className="absolute -top-2 -right-2 text-rose-500 animate-bounce" size={32} />}
        </div>

        <div className="mt-4 px-4 py-2 bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-slate-200 flex flex-col items-center gap-1 min-w-[140px]">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lv.{profile.level} {isDisappointed ? '!!! SILENCE !!!' : 'Affinity'}</span>
            <div className={`flex items-center gap-1.5 font-mono text-lg font-black transition-colors ${isDisappointed ? 'text-rose-600' : 'text-slate-800'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
        </div>
      </div>
    </div>
  );
};
