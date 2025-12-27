
import React, { useState, useEffect, useMemo } from 'react';
import { Heart, Settings, Sun, Moon, Save, Key, Terminal, X, Coffee, Timer as TimerIcon, Pause, Play, SkipForward, RotateCcw, Bed, HelpCircle, Zap, ShieldCheck } from 'lucide-react';
import { CharacterProfile } from '../types';

interface TopBadgeProps {
  level: number;
  title: string;
  isAdminMode: boolean;
  isDarkMode: boolean;
  onBadgeClick: () => void;
}

export const TopBadge = React.forwardRef<HTMLDivElement, TopBadgeProps>(({ level, title, isAdminMode, isDarkMode, onBadgeClick }, ref) => (
  <div ref={ref} className="mb-[-1px] z-20 animate-in slide-in-from-top-4 duration-700">
    <div 
      onClick={onBadgeClick}
      className={`px-5 py-2 rounded-t-2xl border border-b-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] flex items-center gap-2.5 cursor-pointer active:scale-95 transition-all ${isDarkMode ? 'bg-[#161B22] border-[#30363D]' : 'bg-surface border-border'}`}
    >
        <Heart size={12} className={`text-accent fill-accent animate-pulse`} />
        <span className={`text-[11px] font-black tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>
          Lv.{level} <span className="ml-1 text-primary">{title}</span>
        </span>
        {isAdminMode && <div className="w-1.5 h-1.5 bg-primary rounded-full ml-1" />}
    </div>
  </div>
));

interface SettingsMenuProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isBatterySaving: boolean;
  onToggleBatterySaving: () => void;
  onExport: () => void;
  onApiKeyOpen: () => void;
  onShowGuide: () => void;
  onPrivacyOpen: () => void;
  isAdminMode: boolean;
  onShowAdminPanel: () => void;
  btnRef: React.RefObject<HTMLDivElement | null>;
  isApiKeyAlert?: boolean;
  isBreak: boolean;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, setIsOpen, isDarkMode, onToggleDarkMode, isBatterySaving, onToggleBatterySaving, onExport, onApiKeyOpen, onShowGuide, onPrivacyOpen, isAdminMode, onShowAdminPanel, btnRef, isApiKeyAlert, isBreak }) => {
  const [showTempGlow, setShowTempGlow] = useState(false);

  useEffect(() => {
    if (isApiKeyAlert) {
      setShowTempGlow(true);
      const timer = setTimeout(() => setShowTempGlow(false), 10000);
      return () => clearTimeout(timer);
    } else {
      setShowTempGlow(false);
    }
  }, [isApiKeyAlert]);

  // Unified base icon colors
  const lightIconColor = 'text-slate-600';
  const darkIconColor = 'text-slate-300';

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-30'}`} ref={btnRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`relative z-50 p-2.5 rounded-full transition-all border shadow-sm ${isOpen ? 'bg-primary text-white border-primary-dark rotate-45 scale-110' : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100')} ${showTempGlow && !isOpen ? 'ring-2 ring-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse' : ''}`} 
        title="설정"
      >
        <Settings size={20} />
      </button>
      
      <div className={`absolute top-full left-0 mt-3.5 flex flex-col gap-3 transition-all duration-500 origin-top z-50 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
          {/* 다크/라이트 모드 (다크모드일 때 해 아이콘은 노란색 유지) */}
          <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggleDarkMode(); }}>
            <div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-800 text-yellow-400 border-slate-700' : `bg-white border-slate-200 ${lightIconColor}`}`}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </div>
          </div>

          {/* 절전 모드 */}
          <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggleBatterySaving(); }}>
            <div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isBatterySaving ? 'bg-primary text-white border-primary-dark shadow-lg shadow-primary/20' : (isDarkMode ? `bg-slate-800 ${darkIconColor} border-slate-700` : `bg-white border-slate-200 ${lightIconColor}`)}`}>
              <Zap size={20} className={isBatterySaving ? "fill-white" : ""} />
            </div>
          </div>

          {/* 저장 */}
          <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onExport(); }}>
            <div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-800 ${darkIconColor} border-slate-700' : `bg-white border-slate-200 ${lightIconColor}`}`}>
              {/* @ts-ignore */}
              <Save size={20} />
            </div>
          </div>

          {/* API 키 */}
          <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onApiKeyOpen(); }}>
            <div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isApiKeyAlert ? 'bg-rose-500/20 text-rose-500 border-rose-500/40 animate-pulse' : (isDarkMode ? `bg-slate-800 ${darkIconColor} border-slate-700` : `bg-white border-slate-200 ${lightIconColor}`)}`}>
              {/* @ts-ignore */}
              <Key size={20} />
            </div>
          </div>

          {/* 사용법 가이드 */}
          {!isBreak && (
            <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onShowGuide(); setIsOpen(false); }}>
              <div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-800 ${darkIconColor} border-slate-700' : `bg-white border-slate-200 ${lightIconColor}`}`}>
                <HelpCircle size={20} />
              </div>
            </div>
          )}

          {/* AI 정책 (방패 모양 ShieldCheck로 변경) */}
          <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onPrivacyOpen(); }}>
            <div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-800 ${darkIconColor} border-slate-700' : `bg-white border-slate-200 ${lightIconColor}`}`}>
              <ShieldCheck size={20} />
            </div>
          </div>

          {/* 관리자 패널 */}
          {isAdminMode && (
            <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onShowAdminPanel(); setIsOpen(false); }}>
              <div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 bg-primary text-white border-primary-dark`}>
                <Terminal size={20} />
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

interface CharacterSectionProps {
  profile: CharacterProfile;
  isBreak: boolean;
  cooldownRemaining: number;
  cooldownMs: number;
  message: string;
  isApiKeyModalOpen: boolean;
  isDarkMode: boolean;
  onCharacterClick: () => void;
  characterBoxRef: React.RefObject<HTMLDivElement | null>;
}

export const CharacterSection: React.FC<CharacterSectionProps> = ({ profile, isBreak, cooldownRemaining, cooldownMs, message, isApiKeyModalOpen, isDarkMode, onCharacterClick, characterBoxRef }) => {
  // 레벨 1~10까지 하나하나 다르게 설정하는 '객체 매핑' IF구문 대체 방식
  const watchingPhrase = useMemo(() => {
    const lv = profile.level;
    const phrasesMap: Record<number, string[]> = {
      1: ["낯선 시선으로 관찰 중...", "적당한 거리 유지 중", "일하는 모습 분석 중"],
      2: ["조금씩 눈길이 가는 중", "딴짓하는지 체크 중", "당신의 리듬을 기록 중"],
      3: ["익숙해진 뒷모습 관찰 중", "말없이 지켜보는 중", "당신의 페이스를 파악 중"],
      4: ["가까운 곳에서 지켜보는 중", "당신의 리듬에 맞추는 중", "방해되지 않게 침묵 중"],
      5: ["편안하게 옆자리를 지키는 중", "정이 든 눈빛으로 관찰 중", "당신의 몰입을 돕는 중"],
      6: ["신뢰를 담아 바라보는 중", "조용히 등을 밀어주는 중", "당신의 호흡을 느끼는 중"],
      7: ["특별한 시선이 머무는 중", "당신에게 눈을 떼지 못하는 중", "조금 더 가까이 지켜보는 중"],
      8: ["애정 어린 눈빛으로 감상 중", "몰입한 옆모습이 예뻐서...", "세상에서 가장 가까운 시선"],
      9: ["깊은 유대를 느끼며 감상 중", "당신의 모든 순간을 소중히 관찰 중", "함께 있는 공기를 느끼는 중"],
      10: ["영원한 동반자로서 지켜보는 중", "사랑스러운 눈빛으로 감상 중", "눈앞의 당신에게 매료되는 중"]
    };
    
    const phrases = phrasesMap[lv] || ["가만히 바라보는 중..."];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }, [profile.level, cooldownRemaining === cooldownMs]);

  // 대사가 뜬 후 8초 뒤에 배지가 나타나도록 설정
  const shouldShowWatchingText = cooldownRemaining > 0 && cooldownRemaining < (cooldownMs - 8000);

  return (
    <div className={`relative mt-9 md:mt-11 min-h-[180px] md:min-h-[220px] flex items-center justify-center w-full transition-all ${isApiKeyModalOpen ? 'z-50' : 'z-20'}`}>
      <div className="relative">
        {isBreak ? (
          <div className="flex flex-col items-center gap-4 animate-pulse text-primary-light/40 mb-4">
            <Bed size={60} className="md:size-20" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Sleeping...</p>
          </div>
        ) : (
          <div className="relative group">
            {shouldShowWatchingText && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 animate-in fade-in zoom-in duration-700 pointer-events-none w-full flex justify-center px-4">
                <div className={`px-3 py-1 rounded-full border backdrop-blur-xl shadow-lg animate-pulse-slow flex items-center justify-center whitespace-nowrap scale-90 md:scale-100
                  ${isDarkMode ? 'bg-black/90 border-white/10 shadow-black/40' : 'bg-slate-900/85 border-white/20 shadow-slate-900/20'}`}>
                  <span className="text-[9px] font-black uppercase tracking-tight text-slate-100">
                    {watchingPhrase}
                  </span>
                </div>
              </div>
            )}

            {cooldownRemaining > 0 && (
              <div className="absolute -inset-3 pointer-events-none z-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path 
                    d="M 50 2 H 86 A 12 12 0 0 1 98 14 V 86 A 12 12 0 0 1 86 98 H 14 A 12 12 0 0 1 2 86 V 14 A 12 12 0 0 1 14 2 H 50"
                    fill="none" stroke="currentColor" strokeWidth="3" pathLength="100" strokeDasharray="100" 
                    strokeDashoffset={100 * (cooldownRemaining / cooldownMs)} strokeLinecap="round" 
                    className={`transition-all duration-150 ease-linear ${isDarkMode ? 'text-emerald-400' : 'text-primary'}`} 
                  />
                </svg>
              </div>
            )}
            <div onClick={onCharacterClick} ref={characterBoxRef} className={`w-32 h-32 md:w-44 md:h-44 rounded-2xl border-4 overflow-hidden shadow-xl mx-auto transition-all duration-500 group-hover:scale-105 group-hover:border-primary cursor-pointer active:scale-95 ${isDarkMode ? 'border-slate-800' : 'border-border'}`}>
              <img src={profile.imageSrc || ''} alt={profile.name} className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {message && !isApiKeyModalOpen && (
          <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-72 text-center z-20 animate-in fade-in slide-in-from-bottom-2 pointer-events-none">
            <div className={`text-xs md:text-sm font-medium px-4 py-2.5 rounded-[20px] shadow-2xl backdrop-blur-lg border ${isDarkMode ? 'bg-slate-900/80 border-white/10 text-slate-100' : 'bg-surface/80 border-white/50 text-text-primary'}`}>
              {message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface TimerDisplayProps {
  isBreak: boolean;
  isDarkMode: boolean;
  timeLeft: number;
  formatTime: (sec: number) => string;
  onModeClick?: () => void;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ isBreak, isDarkMode, timeLeft, formatTime, onModeClick }) => (
  <div className="flex items-center gap-4 md:gap-6">
    <div 
      onClick={onModeClick}
      className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all duration-500 cursor-pointer active:scale-95 ${isBreak ? (isDarkMode ? 'bg-emerald-900/20 border-emerald-800 text-emerald-400' : 'bg-success/10 border-success/20 text-success') : (isDarkMode ? 'bg-slate-800/50 border-slate-700 text-primary-light' : 'bg-primary/5 border-primary/10 text-primary')}`}
    >
      {isBreak ? <Coffee size={18} /> : <TimerIcon size={18} />}
      <div className="flex flex-col items-center leading-tight">
        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter">{isBreak ? "Break" : "Focus"}</span>
        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter">Mode</span>
      </div>
    </div>
    <div className={`text-6xl md:text-7xl font-bold tracking-tighter tabular-nums ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>{formatTime(timeLeft)}</div>
  </div>
);

interface CycleProgressBarProps {
  overallProgressPercent: number;
  isResetHolding: boolean;
  resetHoldProgress: number;
  isBreak: boolean;
  sessionInCycle: number;
  isDarkMode: boolean;
}

export const CycleProgressBar: React.FC<CycleProgressBarProps> = ({ overallProgressPercent, isResetHolding, resetHoldProgress, isBreak, sessionInCycle, isDarkMode }) => (
  <div className="w-full max-w-[320px] flex items-center gap-4 mt-2 px-2 relative select-none">
    <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-text-secondary/60'}`}>진행률</span>
    <div className="flex-1 relative h-2">
      <div className={`absolute inset-0 rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-border/40'} overflow-hidden`}>
        <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${isBreak ? 'bg-gradient-to-r from-success to-emerald-400 animate-pulse-slow' : 'bg-gradient-to-r from-primary to-primary-light'}`} style={{ width: `${overallProgressPercent}%` }} />
        {isResetHolding && (
          <div 
              className="absolute top-0 right-0 h-full bg-rose-500 z-10"
              style={{ width: `${resetHoldProgress}%` }}
          />
        )}
      </div>
      {[1, 2, 3, 4].map((i) => { 
          const pos = i * 25; 
          const isReached = overallProgressPercent >= pos; 
          return (
              <div key={i} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-20 pointer-events-none select-none" style={{ left: `${i * 25}%` }}>
                  <div className={`transform rotate-45 transition-all border-2 ${isReached ? (isBreak && sessionInCycle === i ? 'bg-success border-success scale-125' : 'bg-primary border-primary scale-110') : (isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-surface border-border')} ${i === 4 ? 'w-3 h-3' : 'w-2 h-2'}`} />
                  <span className={`text-[9px] font-black absolute -bottom-4 select-none ${isReached ? 'text-primary' : (isDarkMode ? 'text-slate-600' : 'text-text-secondary/40')}`}>{i}</span>
              </div>
          ); 
      })}
    </div>
  </div>
);

interface ControlButtonsProps {
  isBreak: boolean;
  isActive: boolean;
  onToggle: () => void;
  onSkipBreak: () => void;
  resetBtnRef: React.RefObject<HTMLButtonElement | null>;
  startBtnRef: React.RefObject<HTMLButtonElement | null>;
  onResetStart: (e: React.MouseEvent | React.TouchEvent) => void;
  onResetEnd: (e: React.MouseEvent | React.TouchEvent) => void;
  onResetCancel: () => void;
  isResetHolding: boolean;
  isDarkMode: boolean;
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({ isBreak, isActive, onToggle, onSkipBreak, resetBtnRef, startBtnRef, onResetStart, onResetEnd, onResetCancel, isResetHolding, isDarkMode }) => (
  <div className="flex items-center justify-center gap-6 md:gap-8 mt-4 w-full">
    <button 
      ref={resetBtnRef}
      onMouseDown={(e) => { e.preventDefault(); onResetStart(e); }}
      onMouseUp={(e) => { e.preventDefault(); onResetEnd(e); }}
      onMouseLeave={onResetCancel}
      onFocus={(e) => e.target.blur()}
      onTouchStart={(e) => { if (e.cancelable) e.preventDefault(); onResetStart(e); }}
      onTouchEnd={(e) => { if (e.cancelable) e.preventDefault(); onResetEnd(e); }}
      className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm overflow-hidden relative select-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200' : 'bg-background border-border text-text-secondary hover:text-text-primary'}`}
      title="되돌아가기"
    >
      <RotateCcw className={`w-5 h-5 md:w-6 md:h-6 relative z-10 transition-transform ${isResetHolding ? 'rotate-[-120deg]' : ''}`} />
    </button>

    <button 
      ref={startBtnRef} 
      onClick={onToggle} 
      className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 ${isBreak ? (isActive ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white') : (isActive ? 'bg-warning text-white' : 'bg-primary text-white hover:bg-primary-light')}`}
      title={isActive ? "일시정지" : "시작"}
    >
      {isActive ? <Pause className="w-7 h-7 md:w-8 md:h-8" fill="currentColor" /> : <Play className="w-7 h-7 md:w-8 md:h-8 ml-1" fill="currentColor" />}
    </button>

    {isBreak ? (
      <button 
        onClick={onSkipBreak} 
        title="휴식 건너뛰기" 
        className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm animate-in fade-in zoom-in duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:text-emerald-300' : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'}`}
      >
        <SkipForward className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" />
      </button>
    ) : (
      <div className="w-12 h-12 md:w-14 md:h-14 opacity-0 pointer-events-none" aria-hidden="true" />
    )}
  </div>
);
