import React from 'react';
import { MessageSquareHeart, Loader2, RefreshCw } from 'lucide-react';

interface PersonalityQuizProps {
  currentQuizStep: number;
  name: string;
  imageSrc: string | null;
  quizData: {
    late_options: string[];
    gift_options: string[];
    lazy_options: string[];
  } | null;
  onOptionSelect: (option: string) => void;
  onRefresh: () => void;
  isPartialRefreshing: boolean;
}

export const PersonalityQuiz: React.FC<PersonalityQuizProps> = ({ currentQuizStep, name, imageSrc, quizData, onOptionSelect, onRefresh, isPartialRefreshing }) => {
  if (!quizData) return null;
  const options = currentQuizStep === 0 ? quizData.late_options : currentQuizStep === 1 ? quizData.gift_options : quizData.lazy_options;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="text-center space-y-4 px-4">
        <div className="inline-flex items-center justify-center p-3 bg-primary/5 rounded-2xl border border-primary/10 mb-2"><MessageSquareHeart size={24} className="text-primary" /></div>
        <h2 className="text-lg font-black text-text-primary tracking-tight leading-tight whitespace-pre-line">
            {currentQuizStep === 0 && `상황 1. 내가 약속 시간에 늦었을 때.\n${name}은(는)?`}
            {currentQuizStep === 1 && `상황 2. 선물을 주거나 받을 때.\n${name}은(는)?`}
            {currentQuizStep === 2 && `상황 3. 휴식 시간.\n${name}은(는)?`}
        </h2>
      </div>
      <div className="space-y-4 px-2">
        <div className="flex flex-col items-start gap-4">
          {options.map((option, index) => (
            <div key={index} className="flex items-start gap-3 w-full group animate-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-border bg-background flex-shrink-0 mt-1">
                <img src={imageSrc || ''} className="w-full h-full object-cover" alt="Character" />
              </div>
              <button onClick={() => onOptionSelect(option)} className="flex-1 max-w-[85%] text-left bg-surface border-2 border-border p-4 rounded-2xl rounded-tl-none hover:border-primary hover:shadow-lg transition-all relative active:scale-[0.98]">
                <p className="text-sm font-bold text-text-primary leading-relaxed">"{option}"</p>
                <div className="absolute -left-2 top-0 w-3 h-3 bg-surface rotate-45 border-l-2 border-b-2 border-border group-hover:border-primary transition-colors"></div>
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center gap-6 pt-4">
        <div className="flex gap-3">
          {[0, 1, 2].map(i => (<div key={i} className={`w-2 h-2 rounded-full transition-all duration-500 ${i === currentQuizStep ? 'bg-primary w-6' : 'bg-border'}`} />))}
        </div>
        <button onClick={onRefresh} disabled={isPartialRefreshing} className="inline-flex items-center gap-2 py-2.5 px-5 text-[11px] font-black text-text-secondary hover:text-primary transition-all border-2 border-dashed border-border rounded-xl hover:bg-background">
          {isPartialRefreshing ? <Loader2 size={12} className="animate-spin"/> : <RefreshCw size={12} />}다른 대사 불러오기
        </button>
      </div>
    </div>
  );
};
