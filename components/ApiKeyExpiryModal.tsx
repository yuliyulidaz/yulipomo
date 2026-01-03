
import React, { useState, useEffect } from 'react';
import { X, ExternalLink, ClipboardPaste, RotateCcw, Loader2 } from 'lucide-react';

import { generateWithFallback } from '../utils/GeminiDelegate';

interface ApiKeyExpiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'EXPIRED' | 'MANUAL' | 'CONGESTED';
  currentApiKey: string;
  isDarkMode: boolean;
  onUpdateKey: (newKey: string) => void;
}

export const ApiKeyExpiryModal: React.FC<ApiKeyExpiryModalProps> = ({
  isOpen,
  onClose,
  type,
  currentApiKey,
  isDarkMode,
  onUpdateKey
}) => {
  const [tempApiKey, setTempApiKey] = useState('');
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTempApiKey(type === 'MANUAL' ? currentApiKey : '');
      setApiKeyError(null);
    }
  }, [isOpen, type, currentApiKey]);


  const validateAndApplyKey = async (key: string) => {
    if (!key || key.length < 20) {
      setApiKeyError("유효한 키가 아닙니다. 다른 키를 입력해 주세요.");
      return;
    }
    setIsValidating(true);
    setApiKeyError(null);

    try {
      await generateWithFallback(key, 'Hello', [], false);
      onUpdateKey(key);
      onClose();

    } catch (e: any) {
      console.error("API Key Validation Error:", e);

      const isRateLimit = e.message?.includes('429') || 
                          e.status === 429 || 
                          e.message?.includes('과부하') || 
                          e.message?.includes('휴식') ||
                          e.message?.includes('대기');

      if (isRateLimit) {

        onUpdateKey(key);
        onClose();
        return; 
      }

      setApiKeyError("유효한 키가 아닙니다. 올바른 키인지 확인해주세요.");
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (tempApiKey && tempApiKey !== currentApiKey) {
      const timer = setTimeout(() => {
        validateAndApplyKey(tempApiKey);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [tempApiKey]);

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleanText = text.trim();
      setTempApiKey(cleanText);
      validateAndApplyKey(cleanText);
    } catch (err) {}
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[340px] md:w-[380px] z-[110] animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
        <div className={`p-7 rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border backdrop-blur-2xl space-y-6 ${isDarkMode ? 'bg-slate-900/95 border-white/10' : 'bg-white/95 border-slate-200'}`}>
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <h3 className={`text-sm font-black leading-tight whitespace-pre-line ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                {type === 'EXPIRED' && 'API 키가 만료 되었습니다.\n새로운 API 키를 입력해 주세요.'}
                {type === 'CONGESTED' && 'Google 서버가 혼잡하니\n다른 키로 바꿔보세요.'}
                {type === 'MANUAL' && 'API 키를 새로 입력하시겠어요?'}
              </h3>
            </div>
            <button onClick={onClose} className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white/40' : 'hover:bg-slate-100 text-slate-400'}`}><X size={18} /></button>
          </div>

          <div className="flex gap-2">
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className={`flex-1 h-10 flex items-center justify-center gap-1.5 rounded-xl border text-[10px] font-black transition-all ${isDarkMode ? 'bg-slate-800/50 border-white/5 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
              키 발급받기 <ExternalLink size={12} />
            </a>
            <button onClick={handlePasteKey} className="flex-1 h-10 bg-primary hover:bg-primary-light text-white text-[10px] font-black rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-1.5 transition-all active:scale-95">
              복사해 온 키 붙여넣기 <ClipboardPaste size={12} />
            </button>
          </div>

          <div className="space-y-2">
            <div className="relative group">
              <input 
                type="password" 
                value={tempApiKey} 
                onChange={(e) => setTempApiKey(e.target.value)} 
                placeholder="API 키를 입력하세요" 
                className={`w-full h-12 px-5 pr-12 rounded-xl border-2 outline-none font-mono text-[13px] transition-all ${isDarkMode ? 'bg-black/40 border-white/5 focus:border-primary text-slate-100' : 'bg-slate-50 border-slate-100 focus:border-primary text-slate-800'}`} 
              />
              {tempApiKey && (
                <button onClick={() => setTempApiKey('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"><RotateCcw size={14} /></button>
              )}
            </div>
            {apiKeyError && <p className="text-[10px] text-rose-500 font-bold px-1 animate-in fade-in slide-in-from-top-1">{apiKeyError}</p>}
            {isValidating && <div className="flex items-center gap-2 px-1"><Loader2 size={12} className="animate-spin text-primary" /><p className="text-[10px] text-primary font-bold animate-pulse">키 유효성 검사 중...</p></div>}
          </div>

          {(type === 'EXPIRED' || type === 'CONGESTED') && (
            <div className={`space-y-1 pt-2 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
              <p className={`text-[9px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>*지금 당장 키를 입력하지 않아도 계속 사용할 수 있어요.</p>
              <p className={`text-[9px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>*설정에서 API키 입력 메뉴로 다시 키를 설정할 수 있어요.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
