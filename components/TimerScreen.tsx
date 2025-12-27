
import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { CharacterProfile } from '../types';
import { ObservationDiary } from './ObservationDiary';
import { OnboardingGuide } from './OnboardingGuide';
import { ApiKeyExpiryModal } from './ApiKeyExpiryModal';
import { ExitConfirmModal } from './ExitConfirmModal';
import { EnergySavingOverlay } from './EnergySavingOverlay';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';

// 설정 및 유틸리티
import { LEVEL_TITLES } from './TimerConfig';
import { formatTime, calculateOverallProgress, cleanDialogue } from './TimerUtils';

// 모달 및 UI 컴포넌트
import { AdminAuthModal, AdminPanel, CycleChoiceModal, AffinityGuideModal } from './TimerModals';
import { TopBadge, SettingsMenu, CharacterSection, TimerDisplay, CycleProgressBar, ControlButtons } from './TimerUI';

// 커스텀 훅
import { useTimerCore } from '../hooks/useTimerCore';
import { useAIManager } from '../hooks/useAIManager';
import { useXPManager } from '../hooks/useXPManager';
import { useMobileCare } from '../hooks/useMobileCare';

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
    triggerAIResponse, triggerCooldown, handleInteraction, pendingExpiryAlert, setPendingExpiryAlert, COOLDOWN_MS
  } = useAIManager(profile, onUpdateProfile);

  // --- 2. Core Timer Logic ---
  const {
    timeLeft, setTimeLeft, isActive, setIsActive, isBreak, setIsBreak,
    sessionInCycle, setSessionInCycle, showReport, setShowReport,
    toggleActive, skipBreak, resetTimer
  } = useTimerCore(profile, onTickXP, onSessionComplete, triggerAIResponse, onUpdateProfile);

  // --- 3. XP & Leveling Logic ---
  const { progressPercent, levelTitle } = useXPManager(profile);

  // --- 4. Mobile Care Logic ---
  const { isBatterySaving, setIsBatterySaving } = useMobileCare(isActive);

  // --- 5. Local UI State ---
  const [distractions, setDistractions] = useState(profile.cycleStats?.distractions ?? 0);
  const [clicks, setClicks] = useState(profile.cycleStats?.clicks ?? 0);
  const [adminClicks, setAdminClicks] = useState(0);
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
  const [showAffinityGuide, setShowAffinityGuide] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // --- 6. Refs ---
  const resetHoldTimerRef = useRef<any>(null);
  const resetStartTimeRef = useRef<number | null>(0);
  const settingsBtnRef = useRef<HTMLDivElement>(null);
  const characterBoxRef = useRef<HTMLDivElement>(null);
  const resetBtnRef = useRef<HTMLButtonElement>(null);
  const startBtnRef = useRef<HTMLButtonElement>(null);
  const affinityRef = useRef<HTMLDivElement>(null);
  const hasTriggeredInitialCooldown = useRef(false);

  // --- 7. Effects & Sync ---
  useEffect(() => {
    const isFirstTime = localStorage.getItem('pomodoro_onboarding_done') !== 'true';
    if (isFirstTime) setTimeout(() => setShowOnboarding(true), 1000);
  }, []);

  useEffect(() => {
    if (isBreak && pendingExpiryAlert && !isApiKeyModalOpen) {
      setApiKeyPopupType('EXPIRED');
      setIsApiKeyModalOpen(true);
    }
  }, [isBreak, pendingExpiryAlert, isApiKeyModalOpen]);

  // 브라우저 탭 전환(이탈) 감지 로직
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isActive && !isBreak) {
        triggerAIResponse('SCOLDING');
        setDistractions(prev => prev + 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isActive, isBreak, triggerAIResponse]);

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      setShowExitModal(true);
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

  // 세션이 바뀌거나 리셋되면 오프닝 트리거 초기화
  useEffect(() => {
    if (sessionInCycle !== 0 || isBreak) {
      hasTriggeredInitialCooldown.current = false;
    }
  }, [sessionInCycle, isBreak]);

  // --- 8. Event Handlers ---
  const handleStartToggle = () => {
    if (!isActive && !isBreak && sessionInCycle === 0 && !hasTriggeredInitialCooldown.current) {
      triggerCooldown();
      hasTriggeredInitialCooldown.current = true;
    }
    toggleActive();
  };

  const handleCharacterClick = () => {
    const wasBlocked = handleInteraction(isActive, isBreak);
    if (!wasBlocked && isActive && !isBreak) {
      setClicks(prev => prev + 1);
    }
  };

  const handleModeIconClick = () => {
    const newCount = adminClicks + 1;
    setAdminClicks(newCount);
    if (newCount >= 5) {
      setAdminClicks(0);
      setShowAdminAuth(true);
    }
    // 2초 내에 연타하지 않으면 카운트 초기화
    const timer = setTimeout(() => setAdminClicks(0), 2000);
    return () => clearTimeout(timer);
  };

  const handleExportProfile = () => {
    const now = new Date();
    const dateStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
    const timeStr = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0');
    const filename = `${profile.name}_${dateStr}_${timeStr}.json`;
    
    // 보안을 위해 API 키 제외 처리
    const { apiKey, ...profileWithoutKey } = profile;
    const dataStr = JSON.stringify(profileWithoutKey, null, 2);
    
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', filename);
    linkElement.click();
    setIsSettingsOpen(false);
    
        const warningMsg = "API는 저장되지 않습니다. 나중에 다시 불러올 때 키를 입력해 주세요.";
    setMessage(warningMsg);
    setTimeout(() => { setMessage(current => current === warningMsg ? "" : current); }, 5000);
  };

  const handleResetStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isResetHolding) return;
    setIsResetHolding(true);
    setResetHoldProgress(0);
    resetStartTimeRef.current = Date.now();
    resetHoldTimerRef.current = setTimeout(() => setMessage("처음부터 재시작됩니다."), 1000);
  };

  const handleResetEnd = (e?: React.MouseEvent | React.TouchEvent) => {
    if (!isResetHolding) return;
    const duration = Date.now() - (resetStartTimeRef.current || 0);
    setIsResetHolding(false);
    setResetHoldProgress(0);
    if (resetHoldTimerRef.current) clearTimeout(resetHoldTimerRef.current);
    if (duration >= RESET_HOLD_MS) {
      resetTimer(true);
      setDistractions(0);
      setClicks(0);
      setMessage("마음을 새로 먹었나 보네? 처음부터 다시 시작하자.");
    } else if (duration < 300) {
      resetTimer(false);
      setMessage("응? 다시 하고 싶어? 좋아, 다시 집중해보자.");
    } else {
      setMessage(""); 
    }
  };

  const handleResetCancel = () => {
    if (!isResetHolding) return;
    setIsResetHolding(false);
    setResetHoldProgress(0);
    if (resetHoldTimerRef.current) clearTimeout(resetHoldTimerRef.current);
    setMessage(""); 
  };

  useEffect(() => {
    let frame: any;
    if (isResetHolding) {
      const update = () => {
        const now = Date.now();
        const duration = now - (resetStartTimeRef.current || now);
        const progress = Math.min(100, (duration / RESET_HOLD_MS) * 100);
        setResetHoldProgress(progress);
        if (progress < 100) frame = requestAnimationFrame(update);
        else handleResetEnd();
      };
      frame = requestAnimationFrame(update);
    }
    return () => cancelAnimationFrame(frame);
  }, [isResetHolding]);

  const overallProgressPercent = calculateOverallProgress(sessionInCycle, isBreak, timeLeft);

  return (
    <div className={`relative w-full h-screen flex transition-colors duration-700 overflow-hidden font-sans select-none ${isDarkMode ? 'bg-[#0B0E14] text-slate-100' : 'bg-background text-text-primary'}`}>
      <EnergySavingOverlay isVisible={isBatterySaving} />
      {showOnboarding && <OnboardingGuide isDarkMode={isDarkMode} characterName={profile.name} targets={{ settings: settingsBtnRef, character: characterBoxRef, reset: resetBtnRef, start: startBtnRef, affinity: affinityRef }} onClose={(never) => { if(never) localStorage.setItem('pomodoro_onboarding_done', 'true'); setShowOnboarding(false); }} />}
      {profile.imageSrc && <div className={`absolute inset-0 z-0 transition-opacity duration-700 ${isDarkMode ? 'opacity-5' : 'opacity-10'}`}><img src={profile.imageSrc} alt="BG" className="w-full h-full object-cover blur-md scale-110" /></div>}
      <AdminAuthModal isOpen={showAdminAuth} onClose={() => setShowAdminAuth(false)} password={adminPassword} setPassword={setAdminPassword} onVerify={(e) => { e.preventDefault(); if(adminPassword==='PTSD'){ setIsAdminMode(true); setShowAdminPanel(true); setShowAdminAuth(false); setAdminPassword(''); setMessage("관리자 모드 활성화!"); } else { setAdminPassword(''); setShowAdminAuth(false); setMessage("비밀번호 틀림."); } }} />
      <AdminPanel isOpen={isAdminMode && showAdminPanel} onClose={() => setShowAdminPanel(false)} profile={profile} onTimeLeap={() => setTimeLeft(10)} onLevelChange={(lv) => onUpdateProfile({ level: lv, xp: 0 })} clicks={clicks} isApiKeyAlert={pendingExpiryAlert} onToggleApiKeyAlert={() => setPendingExpiryAlert(!pendingExpiryAlert)} />
      {showReport && <ObservationDiary profile={profile} stats={{ distractions, clicks }} onClose={() => { setShowReport(false); setDistractions(0); setClicks(0); setShowChoiceModal(true); }} />}
      <CycleChoiceModal isOpen={showChoiceModal} isDarkMode={isDarkMode} completedCycles={profile.totalCompletedCycles || 0} onChoice={(opt) => { setShowChoiceModal(false); setSessionInCycle(0); setIsBreak(true); setIsActive(true); if(opt==='LONG'){ setTimeLeft(30*60); onTickXP(5); } else { setTimeLeft(5*60); onTickXP(25); } }} onExport={handleExportProfile} />
      <ApiKeyExpiryModal isOpen={isApiKeyModalOpen} onClose={() => { setIsApiKeyModalOpen(false); setPendingExpiryAlert(false); }} type={apiKeyPopupType} currentApiKey={profile.apiKey || ''} isDarkMode={isDarkMode} onUpdateKey={(key) => onUpdateProfile({ apiKey: key })} />
      <ExitConfirmModal isOpen={showExitModal} onClose={() => setShowExitModal(false)} onConfirmExit={onReset} characterName={profile.name} isDarkMode={isDarkMode} />
      <AffinityGuideModal isOpen={showAffinityGuide} onClose={() => setShowAffinityGuide(false)} currentLevel={profile.level} isDarkMode={isDarkMode} characterName={profile.name} />
      <PrivacyPolicyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} isDarkMode={isDarkMode} />
      {(isApiKeyModalOpen || showExitModal || showAffinityGuide || isPrivacyModalOpen) && <div className="fixed inset-0 z-[45] bg-transparent" onClick={() => { setIsApiKeyModalOpen(false); setShowExitModal(false); setShowAffinityGuide(false); setIsPrivacyModalOpen(false); }} />}

      <main className="w-full h-full flex flex-col items-center justify-center relative p-4 md:p-8">
          <TopBadge ref={affinityRef} level={profile.level} title={levelTitle} isAdminMode={isAdminMode} isDarkMode={isDarkMode} onBadgeClick={() => setShowAffinityGuide(true)} />
          <div className={`w-full max-w-[450px] backdrop-blur-xl border p-6 md:p-8 rounded-[40px] shadow-[0_20px_50px_rgba(74,95,122,0.1)] flex flex-col items-center gap-6 md:gap-8 animate-in fade-in zoom-in duration-500 relative transition-colors duration-700 ${isDarkMode ? 'bg-[#161B22]/90 border-[#30363D]' : 'bg-surface/90 border-border'} ${isApiKeyModalOpen || isSettingsOpen ? 'overflow-visible z-50' : 'overflow-hidden'}`}>
            {isSettingsOpen && <div className="fixed inset-0 z-40 bg-black/[0.02] backdrop-blur-[1.2px] cursor-default animate-in fade-in duration-300" onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(false); }} />}
            <div className={`absolute top-2.5 inset-x-8 h-1.5 z-10 ${isDarkMode ? 'bg-slate-700/20' : 'bg-border/20'} rounded-full overflow-hidden`}><div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out rounded-full" style={{ width: `${progressPercent}%` }} /></div>
            <div className="w-full flex justify-between items-start mt-2 px-2 relative z-50">
                <SettingsMenu isOpen={isSettingsOpen} setIsOpen={setIsSettingsOpen} isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} isBatterySaving={isBatterySaving} onToggleBatterySaving={() => setIsBatterySaving(!isBatterySaving)} onExport={handleExportProfile} onApiKeyOpen={() => { setApiKeyPopupType('MANUAL'); setIsApiKeyModalOpen(true); setIsSettingsOpen(false); }} onShowGuide={() => { setShowOnboarding(true); setIsSettingsOpen(false); }} isAdminMode={isAdminMode} onShowAdminPanel={() => setShowAdminPanel(!showAdminPanel)} btnRef={settingsBtnRef} isApiKeyAlert={pendingExpiryAlert} isBreak={isBreak} onPrivacyOpen={() => { setIsPrivacyModalOpen(true); setIsSettingsOpen(false); }} />
                <button onClick={() => setShowExitModal(true)} className={`p-2.5 rounded-full transition-all border border-transparent ${isDarkMode ? 'text-slate-400 hover:bg-white/10' : 'text-text-secondary hover:bg-slate-100'}`}><X size={20} /></button>
            </div>
            <CharacterSection profile={profile} isBreak={isBreak} cooldownRemaining={cooldownRemaining} cooldownMs={COOLDOWN_MS} message={message} isApiKeyModalOpen={isApiKeyModalOpen} isDarkMode={isDarkMode} onCharacterClick={handleCharacterClick} characterBoxRef={characterBoxRef} />
            <div className="text-center space-y-1 -mt-10">
                <h2 className={`text-3xl md:text-4xl font-bold tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>{profile.name}</h2>
                <p className={`text-[10px] font-bold tracking-widest uppercase ${isDarkMode ? 'text-slate-400' : 'text-text-secondary'}`}>To. {profile.honorific || profile.userName}</p>
            </div>
            <div className="w-full flex flex-col items-center gap-6 mt-4 pb-4">
              <TimerDisplay isBreak={isBreak} isDarkMode={isDarkMode} timeLeft={timeLeft} formatTime={formatTime} onModeClick={handleModeIconClick} />
              <CycleProgressBar overallProgressPercent={overallProgressPercent} isResetHolding={isResetHolding} resetHoldProgress={resetHoldProgress} isBreak={isBreak} sessionInCycle={sessionInCycle} isDarkMode={isDarkMode} />
              <ControlButtons isBreak={isBreak} isActive={isActive} onToggle={handleStartToggle} onSkipBreak={skipBreak} resetBtnRef={resetBtnRef} startBtnRef={startBtnRef} onResetStart={handleResetStart} onResetEnd={handleResetEnd} onResetCancel={handleResetCancel} isResetHolding={isResetHolding} isDarkMode={isDarkMode} />
            </div>
          </div>
      </main>
    </div>
  );
};
