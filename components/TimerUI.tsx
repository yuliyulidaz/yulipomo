import React from 'react';
import { Heart, Settings, Sun, Moon, Save, Key, Terminal, X, Coffee, Timer as TimerIcon, Pause, Play, SkipForward, RotateCcw, Bed } from 'lucide-react';
import { CharacterProfile } from '../types';

interface TopBadgeProps {
  level: number;
  title: string;
  isAdminMode: boolean;
  isDarkMode: boolean;
  onBadgeClick: () => void;
  badgeClicks: number;
}

export const TopBadge: React.FC<TopBadgeProps> = ({ level, title, isAdminMode, isDarkMode, onBadgeClick, badgeClicks }) => (
  <div className="mb-[-1px] z-20 animate-in slide-in-from-top-4 duration-700">
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
);

interface SettingsMenuProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onExport: () => void;
  onApiKeyOpen: () => void;
  isAdminMode: boolean;
  onShowAdminPanel: () => void;
  btnRef: React.RefObject<HTMLDivElement | null>;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, setIsOpen, isDarkMode, onToggleDarkMode, onExport, onApiKeyOpen, isAdminMode, onShowAdminPanel, btnRef }) => (
  <div className="relative" ref={btnRef}>
    <button onClick={() => setIsOpen(!isOpen)} className={`p-2.5 rounded-full transition-all border shadow-sm ${isOpen ? 'bg-primary text-white border-primary-dark rotate-45 scale-110' : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100')}`} title="설정"><Settings size={20} /></button>
    <div className={`absolute top-full left-0 mt-3.5 flex flex-col gap-3.5 transition-all duration-500 origin-top z-50 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggleDarkMode(); }}><div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-800 text-yellow-400 border-slate-700' : 'bg-white border-slate-200 text-text-primary'}`}>{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</div><span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border shadow-sm whitespace-nowrap min-w-[60px] text-center ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-surface/90 border-border text-text-primary'}`}>{isDarkMode ? '라이트' : '다크'}</span></div>
        <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); onExport(); }}><div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-800 text-slate-100 border-slate-700' : 'bg-white border-slate-200 text-text-primary'}`}><Save size={20} /></div><span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border shadow-sm whitespace-nowrap min-w-[60px] text-center ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-surface/90 border-border text-text-primary'}`}>저장</span></div>
        <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); onApiKeyOpen(); }}><div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 text-text-primary'}`}><Key size={20} /></div><span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border shadow-sm whitespace-nowrap min-w-[60px] text-center ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-surface/90 border-border text-text-primary'}`}>API키</span></div>
        {isAdminMode && (
          <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); onShowAdminPanel(); setIsOpen(false); }}><div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all hover:scale-110 bg-primary text-white border-primary-dark`}><Terminal size={20} /></div><span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border shadow-sm bg-primary border-primary-dark text-white whitespace-nowrap min-w-[60px] text-center`}>패널</span></div>
        )}
    </div>
  </div>
);

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
          {cooldownRemaining > 0 && (<div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary/90 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg animate-pulse whitespace-nowrap z-20">가만히 바라보는 중...</div>)}
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

interface TimerDisplayProps {
  isBreak: boolean;
  isDarkMode: boolean;
  timeLeft: number;
  formatTime: (sec: number) => string;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ isBreak, isDarkMode, timeLeft, formatTime }) => (
  <div className="flex items-center gap-4 md:gap-6">
    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all duration-500 ${isBreak ? (isDarkMode ? 'bg-emerald-900/20 border-emerald-800 text-emerald-400' : 'bg-success/10 border-success/20 text-success') : (isDarkMode ? 'bg-slate-800/50 border-slate-700 text-primary-light' : 'bg-primary/5 border-primary/10 text-primary')}`}>{isBreak ? <Coffee size={18} /> : <TimerIcon size={18} />}<div className="flex flex-col items-center leading-tight"><span className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter">{isBreak ? "Break" : "Focus"}</span><span className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter">Mode</span></div></div>
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
  onResetStart: (e: any) => void;
  onResetEnd: () => void;
  onResetCancel: () => void;
  isResetHolding: boolean;
  isDarkMode: boolean;
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({ isBreak, isActive, onToggle, onSkipBreak, resetBtnRef, startBtnRef, onResetStart, onResetEnd, onResetCancel, isResetHolding, isDarkMode }) => (
  <div className="flex items-center gap-6 md:gap-8 mt-4">
    {!isBreak ? (
      <button ref={startBtnRef} onClick={onToggle} className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 ${isActive ? 'bg-warning text-white' : 'bg-primary text-white hover:bg-primary-light'}`}>
        {isActive ? <Pause className="w-7 h-7 md:w-8 md:h-8" fill="currentColor" /> : <Play className="w-7 h-7 md:w-8 md:h-8 ml-1" fill="currentColor" />}
      </button>
    ) : (
      <button ref={startBtnRef} onClick={onSkipBreak} title="휴식 건너뛰기" className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 bg-emerald-500 text-white hover:bg-emerald-600">
        <SkipForward className="w-7 h-7 md:w-8 md:h-8" fill="currentColor" />
      </button>
    )}
    <button 
      ref={resetBtnRef}
      onMouseDown={onResetStart}
      onMouseUp={onResetEnd}
      onMouseLeave={onResetCancel}
      onTouchStart={onResetStart}
      onTouchEnd={onResetEnd}
      className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm overflow-hidden relative select-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200' : 'bg-background border-border text-text-secondary hover:text-text-primary'}`}
    >
      <RotateCcw className={`w-5 h-5 md:w-6 md:h-6 relative z-10 transition-transform ${isResetHolding ? 'rotate-[-120deg]' : ''}`} />
    </button>
  </div>
);
