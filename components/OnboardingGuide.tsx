import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';

interface OnboardingGuideProps {
  isDarkMode: boolean;
  targets: {
    settings: React.RefObject<HTMLElement | null>;
    character: React.RefObject<HTMLElement | null>;
    reset: React.RefObject<HTMLElement | null>;
    start: React.RefObject<HTMLElement | null>;
  };
  onClose: (neverShowAgain: boolean) => void;
}

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ isDarkMode, targets, onClose }) => {
  const [step, setStep] = useState(1);
  const [spotlight, setSpotlight] = useState({ cx: 0, cy: 0, r: 0, visible: false });

  // 화면 리사이즈나 스텝 변경 시 위치 재계산
  const updateSpotlight = useMemo(() => () => {
    let target: HTMLElement | null = null;
    let radius = 40;

    if (step === 1) target = targets.settings.current;
    if (step === 2) { target = targets.character.current; radius = 100; }
    if (step === 3) { target = targets.reset.current; radius = 40; }
    if (step === 4) { target = targets.start.current; radius = 50; }

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
    if (step < 4) setStep(step + 1);
    else onClose(false);
  };

  const getGuidePosition = () => {
    const isBottomHalf = spotlight.cy > window.innerHeight / 2;
    // 리셋 버튼(Step 3) 설명창이 버튼을 가리지 않도록 오프셋을 더 위로 조정 (기존 210 -> 240)
    const aboveOffset = step === 3 ? 240 : 180;
    
    return {
      top: isBottomHalf ? spotlight.cy - spotlight.r - aboveOffset : spotlight.cy + spotlight.r + 20,
      left: Math.max(20, Math.min(window.innerWidth - 300, spotlight.cx - 140)),
      arrowAtTop: !isBottomHalf
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
        className="absolute z-[310] flex flex-col items-center pointer-events-none transition-all duration-500 ease-in-out"
        style={{ top: pos.top, left: pos.left }}
      >
        {/* Arrow decoration - Rendered before bubble and positioned behind it */}
        <div 
          className={`w-4 h-4 transform rotate-45 absolute transition-all duration-500 z-0 ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-surface border-border'} ${pos.arrowAtTop ? '-top-2 border-t border-l' : '-bottom-2 border-b border-r'}`}
          style={{ 
            left: step === 1 ? '24px' : '140px', 
            opacity: 1
          }}
        ></div>

        <div className={`w-72 bg-surface p-6 rounded-[2rem] shadow-2xl pointer-events-auto border border-border animate-in zoom-in-95 duration-300 relative z-10 ${isDarkMode ? 'bg-slate-900 border-white/10' : ''}`}>
           <div className="flex items-center gap-2 mb-3">
              <div className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Guide {step}/4</div>
           </div>
           
           <p className={`text-sm font-bold leading-relaxed mb-6 whitespace-pre-line ${isDarkMode ? 'text-slate-200' : 'text-text-primary'}`}>
              {step === 1 && "설정: 다크모드, API키 등 설정을 변경할 수 있습니다."}
              {step === 2 && "캐릭터: 최애를 톡톡 눌러서 응원을 받으세요."}
              {step === 3 && "되돌아가기:\n한 번 누르면 현재 세션 초기화,\n길게 누르면 사이클이 통째로 초기화 됩니다."}
              {step === 4 && "시작: 이제 시작 버튼을 누르고 집중을 시작해 보세요."}
           </p>
           
           <div className="flex items-center justify-between gap-3">
              {step < 4 ? (
                <button 
                  onClick={handleNext}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-black text-xs shadow-lg shadow-primary/20 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  다음 <ChevronRight size={14} />
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => onClose(true)}
                    className="flex-1 py-3 bg-background border border-border text-text-secondary rounded-xl font-bold text-[10px] active:scale-95 transition-all"
                  >
                    다시 보지 않기
                  </button>
                  <button 
                    onClick={() => onClose(false)}
                    className="flex-1 py-3 bg-primary text-white rounded-xl font-black text-xs shadow-lg shadow-primary/20 active:scale-95 transition-all"
                  >
                    시작하기
                  </button>
                </>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
