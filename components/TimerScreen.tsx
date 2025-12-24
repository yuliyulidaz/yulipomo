import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { CharacterProfile } from '../types';
import { ObservationDiary } from './ObservationDiary';
import { OnboardingGuide } from './OnboardingGuide';
import { ApiKeyExpiryModal } from './ApiKeyExpiryModal';
import { ExitConfirmModal } from './ExitConfirmModal';

// 설정 및 유틸리티
import { LEVEL_TITLES } from './TimerConfig';
import { formatTime, calculateOverallProgress, cleanDialogue } from './TimerUtils';

// 모달 및 UI 컴포넌트
import { AdminAuthModal, AdminPanel, CycleChoiceModal } from './TimerModals';
import { TopBadge, SettingsMenu, CharacterSection, TimerDisplay, CycleProgressBar, ControlButtons } from './TimerUI';

// 커스텀 훅
import { useTimerCore } from '../hooks/useTimerCore';
import { useAIManager } from '../hooks/useAIManager';
import { useXPManager } from '../hooks/useXPManager';

interface TimerScreenProps {
  profile: CharacterProfile;
  onReset: () => void;
  onTickXP: (amount: number) => void;
  onUpdateProfile: (updates: Partial<CharacterProfile>) => void;
  onSessionComplete: (wasSuccess: boolean) => void;
}

const RESET_HOLD_MS = 2000;

export const TimerScreen: React.FC<TimerScreenProps> = ({ 
  profile, onReset, onTickXP, onUpdateProfile, onSessionComplete 
}) => {
  // --- 1. AI & Dialogue Logic ---
  const {
    message, setMessage, cooldownRemaining, setCooldownRemaining,
    triggerAIResponse, handleInteraction, pendingExpiryAlert, COOLDOWN_MS
  } = useAIManager(profile, onUpdateProfile);

  // --- 2. Core Timer Logic ---
  const {
    timeLeft, setTimeLeft, isActive, setIsActive, isBreak, setIsBreak,
    sessionInCycle, setSessionInCycle, showReport, setShowReport,
    toggleActive, skipBreak, resetTimer
  } = useTimerCore(profile, onTickXP, onSessionComplete, triggerAIResponse);

  // --- 3. XP & Leveling Logic ---
  const { progressPercent, levelTitle } = useXPManager(profile);

  // --- 4. Local UI State ---
  const [distractions, setDistractions] = useState(profile.cycleStats?.distractions ?? 0);
  const [clicks, setClicks] = useState(profile.cycleStats?.clicks ?? 0);
  const [badgeClicks, setBadgeClicks] = useState(0);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isResetHolding, setIsResetHolding] = useState(false);
  const [resetHoldProgress, setResetHoldProgress] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyPopupType, setApiKeyPopupType] = useState<'EXPIRED' | 'MANUAL'>('MANUAL');
  const [showExitModal, setShowExitModal] = useState(false);

  // --- 5. Refs ---
  const resetHoldTimerRef = useRef<any>(null);
  const resetStartTimeRef = useRef<number | null>(null);
  const settingsBtnRef = useRef<HTMLDivElement>(null);
  const characterBoxRef = useRef<HTMLDivElement>(null);
  const resetBtnRef = useRef<HTMLButtonElement>(null);
  const startBtnRef = useRef<HTMLButtonElement>(null);

  // --- 6. Effects & Sync ---
  useEffect(() => {
    const isFirstTime = localStorage.getItem('pomodoro_onboarding_done') !== 'true';
    if (isFirstTime) setTimeout(() => setShowOnboarding(true), 1000);
  }, []);

  // --- 6-2. Back Button / History Handling ---
  useEffect(() => {
    // 히스토리에 가짜 상태 추가 (뒤로가기를 눌러도 URL이 유지되도록)
    window.history.pushState(null, "", window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      // 뒤로가기를 누르면 이 함수가 호출됨
      e.preventDefault();
      setShowExitModal(true);
      // 다시 상태를 밀어 넣어 한 번 더 방어막 생성
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    onUpdateProfile({
      savedTimeLeft: timeLeft, savedIsActive: isActive, savedIsBreak: isBreak,
      savedSessionInCycle: sessionInCycle, lastActive: Date.now(),
      cycleStats: { distractions, clicks }
    });
  }, [timeLeft, isActive, isBreak, sessionInCycle, distractions, clicks, onUpdateProfile]);

  // --- 7. Event Handlers ---
  const handleCharacterClick = () => {
    const wasBlocked = handleInteraction(isActive, isBreak);
    if (!wasBlocked && isActive && !isBreak) {
      setClicks(prev => prev + 1);
    }
  };

  const handleExportProfile = () => {
    const dataStr = JSON.stringify(profile, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `${profile.name}_backup.json`);
    linkElement.click();
    setIsSettingsOpen(false);
    setMessage("저장되었습니다.");
  };

  const handleResetStart = () => {
    setIsResetHolding(true);
    setResetHoldProgress(0);
    resetStartTimeRef.current = Date.now();
    resetHoldTimerRef.current = setTimeout(() => setMessage("처음부터 재시작됩니다."), 1000);
  };

  const handleResetEnd = () => {
    if (!isResetHolding) return;
    const duration = Date.now() - (resetStartTimeRef.current || 0);
    if (duration >= RESET_HOLD_MS) {
      resetTimer(true);
      setDistractions(0);
      setClicks(0);
      setMessage("마음을 새로 먹었나 보네? 처음부터 다시 시작하자.");
    } else {
      resetTimer(false);
      setMessage("응? 다시 하고 싶어? 좋아, 다시 집중해보자.");
    }
    setIsResetHolding(false);
    setResetHoldProgress(0);
  };

  useEffect(() => {
    let frame: any;
    if (isResetHolding) {
      const update = () => {
        const progress = Math.min(100, ((Date.now() - (resetStartTimeRef.current || 0)) / RESET_HOLD_MS) * 100);
        setResetHoldProgress(progress);
        if (progress < 100) frame = requestAnimationFrame(update);
        else handleResetEnd();
      };
      frame = requestAnimationFrame(update);
    }
    return () => cancelAnimationFrame(frame);
  }, [isResetHolding]);

  // --- 8. Computed Values ---
  const overallProgressPercent = calculateOverallProgress(sessionInCycle, isBreak, timeLeft);

  return (
    <div className={`relative w-full h-screen flex transition-colors duration-700 overflow-hidden font-sans select-none ${isDarkMode ? 'bg-[#0B0E14] text-slate-100' : 'bg-background text-text-primary'}`}>
      
      {showOnboarding && <OnboardingGuide isDarkMode={isDarkMode} targets={{ settings: settingsBtnRef, character: characterBoxRef, reset: resetBtnRef, start: startBtnRef }} onClose={(never) => { if(never) localStorage.setItem('pomodoro_onboarding_done', 'true'); setShowOnboarding(false); }} />}

      {profile.imageSrc && <div className={`absolute inset-0 z-0 transition-opacity duration-700 ${isDarkMode ? 'opacity-5' : 'opacity-10'}`}><img src={profile.imageSrc} alt="BG" className="w-full h-full object-cover blur-md scale-110" /></div>}

      <AdminAuthModal isOpen={showAdminAuth} onClose={() => setShowAdminAuth(false)} password={adminPassword} setPassword={setAdminPassword} onVerify={(e) => { e.preventDefault(); if(adminPassword==='PTSD'){ setIsAdminMode(true); setShowAdminPanel(true); setShowAdminAuth(false); setAdminPassword(''); setMessage("관리자 모드 활성화!"); } else { setAdminPassword(''); setShowAdminAuth(false); setMessage("비밀번호 틀림."); } }} />
      
      <AdminPanel isOpen={isAdminMode && showAdminPanel} onClose={() => setShowAdminPanel(false)} profile={profile} onTimeLeap={() => setTimeLeft(10)} onLevelChange={(lv) => onUpdateProfile({ level: lv, xp: 0 })} clicks={clicks} />

      {showReport && <ObservationDiary profile={profile} stats={{ distractions, clicks }} onClose={() => { setShowReport(false); setDistractions(0); setClicks(0); setShowChoiceModal(true); }} />}

      <CycleChoiceModal isOpen={showChoiceModal} isDarkMode={isDarkMode} onChoice={(opt) => { setShowChoiceModal(false); setSessionInCycle(0); setIsBreak(true); setIsActive(true); if(opt==='LONG'){ setTimeLeft(30*60); onTickXP(5); } else { setTimeLeft(5*60); onTickXP(25); } }} onExport={handleExportProfile} />

      <ApiKeyExpiryModal isOpen={isApiKeyModalOpen} onClose={() => setIsApiKeyModalOpen(false)} type={apiKeyPopupType} currentApiKey={profile.apiKey || ''} isDarkMode={isDarkMode} onUpdateKey={(key) => onUpdateProfile({ apiKey: key })} />

      <ExitConfirmModal isOpen={showExitModal} onClose={() => setShowExitModal(false)} onConfirmExit={onReset} characterName={profile.name} isDarkMode={isDarkMode} />

      {(isSettingsOpen || isApiKeyModalOpen || showExitModal) && <div className="fixed inset-0 z-[45]" onClick={() => { setIsSettingsOpen(false); setIsApiKeyModalOpen(false); setShowExitModal(false); }} />}

      <main className="w-full h-full flex flex-col items-center justify-center relative p-4 md:p-8">
          <TopBadge level={profile.level} title={levelTitle} isAdminMode={isAdminMode} isDarkMode={isDarkMode} onBadgeClick={() => { const nc = badgeClicks+1; setBadgeClicks(nc); if(nc>=5){ setBadgeClicks(0); setShowAdminAuth(true); } setTimeout(()=>setBadgeClicks(0),2000); }} badgeClicks={badgeClicks} />

          <div className={`w-full max-w-[450px] backdrop-blur-xl border p-6 md:p-8 rounded-[40px] shadow-[0_20px_50px_rgba(74,95,122,0.1)] flex flex-col items-center gap-6 md:gap-8 animate-in fade-in zoom-in duration-500 relative transition-colors duration-700 ${isDarkMode ? 'bg-[#161B22]/90 border-[#30363D]' : 'bg-surface/90 border-border'} ${isApiKeyModalOpen || isSettingsOpen ? 'overflow-visible z-40' : 'overflow-hidden'}`}>
            <div className={`absolute top-2.5 inset-x-8 h-1.5 z-10 ${isDarkMode ? 'bg-slate-700/20' : 'bg-border/20'} rounded-full overflow-hidden`}><div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out rounded-full" style={{ width: `${progressPercent}%` }} /></div>

            <div className="w-full flex justify-between items-start mt-2 px-2 relative z-50">
                <SettingsMenu isOpen={isSettingsOpen} setIsOpen={setIsSettingsOpen} isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} onExport={handleExportProfile} onApiKeyOpen={() => { setApiKeyPopupType('MANUAL'); setIsApiKeyModalOpen(true); setIsSettingsOpen(false); }} isAdminMode={isAdminMode} onShowAdminPanel={() => setShowAdminPanel(!showAdminPanel)} btnRef={settingsBtnRef} />
                <button onClick={() => setShowExitModal(true)} className={`p-2.5 rounded-full transition-all border border-transparent ${isDarkMode ? 'text-slate-400 hover:bg-rose-900/30' : 'text-text-secondary hover:bg-rose-50 hover:text-rose-500'}`}><X size={20} /></button>
            </div>

            <CharacterSection profile={profile} isBreak={isBreak} cooldownRemaining={cooldownRemaining} cooldownMs={COOLDOWN_MS} message={message} isApiKeyModalOpen={isApiKeyModalOpen} isDarkMode={isDarkMode} onCharacterClick={handleCharacterClick} characterBoxRef={characterBoxRef} />

            <div className="text-center space-y-1 -mt-10">
                <h2 className={`text-3xl md:text-4xl font-bold tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>{profile.name}</h2>
                <p className={`text-[10px] font-bold tracking-widest uppercase ${isDarkMode ? 'text-slate-400' : 'text-text-secondary'}`}>To. {profile.honorific || profile.userName}</p>
            </div>

            <div className="w-full flex flex-col items-center gap-6 mt-4 pb-4">
              <TimerDisplay isBreak={isBreak} isDarkMode={isDarkMode} timeLeft={timeLeft} formatTime={formatTime} />
              <CycleProgressBar overallProgressPercent={overallProgressPercent} isResetHolding={isResetHolding} resetHoldProgress={resetHoldProgress} isBreak={isBreak} sessionInCycle={sessionInCycle} isDarkMode={isDarkMode} />
              <ControlButtons isBreak={isBreak} isActive={isActive} onToggle={toggleActive} onSkipBreak={skipBreak} resetBtnRef={resetBtnRef} startBtnRef={startBtnRef} onResetStart={handleResetStart} onResetEnd={handleResetEnd} onResetCancel={() => { setIsResetHolding(false); setResetHoldProgress(0); if(resetHoldTimerRef.current) clearTimeout(resetHoldTimerRef.current); }} isResetHolding={isResetHolding} isDarkMode={isDarkMode} />
            </div>
          </div>
      </main>
    </div>
  );
};
