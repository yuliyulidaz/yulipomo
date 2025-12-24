
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
        top: (window.innerHeight - 300) / 2,
        left: (window.innerWidth - 288) / 2,
        arrowAtTop: false,
        noArrow: true,
        arrowLeft: 0
      };
    }

    const isBottomHalf = spotlight.cy > window.innerHeight / 2;
    // Step 5를 기존보다 더 위로 올리기 위해 220으로 상향 (기존 180)
    const aboveOffset = step === 4 ? 240 : (step === 5 ? 220 : 180);
    
    const leftPos = Math.max(20, Math.min(window.innerWidth - 300, spotlight.cx - 140));
    
    return {
      top: isBottomHalf ? spotlight.cy - spotlight.r - aboveOffset : spotlight.cy + spotlight.r + 20,
      left: leftPos,
      arrowAtTop: !isBottomHalf,
      noArrow: false,
      // 마름모가 버튼 중앙을 정확히 가리키도록 동적 계산 (마름모 너비 16px의 절반인 8px 차감)
      arrowLeft: spotlight.cx - leftPos - 8
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
        {/* Arrow decoration - 투명도를 완전히 제거하고(opacity-100) 색상을 통일 */}
        {!pos.noArrow && (
          <div 
            className={`w-4 h-4 transform rotate-45 absolute transition-all duration-500 -z-10 opacity-100 ${isDarkMode ? 'bg-slate-900 border-white/20' : 'bg-white border-border'} ${pos.arrowAtTop ? '-top-2 border-t border-l' : '-bottom-2 border-b border-r'}`}
            style={{ 
              left: `${pos.arrowLeft}px`
            }}
          ></div>
        )}

        <div className={`w-72 p-6 rounded-[2rem] shadow-2xl pointer-events-auto border border-border animate-in zoom-in-95 duration-300 relative z-10 opacity-100 ${isDarkMode ? 'bg-slate-900 border-white/20' : 'bg-white'}`}>
           <div className="flex items-center gap-2 mb-3">
              <div className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Guide {step}/5</div>
           </div>
           
           <p className={`text-sm font-bold leading-relaxed mb-6 whitespace-pre-line ${isDarkMode ? 'text-slate-200' : 'text-text-primary'}`}>
              {step === 1 && "설정: 다크모드, API키 등 설정을 변경할 수 있습니다."}
              {step === 2 && "캐릭터: 최애를 톡톡 눌러서 응원을 받으세요."}
              {step === 3 && `TIP : ${characterName} 와 100분동안 집중하기 전에\n\n1. 최애와 타이머를 계속 볼 수 있도록, 디스플레이 설정에서 '화면 자동 잠금/꺼짐'을 '안 함'으로 설정해주세요.\n2. 미리 충전기를 연결해 주세요.`}
              {step === 4 && "되돌아가기:\n한 번 누르면 현재 세션 초기화,\n길게 누르면 사이클이 통째로 초기화 됩니다."}
              {step === 5 && "시작: 이제 시작 버튼을 누르고 집중을 시작해 보세요."}
           </p>
           
           <div className="flex items-center justify-between gap-3">
              {step < 5 ? (
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
