import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';

interface OnboardingGuideProps {
  isDarkMode: boolean;
  characterName: string;
  targets: {
    settings: React.RefObject<HTMLElement | null>;
    character: React.RefObject<HTMLElement | null>;
    reset: React.RefObject<HTMLElement | null>;
    start: React.RefObject<HTMLElement | null>;
    affinity: React.RefObject<HTMLElement | null>;
  };
  onClose: (neverShowAgain: boolean) => void;
}

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ isDarkMode, characterName, targets, onClose }) => {
  const [step, setStep] = useState(1);
  const [spotlight, setSpotlight] = useState<{ 
    cx: number; cy: number; r: number; visible: boolean; 
    extra?: { cx: number; cy: number; r: number } 
  }>({ cx: 0, cy: 0, r: 0, visible: false });

  const updateSpotlight = useMemo(() => () => {
    let target: HTMLElement | null = null;
    let radius = 40;
    let extraSpotlight: { cx: number; cy: number; r: number } | undefined = undefined;

    if (step === 1) target = targets.settings.current;
    if (step === 2) { 
      target = targets.character.current; 
      radius = 100;
      // 2단계에서 상단 호감도 표시 배지도 함께 강조
      if (targets.affinity.current) {
        const rect = targets.affinity.current.getBoundingClientRect();
        extraSpotlight = {
          cx: rect.left + rect.width / 2,
          cy: rect.top + rect.height / 2,
          r: Math.max(rect.width, rect.height) / 2 + 10
        };
      }
    }
    if (step === 3) { 
      setSpotlight({ 
        cx: window.innerWidth / 2, 
        cy: window.innerHeight / 2, 
        r: 0, 
        visible: true 
      });
      return;
    }
    if (step === 4) { target = targets.reset.current; radius = 40; }
    if (step === 5) { target = targets.start.current; radius = 50; }

    if (!target) {
      setSpotlight({ cx: 0, cy: 0, r: 0, visible: false });
      return;
    }

    const rect = target.getBoundingClientRect();
    setSpotlight({
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2,
      r: Math.max(rect.width, rect.height) / 2 + 10,
      visible: true,
      extra: extraSpotlight
    });
  }, [step, targets]);

  useEffect(() => {
    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    return () => window.removeEventListener('resize', updateSpotlight);
  }, [updateSpotlight]);

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
    else onClose(false);
  };

  const getGuidePosition = () => {
    if (step === 3) {
      return {
        top: (window.innerHeight - 220) / 2,
        left: (window.innerWidth - 280) / 2
      };
    }

    const isBottomHalf = spotlight.cy > window.innerHeight / 2;
    
    // 기본 오프셋 설정
    let verticalOffset = isBottomHalf ? -160 : 20;

    // 사용자 요청에 따른 특정 스텝 높이 추가 조정
    if (step === 4) verticalOffset = -220; // 4번은 많이 위로
    if (step === 5) verticalOffset = -190; // 5번은 너무 멀지 않게 위치 조정

    const leftPos = Math.max(20, Math.min(window.innerWidth - 300, spotlight.cx - 140));
    
    return {
      top: isBottomHalf ? spotlight.cy - spotlight.r + verticalOffset : spotlight.cy + spotlight.r + verticalOffset,
      left: leftPos
    };
  };

  const pos = getGuidePosition();

  if (!spotlight.visible) return null;

  return (
    <div className="fixed inset-0 z-[300] overflow-hidden animate-in fade-in duration-500">
      {/* Background Mask */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <circle 
              cx={spotlight.cx} 
              cy={spotlight.cy} 
              r={spotlight.r} 
              fill="black" 
              className="transition-all duration-500 ease-in-out"
            />
            {spotlight.extra && (
              <circle 
                cx={spotlight.extra.cx} 
                cy={spotlight.extra.cy} 
                r={spotlight.extra.r} 
                fill="black" 
                className="transition-all duration-500 ease-in-out"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#spotlight-mask)" className="pointer-events-auto" />
      </svg>

      {/* Guide Content Card */}
      <div 
        className="absolute z-[310] flex flex-col pointer-events-none transition-all duration-500 ease-in-out"
        style={{ top: pos.top, left: pos.left }}
      >
        <div className="w-[280px] p-6 rounded-2xl shadow-2xl pointer-events-auto bg-white/85 backdrop-blur-md border-none animate-in zoom-in-95 duration-300">
           <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-black text-black/30 uppercase tracking-widest">Guide {step}/5</span>
           </div>
           
           <div className="text-[13px] font-medium leading-relaxed mb-6 whitespace-pre-line text-black">
              {step === 1 && <span><b>설정</b>에서 다크모드, 절전모드, API키 등을 변경할 수 있습니다.</span>}
              {step === 2 && <span>25분의 집중 시간 동안 최애의 <b>응원</b>과 <b>감시</b>를 받을 수 있습니다. 집중할수록 <b>호감도</b>가 쌓이고, 응원 대사도 관계에 맞게 달라집니다.</span>}
              {step === 3 && <span><b>TIP</b> : {characterName}와 함께하는 100분 동안 화면이 꺼지지 않도록, 기기의 디스플레이 <b>잠금 설정</b>을 확인하고 <b>충전기</b>를 미리 연결해 주세요.</span>}
              {step === 4 && <span><b>되돌아가기</b>:<br/><b>짧게</b> 누르면 현재의 25분 집중 시간만 초기화되고, <b>길게</b> 누르면 전체가 초기화됩니다.</span>}
              {step === 5 && <span>이제 <b>시작</b>을 누르고 {characterName}와 함께 100분 간 집중 해 볼까요?</span>}
           </div>
           
           <div className="flex items-center justify-end">
              {step < 5 ? (
                <button 
                  onClick={handleNext}
                  className="py-1.5 px-3 bg-black text-white rounded-lg font-bold text-[11px] active:scale-95 transition-all flex items-center gap-1 shadow-sm"
                >
                  다음 <ChevronRight size={12} strokeWidth={3} />
                </button>
              ) : (
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={() => onClose(true)}
                    className="flex-1 py-1.5 bg-black/5 text-black/50 rounded-lg font-bold text-[10px] active:scale-95 transition-all"
                  >
                    다시 보지 않기
                  </button>
                  <button 
                    onClick={() => onClose(false)}
                    className="flex-1 py-1.5 bg-black text-white rounded-lg font-bold text-[11px] active:scale-95 transition-all shadow-md"
                  >
                    닫기
                  </button>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};