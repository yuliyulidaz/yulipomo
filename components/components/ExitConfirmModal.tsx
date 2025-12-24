// @google/genai senior engineer note: Fix non-existent and unused icon imports.
import React, { useEffect } from 'react';
import { Heart, AlertCircle } from 'lucide-react';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
  characterName: string;
  isDarkMode: boolean;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmExit,
  characterName,
  isDarkMode
}) => {
  // 모달이 열려있을 때 뒤로가기를 누르면 모달을 닫는 역할 (안드로이드 유저 배려)
  useEffect(() => {
    if (!isOpen) return;

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      onClose();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[600] bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Bottom Drawer Content */}
      <div 
        className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] z-[610] 
          rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.2)] border-t transform transition-transform duration-500 ease-out animate-in slide-in-from-bottom-full
          ${isDarkMode ? 'bg-[#161B22] border-[#30363D]' : 'bg-surface border-border'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Handle */}
        <div className="w-12 h-1.5 bg-border/40 rounded-full mx-auto mt-4 mb-2" />

        <div className="p-8 pt-4 space-y-8 flex flex-col items-center text-center">
          <div className="relative">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-rose-500/10 text-rose-500' : 'bg-rose-50 text-rose-500'}`}>
              <AlertCircle size={40} strokeWidth={2.5} className="animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                <Heart size={14} className="text-rose-500 fill-rose-500" />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>
              {characterName}은(는) 당신이 떠나지 않기를 바랍니다.
            </h3>
            <p className={`text-sm font-medium leading-relaxed px-4 ${isDarkMode ? 'text-slate-400' : 'text-text-secondary'}`}>
              지금 나가시면 집중 흐름이 깨질 수 있어요.<br/>정말 우리 시간을 마무리할까요?
            </p>
          </div>

          <div className="w-full space-y-3 pt-2">
            <button 
              onClick={onClose}
              className="w-full py-4 bg-primary hover:bg-primary-light text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              힘내서 더 집중해볼게! <Heart size={16} fill="currentColor" />
            </button>
            
            <button 
              onClick={onClose}
              className={`w-full py-4 rounded-2xl font-black text-sm border transition-all active:scale-95
                ${isDarkMode ? 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
            >
              악, 실수로 누른거야
            </button>

            <button 
              onClick={onConfirmExit}
              className="w-full py-3 text-[11px] font-black text-rose-400 hover:text-rose-500 uppercase tracking-widest transition-colors"
            >
              아쉬워하며 나가기
            </button>
          </div>
        </div>
      </div>
    </>
  );
};