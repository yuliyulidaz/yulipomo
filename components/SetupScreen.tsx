
import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, AlertCircle, Loader2, Sparkles, ArrowLeft, FolderOpen } from 'lucide-react';
import { CharacterProfile, DialogueStyles } from '../types';
import { Type } from "@google/genai"; // 👈 Type 임포트 필수!

import { GREETING_TEMPLATES, SAFETY_SETTINGS } from './SetupConfig';
import { Step1, Step2, Step3 } from './SetupSteps';
import { PersonalityQuiz } from './PersonalityQuiz';
import { buildQuizPrompt, buildRefreshQuizPrompt } from './AIPromptTemplates';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { ApiKeyHelpModal } from './ApiKeyHelpModal';
import { generateWithFallback } from '../utils/GeminiDelegate';

const QUIZ_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    late_options: { type: Type.ARRAY, items: { type: Type.STRING } },
    gift_options: { type: Type.ARRAY, items: { type: Type.STRING } },
    lazy_options: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["late_options", "gift_options", "lazy_options"] // 필수 항목 지정
};

interface SetupScreenProps {
  onComplete: (profile: CharacterProfile) => void;
}

type SetupStep = 'STEP1' | 'STEP2' | 'STEP3' | 'QUIZ';

export const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState<SetupStep>('STEP1');
  const [apiKey, setApiKey] = useState('');
  const [userName, setUserName] = useState('');
  const [name, setName] = useState('');
  const [honorific, setHonorific] = useState('');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'NEUTRAL'>('FEMALE');
  const [charGender, setCharGender] = useState<'MALE' | 'FEMALE' | 'NEUTRAL' | ''>('');
  const [charJob, setCharJob] = useState('');
  const [userJob, setUserJob] = useState('');
  const [todayTask, setTodayTask] = useState('');
  const [selectedTone, setSelectedTone] = useState<string>("");
  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPartialRefreshing, setIsPartialRefreshing] = useState(false);
  const [quizData, setQuizData] = useState<{ late_options: string[]; gift_options: string[]; lazy_options: string[]; } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentQuizStep, setCurrentQuizStep] = useState<number>(0); 
  const [selectedStyles, setSelectedStyles] = useState<DialogueStyles>({ late: '', gift: '', lazy: '' });
  const [tempQuizSelection, setTempQuizSelection] = useState<string>('');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  
  const [isImportedProfile, setIsImportedProfile] = useState(false);
  const [importedBaseProfile, setImportedBaseProfile] = useState<Partial<CharacterProfile> | null>(null);

  const [containerHeight, setContainerHeight] = useState<string>('100dvh');

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const userNameInputRef = useRef<HTMLInputElement>(null);
  const apiKeyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const handleResize = () => {
      if (window.innerWidth < 768) {
        if (isIOS) setContainerHeight('100dvh');
        else setContainerHeight(`${window.innerHeight}px`);
      } else {
        setContainerHeight('720px');
      }
    };
    handleResize();
    const timer = setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    setError(null);
    if (step === 'QUIZ') {
      const quizKeys: Array<keyof DialogueStyles> = ['late', 'gift', 'lazy'];
      setTempQuizSelection(selectedStyles[quizKeys[currentQuizStep]] || '');
    }
  }, [step, currentQuizStep, selectedStyles]);

  const togglePersonality = (keyword: string) => {
    setSelectedPersonalities(prev => {
      if (prev.includes(keyword)) return prev.filter(k => k !== keyword);
      if (prev.length >= 2) return prev; 
      return [...prev, keyword];
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const loadedProfile = JSON.parse(event.target?.result as string) as CharacterProfile;
        if (loadedProfile.name && loadedProfile.selectedDialogueStyles?.late) {
          setName(loadedProfile.name);
          setUserName(loadedProfile.userName || "");
          setHonorific(loadedProfile.honorific || "");
          setImageSrc(loadedProfile.imageSrc);
          setCharGender(loadedProfile.charGender);
          setGender(loadedProfile.gender || 'FEMALE');
          setCharJob(loadedProfile.charJob || "");
          setUserJob(loadedProfile.userJob || "");
          setSelectedStyles(loadedProfile.selectedDialogueStyles);
          if (loadedProfile.personality) {
            setSelectedTone(loadedProfile.personality[0]);
            setSelectedPersonalities(loadedProfile.personality.slice(1));
          }
          setIsImportedProfile(true);
          setImportedBaseProfile(loadedProfile);
          setStep('STEP3');
          setError(null);
        } else if (loadedProfile.name && loadedProfile.level !== undefined) {
          onComplete(loadedProfile);
        } else {
          setError("올바른 캐릭터 파일이 아닙니다.");
        }
      } catch (err) { setError("파일을 읽는 도중 오류가 발생했습니다."); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const validateStep = () => {
    if (step === 'STEP1') {
      if (!imageSrc) { setError('최애의 이미지를 등록해주세요.'); return false; }
      if (!name.trim()) { setError('최애의 이름을 입력해주세요.'); nameInputRef.current?.focus(); return false; }
      if (!charGender) { setError('최애의 성별을 선택해주세요.'); return false; }
    } else if (step === 'STEP2') {
      if (!selectedTone) { setError('말투를 선택해주세요.'); return false; }
      if (selectedPersonalities.length === 0) { setError('성격 키워드를 선택해주세요.'); return false; }
    } else if (step === 'STEP3') {
      if (!userName.trim()) { setError('당신의 이름을 입력해주세요.'); userNameInputRef.current?.focus(); return false; }
      if (!apiKey.trim()) { setError('Gemini API 키를 입력해주세요.'); apiKeyInputRef.current?.focus(); return false; }
    }
    return true;
  };

  const isCurrentStepValid = () => {
    if (step === 'STEP1') return !!imageSrc && !!name.trim() && !!charGender;
    if (step === 'STEP2') return !!selectedTone && selectedPersonalities.length > 0;
    if (step === 'STEP3') return !!userName.trim() && !!apiKey.trim();
    if (step === 'QUIZ') return !!tempQuizSelection;
    return false;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      setError(null);
      if (step === 'STEP1') setStep('STEP2');
      else if (step === 'STEP2') setStep('STEP3');
    }
  };

  const handleBackStep = () => {
    if (step === 'QUIZ') {
      if (currentQuizStep > 0) setCurrentQuizStep(prev => prev - 1);
      else setStep('STEP3');
    } else if (step === 'STEP3') {
      if (isImportedProfile) {
        setIsImportedProfile(false);
        setImportedBaseProfile(null);
        setStep('STEP1');
      } else {
        setStep('STEP2');
      }
    }
    else if (step === 'STEP2') setStep('STEP1');
  };

  const generatePersonalityOptions = async () => {
    if (!validateStep()) return;
    const effectiveHonorific = honorific || userName || "당신";
    
    if (isImportedProfile && importedBaseProfile) {
      const initialGreeting = GREETING_TEMPLATES[selectedTone].replace("{honorific}", effectiveHonorific);
      onComplete({
        ...importedBaseProfile as CharacterProfile,
        apiKey,
        userName,
        honorific: effectiveHonorific,
        todayTask: todayTask.trim() || importedBaseProfile.todayTask,
        initialGreeting: importedBaseProfile.initialGreeting || initialGreeting
      });
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = buildQuizPrompt({ 
        name, 
        charGender, 
        selectedPersonalities, 
        selectedTone, 
        charJob,
        userJob,
        userName, 
        gender, 
        honorific: effectiveHonorific 
      });
      
      const response = await generateWithFallback(apiKey, prompt, SAFETY_SETTINGS, QUIZ_SCHEMA);
      
      // Access text as a property, not a method, per Gemini API guidelines.
      const rawText = response?.text || "";

      if (!rawText) throw new Error("AI 응답 텍스트 없음");

      const cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsedData = JSON.parse(cleanText);
      
      if (!parsedData.late_options || !parsedData.gift_options) {
        throw new Error("필수 항목 누락 (late_options 등)");
      }
      
      setQuizData(parsedData);
      setStep('QUIZ');
      setCurrentQuizStep(0);

    } catch (e: any) { 
      console.error("💥 [Setup] 에러:", e);
      setError(e.message || "AI 분석 실패");
    } finally { 
      setIsGenerating(false); 
    }
  };

  const refreshCurrentQuizStep = async () => {
    if (isPartialRefreshing || !quizData) return;
    setIsPartialRefreshing(true);
    try {
      const situationKeys = ["late_options", "gift_options", "lazy_options"];
      const targetKey = situationKeys[currentQuizStep];
      const effectiveHonorific = honorific || userName || "당신";
      
      const prompt = buildRefreshQuizPrompt({ 
        name, 
        charGender, 
        selectedPersonalities, 
        selectedTone, 
        charJob,
        userJob,
        userName, 
        gender, 
        honorific: effectiveHonorific, 
        situationIdx: currentQuizStep, 
        targetKey 
      });

      const response = await generateWithFallback(apiKey, prompt, SAFETY_SETTINGS, QUIZ_SCHEMA);

      // Access text as a property, not a method, per Gemini API guidelines.
      const rawText = response?.text || "";

      const cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanText);

      if (parsed[targetKey]) {
          setQuizData(prev => ({ ...prev!, [targetKey]: parsed[targetKey] }));
          handleQuizSelect('');
      }
    } catch (e: any) { 
        setError(e.message || "새로고침 실패."); 
    } finally { 
        setIsPartialRefreshing(false); 
    }
  };

  const handleQuizSelect = (option: string) => {
    setTempQuizSelection(option);
    const quizKeys: Array<keyof DialogueStyles> = ['late', 'gift', 'lazy'];
    const key = quizKeys[currentQuizStep];
    setSelectedStyles(prev => ({ ...prev, [key]: option }));
  };

  const handleQuizConfirm = () => {
    if (!tempQuizSelection) return;
    if (currentQuizStep < 2) {
      setCurrentQuizStep(prev => prev + 1);
    } else {
      const targetName = honorific || userName || "당신";
      const initialGreeting = GREETING_TEMPLATES[selectedTone].replace("{honorific}", targetName);
      
      onComplete({
        apiKey, userName, name, honorific: targetName, imageSrc, gender, charGender,
        charJob, userJob, personality: [selectedTone, ...selectedPersonalities],
        selectedDialogueStyles: selectedStyles,
        dialogueCache: { scolding: [], click: [], pause: [], start: [] },
        xp: 0, level: 1, maxXpForNextLevel: 10, streak: 0, totalFocusMinutes: 0, totalCompletedCycles: 0, receivedNotes: [], initialGreeting,
        todayTask: todayTask.trim() || undefined,
        diaryHistory: []
      });
    }
  };

  const isValid = isCurrentStepValid();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-0 font-sans">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
      <div 
        className="w-full max-w-xl bg-white flex flex-col relative overflow-hidden" 
        style={{ height: containerHeight }}
      >
        <div className="flex-none w-full flex bg-white z-20">
          {[1, 2, 3].map(i => {
            let isActive = step === 'QUIZ' || (step === 'STEP1' && i === 1) || (step === 'STEP2' && i <= 2) || (step === 'STEP3' && i <= 3);
            return <div key={i} className={`h-1 flex-1 transition-all duration-700 ${isActive ? 'bg-primary' : 'bg-slate-100'} ${i < 3 ? 'border-r-2 border-white' : ''}`} />;
          })}
        </div>

        <div ref={containerRef} className="flex-1 overflow-y-auto scroll-smooth pt-4 relative">
          {step === 'STEP1' && (
            <Step1 
              name={name} 
              setName={setName} 
              imageSrc={imageSrc} 
              setImageSrc={setImageSrc} 
              charGender={charGender} 
              setCharGender={setCharGender} 
              onPrivacyOpen={() => setIsPrivacyModalOpen(true)}
              nameInputRef={nameInputRef} 
            />
          )}
          {(step === 'STEP2' || step === 'STEP3') && <div className="px-10 pb-4">
            {step === 'STEP2' && <Step2 selectedTone={selectedTone} setSelectedTone={setSelectedTone} selectedPersonalities={selectedPersonalities} togglePersonality={togglePersonality} charJob={charJob} setCharJob={setCharJob} />}
            {step === 'STEP3' && <Step3 userName={userName} setUserName={setUserName} honorific={honorific} setHonorific={setHonorific} gender={gender} setGender={setGender} userJob={userJob} setUserJob={setUserJob} todayTask={todayTask} setTodayTask={setTodayTask} apiKey={apiKey} setApiKey={setApiKey} name={name} userNameInputRef={userNameInputRef} apiKeyInputRef={apiKeyInputRef} onHelpOpen={() => setIsHelpModalOpen(true)} />}
          </div>}
          {step === 'QUIZ' && <PersonalityQuiz currentQuizStep={currentQuizStep} name={name} imageSrc={imageSrc} quizData={quizData} tempSelection={tempQuizSelection} onTempSelect={handleQuizSelect} onRefresh={refreshCurrentQuizStep} isPartialRefreshing={isPartialRefreshing} />}
        </div>

        <div className={`flex-none px-10 pt-4 bg-white flex flex-col gap-3 relative z-30 pb-[max(3rem,calc(env(safe-area-inset-bottom)+1.2rem))]`}>
          {error && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-[90%] max-w-sm px-4 py-3 bg-[#FF7F50] text-white text-[11px] font-bold rounded-xl flex items-center gap-2 shadow-xl animate-in slide-in-from-bottom-2 duration-300">
              <AlertCircle size={14} className="shrink-0" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            {step === 'STEP1' ? (
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="px-5 bg-white hover:bg-slate-50 text-text-secondary rounded-xl border border-slate-100 flex flex-col items-center justify-center transition-all active:scale-95 h-14"
                title="불러오기"
              >
                <FolderOpen size={18}/>
                <span className="text-[8px] font-black leading-none mt-1 uppercase">Load</span>
              </button>
            ) : (
              <button 
                onClick={handleBackStep} 
                className="px-5 bg-white hover:bg-slate-50 text-text-secondary rounded-xl border border-slate-100 flex items-center justify-center transition-all active:scale-95 h-14"
              >
                <ArrowLeft size={20}/>
              </button>
            )}
            
            {step === 'QUIZ' ? (
              <button 
                onClick={handleQuizConfirm} 
                disabled={!tempQuizSelection} 
                className={`flex-1 font-black rounded-xl flex justify-center items-center gap-2 shadow-lg transition-all h-14 ${tempQuizSelection ? 'bg-primary text-white shadow-primary/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-40'}`}
              >
                {currentQuizStep === 2 ? '최종 선택 완료' : '선택하기'} <ArrowRight size={18}/>
              </button>
            ) : step === 'STEP3' ? (
              <button 
                onClick={generatePersonalityOptions} 
                disabled={isGenerating} 
                className={`flex-1 bg-primary hover:bg-primary-light text-white font-black rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-primary/20 transition-all h-14 ${isValid ? 'opacity-100' : 'opacity-40'}`}
              >
                {isGenerating ? <><Loader2 className="animate-spin" size={20}/> AI 분석 중</> : (isImportedProfile ? <>기존 데이터로 시작하기 <Sparkles size={16} className="text-accent-soft fill-accent"/></> : <>소환하기 <Sparkles size={16} className="text-accent-soft fill-accent"/></>)}
              </button>
            ) : (
              <button 
                onClick={handleNextStep} 
                className={`flex-1 bg-primary hover:bg-primary-light text-white font-black rounded-xl flex justify-center items-center gap-2 shadow-lg h-14 transition-all ${isValid ? 'opacity-100' : 'opacity-40'}`}
              >
                계속하기 <ArrowRight size={18}/>
              </button>
            )}
          </div>
        </div>
      </div>
      <PrivacyPolicyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} isDarkMode={false} />
      <ApiKeyHelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} isDarkMode={false} />
    </div>
  );
};
