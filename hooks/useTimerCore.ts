import { useState, useEffect, useCallback, useRef } from 'react';
import { CharacterProfile } from '../types';

export const useTimerCore = (
  profile: CharacterProfile,
  onTickXP: (amount: number) => void,
  onSessionComplete: (wasSuccess: boolean) => void,
  triggerAIResponse: (type: string) => void,
  onUpdateProfile: (updates: Partial<CharacterProfile>) => void,
  onTimerEnd?: () => void
) => {
  const [timeLeft, setTimeLeft] = useState(profile.savedTimeLeft ?? 25 * 60);
  // 새로고침 시 유저의 여유를 위해 항상 정지(false) 상태로 시작하도록 고정
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(profile.savedIsBreak ?? false);
  const [sessionInCycle, setSessionInCycle] = useState(profile.savedSessionInCycle ?? 0);
  const [showReport, setShowReport] = useState(false);


  const onTickXPRef = useRef(onTickXP);
  const handleTimerFinishRef = useRef<() => void>(() => { });
  const onTimerEndRef = useRef(onTimerEnd);

  // 최신 함수를 항상 Ref에 업데이트 (렌더링 주소값은 고정됨)
  useEffect(() => {
    onTickXPRef.current = onTickXP;
    onTimerEndRef.current = onTimerEnd;
  });

  const handleTimerFinish = useCallback(() => {
    if (!isBreak) {
      onSessionComplete(true);
      onTimerEndRef.current?.(); // Ref를 통해 항상 최신 버전 실행
      const nextSessionCount = sessionInCycle + 1;
      setSessionInCycle(nextSessionCount);
      if (nextSessionCount === 4) {
        setIsActive(false);
        // 누적 사이클 횟수 증가
        onUpdateProfile({ totalCompletedCycles: (profile.totalCompletedCycles || 0) + 1 });
        setShowReport(true);
      } else {
        setIsBreak(true);
        setTimeLeft(5 * 60);
      }
    } else {
      setIsBreak(false);
      setTimeLeft(25 * 60);
      onTimerEndRef.current?.(); // Ref를 통해 항상 최신 버전 실행
      if (sessionInCycle > 0) {
        setIsActive(true);
        triggerAIResponse('START');
      } else {
        setIsActive(false);
      }
    }
  }, [isBreak, sessionInCycle, onSessionComplete, triggerAIResponse, profile.totalCompletedCycles, onUpdateProfile]);

  // 최신 handleTimerFinish를 Ref에 동기화
  useEffect(() => {
    handleTimerFinishRef.current = handleTimerFinish;
  }, [handleTimerFinish]);

  // 🛡️ [심장부] 타이머 로직 - 이제 외부 함수 변화에 영향을 받지 않습니다.
  useEffect(() => {
    let interval: any = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          const nextTime = time - 1;
          // 1분마다 XP 획득 (Ref 사용으로 타이머 리셋 방지)
          if (!isBreak && nextTime > 0 && nextTime % 60 === 0) {
            onTickXPRef.current(1);
          }
          return nextTime;
        });
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // 타이머 종료 처리 (Ref 사용으로 안전하게 호출)
      handleTimerFinishRef.current();
    }

    return () => {
      if (interval) clearInterval(interval);
    };

  }, [isActive, isBreak, timeLeft === 0]);

  const toggleActive = useCallback(() => {
    if (!isBreak) {
      if (!isActive) triggerAIResponse('START');
      else triggerAIResponse('PAUSE');
    }
    setIsActive(!isActive);
  }, [isActive, isBreak, triggerAIResponse]);

  const skipBreak = useCallback(() => {
    setIsBreak(false);
    setTimeLeft(25 * 60);
    setIsActive(true);
    triggerAIResponse('START');
  }, [triggerAIResponse]);

  const resetTimer = useCallback((forceFullReset: boolean = false) => {
    if (forceFullReset) {
      setSessionInCycle(0);
      setIsBreak(false);
      setTimeLeft(25 * 60);
      setIsActive(false);
    } else {
      setIsActive(false);
      setTimeLeft(isBreak ? (sessionInCycle === 0 ? 30 * 60 : 5 * 60) : 25 * 60);
    }
  }, [isBreak, sessionInCycle]);

  const shouldBlockRefill = sessionInCycle === 3 && !isBreak && timeLeft <= 120;

  return {
    timeLeft, setTimeLeft,
    isActive, setIsActive,
    isBreak, setIsBreak,
    sessionInCycle, setSessionInCycle,
    showReport, setShowReport,
    toggleActive,
    skipBreak,
    resetTimer,
    shouldBlockRefill
  };
};
