
import { useState, useEffect, useCallback } from 'react';
import { CharacterProfile } from '../types';

export const useTimerCore = (
  profile: CharacterProfile,
  onTickXP: (amount: number) => void,
  onSessionComplete: (wasSuccess: boolean) => void,
  triggerAIResponse: (type: string) => void
) => {
  const [timeLeft, setTimeLeft] = useState(profile.savedTimeLeft ?? 25 * 60);
  // 새로고침 시 유저의 여유를 위해 항상 정지(false) 상태로 시작하도록 고정
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(profile.savedIsBreak ?? false);
  const [sessionInCycle, setSessionInCycle] = useState(profile.savedSessionInCycle ?? 0);
  const [showReport, setShowReport] = useState(false);

  const handleTimerFinish = useCallback(() => {
    if (!isBreak) {
      onSessionComplete(true);
      const nextSessionCount = sessionInCycle + 1;
      setSessionInCycle(nextSessionCount);
      if (nextSessionCount === 4) {
        setIsActive(false);
        setShowReport(true);
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
  }, [isBreak, sessionInCycle, onSessionComplete, triggerAIResponse]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          const nextTime = time - 1;
          if (!isBreak && nextTime % 60 === 0) onTickXP(1);
          return nextTime;
        });
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleTimerFinish();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isBreak, onTickXP, handleTimerFinish]);

  const toggleActive = useCallback(() => {
    // 휴식 시간 중에는 수동으로 시작/정지를 눌러도 대사가 발생하지 않음
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

  return {
    timeLeft, setTimeLeft,
    isActive, setIsActive,
    isBreak, setIsBreak,
    sessionInCycle, setSessionInCycle,
    showReport, setShowReport,
    toggleActive,
    skipBreak,
    resetTimer
  };
};
