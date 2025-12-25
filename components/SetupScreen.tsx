
import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, AlertCircle, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { CharacterProfile, DialogueStyles } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

// 설정 및 단계별 컴포넌트
import { GREETING_TEMPLATES, SAFETY_SETTINGS } from './SetupConfig';
import { Step1, Step2, Step3 } from './SetupSteps';
import { PersonalityQuiz } from './PersonalityQuiz';

interface SetupScreenProps {
  onComplete: (profile: CharacterProfile) => void;
}

type SetupStep = 'STEP1' | 'STEP2' | 'STEP3' | 'QUIZ';

export const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState<SetupStep>('STEP1');
  
  // 상태 관리
  const [apiKey, setApiKey] = useState('');
  const [userName, setUserName] = useState('');
  const [name, setName] = useState('');
  const [honorific, setHonorific] = useState('');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'NEUTRAL'>('FEMALE');
  const [charGender, setCharGender] = useState<'MALE' | 'FEMALE' | 'NEUTRAL' | ''>('');
  const [tmi, setTmi] = useState('');
  const [todayTask, setTodayTask] = useState('');
  const [selectedTone, setSelectedTone] = useState<string>("");
  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>([]);

  // 로직 상태
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPartialRefreshing, setIsPartialRefreshing] = useState(false);
  const [quizData, setQuizData] = useState<{ late_options: string[]; gift_options: string[]; lazy_options: string[]; } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentQuizStep, setCurrentQuizStep] = useState<number>(0); 
  const [selectedStyles, setSelectedStyles] = useState<DialogueStyles>({ late: '', gift: '', lazy: '' });
  
  // 퀴즈 임시 선택 상태 (확정 전 하이라이트용)
  const [tempQuizSelection, setTempQuizSelection] = useState<string>('');

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const tmiRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const userNameInputRef = useRef<HTMLInputElement>(null);
  const apiKeyInputRef = useRef<HTMLInputElement>(null);

  // 에러 발생 시 3초 후 자동 삭제
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 스텝 또는 퀴즈 소단계 변경 시 스크롤 상단 이동 및 에러 메시지 초기화
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setError(null);
    
    // 퀴즈 단계 이동 시 이미 선택된 값이 있다면 임시 선택값으로 복구
    if (step === 'QUIZ') {
      const quizKeys = (['late', 'gift', 'lazy'] as const);
      setTempQuizSelection(selectedStyles[quizKeys[currentQuizStep]] || '');
    }
  }, [step, currentQuizStep]);

  const togglePersonality = (keyword: string) => {
    setSelectedPersonalities(prev => {
      if (prev.includes(keyword)) return prev.filter(k => k !== keyword);
      if (prev.length >= 2) return prev; 
      return [...prev, keyword];
    });
  };

  const insertPlaceholder = (placeholder: string) => {
    if (!tmiRef.current) return;
    const { selectionStart: start, selectionEnd: end, value: text } = tmiRef.current;
    const newText = text.substring(0, start) + placeholder + text.substring(end);
    setTmi(newText);
    setTimeout(() => {
        tmiRef.current?.focus();
        tmiRef.current?.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const loadedProfile = JSON.parse(event.target?.result as string) as CharacterProfile;
        if (loadedProfile.name && loadedProfile.level !== undefined) onComplete(loadedProfile);
        else setError("올바른 캐릭터 파일이 아닙니다.");
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

  // 현재 단계가 유효한지 실시간 확인 (버튼 흐림 효과용)
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
      setStep(step === 'STEP1' ? 'STEP2' : 'STEP3');
    }
  };

  const handleBackStep = () => {
    if (step === 'QUIZ') {
      if (currentQuizStep > 0) setCurrentQuizStep(prev => prev - 1);
      else setStep('STEP3');
    } else {
      setStep(step === 'STEP3' ? 'STEP2' : 'STEP1');
    }
  };

  const generatePersonalityOptions = async () => {
    if (!validateStep()) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const processedTmi = tmi.replace(/{{user}}/g, userName).replace(/{{char}}/g, name);
      const prompt = `Character Name: ${name}, User: ${userName}, Style: ${selectedTone}, Personality: [${selectedPersonalities.join(', ')}], TMI: ${processedTmi}. Create 3 Korean dialogue options for 3 situations: late_options, gift_options, lazy_options. JSON Format.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: { type: Type.OBJECT, properties: { late_options: { type: Type.ARRAY, items: { type: Type.STRING } }, gift_options: { type: Type.ARRAY, items: { type: Type.STRING } }, lazy_options: { type: Type.ARRAY, items: { type: Type.STRING } } } },
          safetySettings: SAFETY_SETTINGS
        },
      });
      setQuizData(JSON.parse(response.text || '{}'));
      setStep('QUIZ');
      setCurrentQuizStep(0);
    } catch (e) { setError("AI 분석 실패: API 키가 올바른지 확인해주세요."); } finally { setIsGenerating(false); }
  };

  const refreshCurrentQuizStep = async () => {
    if (isPartialRefreshing || !quizData) return;
    setIsPartialRefreshing(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const situations = ["지각했을 때", "선물이나 칭찬을 받았을 때", "딴짓을 할 때"];
      const targetKey = (["late_options", "gift_options", "lazy_options"] as const)[currentQuizStep];
      const prompt = `NEW 3 Korean options for "${situations[currentQuizStep]}" situation. JSON key: "${targetKey}". Character: ${name}, Style: ${selectedTone}.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', contents: prompt,
        config: { responseMimeType: "application/json", safetySettings: SAFETY_SETTINGS },
      });
      const parsed = JSON.parse(response.text || '{}');
      if (parsed[targetKey]) {
          setQuizData(prev => ({ ...prev!, [targetKey]: parsed[targetKey] }));
          // 새로고침 시 현재 단계의 선택값을 초기화하여 데이터 무결성 유지
          handleQuizSelect('');
      }
    } catch (e) { setError("새로고침 실패."); } finally { setIsPartialRefreshing(false); }
  };

  const handleQuizSelect = (option: string) => {
    setTempQuizSelection(option);
    const key = (['late', 'gift', 'lazy'] as const)[currentQuizStep];
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
        speciesTrait: tmi, personality: [selectedTone, ...selectedPersonalities],
        selectedDialogueStyles: selectedStyles,
        dialogueCache: { scolding: [], praising: [], idle: [], click: [], pause: [], start: [] },
        xp: 0, level: 1, maxXpForNextLevel: 10, streak: 0, totalFocusMinutes: 0, receivedNotes: [], initialGreeting,
        todayTask: todayTask.trim() || undefined
      });
    }
  };

  const isValid = isCurrentStepValid();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-0 font-sans">
      <div className="w-full max-w-xl bg-white flex flex-col h-screen md:h-[720px] relative">
        
        {/* 상단 스텝 알림 바 */}
        <div className="absolute top-0 left-0 w-full flex bg-white z-20">
          {[1, 2, 3].map(i => {
            let isActive = false;
            if (step !== 'QUIZ') {
              if (step === 'STEP1' && i === 1) isActive = true;
              if (step === 'STEP2' && i <= 2) isActive = true;
              if (step === 'STEP3' && i <= 3) isActive = true;
            } else {
              if (currentQuizStep + 1 >= i) isActive = true;
            }
            return (
              <div 
                key={i} 
                className={`h-1 flex-1 transition-all duration-700 ${isActive ? 'bg-primary' : 'bg-slate-100'} ${i < 3 ? 'border-r-2 border-white' : ''}`} 
              />
            );
          })}
        </div>

        <div ref={containerRef} className="flex-1 overflow-y-auto scroll-smooth">
          {step === 'STEP1' && <Step1 name={name} setName={setName} imageSrc={imageSrc} setImageSrc={setImageSrc} charGender={charGender} setCharGender={setCharGender} onLoadClick={() => fileInputRef.current?.click()} fileInputRef={fileInputRef} handleFileChange={handleFileChange} nameInputRef={nameInputRef} />}
          <div className="px-10 pb-28">
            {step === 'STEP2' && <Step2 selectedTone={selectedTone} setSelectedTone={setSelectedTone} selectedPersonalities={selectedPersonalities} togglePersonality={togglePersonality} tmi={tmi} setTmi={setTmi} tmiRef={tmiRef} insertPlaceholder={insertPlaceholder} />}
            {step === 'STEP3' && <Step3 userName={userName} setUserName={setUserName} honorific={honorific} setHonorific={setHonorific} gender={gender} setGender={setGender} todayTask={todayTask} setTodayTask={setTodayTask} apiKey={apiKey} setApiKey={setApiKey} name={name} userNameInputRef={userNameInputRef} apiKeyInputRef={apiKeyInputRef} />}
          </div>
          {step === 'QUIZ' && <PersonalityQuiz currentQuizStep={currentQuizStep} name={name} imageSrc={imageSrc} quizData={quizData} tempSelection={tempQuizSelection} onTempSelect={handleQuizSelect} onRefresh={refreshCurrentQuizStep} isPartialRefreshing={isPartialRefreshing} />}
        </div>

        <div className="absolute bottom-0 left-0 w-full p-4 bg-white flex flex-col gap-3">
          {error && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-[90%] max-w-sm px-4 py-3 bg-[#FF7F50] text-white text-[11px] font-bold rounded-xl flex items-center gap-2 shadow-xl animate-in slide-in-from-bottom-2 duration-300">
              <AlertCircle size={14} className="shrink-0" />
              <span className="flex-1">{error}</span>
            </div>
          )}
          
          <div className="flex gap-3">
            {step !== 'STEP1' && <button onClick={handleBackStep} className="px-5 bg-white hover:bg-slate-50 text-text-secondary rounded-xl border border-slate-100 flex items-center justify-center transition-all active:scale-95 h-14"><ArrowLeft size={20}/></button>}
            
            {step === 'QUIZ' ? (
              <button 
                onClick={handleQuizConfirm} 
                disabled={!tempQuizSelection}
                className={`flex-1 font-black rounded-xl flex justify-center items-center gap-2 shadow-lg transition-all h-14 ${tempQuizSelection ? 'bg-primary text-white shadow-primary/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-40'}`}
              >
                {currentQuizStep === 2 ? '최종 선택 완료' : '선택하기'} <ArrowRight size={18}/>
              </button>
            ) : step === 'STEP3' ? (
              <button onClick={generatePersonalityOptions} disabled={isGenerating} className={`flex-1 bg-primary hover:bg-primary-light text-white font-black rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-primary/20 transition-all h-14 ${isValid ? 'opacity-100' : 'opacity-40'}`}>
                {isGenerating ? <><Loader2 className="animate-spin" size={20}/> AI 분석 중</> : <>소환하기 <Sparkles size={16} className="text-accent-soft fill-accent"/></>}
              </button>
            ) : (
              <button onClick={handleNextStep} className={`flex-1 bg-primary hover:bg-primary-light text-white font-black rounded-xl flex justify-center items-center gap-2 shadow-lg h-14 transition-all ${isValid ? 'opacity-100' : 'opacity-40'}`}>계속하기 <ArrowRight size={18}/></button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
