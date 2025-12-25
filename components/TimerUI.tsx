
import React, { useState, useEffect } from 'react';
import { Heart, Settings, Sun, Moon, Save, Key, Terminal, X, Coffee, Timer as TimerIcon, Pause, Play, SkipForward, RotateCcw, Bed, HelpCircle, Zap } from 'lucide-react';
import { CharacterProfile } from '../types';

interface TopBadgeProps {
  level: number;
  title: string;
  isAdminMode: boolean;
  isDarkMode: boolean;
  onBadgeClick: () => void;
  badgeClicks: number;
}

export const TopBadge = React.forwardRef<HTMLDivElement, TopBadgeProps>(({ level, title, isAdminMode, isDarkMode, onBadgeClick, badgeClicks }, ref) => (
  <div ref={ref} className="mb-[-1px] z-20 animate-in slide-in-from-top-4 duration-700">
    <div 
      onClick={onBadgeClick}
      className={`px-5 py-2 rounded-t-2xl border border-b-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] flex items-center gap-2.5 cursor-pointer active:scale-95 transition-all ${isDarkMode ? 'bg-[#161B22] border-[#30363D]' : 'bg-surface border-border'} ${badgeClicks > 0 ? 'ring-2 ring-primary/20' : ''}`}
    >
        <Heart size={12} className={`text-accent fill-accent ${badgeClicks > 0 ? 'animate-bounce' : 'animate-pulse'}`} />
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
  isAdminMode: boolean;
  onShowAdminPanel: () => void;
  btnRef: React.RefObject<HTMLDivElement | null>;
  isApiKeyAlert?: boolean;
  isBreak: boolean;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, setIsOpen, isDarkMode, onToggleDarkMode, isBatterySaving, onToggleBatterySaving, onExport, onApiKeyOpen, onShowGuide, isAdminMode, onShowAdminPanel, btnRef, isApiKeyAlert, isBreak }) => {
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

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-30'}`} ref={btnRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`relative z-50 p-2.5 rounded-full transition-all border shadow-sm ${isOpen ? 'bg-primary text-white border-primary-dark rotate-45 scale-110' : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100')} ${showTempGlow && !isOpen ? 'ring-2 ring-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse' : ''}`} 
        title="설정"
      >
        <Settings size={20} />
      </button>
      
      <div className={`absolute top-full left-0 mt-3.5 flex flex-col gap-3.5 transition-all duration-500 origin-top z-50 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
          <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggleDarkMode(); }}><div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-800 text-yellow-400 border-slate-700' : 'bg-white border-slate-200 text-text-primary'}`}>{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</div><span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border shadow-sm whitespace-nowrap min-w-[60px] text-center ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-surface/90 border-border text-text-primary'}`}>{isDarkMode ? '라이트' : '다크'}</span></div>
          <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggleBatterySaving(); }}><div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isBatterySaving ? 'bg-primary text-white border-primary-dark shadow-lg shadow-primary/20' : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white border-slate-200 text-text-secondary')}`}><Zap size={20} className={isBatterySaving ? "fill-white" : ""} /></div><span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border shadow-sm whitespace-nowrap min-w-[60px] text-center ${isBatterySaving ? 'bg-primary border-primary-dark text-white' : (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-surface/90 border-border text-text-primary')}`}>{isBatterySaving ? '절전 끔' : '절전 켬'}</span></div>
          <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); onExport(); }}><div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-800 text-slate-100 border-slate-700' : 'bg-white border-slate-200 text-text-primary'}`}><Save size={20} /></div><span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border shadow-sm whitespace-nowrap min-w-[60px] text-center ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-surface/90 border-border text-text-primary'}`}>저장</span></div>
          <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); onApiKeyOpen(); }}><div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isApiKeyAlert ? 'bg-rose-500/20 text-rose-500 border-rose-500/40 animate-pulse' : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white border-slate-200 text-text-primary')}`}><Key size={20} /></div><span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border shadow-sm whitespace-nowrap min-w-[60px] text-center ${isApiKeyAlert ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-surface/90 border-border text-text-primary')}`}>API키</span></div>
          {!isBreak && (
            <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); onShowGuide(); setIsOpen(false); }}><div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-800 text-primary-light border-slate-700' : 'bg-white border-slate-200 text-primary'}`}><HelpCircle size={20} /></div><span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border shadow-sm whitespace-nowrap min-w-[60px] text-center ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-surface/90 border-border text-text-primary'}`}>사용법</span></div>
          )}
          {isAdminMode && (
            <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); onShowAdminPanel(); setIsOpen(false); }}><div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 bg-primary text-white border-primary-dark`}><Terminal size={20} /></div><span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border shadow-sm bg-primary border-primary-dark text-white whitespace-nowrap min-w-[60px] text-center`}>패널</span></div>
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

export const CharacterSection: React.FC<CharacterSectionProps> = ({ profile, isBreak, cooldownRemaining, cooldownMs, message, isApiKeyModalOpen, isDarkMode, onCharacterClick, characterBoxRef }) => (
  <div className={`relative mt-9 md:mt-11 min-h-[180px] md:min-h-[220px] flex items-center justify-center w-full transition-all ${isApiKeyModalOpen ? 'z-50' : 'z-20'}`}>
    <div className="relative">
      {isBreak ? (
        <div className="flex flex-col items-center gap-4 animate-pulse text-primary-light/40 mb-4">
          <Bed size={60} className="md:size-20" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Sleeping...</p>
        </div>
      ) : (
        <>
          {cooldownRemaining > 0 && cooldownRemaining <= 8000 && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 animate-in fade-in zoom-in duration-500 pointer-events-none">
              <div className={`px-4 py-1.5 rounded-full border backdrop-blur-md shadow-sm animate-pulse-slow flex items-center justify-center whitespace-nowrap
                ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5' : 'bg-primary/10 border-primary/20 shadow-primary/5'}`}>
                <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-emerald-400' : 'text-primary'}`}>
                  가만히 바라보는 중...
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
        </>
      )}

      {message && !isApiKeyModalOpen && (
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-64 text-center z-20 animate-in fade-in slide-in-from-bottom-2 pointer-events-none">
          <div className={`text-xs md:text-sm font-medium px-6 py-3 rounded-[20px] shadow-2xl backdrop-blur-lg border ${isDarkMode ? 'bg-slate-900/80 border-white/10 text-slate-100' : 'bg-surface/80 border-white/50 text-text-primary'}`}>
            "{message}"
          </div>
        </div>
      )}
    </div>
  </div>
);

// @google/genai senior engineer fix: Adding missing exported components required by TimerScreen.tsx
interface TimerDisplayProps {
  isBreak: boolean;
  isDarkMode: boolean;
  timeLeft: number;
  formatTime: (seconds: number) => string;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ isBreak, isDarkMode, timeLeft, formatTime }) => (
  <div className={`text-6xl md:text-7xl font-mono font-black tracking-tighter tabular-nums ${isBreak ? 'text-primary' : (isDarkMode ? 'text-slate-100' : 'text-text-primary')}`}>
    {formatTime(timeLeft)}
  </div>
);

// @google/genai senior engineer fix: Adding missing exported components required by TimerScreen.tsx
interface CycleProgressBarProps {
  overallProgressPercent: number;
  isResetHolding: boolean;
  resetHoldProgress: number;
  isBreak: boolean;
  sessionInCycle: number;
  isDarkMode: boolean;
}

export const CycleProgressBar: React.FC<CycleProgressBarProps> = ({ overallProgressPercent, isResetHolding, resetHoldProgress, isBreak, sessionInCycle, isDarkMode }) => (
  <div className="w-full space-y-4">
    <div className="flex justify-between items-end px-1">
      <div className="flex flex-col">
        <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-text-secondary/60'}`}>Overall Progress</span>
        <span className="text-xs font-bold text-primary">{Math.round(overallProgressPercent)}% Complete</span>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div 
            key={i} 
            className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
              i < sessionInCycle 
                ? 'bg-primary shadow-lg shadow-primary/50' 
                : (i === sessionInCycle && !isBreak ? 'bg-primary/30 animate-pulse' : (isDarkMode ? 'bg-slate-800' : 'bg-slate-100'))
            }`} 
          />
        ))}
      </div>
    </div>
    
    <div className={`relative h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
      <div 
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out rounded-full" 
        style={{ width: `${overallProgressPercent}%` }} 
      />
      {isResetHolding && (
        <div 
          className="absolute inset-y-0 left-0 bg-rose-500/40 transition-all duration-100 ease-linear" 
          style={{ width: `${resetHoldProgress}%` }} 
        />
      )}
    </div>
  </div>
);

// @google/genai senior engineer fix: Adding missing exported components required by TimerScreen.tsx
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

export const ControlButtons: React.FC<ControlButtonsProps> = ({ 
  isBreak, isActive, onToggle, onSkipBreak, 
  resetBtnRef, startBtnRef, 
  onResetStart, onResetEnd, onResetCancel, 
  isResetHolding, isDarkMode 
}) => (
  <div className="w-full flex gap-4 mt-2">
    <button 
      ref={resetBtnRef}
      onMouseDown={onResetStart}
      onMouseUp={onResetEnd}
      onMouseLeave={onResetCancel}
      onTouchStart={onResetStart}
      onTouchEnd={onResetEnd}
      className={`flex-1 h-16 rounded-2xl border-2 flex items-center justify-center transition-all active:scale-95 group relative overflow-hidden ${isResetHolding ? 'border-rose-500 bg-rose-500/10' : (isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-100 hover:border-border')}`}
      title="길게 누르면 초기화"
    >
      <RotateCcw size={24} className={`transition-all ${isResetHolding ? 'text-rose-500 scale-110' : (isDarkMode ? 'text-slate-400 group-hover:text-slate-200' : 'text-text-secondary group-hover:text-text-primary')}`} />
    </button>
    
    <button 
      ref={startBtnRef}
      onClick={isBreak ? onSkipBreak : onToggle}
      className={`flex-[2] h-16 rounded-2xl flex items-center justify-center gap-3 font-black text-white shadow-xl transition-all active:scale-95 ${isBreak ? 'bg-accent hover:bg-accent-dark shadow-accent/20' : (isActive ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-primary hover:bg-primary-light shadow-primary/20')}`}
    >
      {isBreak ? (
        <><SkipForward size={24} fill="currentColor" /> 휴식 건너뛰기</>
      ) : (
        isActive ? <><Pause size={24} fill="currentColor" /> 잠시 멈춤</> : <><Play size={24} fill="currentColor" /> 집중 시작</>
      )}
    </button>
  </div>
);
