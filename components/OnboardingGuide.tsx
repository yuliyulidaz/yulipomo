
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
  };
  onClose: (neverShowAgain: boolean) => void;
}

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ isDarkMode, characterName, targets, onClose }) => {
  const [step, setStep] = useState(1);
  const [spotlight, setSpotlight] = useState({ cx: 0, cy: 0, r: 0, visible: false });

  // 화면 리사이즈나 스텝 변경 시 위치 재계산
  const updateSpotlight = useMemo(() => () => {
    let target: HTMLElement | null = null;
    let radius = 40;

    if (step === 1) target = targets.settings.current;
    if (step === 2) { target = targets.character.current; radius = 100; }
    if (step === 3) { 
      // 중앙 팁: 스포트라이트 없이 화면 전체를 어둡게 (r: 0)
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
      visible: true
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
      // 화면 정중앙 배치
      return {
        top: (window.innerHeight - 250) / 2,
        left: (window.innerWidth - 288) / 2
      };
    }

    const isBottomHalf = spotlight.cy > window.innerHeight / 2;
    // 요소와의 간격 유지
    const verticalOffset = isBottomHalf ? -180 : 20;
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
      {/* Spotlight Mask Area */}
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
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#spotlight-mask)" className="pointer-events-auto" />
      </svg>

      {/* Guide Content */}
      <div 
        className="absolute z-[310] flex flex-col pointer-events-none transition-all duration-500 ease-in-out"
        style={{ top: pos.top, left: pos.left }}
      >
        <div className="w-72 p-5 rounded-xl shadow-2xl pointer-events-auto bg-white/90 backdrop-blur-md border-none animate-in zoom-in-95 duration-300 relative z-10">
           <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black text-black/40 uppercase tracking-widest">Guide {step}/5</span>
           </div>
           
           <p className="text-sm font-medium leading-relaxed mb-5 whitespace-pre-line text-black">
              {step === 1 && "설정: 다크모드, API키 등 설정을 변경할 수 있습니다."}
              {step === 2 && "캐릭터: 최애를 톡톡 눌러서 응원을 받으세요."}
              {step === 3 && `TIP : ${characterName} 와 100분동안 집중하기 전에\n\n1. 화면 자동 잠금 설정을 '안 함'으로 변경해주세요.\n2. 충전기를 미리 연결해 주세요.`}
              {step === 4 && "되돌아가기:\n한 번 누르면 세션 초기화,\n길게 누르면 전체 사이클이 초기화됩니다."}
              {step === 5 && "시작: 이제 시작 버튼을 누르고 집중을 시작해 보세요."}
           </p>
           
           <div className="flex items-center justify-end gap-2">
              {step < 5 ? (
                <button 
                  onClick={handleNext}
                  className="py-1.5 px-4 bg-black text-white rounded-lg font-bold text-xs active:scale-95 transition-all flex items-center gap-1"
                >
                  다음 <ChevronRight size={12} />
                </button>
              ) : (
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={() => onClose(true)}
                    className="flex-1 py-1.5 bg-black/5 text-black/60 rounded-lg font-bold text-[10px] active:scale-95 transition-all"
                  >
                    다시 보지 않기
                  </button>
                  <button 
                    onClick={() => onClose(false)}
                    className="flex-1 py-1.5 bg-black text-white rounded-lg font-bold text-xs active:scale-95 transition-all"
                  >
                    시작하기
                  </button>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
