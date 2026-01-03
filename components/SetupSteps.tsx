
import React, { useState } from 'react';
// Added missing icon imports: ExternalLink, ClipboardPaste, X to fix build errors in Step3
import { Camera, Heart, Timer, Coffee, ExternalLink, ClipboardPaste, X, HelpCircle, Sparkles } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { TONE_KEYWORDS, PERSONALITY_KEYWORDS } from './SetupConfig';
import { ImageCropper } from './ImageCropper';

interface Step1Props {
  name: string;
  setName: (v: string) => void;
  imageSrc: string | null;
  setImageSrc: (v: string | null) => void;
  charGender: 'MALE' | 'FEMALE' | 'NEUTRAL' | '';
  setCharGender: (v: 'MALE' | 'FEMALE' | 'NEUTRAL') => void;
  onPrivacyOpen: () => void;
  nameInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const Step1: React.FC<Step1Props> = ({ name, setName, imageSrc, setImageSrc, charGender, setCharGender, onPrivacyOpen, nameInputRef }) => {
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const handleImageSelected = (base64: string) => {
    setRawImage(base64);
    setShowCropper(true);
  };

  const handleCropComplete = (croppedBase64: string) => {
    setImageSrc(croppedBase64);
    setShowCropper(false);
    setRawImage(null);
  };

  return (
    <div className="flex flex-col items-center animate-in fade-in duration-700">
      {showCropper && rawImage && (
        <ImageCropper 
          imageSrc={rawImage} 
          onCrop={handleCropComplete} 
          onCancel={() => setShowCropper(false)} 
        />
      )}

      <div className="w-full flex flex-col items-center justify-center pt-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
              <Heart size={14} className="text-accent fill-accent" />
              <span className="text-sm font-black text-primary tracking-widest uppercase">최애와 딱 100분 집중하기</span>
          </div>
        
          <div className="flex flex-col items-center gap-1.5 mb-14">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
              (<Timer size={11} className="text-slate-500" />25분 집중 + <Coffee size={11} className="text-slate-500" /> 5분 휴식) x 4회
            </div>
          </div>
          
          <div className="relative w-32 h-32 md:w-44 md:h-44 mx-auto">
            <div className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500/80 rounded-full flex items-center justify-center shadow-md z-10 animate-pulse-slow select-none">
              <span className="text-white font-black text-lg leading-none mt-1">*</span>
            </div>
            
            <div className={`w-full h-full rounded-2xl overflow-hidden border-2 transition-all duration-500 relative ${imageSrc ? 'border-primary shadow-lg shadow-primary/10' : 'border-border bg-background'}`}>
              {imageSrc ? (
                <>
                  <img src={imageSrc} alt="Preview" className="w-full h-full object-cover animate-in zoom-in-95 duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary opacity-40">
                  <Camera size={40} strokeWidth={1} />
                </div>
              )}
            </div>
            <div className="absolute -bottom-3 -right-3">
              <FileUpload onImageSelected={handleImageSelected} currentImage={imageSrc} onClear={() => setImageSrc(null)} />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col items-center pt-14">
        <div className="w-full max-w-xs space-y-8 flex flex-col items-center px-4">
          <div className="relative w-full">
            <label className="absolute -top-6 left-0 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              최애 이름 <span className="text-rose-500">*</span>
            </label>
            <input ref={nameInputRef} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="'최애'의 이름을 적어주세요" className="w-full px-0 py-3 bg-transparent border-b border-border outline-none focus:border-primary transition-all text-center font-semibold text-sm placeholder:text-border placeholder:font-normal text-text-primary" />
          </div>

          <div className="w-full">
            <div className="flex items-center gap-6">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                최애 성별 <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                {(['FEMALE', 'MALE', 'NEUTRAL'] as const).map(g => (
                  <button 
                    key={g} 
                    onClick={() => setCharGender(g)} 
                    className={`py-1.5 px-3 text-xs rounded-md border transition-all ${
                      charGender === g 
                        ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                        : (charGender ? 'border-transparent text-slate-300' : 'bg-transparent border-transparent text-text-secondary hover:text-primary')
                    }`}
                  >
                    {g === 'MALE' ? '남성' : g === 'FEMALE' ? '여성' : '중성'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="text-center pt-7 space-y-4">
            <div className="text-center space-y-1 w-full">
              <p className="text-[9px] text-slate-500 font-bold tracking-tight">이 서비스는 Google Gemini API키를 필요로 합니다.</p>
              <button 
                onClick={onPrivacyOpen}
                className="text-[10px] text-primary font-black underline underline-offset-2 decoration-primary/30 hover:text-primary-dark transition-colors"
              >
                개인정보 및 AI 정책 확인 하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface Step2Props {
  selectedTone: string;
  setSelectedTone: (v: string) => void;
  selectedPersonalities: string[];
  togglePersonality: (v: string) => void;
  charJob: string;
  setCharJob: (v: string) => void;
}

export const Step2: React.FC<Step2Props> = ({ selectedTone, setSelectedTone, selectedPersonalities, togglePersonality, charJob, setCharJob }) => (
  <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 pt-16">
    <div className="text-center space-y-3">
      <h1 className="text-xl font-black text-text-primary mb-2">최애의 성격</h1>
      <p className="text-slate-500 text-[11px] font-medium mb-10">상대는 당신에게 어떤 목소리로 말을 건네나요?</p>
    </div>
    <div className="space-y-8 text-left">
      <div className="space-y-4">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
          말투 <span className="text-rose-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {TONE_KEYWORDS.map(k => (
            <button 
              key={k} 
              onClick={() => setSelectedTone(k)} 
              className={`py-1.5 px-3 text-xs rounded-md border transition-all ${
                selectedTone === k 
                  ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                  : (selectedTone ? 'border-transparent text-slate-300' : 'bg-transparent border-transparent text-text-secondary hover:text-primary')
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
          성격 키워드 (최대 2개) <span className="text-rose-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {PERSONALITY_KEYWORDS.map(k => (
            <button 
              key={k} 
              onClick={() => togglePersonality(k)} 
              disabled={!selectedPersonalities.includes(k) && selectedPersonalities.length >= 2}
              className={`py-1.5 px-3 text-xs rounded-md border transition-all ${selectedPersonalities.includes(k) ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'bg-transparent border-transparent text-text-secondary hover:text-primary disabled:opacity-30'}`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">최애 직업/지위</label>
            <span className="text-[10px] font-medium text-slate-400">{(charJob || '').length}/15</span>
        </div>
        <div className="relative">
            <input 
              type="text" 
              maxLength={15}
              value={charJob} 
              onChange={e => setCharJob(e.target.value)} 
              placeholder="예) 최고의 아이돌, 싸가지없는 왕, 천재 탐정" 
              className="w-full py-3 bg-transparent border-b border-border outline-none focus:border-primary transition-all font-semibold text-sm placeholder:text-border placeholder:font-normal text-text-primary" 
            />
        </div>
      </div>
    </div>
  </div>
);

interface Step3Props {
  userName: string;
  setUserName: (v: string) => void;
  honorific: string;
  setHonorific: (v: string) => void;
  gender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  setGender: (v: 'MALE' | 'FEMALE' | 'NEUTRAL') => void;
  userJob: string;
  setUserJob: (v: string) => void;
  todayTask: string;
  setTodayTask: (v: string) => void;
  apiKey: string;
  setApiKey: (v: string) => void;
  name: string;
  userNameInputRef?: React.RefObject<HTMLInputElement | null>;
  apiKeyInputRef?: React.RefObject<HTMLInputElement | null>;
  onHelpOpen: () => void;
}

export const Step3: React.FC<Step3Props> = ({ userName, setUserName, honorific, setHonorific, gender, setGender, userJob, setUserJob, todayTask, setTodayTask, apiKey, setApiKey, name, userNameInputRef, apiKeyInputRef, onHelpOpen }) => {
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleanText = text.trim();
      if (cleanText) {
        setApiKey(cleanText);
      }
    } catch (err) {
      console.error('Failed to read clipboard');
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 pt-16">
      <div className="text-center space-y-3 mb-16">
        <h1 className="text-xl font-black text-text-primary mb-2">우리의 연결</h1>
        <p className="text-slate-500 text-[11px] font-medium">마지막 관문입니다. 당신을 알려주세요.</p>
      </div>

      <div className="space-y-12 px-2">
        <div className="grid grid-cols-2 gap-8">
          <div className="relative group">
            <label className="absolute -top-6 left-0 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              내 이름 <span className="text-rose-500">*</span>
            </label>
            <input ref={userNameInputRef} type="text" value={userName} onChange={e => setUserName(e.target.value)} placeholder="당신의 이름" className="w-full py-2 bg-transparent border-b border-border outline-none focus:border-primary transition-all font-semibold text-sm text-text-primary" />
          </div>
          <div className="relative group">
            <label className="absolute -top-6 left-0 text-[10px] font-bold text-slate-500 uppercase tracking-widest">호칭</label>
            <input type="text" value={honorific} onChange={e => setHonorific(e.target.value)} placeholder="부를 호칭" className="w-full py-2 bg-transparent border-b border-border outline-none focus:border-primary transition-all font-semibold text-sm text-text-primary" />
          </div>
        </div>

        <div className="flex flex-col gap-12">
          <div className="relative w-full">
            <label className="absolute -top-6 left-0 text-[10px] font-bold text-slate-500 uppercase tracking-widest">성별</label>
            <div className="flex gap-2 pt-1">
              {(['FEMALE', 'MALE', 'NEUTRAL'] as const).map(g => (
                <button 
                  key={g} 
                  onClick={() => setGender(g)} 
                  className={`py-1.5 px-3 text-xs rounded-md border transition-all ${
                    gender === g 
                      ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                      : (gender ? 'border-transparent text-slate-300' : 'bg-transparent border-transparent text-text-secondary hover:text-primary')
                  }`}
                >
                  {g === 'MALE' ? '남성' : g === 'FEMALE' ? '여성' : '중성'}
                </button>
              ))}
            </div>
          </div>
          <div className="relative group">
            <div className="absolute -top-6 left-0 right-0 flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">나의 직업/지위</label>
              <span className="text-[10px] font-medium text-slate-400">{(userJob || '').length}/15</span>
            </div>
            <input type="text" maxLength={15} value={userJob} onChange={e => setUserJob(e.target.value)} placeholder="예) 구박받는 매니저, 괴도" className="w-full py-2 bg-transparent border-b border-border outline-none focus:border-primary transition-all font-semibold text-sm text-text-primary placeholder:text-border placeholder:font-normal" />
          </div>
        </div>

        <div className="relative group">
          <label className="absolute -top-6 left-0 flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            오늘 {name}와(과) 해야 할 일은?
          </label>
          <input type="text" value={todayTask} onChange={e => setTodayTask(e.target.value)} placeholder="예: 제작 마감, 수학 숙제 등" className="w-full py-2 bg-transparent border-b border-border outline-none focus:border-primary transition-all text-sm font-semibold text-text-primary placeholder:text-slate-400 placeholder:font-normal" />
        </div>

        <div className="relative group">
          <label className="absolute -top-6 left-0 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Gemini API Key <span className="text-rose-500">*</span>
            <button 
              type="button" 
              onClick={onHelpOpen}
              className="text-slate-400 hover:text-primary transition-colors p-0.5"
            >
              <HelpCircle size={13} />
            </button>
          </label>
          <div className="pt-1">
            <div className="flex gap-6 mb-2">
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-primary hover:text-primary-dark transition-all flex items-center gap-1.5 underline underline-offset-4 decoration-primary/30">
                API 키 발급받기 <ExternalLink size={12} />
              </a>
              <button onClick={handlePaste} className="text-[10px] font-black text-primary hover:text-primary-dark transition-all flex items-center gap-1.5 underline underline-offset-4 decoration-primary/30">
                키 붙여넣기 <ClipboardPaste size={12} />
              </button>
            </div>
            <div className="relative">
              <input 
                ref={apiKeyInputRef}
                type="password" 
                value={apiKey} 
                onChange={e => setApiKey(e.target.value)} 
                placeholder="API 키를 입력하세요" 
                className="w-full bg-transparent border-b border-border outline-none focus:border-primary font-semibold text-sm py-2 pr-10 placeholder:text-border text-text-primary transition-colors" 
              />
              {apiKey && (
                <button 
                  onClick={() => setApiKey('')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-text-secondary hover:text-rose-500 transition-colors"
                  title="삭제"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-[10px] text-slate-500 leading-relaxed font-bold tracking-tight">키를 입력하고 '소환하기'를 누르면 {name}이(가) 나타납니다.</p>
        </div>
      </div>
    </div>
  );
};
