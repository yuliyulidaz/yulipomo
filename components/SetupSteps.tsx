import React from 'react';
import { Camera, FileJson, Heart, ClipboardList, ExternalLink, ClipboardPaste, X } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { TONE_KEYWORDS, PERSONALITY_KEYWORDS } from './SetupConfig';

interface Step1Props {
  name: string;
  setName: (v: string) => void;
  imageSrc: string | null;
  setImageSrc: (v: string | null) => void;
  onLoadClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Step1: React.FC<Step1Props> = ({ name, setName, imageSrc, setImageSrc, onLoadClick, fileInputRef, handleFileChange }) => (
  <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 text-center">
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2 mb-1">
          <Heart size={14} className="text-accent fill-accent" />
          <span className="text-[10px] font-black text-primary tracking-widest uppercase">최애와 딱 100분 집중하기</span>
      </div>
      <h1 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight">최애 뽀모도로</h1>
      <p className="text-text-secondary text-sm font-medium">당신과 함께 할 상대는 누구인가요?</p>
    </div>
    <div className="relative w-32 h-32 md:w-44 md:h-44 mx-auto">
      <div className={`w-full h-full rounded-2xl overflow-hidden border-2 transition-all duration-500 ${imageSrc ? 'border-primary shadow-lg shadow-primary/10' : 'border-border bg-background'}`}>
        {imageSrc ? <img src={imageSrc} alt="Preview" className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary opacity-40"><Camera size={40} strokeWidth={1} /></div>}
      </div>
      <div className="absolute -bottom-3 -right-3"><FileUpload onImageSelected={setImageSrc} currentImage={imageSrc} onClear={() => setImageSrc(null)} /></div>
    </div>
    <div className="max-w-xs mx-auto pt-4 md:pt-6 flex flex-col items-center">
      <div className="relative w-full">
        <label className="absolute -top-6 left-0 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Bias Name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="'최애'의 이름을 적어주세요" className="w-full px-0 py-3 bg-transparent border-b-2 border-border outline-none focus:border-primary transition-all text-center font-bold text-xl placeholder:text-border placeholder:font-normal text-text-primary" />
      </div>
      <div className="mt-4 md:mt-8">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
        <button onClick={onLoadClick} className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-dashed border-primary/40 text-primary hover:bg-primary/5 hover:border-primary transition-all group">
          <FileJson size={14} className="group-hover:scale-110 transition-transform" /><span className="text-xs font-black">이미 함께하는 최애가 있나요? (불러오기)</span>
        </button>
      </div>
    </div>
  </div>
);

interface Step2Props {
  selectedTone: string;
  setSelectedTone: (v: string) => void;
  selectedPersonalities: string[];
  togglePersonality: (v: string) => void;
  tmi: string;
  setTmi: (v: string) => void;
  tmiRef: React.RefObject<HTMLTextAreaElement | null>;
  insertPlaceholder: (v: string) => void;
}

export const Step2: React.FC<Step2Props> = ({ selectedTone, setSelectedTone, selectedPersonalities, togglePersonality, tmi, setTmi, tmiRef, insertPlaceholder }) => (
  <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
    <div className="text-center space-y-3"><h1 className="text-2xl font-bold text-text-primary tracking-tight">최애의 성격</h1><p className="text-text-secondary text-sm font-medium">상대는 당신에게 어떤 목소리로 말을 건네나요?</p></div>
    <div className="space-y-8">
      <div className="space-y-4">
        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block text-center">Speech Style</label>
        <div className="grid grid-cols-3 gap-3">
          {TONE_KEYWORDS.map(k => (
            <button key={k} onClick={() => setSelectedTone(k)} className={`py-3 text-xs rounded-lg border transition-all font-bold ${selectedTone === k ? 'bg-primary border-primary text-white shadow-md' : 'bg-surface border-border text-text-secondary hover:border-primary-light'}`}>{k}</button>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block text-center">Personality Tags</label>
        <div className="flex flex-wrap justify-center gap-2">
          {PERSONALITY_KEYWORDS.map(k => (
            <button key={k} onClick={() => togglePersonality(k)} className={`py-2 px-4 text-xs rounded-lg border transition-all font-bold ${selectedPersonalities.includes(k) ? 'bg-accent-soft border-accent text-primary-dark shadow-sm' : 'bg-surface border-border text-text-secondary hover:bg-background'}`}>{k}</button>
          ))}
        </div>
      </div>
      <div className="space-y-4 pt-2">
        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block text-center">Additional Info (TMI)</label>
        <div className="relative">
          <textarea ref={tmiRef} value={tmi} onChange={e => setTmi(e.target.value)} placeholder={`특이 사항이나 비밀 설정을 자유롭게 적어 주세요.\n{{user}}는 사용자, {{char}}는 최애입니다.\n예) {{char}}는 최고의 아이돌 {{user}}는 구박받는 매니저`} className="w-full h-56 p-4 bg-background border-2 border-border rounded-xl outline-none focus:border-primary focus:bg-surface transition-all text-sm leading-relaxed font-medium resize-none text-text-primary placeholder:text-text-secondary/60" />
          <div className="absolute bottom-2 right-2 flex gap-1.5">
            <button onClick={() => insertPlaceholder('{{user}}')} className="px-2 py-0.5 bg-surface text-text-secondary text-[9px] font-black rounded border border-border hover:text-primary transition-colors">{"{{user}}"}</button>
            <button onClick={() => insertPlaceholder('{{char}}')} className="px-2 py-0.5 bg-surface text-text-secondary text-[9px] font-black rounded border border-border hover:text-primary transition-colors">{"{{char}}"}</button>
          </div>
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
  todayTask: string;
  setTodayTask: (v: string) => void;
  apiKey: string;
  setApiKey: (v: string) => void;
  name: string;
}

export const Step3: React.FC<Step3Props> = ({ userName, setUserName, honorific, setHonorific, gender, setGender, todayTask, setTodayTask, apiKey, setApiKey, name }) => {
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setApiKey(text.trim());
    } catch (err) {
      console.error('Failed to read clipboard');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center space-y-3"><h1 className="text-2xl font-bold text-text-primary tracking-tight">우리의 연결</h1><p className="text-text-secondary text-sm font-medium">마지막 관문입니다. 당신을 알려주세요.</p></div>
      <div className="grid grid-cols-2 gap-8 px-2">
        <div className="relative group"><label className="absolute -top-6 left-0 text-[10px] font-bold text-text-secondary uppercase tracking-widest">My Name</label><input type="text" value={userName} onChange={e => setUserName(e.target.value)} placeholder="당신의 이름" className="w-full py-2 bg-transparent border-b-2 border-border outline-none focus:border-primary transition-all font-bold text-sm text-text-primary" /></div>
        <div className="relative group"><label className="absolute -top-6 left-0 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Call Me</label><input type="text" value={honorific} onChange={e => setHonorific(e.target.value)} placeholder="부를 호칭" className="w-full py-2 bg-transparent border-b-2 border-border outline-none focus:border-primary transition-all font-bold text-sm text-text-primary" /></div>
      </div>
      <div className="space-y-4 px-2">
        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block">Gender</label>
        <div className="flex border border-border rounded-xl overflow-hidden p-1 gap-1">
          {(['MALE', 'FEMALE', 'NEUTRAL'] as const).map(g => (
            // Fix: simplified ternary to avoid type overlap error between 'NEUTRAL' and 'FEMALE'
            <button key={g} onClick={() => setGender(g)} className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all ${gender === g ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-background'}`}>{g === 'MALE' ? '남성' : g === 'FEMALE' ? '여성' : '중성'}</button>
          ))}
        </div>
      </div>
      <div className="space-y-4 px-2 pt-2">
        <label className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest"><ClipboardList size={12} className="text-primary" />최애와의 뽀모도로에서 당신이 해야 할 일은?</label>
        <input type="text" value={todayTask} onChange={e => setTodayTask(e.target.value)} placeholder="예: 제작 마감, 수학 숙제 등" className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl outline-none focus:border-primary transition-all text-sm font-bold text-text-primary placeholder:text-text-secondary/40" />
      </div>
      <div className="pt-2 px-2 space-y-4">
        <div className="flex gap-2">
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background text-[10px] font-black text-text-secondary hover:bg-slate-50 transition-all">
            API 키 발급받기 <ExternalLink size={12} />
          </a>
          <button onClick={handlePaste} className="flex-1 h-10 bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-black rounded-xl flex items-center justify-center gap-1.5 transition-all">
            복사해 온 키 붙여넣기 <ClipboardPaste size={12} />
          </button>
        </div>
        <div className="relative group">
          <label className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Gemini API Key</label>
          <div className="relative">
            <input 
              type="password" 
              value={apiKey} 
              onChange={e => setApiKey(e.target.value)} 
              placeholder="API 키를 입력하세요" 
              className="w-full bg-background border-b-2 border-border outline-none focus:border-primary font-mono text-base py-2 pr-10 placeholder:text-border text-text-primary transition-colors" 
            />
            {apiKey && (
              <button 
                onClick={() => setApiKey('')}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-text-secondary hover:text-rose-500 transition-colors"
                title="지우기"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <p className="text-[10px] text-text-secondary leading-relaxed font-bold">키를 입력하고 '소환하기'를 누르면 {name}이(가) 당신 앞에 나타납니다.</p>
      </div>
    </div>
  );
};
