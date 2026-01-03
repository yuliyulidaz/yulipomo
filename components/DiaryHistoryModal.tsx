import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { CharacterProfile, DiaryEntry } from '../types';

interface DiaryHistoryModalProps {
  profile: CharacterProfile;
  isOpen: boolean;
  onClose: () => void;
}

const LEVEL_TITLES: Record<number, string> = {
  1: "완전한 타인", 2: "약간의 호기심", 3: "낯가리는 파트너", 4: "편안한 동료",
  5: "정이 든 사이", 6: "신뢰하는 관계", 7: "특별한 호감", 8: "소중한 사람",
  9: "애틋한 연인", 10: "영원한 반려"
};

export const DiaryHistoryModal: React.FC<DiaryHistoryModalProps> = ({ profile, isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLimitToast, setShowLimitToast] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const history = profile.diaryHistory || [];

  useEffect(() => {
    if (isOpen) {
      setShowLimitToast(true);
      const timer = setTimeout(() => setShowLimitToast(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // 스와이프 로직
  const minSwipeDistance = 50;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) handleNext();
    if (isRightSwipe) handlePrev();
  };

  if (!isOpen || history.length === 0) return null;

  const currentEntry = history[currentIndex];

  const getFontSize = (text: string) => {
    if (text.length > 200) return 'text-lg';
    if (text.length > 150) return 'text-xl';
    return 'text-2xl';
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-500 overflow-hidden">
      {/* 닫기 버튼 (모달 밖 우측 상단) */}
      <button 
        onClick={onClose}
        className="fixed top-6 right-6 z-[700] p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-95"
      >
        <X size={24} />
      </button>

      {showLimitToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[700] bg-white text-primary-dark px-6 py-3 rounded-full text-xs font-black shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
          📜 최근 10개만 저장됩니다.
        </div>
      )}

      {/* 메인 카드 영역 */}
      <div 
        className="relative w-full max-w-[350px] aspect-[9/16] flex items-center justify-center"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 네비게이션 버튼 (데스크탑) */}
        <div className="absolute inset-x-[-60px] hidden md:flex justify-between items-center z-50">
           <button 
              onClick={handlePrev} 
              disabled={currentIndex === 0}
              className={`p-3 rounded-full bg-white/5 border border-white/10 text-white transition-all ${currentIndex === 0 ? 'opacity-0 cursor-default' : 'hover:bg-white/20 active:scale-90'}`}
           >
             <ChevronLeft size={32} />
           </button>
           <button 
              onClick={handleNext} 
              disabled={currentIndex === history.length - 1}
              className={`p-3 rounded-full bg-white/5 border border-white/10 text-white transition-all ${currentIndex === history.length - 1 ? 'opacity-0 cursor-default' : 'hover:bg-white/20 active:scale-90'}`}
           >
             <ChevronRight size={32} />
           </button>
        </div>

        {/* 일기 카드 */}
        <div 
          key={currentEntry.id}
          className="w-full h-full bg-[#FCFAF2] rounded-2xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)] relative border-4 border-[#E8E2D0] overflow-hidden flex flex-col origin-center animate-in slide-in-from-right-10 fade-in duration-500"
        >
          <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')]"></div>
          
          <div className="flex-1 p-8 pb-10 space-y-4 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-center border-b-2 border-primary/10 pb-2">
                <h3 className="font-sans font-black text-[11px] text-primary-dark opacity-90">{profile.name}의 {profile.userName} 관찰일지</h3>
                <p className="font-sans font-bold text-[10px] text-text-secondary">{currentEntry.date}</p>
              </div>

              <div className="flex-1 relative overflow-hidden flex flex-col">
                  {/* 사진과 수치를 나란히 배치 */}
                  <div className="flex items-center justify-center gap-6 py-2 mb-2">
                      <div className="relative flex-shrink-0">
                          <div className="w-24 h-24 bg-white p-1.5 shadow-lg border border-primary/5 rotate-1 relative">
                              <img src={profile.imageSrc || ''} className="w-full h-full object-cover grayscale-[0.1] sepia-[0.15] contrast-110" alt="Character" />
                              <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                          </div>
                      </div>
                      
                      <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between bg-primary/5 px-3 py-1 rounded-lg border border-primary/5 min-w-[115px]">
                              <span className="text-[8px] font-black text-primary/60 uppercase mr-2">집중시간</span>
                              <span className="text-xs font-bold text-primary-dark">100분</span>
                          </div>
                          <div className="flex items-center justify-between bg-rose-500/5 px-3 py-1 rounded-lg border border-rose-500/5 min-w-[115px]">
                              <span className="text-[8px] font-black text-rose-400/80 uppercase mr-2">딴짓</span>
                              <span className="text-xs font-bold text-rose-500">{currentEntry.distractions}회</span>
                          </div>
                          <div className="flex items-center justify-between bg-primary/5 px-3 py-1 rounded-lg border border-primary/5 min-w-[115px]">
                              <span className="text-[8px] font-black text-primary/60 uppercase mr-2">대화</span>
                              <span className="text-xs font-bold text-primary">{currentEntry.clicks}회</span>
                          </div>
                      </div>
                  </div>

                  <div className="flex-1 relative flex flex-col overflow-hidden">
                      <div className="absolute inset-0 pointer-events-none opacity-20" 
                           style={{ backgroundImage: 'linear-gradient(#4A5F7A 1px, transparent 1px)', backgroundSize: '100% 2.2rem' }}>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto pr-2 custom-diary-scroll relative z-10">
                          <div className={`font-diary leading-[2.2rem] text-[#3D382E] whitespace-pre-wrap ${getFontSize(currentEntry.content)}`}>
                              {currentEntry.content}
                          </div>
                      </div>

                      <div className="absolute bottom-2 right-0 transform rotate-[-15deg] pointer-events-none z-20">
                          <div className="w-24 h-24 rounded-full border-[3px] border-rose-600/50 flex flex-col items-center justify-center text-rose-600/50 p-1 bg-transparent">
                              <div className="absolute inset-0 rounded-full border border-rose-600/20 m-0.5"></div>
                              <span className="font-diary text-xs font-bold leading-none mb-1 opacity-90">{LEVEL_TITLES[currentEntry.levelAtTime]}</span>
                              <span className="font-diary text-2xl font-bold leading-none">{profile.name}</span>
                              <span className="text-[8px] font-black mt-1 border-t border-rose-600/40 pt-0.5 px-2 tracking-tighter">ARCHIVED</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* 하단 인디케이터 (도트) */}
          <div className="p-6 pt-0 flex justify-center items-center gap-1.5 z-40 bg-gradient-to-t from-[#FCFAF2] via-[#FCFAF2] to-transparent">
              {history.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-primary' : 'w-1.5 bg-primary/20'}`} 
                />
              ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-diary-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-diary-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-diary-scroll::-webkit-scrollbar-thumb {
          background: rgba(74, 95, 122, 0.1);
          border-radius: 10px;
        }
      `}} />
    </div>
  );
};