import React, { useState } from 'react';
import { Loader2, Check } from 'lucide-react';

interface PersonalityQuizProps {
  currentQuizStep: number;
  name: string;
  imageSrc: string | null;
  quizData: {
    late_options: string[];
    gift_options: string[];
    lazy_options: string[];
  } | null;
  tempSelection: string;
  onTempSelect: (option: string) => void;
  onRefresh: () => void;
  isPartialRefreshing: boolean;
}

export const PersonalityQuiz: React.FC<PersonalityQuizProps> = ({ 
  currentQuizStep, name, imageSrc, quizData, 
  tempSelection, onTempSelect, 
  onRefresh, isPartialRefreshing 
}) => {
  const [refreshUsed, setRefreshUsed] = useState<Record<number, boolean>>({});

  if (!quizData) return null;
  const options = currentQuizStep === 0 ? quizData.late_options : currentQuizStep === 1 ? quizData.gift_options : quizData.lazy_options;

  const handleRefreshClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (refreshUsed[currentQuizStep] || isPartialRefreshing) return;
    setRefreshUsed(prev => ({ ...prev, [currentQuizStep]: true }));
    onRefresh();
  };

  const handleOptionClick = (e: React.MouseEvent, option: string) => {
    e.stopPropagation();
    if (tempSelection === option) {
      onTempSelect('');
    } else {
      onTempSelect(option);
    }
  };

  return (
    <div 
      className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 pt-[12vh] cursor-default min-h-full"
      onClick={() => onTempSelect('')}
    >
      {/* 상단 영역: 캐릭터 이미지 아이콘 (화면의 약 20% 지점에 위치하도록 상단 패딩과 조합) */}
      <div className="flex-shrink-0 flex justify-center mb-6">
        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-primary/20 shadow-inner bg-background overflow-hidden">
          <img src={imageSrc || ''} className="w-full h-full object-cover" alt="Character Icon" />
        </div>
      </div>

      {/* 상황 설명 문구 (간격을 mb-6으로 최적화) */}
      <div className="text-center px-6 mb-6">
        <h2 className="text-sm md:text-base font-black text-text-primary tracking-tight leading-tight whitespace-pre-line">
            {currentQuizStep === 0 && `상황 1. 약속 시간을 어겼을 때,\n${name}의 반응은?`}
            {currentQuizStep === 1 && `상황 2. 선물을 주고 받을 때,\n${name}의 반응은?`}
            {currentQuizStep === 2 && `상황 3. 딴짓할 때,\n${name}의 반응은?`}
        </h2>
      </div>

      {/* 캐릭터 대사 리스트 (버튼 사이 간격을 space-y-3으로 조정하여 한 화면에 안착) */}
      <div className="px-8 space-y-3 flex flex-col">
        {options.map((option, index) => {
          const isSelected = tempSelection === option;
          return (
            <button 
              key={`${currentQuizStep}-${index}`}
              onClick={(e) => handleOptionClick(e, option)} 
              className={`w-full py-4 px-6 rounded-2xl border-2 transition-all duration-300 relative active:scale-[0.98] flex flex-col items-center justify-center text-center
                ${isSelected 
                  ? 'bg-primary/10 border-primary shadow-md text-primary scale-[1.01]' 
                  : (tempSelection ? 'bg-transparent border-transparent text-slate-200 scale-[0.98]' : 'bg-transparent border-transparent text-text-secondary hover:text-primary')
                }`}
            >
              <p className={`text-sm md:text-base font-medium leading-relaxed tracking-tight break-keep`}>
                “{option}”
              </p>
              {isSelected && (
                <div className="absolute -right-2 -top-2 bg-primary text-white p-1.5 rounded-full shadow-md animate-in zoom-in duration-300">
                  <Check size={12} strokeWidth={4} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 리필 버튼: 하단 여유 공간 최적화 */}
      <div className="flex justify-center mt-8 pb-10">
        <button 
          onClick={handleRefreshClick} 
          disabled={isPartialRefreshing || refreshUsed[currentQuizStep]} 
          className={`inline-flex items-center gap-1.5 text-[10px] font-bold transition-all uppercase tracking-widest
            ${refreshUsed[currentQuizStep] 
              ? 'text-text-secondary/20 cursor-not-allowed' 
              : 'text-text-secondary/60 hover:text-rose-500 active:scale-95'}`}
        >
          {isPartialRefreshing ? <Loader2 size={12} className="animate-spin"/> : null}
          마음에 드는 대사가 없어요 {refreshUsed[currentQuizStep] ? '(완료)' : '(1회)'}
        </button>
      </div>
    </div>
  );
};
