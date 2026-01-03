
import React, { useEffect } from 'react';
import { HelpCircle, CheckCircle2 } from 'lucide-react';

interface ApiKeyHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export const ApiKeyHelpModal: React.FC<ApiKeyHelpModalProps> = ({
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
        <div className="p-8 pt-4 space-y-6 max-h-[85vh] overflow-y-auto custom-diary-scroll">
          <div className="flex flex-col items-center text-center space-y-4">
          
            <h3 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>
              Gemini API 키 발급 가이드 (무료)
            </h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className={`text-sm font-black ${isDarkMode ? 'text-slate-200' : 'text-slate-700'} flex items-center gap-2`}>
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center">?</span>
                왜 키가 필요한가요?
              </h4>
              <p className={`text-[11px] font-medium leading-relaxed px-1 ${isDarkMode ? 'text-slate-400' : 'text-text-secondary'}`}>
                최애 캐릭터가 당신의 행동(딴짓, 클릭 등)을 인지하고, 대화와 관찰 일지를 작성하기 위해 Google의 AI인 Gemini를 사용합니다. 사용자 개별 API 키를 사용함으로써 자유로운 대화 경험을 제공할 수 있습니다. 키는 처음 한 번만 발급받으면 계속 사용할 수 있습니다.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className={`text-sm font-black ${isDarkMode ? 'text-slate-200' : 'text-slate-700'} flex items-center gap-2`}>
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center">!</span>
                무료 키 사용 권장
              </h4>
              <p className={`text-[11px] font-medium leading-relaxed px-1 ${isDarkMode ? 'text-slate-400' : 'text-text-secondary'}`}>
                이 사이트는 결제 카드를 등록하지 않은 '완전 무료 계정'에서도 충분히 사용하실 수 있도록 설계되었습니다. 혹시 다른 용도로 결제 카드를 연결해 둔 API 키를 사용하신다면, 예상치 못한 비용이 발생하지 않도록 구글 대시보드에서 사용량을 꼭 확인해 주세요!
              </p>
            </div>

            <div className="space-y-4">
              <h4 className={`text-sm font-black ${isDarkMode ? 'text-slate-200' : 'text-slate-700'} flex items-center gap-2`}>
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center">!</span>
                키를 발급 받는 방법을 알려주세요.
              </h4>
              <div className="space-y-1.5 pl-1">
                {[
                  "'API키 발급받기'로 이동한 화면에서 오른쪽 상단 'API키 만들기' 클릭",
                  "키 이름은 자유롭게 지정",
                  "가져온 프로젝트 선택에서 '프로젝트 만들기'",
                  "자유롭게 프로젝트 이름 설정하여 만들기 (영문 4글자 이상)",
                  "4 에서 만든 프로젝트 선택",
                  "하단 키 만들기 클릭",
                  "테이블 가장 앞 '키' 하단에 있는 파란 글씨 클릭",
                  "API 세부정보에서 가장 위에 있는 정보 복사 (Alza로 시작)",
                  "본 페이지로 돌아와 붙여넣기"
                ].map((step, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <div className={`shrink-0 w-4 text-[11px] font-black transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      {idx + 1}.
                    </div>
                    <p className={`text-[11px] font-medium leading-tight pt-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-primary hover:bg-primary-light text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 transition-all active:scale-95 mt-4"
          >
            가이드를 확인했습니다
          </button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-diary-scroll::-webkit-scrollbar { width: 4px; }
        .custom-diary-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-diary-scroll::-webkit-scrollbar-thumb { background: rgba(74, 95, 122, 0.1); border-radius: 10px; }
      `}} />
    </>
  );
};
