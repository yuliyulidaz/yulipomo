
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 휴대폰 사용자를 위한 케어 훅
 * 빌드 에러 방지를 위해 인라인 타입 정의를 제거했습니다.
 * 화면 꺼짐 방지(Wake Lock) 기능만 수행합니다.
 */
export function useMobileCare(isActive) {
  const [isBatterySaving, setIsBatterySaving] = useState(false);
  const wakeLockRef = useRef(null);

  // 화면 켜짐 유지 (Wake Lock API)
  const requestWakeLock = useCallback(async () => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch (err) {
        // Ignored
      }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch (err) {
        // Ignored
      }
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    
    const handleVisibilityChange = () => {
      if (isActive && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [isActive, requestWakeLock, releaseWakeLock]);

  return {
    isBatterySaving,
    setIsBatterySaving
  };
}
