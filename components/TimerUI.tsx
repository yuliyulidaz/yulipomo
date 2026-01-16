import React, { useState, useEffect, useMemo } from 'react';
import { Heart, Settings, Sun, Moon, Save, Key, Terminal, Coffee, Timer as TimerIcon, Pause, Play, SkipForward, RotateCcw, HelpCircle, Zap, ShieldCheck, MessageSquareHeart, AlarmClock, Camera } from 'lucide-react';
import { CharacterProfile } from '../types';
import { WATCHING_PHRASES } from '../WatchingPhrases';

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
  onHistoryOpen: () => void;
  onShowGuide: () => void;
  onPrivacyOpen: () => void;
  isAdminMode: boolean;
  onShowAdminPanel: () => void;
  btnRef: React.RefObject<HTMLDivElement | null>;
  isApiKeyAlert?: boolean;
  isBreak: boolean;
  hasHistory: boolean;
  isSoundEnabled?: boolean;
  onToggleSound: () => void;
  onShowReleaseNotes: () => void;
  hasNewReleaseNotes?: boolean;
  soundVolume?: number;
  onVolumeChange?: (vol: number) => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, setIsOpen, isDarkMode, onToggleDarkMode, isBatterySaving, onToggleBatterySaving, onExport, onApiKeyOpen, onHistoryOpen, onShowGuide, onPrivacyOpen, isAdminMode, onShowAdminPanel, btnRef, isApiKeyAlert, isBreak, hasHistory, isSoundEnabled, onToggleSound, onShowReleaseNotes, hasNewReleaseNotes, soundVolume = 1, onVolumeChange }) => {
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
        {/* 다크/라이트 모드 */}
        <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggleDarkMode(); }}>
          <div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 text-yellow-400 border-slate-700' : `bg-white border-slate-200 ${lightIconColor}`}`}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </div>
        </div>

        {/* 절전 모드 */}
        <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggleBatterySaving(); }}>
          <div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all active:scale-95 ${isBatterySaving ? 'bg-primary text-white border-primary-dark shadow-lg shadow-primary/20' : (isDarkMode ? `bg-slate-800 ${darkIconColor} border-slate-700` : `bg-white border-slate-200 ${lightIconColor}`)}`}>
            <Zap size={20} className={isBatterySaving ? "fill-white" : ""} />
          </div>
        </div>

        {/* 알람 및 볼륨 설정 (확장형 슬라이더) */}
        <div className="relative group flex items-center select-none" onClick={(e) => e.stopPropagation()}>
          <div
            className={`h-12 rounded-full border shadow-sm flex items-center transition-all duration-500 ease-out overflow-hidden ${isSoundEnabled
              ? 'w-48 bg-rose-50 border-rose-100' // Expanded width
              : `w-12 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}` // Collapsed width
              } ${isDarkMode && isSoundEnabled ? 'bg-[#1F1114] border-rose-900/30' : ''}`}
          >
            {/* 1. Mute/Unmute Icon Section */}
            <div
              onClick={onToggleSound}
              className={`w-12 h-full flex items-center justify-center cursor-pointer shrink-0 z-10 ${isSoundEnabled
                ? 'text-rose-500'
                : (isDarkMode ? darkIconColor : lightIconColor)
                }`}
            >
              <AlarmClock size={20} className={isSoundEnabled ? "fill-current animate-pulse-slow" : ""} />
            </div>

            {/* 2. Volume Slider Section (Visible only when Enabled) */}
            <div className={`flex-1 flex items-center justify-between pr-3 pl-1 h-full transition-opacity duration-300 ${isSoundEnabled ? 'opacity-100' : 'opacity-40 grayscale'}`}>
              {[1, 2, 3, 4].map((level) => {
                const heightPercent = 30 + (level - 1) * 15; // 30, 45, 60, 75
                const isActive = soundVolume && soundVolume >= level;

                return (
                  <div
                    key={level}
                    onClick={() => isSoundEnabled && onVolumeChange?.(level)}
                    className={`w-6 h-full flex items-center justify-center cursor-pointer group/bar ${!isSoundEnabled ? 'cursor-not-allowed' : ''}`}
                  >
                    <div
                      className={`w-1.5 rounded-full transition-all duration-300 ${isActive
                        ? (isSoundEnabled ? 'bg-rose-400' : (isDarkMode ? 'bg-slate-600' : 'bg-slate-400'))
                        : (isDarkMode ? 'bg-slate-800' : 'bg-slate-200')
                        }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 저장 */}
        <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onExport(); }}>
          <div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 ${darkIconColor} border-slate-700' : `bg-white border-slate-200 ${lightIconColor}`}`}>
            <Save size={20} />
          </div>
        </div>

        {/* 일기 보관함 */}
        <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onHistoryOpen(); }}>
          <div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all active:scale-95 ${!hasHistory ? 'opacity-40 grayscale-[0.5]' : ''} ${isDarkMode ? `bg-slate-800 ${darkIconColor} border-slate-700` : `bg-white border-slate-200 ${lightIconColor}`}`}>
            <MessageSquareHeart size={20} />
          </div>
        </div>

        {/* API 키 */}
        <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onApiKeyOpen(); }}>
          <div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all active:scale-95 ${isApiKeyAlert ? 'bg-rose-500/20 text-rose-500 border-rose-500/40 animate-pulse' : (isDarkMode ? `bg-slate-800 ${darkIconColor} border-slate-700` : `bg-white border-slate-200 ${lightIconColor}`)}`}>
            <Key size={20} />
          </div>
        </div>

        {/* 사용법 가이드 */}
        {!isBreak && (
          <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onShowGuide(); setIsOpen(false); }}>
            <div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 ${darkIconColor} border-slate-700' : `bg-white border-slate-200 ${lightIconColor}`}`}>
              <HelpCircle size={20} />
            </div>
          </div>
        )}

        {/* AI 정책 */}
        <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onPrivacyOpen(); }}>
          <div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 ${darkIconColor} border-slate-700' : `bg-white border-slate-200 ${lightIconColor}`}`}>
            <ShieldCheck size={20} />
          </div>
        </div>

        {/* 관리자 패널 */}
        {/* 관리자 패널 */}
        {isAdminMode && (
          <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onShowAdminPanel(); setIsOpen(false); }}>
            <div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all active:scale-95 bg-primary text-white border-primary-dark`}>
              <Terminal size={20} />
            </div>
          </div>
        )}

        {/* 릴리즈 노트 (하단 배치) */}
        <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onShowReleaseNotes(); setIsOpen(false); }}>
          <div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all active:scale-95 ${hasNewReleaseNotes ? 'bg-rose-500/20 text-rose-500 border-rose-500/40 animate-pulse' : (isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white border-slate-200 text-slate-600')}`}>
            <div className="relative">
              <MessageSquareHeart size={20} className="hidden" /> {/* 기존 아이콘 대체 또는 새로 추가 */}
              <Settings size={20} className="hidden" />
              <div className="flex items-center justify-center relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
import { ImageCropper } from './ImageCropper';


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
  onPhotoUpdate: (newImage: string) => void;
}

export const CharacterSection: React.FC<CharacterSectionProps> = ({ profile, isBreak, cooldownRemaining, cooldownMs, message, isApiKeyModalOpen, isDarkMode, onCharacterClick, characterBoxRef, onPhotoUpdate }) => {
  const [cropImage, setCropImage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const watchingPhrase = useMemo(() => {
    const lv = profile.level;
    const phrases = WATCHING_PHRASES[lv] || ["가만히 바라보는 중..."];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }, [profile.level, cooldownRemaining === cooldownMs]);


  const shouldShowWatchingText = cooldownRemaining > 0 && cooldownRemaining < (cooldownMs - 8000);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setCropImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative mt-9 md:mt-11 min-h-[180px] md:min-h-[220px] flex items-center justify-center w-full transition-all ${isApiKeyModalOpen ? 'z-50' : 'z-20'}`}>
      <div className="relative">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
        />

        {cropImage && (
          <ImageCropper
            imageSrc={cropImage}
            onCrop={(img) => {
              onPhotoUpdate(img);
              setCropImage(null);
            }}
            onCancel={() => setCropImage(null)}
          />
        )}

        {isBreak ? (
          <div
            onClick={triggerFileSelect}
            className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500 cursor-pointer group"
          >
            {/* 모바일 배려: 호버 없이도 항상 '사진 변경' 아이콘 노출 */}
            <div className={`relative w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all active:scale-95 shadow-lg ${isDarkMode ? 'bg-slate-800 border-slate-700 text-rose-400' : 'bg-white border-rose-100/50 text-rose-500'}`}>
              <div className="absolute inset-0 bg-rose-500/5 rounded-full animate-pulse-slow"></div>
              <RotateCcw size={32} className="relative z-10" />
              <div className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-sm">
                <Camera size={12} fill="currentColor" />
              </div>
            </div>

            <p className={`text-[11px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              최애 사진 변경
            </p>
            <p className="text-[10px] text-slate-400 font-medium -mt-2 opacity-60">다음 25분을 위한 뉴짤!</p>
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
            <div onClick={onCharacterClick} ref={characterBoxRef} className={`w-32 h-32 md:w-44 md:h-44 rounded-2xl border-2 overflow-hidden shadow-xl mx-auto transition-all duration-500 cursor-pointer active:scale-95 ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
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
