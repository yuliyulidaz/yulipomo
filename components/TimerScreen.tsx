
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { CharacterProfile, DiaryEntry } from '../types';
import { ObservationDiary } from './ObservationDiary';
import { OnboardingGuide } from './OnboardingGuide';
import { ApiKeyExpiryModal } from './ApiKeyExpiryModal';
import { ExitConfirmModal } from './ExitConfirmModal';
import { EnergySavingOverlay } from './EnergySavingOverlay';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { DiaryHistoryModal } from './DiaryHistoryModal';
import { ReleaseNotesModal, LATEST_VERSION } from './ReleaseNotesModal';

// 설정 및 유틸리티
import { formatTime, calculateOverallProgress } from './TimerUtils';
import { playSuccessSound, initAudioContext } from '../utils/soundEffects';

// 모달 및 UI 컴포넌트
import { AdminAuthModal, AdminPanel, CycleChoiceModal, AffinityGuideModal } from './TimerModals';
import { TopBadge, SettingsMenu, CharacterSection, TimerDisplay, CycleProgressBar, ControlButtons } from './TimerUI';

// 커스텀 훅
import { useTimerCore } from '../hooks/useTimerCore';
import { useAIManager } from '../hooks/useAIManager';
import { useXPManager } from '../hooks/useXPManager';
import { useMobileCare } from '../hooks/useMobileCare';
import { useVersionCheck } from '../hooks/useVersionCheck';

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

  const [isSoundEnabled, setIsSoundEnabled] = useState(profile.isSoundEnabled ?? false);
  const triggerAIResponseRef = useRef<(type: string) => void>(() => { });

  const playTimerSound = useCallback(() => {
    playSuccessSound(isSoundEnabled);
  }, [isSoundEnabled]);

  const {
    timeLeft, setTimeLeft, isActive, setIsActive, isBreak, setIsBreak,
    sessionInCycle, setSessionInCycle, showReport, setShowReport,
    toggleActive, skipBreak, resetTimer,
    shouldBlockRefill
  } = useTimerCore(
    profile,
    onTickXP,
    onSessionComplete,
    (type) => triggerAIResponseRef.current(type),
    onUpdateProfile,
    playTimerSound
  );

  const toggleSound = () => {
    const next = !isSoundEnabled;
    setIsSoundEnabled(next);
    onUpdateProfile({ isSoundEnabled: next });

    if (next) {
      initAudioContext(); // Enable audio context on explicit user action
      playSuccessSound(true);
      showToast("세션의 시작과 종료를 소리와 햅틱으로 알립니다.");
    } else {
      showToast("소리 꺼짐");
    }
  };

  const {
    message, cooldownRemaining,
    triggerAIResponse,
    triggerCooldown, handleInteraction, pendingExpiryAlert, setPendingExpiryAlert,
    isCongested, setIsCongested,
    COOLDOWN_MS,
    retryDelay,
    activeModel
  } = useAIManager(
    profile,
    onUpdateProfile,
    shouldBlockRefill
  );

  useEffect(() => {
    triggerAIResponseRef.current = triggerAIResponse;
  }, [triggerAIResponse]);

  const handlePhotoUpdate = (newImage: string) => {
    // 즉시 프로필에 저장하되, pendingImageSrc 필드에 저장하여 지속성 확보
    onUpdateProfile({ pendingImageSrc: newImage });
    showToast("최애의 사진이 저장되었습니다! 다음 세션 시작 시 공개됩니다 💖");
  };

  useEffect(() => {
    // 휴식 시간이 끝나고 새 세션이 시작될 때, 대기 중인 이미지가 있다면 적용
    if (!isBreak && profile.pendingImageSrc) {
      onUpdateProfile({
        imageSrc: profile.pendingImageSrc,
        pendingImageSrc: null // 적용 후 대기 이미지 초기화
      });
    }
  }, [isBreak, profile.pendingImageSrc]);

  const { progressPercent, levelTitle } = useXPManager(profile);
  const { isBatterySaving, setIsBatterySaving } = useMobileCare(isActive);
  const [toast, setToast] = useState<string>("");
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
  const [apiKeyPopupType, setApiKeyPopupType] = useState<'EXPIRED' | 'MANUAL' | 'CONGESTED'>('MANUAL');
  const [showExitModal, setShowExitModal] = useState(false);
  const [showAffinityGuide, setShowAffinityGuide] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [hasNewReleaseNotes, setHasNewReleaseNotes] = useState(false);
  const toastTimeoutRef = useRef<any>(null);
  const resetHoldTimerRef = useRef<any>(null);
  const resetStartTimeRef = useRef<number | null>(0);
  const settingsBtnRef = useRef<HTMLDivElement>(null);
  const characterBoxRef = useRef<HTMLDivElement>(null);
  const resetBtnRef = useRef<HTMLButtonElement>(null);
  const startBtnRef = useRef<HTMLButtonElement>(null);
  const affinityRef = useRef<HTMLDivElement>(null);
  const hasTriggeredInitialCooldown = useRef(false);

  const { hasUpdate, checkVersion } = useVersionCheck();

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(""), 3000);
  }, []);

  useEffect(() => {
    const lastRead = localStorage.getItem('pomodoro_last_read_version');
    if (lastRead !== LATEST_VERSION) {
      setHasNewReleaseNotes(true);
    }
  }, []);

  const handleOpenReleaseNotes = () => {
    setShowReleaseNotes(true);
    if (hasNewReleaseNotes) {
      setHasNewReleaseNotes(false);
      localStorage.setItem('pomodoro_last_read_version', LATEST_VERSION);
    }
    setIsSettingsOpen(false);
  };

  useEffect(() => {
    const isFirstTime = localStorage.getItem('pomodoro_onboarding_done') !== 'true';
    if (isFirstTime) setTimeout(() => setShowOnboarding(true), 1000);
  }, []);

  useEffect(() => {
    if (isBreak && pendingExpiryAlert && !isApiKeyModalOpen) {

      setApiKeyPopupType(isCongested ? 'CONGESTED' : 'EXPIRED');
      setIsApiKeyModalOpen(true);
    }
  }, [isBreak, pendingExpiryAlert, isApiKeyModalOpen, isCongested]);

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

  // Android 물리 뒤로가기 버튼 처리 (앱 종료 방지)
  useEffect(() => {
    // 1. 진입 시 히스토리 스택에 '#timer' 해시 추가 (강제 히스토리 생성)
    // 현재 URL에 이미 #timer가 없다면 추가
    if (window.location.hash !== '#timer') {
      window.history.pushState({ page: 'timer' }, "", window.location.pathname + "#timer");
    }

    const handlePopState = (e: PopStateEvent) => {
      // 2. 뒤로가기 감지
      // 안드로이드에서 popstate 직후 동기적 pushState가 무시되는 경우를 방지하기 위해 setTimeout 사용
      console.log('Popstate event detected. Preventing exit and re-trapping history.');
      e.preventDefault(); // Prevent default browser back action
      setTimeout(() => {
        // 모달 열기
        setShowExitModal(true);

        // 함정 재설치
        window.history.pushState({ page: 'timer' }, "", window.location.pathname + "#timer");
      }, 10);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // 언마운트 시 뒤로가기를 하면 자연스럽게 나갈 수 있도록 굳이 hash를 지우지 않음
      // 혹은 필요하다면 history.back()을 호출할 수도 있지만, SPA에서는 그대로 두는 편이 안전
    };
  }, []);

  useEffect(() => {
    onUpdateProfile({
      savedTimeLeft: timeLeft, savedIsActive: isActive, savedIsBreak: isBreak,
      savedSessionInCycle: sessionInCycle, lastActive: Date.now(),
      cycleStats: { distractions, clicks }
    });
  }, [timeLeft, isActive, isBreak, sessionInCycle, distractions, clicks, onUpdateProfile]);

  useEffect(() => {
    if (sessionInCycle !== 0 || isBreak) {
      hasTriggeredInitialCooldown.current = false;
    }
    if (isBreak) {
      checkVersion();
    }
  }, [sessionInCycle, isBreak, checkVersion]);

  useEffect(() => {
    if (hasUpdate) {
      showToast("새로운 업데이트가 있어요. 새로고침 해주세요.");
    }
  }, [hasUpdate]);

  const handleStartToggle = () => {
    initAudioContext(); // Enable audio context on explicit user action
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
    const timer = setTimeout(() => setAdminClicks(0), 2000);
    return () => clearTimeout(timer);
  };

  const handleExportProfile = () => {
    const now = new Date();
    const dateStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
    const timeStr = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0');
    const filename = `${profile.name}_${dateStr}_${timeStr}.json`;

    const { apiKey, ...profileWithoutKey } = profile;
    const dataStr = JSON.stringify(profileWithoutKey, null, 2);

    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', filename);
    linkElement.click();
    setIsSettingsOpen(false);
    showToast("저장되었습니다! 초기 화면으로 이동합니다.");

    // 파일 다운로드 트리거 후, 약간의 지연 시간을 두고 리셋 (다운로드 처리 보장)
    setTimeout(() => {
      onReset();
    }, 500);
  };

  const handleResetStart = () => {
    if (isResetHolding) return;
    setIsResetHolding(true);
    setResetHoldProgress(0);
    resetStartTimeRef.current = Date.now();
    resetHoldTimerRef.current = setTimeout(() => showToast("계속 누르면 가장 처음으로 초기화 됩니다."), 1000);
  };

  const handleResetEnd = () => {
    if (!isResetHolding) return;
    const duration = Date.now() - (resetStartTimeRef.current || 0);
    setIsResetHolding(false);
    setResetHoldProgress(0);
    if (resetHoldTimerRef.current) clearTimeout(resetHoldTimerRef.current);
    if (duration >= RESET_HOLD_MS) {
      resetTimer(true);
      setDistractions(0);
      setClicks(0);
      showToast("전체 세션을 새로 시작합니다.");
    } else if (duration < 300) {
      resetTimer(false);
      showToast("이번 세션만 새로 시작합니다.");
    }
  };

  const handleResetCancel = () => {
    if (!isResetHolding) return;
    setIsResetHolding(false);
    setResetHoldProgress(0);
    if (resetHoldTimerRef.current) clearTimeout(resetHoldTimerRef.current);
  };

  const handleSaveDiaryToHistory = useCallback((content: string, dateStr: string) => {
    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      date: dateStr,
      content: content,
      distractions: distractions,
      clicks: clicks,
      levelAtTime: profile.level
    };

    const updatedHistory = [newEntry, ...(profile.diaryHistory || [])].slice(0, 10);
    onUpdateProfile({ diaryHistory: updatedHistory });
  }, [distractions, clicks, profile.level, profile.diaryHistory, onUpdateProfile]);

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
    <div className={`relative w-full h-[100dvh] flex transition-colors duration-700 overflow-hidden font-sans select-none ${isDarkMode ? 'bg-[#0B0E14] text-slate-100' : 'bg-background text-text-primary'}`}>
      <EnergySavingOverlay isVisible={isBatterySaving} />

      {showOnboarding && <OnboardingGuide isDarkMode={isDarkMode} characterName={profile.name} targets={{ settings: settingsBtnRef, character: characterBoxRef, reset: resetBtnRef, start: startBtnRef, affinity: affinityRef }} onClose={(never) => { if (never) localStorage.setItem('pomodoro_onboarding_done', 'true'); setShowOnboarding(false); }} />}
      {profile.imageSrc && <div className={`absolute inset-0 z-0 transition-opacity duration-700 ${isDarkMode ? 'opacity-5' : 'opacity-10'}`}><img src={profile.imageSrc} alt="BG" className="w-full h-full object-cover blur-md scale-110" /></div>}

      <AdminAuthModal isOpen={showAdminAuth} onClose={() => setShowAdminAuth(false)} password={adminPassword} setPassword={setAdminPassword} onVerify={(e) => { e.preventDefault(); if (btoa(adminPassword) === 'UFRTRA==') { setIsAdminMode(true); setShowAdminPanel(true); setShowAdminAuth(false); setAdminPassword(''); showToast("관리자 모드 활성화!"); } else { setAdminPassword(''); setShowAdminAuth(false); showToast("비밀번호 틀림."); } }} />

      <AdminPanel
        isOpen={isAdminMode && showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
        profile={profile}
        onTimeLeap={() => setTimeLeft(10)}
        onLevelChange={(lv) => onUpdateProfile({ level: lv, xp: 0 })}
        clicks={clicks}
        distractions={distractions}
        activeModel={activeModel}
        isApiKeyAlert={pendingExpiryAlert}
        onToggleApiKeyAlert={() => {
          setIsCongested(false);
          setPendingExpiryAlert(!pendingExpiryAlert);
        }}
        isCongested={isCongested}
        onToggleCongested={() => {
          setIsCongested(!isCongested);
          setPendingExpiryAlert(!isCongested);
        }}
        retryDelay={retryDelay}
      />

      {showReport && <ObservationDiary profile={profile} stats={{ distractions, clicks }} onSave={handleSaveDiaryToHistory} onClose={() => { setShowReport(false); setDistractions(0); setClicks(0); setShowChoiceModal(true); }} />}
      {showHistoryModal && <DiaryHistoryModal profile={profile} isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} />}

      <CycleChoiceModal isOpen={showChoiceModal} isDarkMode={isDarkMode} completedCycles={profile.totalCompletedCycles || 0} onChoice={(opt) => { setShowChoiceModal(false); setSessionInCycle(0); setIsBreak(true); setIsActive(true); if (opt === 'LONG') { setTimeLeft(30 * 60); onTickXP(5); } else { setTimeLeft(5 * 60); onTickXP(25); } }} onExport={handleExportProfile} />
      <ApiKeyExpiryModal isOpen={isApiKeyModalOpen} onClose={() => { setIsApiKeyModalOpen(false); setPendingExpiryAlert(false); }} type={apiKeyPopupType} currentApiKey={profile.apiKey || ''} isDarkMode={isDarkMode} onUpdateKey={(key) => onUpdateProfile({ apiKey: key })} />
      <ExitConfirmModal isOpen={showExitModal} onClose={() => setShowExitModal(false)} onConfirmExit={onReset} characterName={profile.name} isDarkMode={isDarkMode} />
      <AffinityGuideModal isOpen={showAffinityGuide} onClose={() => setShowAffinityGuide(false)} currentLevel={profile.level} isDarkMode={isDarkMode} characterName={profile.name} />
      <PrivacyPolicyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} isDarkMode={isDarkMode} />
      <ReleaseNotesModal isOpen={showReleaseNotes} onClose={() => setShowReleaseNotes(false)} isDarkMode={isDarkMode} />
      {(isApiKeyModalOpen || showExitModal || showAffinityGuide || isPrivacyModalOpen || showHistoryModal || showReleaseNotes) && <div className="fixed inset-0 z-[45] bg-transparent" onClick={() => { setIsApiKeyModalOpen(false); setShowExitModal(false); setShowAffinityGuide(false); setIsPrivacyModalOpen(false); setShowHistoryModal(false); setShowReleaseNotes(false); }} />}

      <main className="w-full h-full flex flex-col items-center justify-center relative p-4 md:p-8">
        <TopBadge ref={affinityRef} level={profile.level} title={levelTitle} isAdminMode={isAdminMode} isDarkMode={isDarkMode} onBadgeClick={() => setShowAffinityGuide(true)} />
        <div className={`w-full max-w-[450px] backdrop-blur-xl border p-6 md:p-8 rounded-[40px] shadow-[0_20px_50px_rgba(74,95,122,0.1)] flex flex-col items-center gap-6 md:gap-8 animate-in fade-in zoom-in duration-500 relative transition-colors duration-700 ${isDarkMode ? 'bg-[#161B22]/90 border-[#30363D]' : 'bg-surface/90 border-border'} ${isApiKeyModalOpen || isSettingsOpen ? 'overflow-visible z-50' : 'overflow-hidden'}`}>
          {isSettingsOpen && <div className="fixed inset-0 z-40 bg-black/[0.02] backdrop-blur-[1.2px] cursor-default animate-in fade-in duration-300" onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(false); }} />}
          <div className={`absolute top-2.5 inset-x-8 h-1.5 z-10 ${isDarkMode ? 'bg-slate-700/20' : 'bg-border/20'} rounded-full overflow-hidden`}><div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out rounded-full" style={{ width: `${progressPercent}%` }} /></div>
          <div className="w-full flex justify-between items-start mt-2 px-2 relative z-50">
            <SettingsMenu
              isOpen={isSettingsOpen}
              setIsOpen={setIsSettingsOpen}
              isDarkMode={isDarkMode}
              onToggleDarkMode={() => { const next = !isDarkMode; setIsDarkMode(next); showToast(next ? "다크모드" : "라이트모드"); }}
              isBatterySaving={isBatterySaving}
              onToggleBatterySaving={() => { const next = !isBatterySaving; setIsBatterySaving(next); showToast(next ? "절전모드 ON" : "절전모드 OFF"); }}
              isSoundEnabled={isSoundEnabled}
              onToggleSound={toggleSound}
              onExport={handleExportProfile}
              onApiKeyOpen={() => { setApiKeyPopupType('MANUAL'); setIsApiKeyModalOpen(true); setIsSettingsOpen(false); }}
              onHistoryOpen={() => {
                if (profile.diaryHistory.length > 0) {
                  setShowHistoryModal(true);
                  setIsSettingsOpen(false);
                } else {
                  showToast("아직 작성된 일기가 없습니다. 100분을 채워 최애의 일기를 받아 보세요.");
                }
              }}
              onShowGuide={() => { setShowOnboarding(true); setIsSettingsOpen(false); }}
              isAdminMode={isAdminMode}
              onShowAdminPanel={() => setShowAdminPanel(!showAdminPanel)}
              btnRef={settingsBtnRef}
              isApiKeyAlert={pendingExpiryAlert}
              isBreak={isBreak}
              hasHistory={profile.diaryHistory.length > 0}
              onPrivacyOpen={() => { setIsPrivacyModalOpen(true); setIsSettingsOpen(false); }}
              onShowReleaseNotes={handleOpenReleaseNotes}
              hasNewReleaseNotes={hasNewReleaseNotes}
            />
            <button onClick={() => setShowExitModal(true)} className={`p-2.5 rounded-full transition-all border border-transparent ${isDarkMode ? 'text-slate-400 hover:bg-white/10' : 'text-text-secondary hover:bg-slate-100'}`}><X size={20} /></button>
          </div>
          <CharacterSection
            profile={profile}
            isBreak={isBreak}
            cooldownRemaining={cooldownRemaining}
            cooldownMs={COOLDOWN_MS}
            message={message}
            isApiKeyModalOpen={isApiKeyModalOpen}
            isDarkMode={isDarkMode}
            onCharacterClick={handleCharacterClick}
            characterBoxRef={characterBoxRef}
            onPhotoUpdate={handlePhotoUpdate}
          />
          <div className="text-center space-y-1 -mt-10">
            <h2 className={`text-3xl md:text-4xl font-bold tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>{profile.name}</h2>
            <p className={`text-[10px] font-bold tracking-widest uppercase ${isDarkMode ? 'text-slate-400' : 'text-text-secondary'}`}>To. {profile.honorific || profile.userName}</p>
          </div>
          <div className="w-full flex flex-col items-center gap-6 mt-4 pb-4 relative">
            {toast && (
              <div className={`absolute -top-10 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 text-[11px] font-black rounded-full shadow-2xl animate-in fade-in slide-in-from-top-2 duration-500 backdrop-blur-md border transition-colors duration-500 whitespace-nowrap ${isDarkMode ? 'bg-slate-100/95 text-slate-900 border-black/5' : 'bg-slate-800/90 text-white border-white/10'}`}>
                {toast}
              </div>
            )}
            <TimerDisplay isBreak={isBreak} isDarkMode={isDarkMode} timeLeft={timeLeft} formatTime={formatTime} onModeClick={handleModeIconClick} />
            <CycleProgressBar overallProgressPercent={overallProgressPercent} isResetHolding={isResetHolding} resetHoldProgress={resetHoldProgress} isBreak={isBreak} sessionInCycle={sessionInCycle} isDarkMode={isDarkMode} />
            <ControlButtons isBreak={isBreak} isActive={isActive} onToggle={handleStartToggle} onSkipBreak={skipBreak} resetBtnRef={resetBtnRef} startBtnRef={startBtnRef} onResetStart={handleResetStart} onResetEnd={handleResetEnd} onResetCancel={handleResetCancel} isResetHolding={isResetHolding} isDarkMode={isDarkMode} />
          </div>
        </div>
      </main>
    </div>
  );
};
