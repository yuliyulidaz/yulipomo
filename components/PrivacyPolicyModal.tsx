import React, { useEffect } from 'react';
import { ShieldCheck, X, CheckCircle2 } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  isDarkMode
}) => {
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
      <div 
        className="fixed inset-0 z-[700] bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div 
        className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] z-[710] 
          rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.2)] border-t transform transition-transform duration-500 ease-out animate-in slide-in-from-bottom-full
          ${isDarkMode ? 'bg-[#161B22] border-[#30363D]' : 'bg-surface border-border'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-border/40 rounded-full mx-auto mt-4 mb-2" />
        <div className="p-8 pt-4 space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-primary/20 text-primary-light' : 'bg-primary/10 text-primary'}`}>
              <ShieldCheck size={32} />
            </div>
            <h3 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>
              개인정보 및 AI 정책 안내
            </h3>
          </div>

          <div className="space-y-5 py-2">
            <div className="flex gap-4 items-start">
              <div className="mt-1 shrink-0 text-primary">
                <CheckCircle2 size={16} />
              </div>
              <div className="space-y-1">
                <h4 className={`text-xs font-black ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>1. 데이터 저장</h4>
                <p className={`text-[11px] font-medium leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-text-secondary'}`}>
                  사용자가 입력한 이름, TMI, 이미지는 오직 사용자의 기기에만 저장되며, 개발자는 이를 수집하거나 열람할 수 없습니다.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="mt-1 shrink-0 text-primary">
                <CheckCircle2 size={16} />
              </div>
              <div className="space-y-1">
                <h4 className={`text-xs font-black ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>2. AI 처리</h4>
                <p className={`text-[11px] font-medium leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-text-secondary'}`}>
                  모든 대화 생성은 Google Gemini API를 통해 이루어집니다. 입력하신 내용은 AI 답변 생성을 위해 Google로 전달되나, 이는 서비스 제공 목적 이외에 사용되지 않습니다. (단, <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-primary/30 font-bold hover:text-primary transition-colors">Google의 개인정보 처리방침</a>에 따름)
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="mt-1 shrink-0 text-primary">
                <CheckCircle2 size={16} />
              </div>
              <div className="space-y-1">
                <h4 className={`text-xs font-black ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>3. 학습 미이용</h4>
                <p className={`text-[11px] font-medium leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-text-secondary'}`}>
                  본 서비스는 유저의 사적인 데이터를 별도로 수집하여 AI를 재학습시키지 않습니다.
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-primary hover:bg-primary-light text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </>
  );
};