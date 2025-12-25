
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
  // 각 상황(Step)별로 새로고침 기회를 1회씩 부여하기 위해 객체로 관리
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
    // 이미 선택된 대사를 누르면 해제, 아니면 선택
    if (tempSelection === option) {
      onTempSelect('');
    } else {
      onTempSelect(option);
    }
  };

  return (
    <div 
      className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 pt-2 cursor-default"
      onClick={() => onTempSelect('')} // 배경 클릭 시 선택 해제
    >
      {/* 상단 영역: 캐릭터 이미지 아이콘 (매우 좁은 간격) */}
      <div className="flex-shrink-0 flex justify-center mb-3">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-primary/20 shadow-inner bg-background">
          <img src={imageSrc || ''} className="w-full h-full object-cover" alt="Character Icon" />
        </div>
      </div>

      {/* 상황 설명 문구 */}
      <div className="text-center px-6 mb-4">
        <h2 className="text-sm md:text-base font-black text-text-primary tracking-tight leading-tight whitespace-pre-line">
            {currentQuizStep === 0 && `상황 1. 내가 약속 시간에 늦었을 때,\n${name}의 반응은?`}
            {currentQuizStep === 1 && `상황 2. 뜻밖의 선물을 주었을 때,\n${name}의 반응은?`}
            {currentQuizStep === 2 && `상황 3. 내가 공부 안 하고 딴짓할 때,\n${name}의 반응은?`}
        </h2>
      </div>

      {/* 둥근 따옴표 캐릭터 대사 리스트 */}
      <div className="px-8 space-y-3 flex flex-col">
        {options.map((option, index) => {
          const isSelected = tempSelection === option;
          return (
            <button 
              key={`${currentQuizStep}-${index}`}
              onClick={(e) => handleOptionClick(e, option)} 
              className={`w-full py-4 px-6 rounded-xl border-2 transition-all duration-300 relative active:scale-[0.98] flex flex-col items-center justify-center text-center
                ${isSelected 
                  ? 'bg-primary/10 border-primary shadow-sm text-primary' 
                  : (tempSelection ? 'bg-transparent border-transparent text-slate-300 scale-[0.97]' : 'bg-transparent border-transparent text-text-secondary hover:text-primary')
                }`}
            >
              <p className={`text-sm font-medium leading-relaxed tracking-tight break-keep`}>
                “{option}”
              </p>
              {isSelected && (
                <div className="absolute -right-2 -top-2 bg-primary text-white p-1 rounded-full shadow-md animate-in zoom-in duration-300">
                  <Check size={10} strokeWidth={4} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 리필 버튼: 대사 리스트와 일정한 간격을 두고 바로 아래에 배치 */}
      <div className="flex justify-center mt-6 pb-10">
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