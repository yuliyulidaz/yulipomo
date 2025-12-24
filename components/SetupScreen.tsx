import React, { useState, useRef } from 'react';
import { ArrowRight, AlertCircle, Loader2, Sparkles, ArrowLeft, RotateCcw } from 'lucide-react';
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
  const [tmi, setTmi] = useState('');
  const [todayTask, setTodayTask] = useState('');
  const [selectedTone, setSelectedTone] = useState<string>("존댓말");
  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>([]);

  // 로직 상태
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPartialRefreshing, setIsPartialRefreshing] = useState(false);
  const [quizData, setQuizData] = useState<{ late_options: string[]; gift_options: string[]; lazy_options: string[]; } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentQuizStep, setCurrentQuizStep] = useState<number>(0); 
  const [selectedStyles, setSelectedStyles] = useState<DialogueStyles>({ late: '', gift: '', lazy: '' });

  const tmiRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 이벤트 핸들러
  const resetAllFields = () => {
    if (window.confirm("입력한 모든 내용을 초기화할까요?")) {
      setApiKey(''); setUserName(''); setName(''); setHonorific(''); setImageSrc(null); setTmi(''); setTodayTask('');
      setSelectedPersonalities([]); setSelectedTone("존댓말"); setError(null); setStep('STEP1');
    }
  };

  const togglePersonality = (keyword: string) => {
    setSelectedPersonalities(prev => prev.includes(keyword) ? prev.filter(k => k !== keyword) : [...prev, keyword]);
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

  const generatePersonalityOptions = async () => {
    setError(null);
    if (!apiKey) return setError('Gemini API 키를 입력해주세요.');
    if (!userName) return setError('당신의 이름을 입력해주세요.');
    if (!name) return setError('최애의 이름을 입력해주세요.');
    if (!imageSrc) return setError('캐릭터 이미지를 업로드해주세요.');
    if (selectedPersonalities.length === 0) return setError('성격 키워드를 최소 1개 선택해주세요.');

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
      if (parsed[targetKey]) setQuizData(prev => ({ ...prev!, [targetKey]: parsed[targetKey] }));
    } catch (e) { setError("새로고침 실패."); } finally { setIsPartialRefreshing(false); }
  };

  const handleOptionSelect = (option: string) => {
    if (currentQuizStep < 2) {
      const key = (['late', 'gift', 'lazy'] as const)[currentQuizStep];
      setSelectedStyles(prev => ({ ...prev, [key]: option }));
      setCurrentQuizStep(prev => prev + 1);
    } else {
      const finalStyles = { ...selectedStyles, lazy: option };
      const targetName = honorific || userName || "당신";
      const initialGreeting = GREETING_TEMPLATES[selectedTone].replace("{honorific}", targetName);
      onComplete({
        apiKey, userName, name, honorific: targetName, imageSrc, gender,
        speciesTrait: tmi, personality: [selectedTone, ...selectedPersonalities],
        selectedDialogueStyles: finalStyles,
        dialogueCache: { scolding: [], praising: [], idle: [], click: [], pause: [], start: [] },
        xp: 0, level: 1, maxXpForNextLevel: 10, streak: 0, totalFocusMinutes: 0, receivedNotes: [], initialGreeting,
        todayTask: todayTask.trim() || undefined
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-6 font-sans">
      <div className="w-full max-w-xl bg-surface rounded-2xl shadow-xl overflow-hidden flex flex-col h-[680px] md:h-[720px] relative border border-border">
        
        <div className="absolute top-0 left-0 w-full flex bg-background z-20 border-b border-border/50">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 flex-1 transition-all duration-700 ${ (step === 'STEP1' && i === 1) || (step === 'STEP2' && i <= 2) || (step === 'STEP3' && i <= 3) || step === 'QUIZ' ? 'bg-primary' : 'bg-transparent' }`} />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-10 pt-16 pb-28 scroll-smooth">
          {step === 'STEP1' && <Step1 name={name} setName={setName} imageSrc={imageSrc} setImageSrc={setImageSrc} onLoadClick={() => fileInputRef.current?.click()} fileInputRef={fileInputRef} handleFileChange={handleFileChange} />}
          {step === 'STEP2' && <Step2 selectedTone={selectedTone} setSelectedTone={setSelectedTone} selectedPersonalities={selectedPersonalities} togglePersonality={togglePersonality} tmi={tmi} setTmi={setTmi} tmiRef={tmiRef} insertPlaceholder={insertPlaceholder} />}
          {step === 'STEP3' && <Step3 userName={userName} setUserName={setUserName} honorific={honorific} setHonorific={setHonorific} gender={gender} setGender={setGender} todayTask={todayTask} setTodayTask={setTodayTask} apiKey={apiKey} setApiKey={setApiKey} name={name} />}
          {step === 'QUIZ' && <PersonalityQuiz currentQuizStep={currentQuizStep} name={name} imageSrc={imageSrc} quizData={quizData} onOptionSelect={handleOptionSelect} onRefresh={refreshCurrentQuizStep} isPartialRefreshing={isPartialRefreshing} />}
        </div>

        <div className="absolute bottom-0 left-0 w-full p-6 bg-surface/90 backdrop-blur-md border-t border-border flex flex-col gap-3">
          {error && <div className="mb-2 px-4 py-2 bg-rose-50 text-rose-600 text-[10px] font-black rounded-lg flex items-center gap-2 border border-rose-100 animate-shake"><AlertCircle size={12} /> {error}</div>}
          <div className="flex gap-3">
            {step !== 'STEP1' && <button onClick={() => setStep(step === 'STEP3' ? 'STEP2' : (step === 'STEP2' ? 'STEP1' : 'STEP3'))} className="px-5 bg-background hover:bg-border text-text-secondary rounded-xl border border-border flex items-center justify-center transition-all active:scale-95 h-14"><ArrowLeft size={20}/></button>}
            {step === 'STEP3' ? (
              <button onClick={generatePersonalityOptions} disabled={isGenerating} className="flex-1 bg-primary hover:bg-primary-light text-white font-black rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-primary/20 transition-all h-14">
                {isGenerating ? <><Loader2 className="animate-spin" size={20}/> AI 분석 중</> : <>소환하기 <Sparkles size={16} className="text-accent-soft fill-accent"/></>}
              </button>
            ) : step !== 'QUIZ' ? (
              <button onClick={() => { if(step==='STEP1' && (!name || !imageSrc)) return setError('필수 항목을 입력하세요.'); if(step==='STEP2' && selectedPersonalities.length===0) return setError('성격을 선택하세요.'); setError(null); setStep(step==='STEP1' ? 'STEP2' : 'STEP3'); }} className="flex-1 bg-primary hover:bg-primary-light text-white font-black rounded-xl flex justify-center items-center gap-2 shadow-lg h-14">계속하기 <ArrowRight size={18}/></button>
            ) : (
              <div className="flex-1 flex items-center justify-center h-14"><button onClick={resetAllFields} className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2 text-[11px] font-black uppercase tracking-widest"><RotateCcw size={14}/> Reset Profile</button></div>
            )}
          </div>
        </div>
      </div>
      <style>{`.animate-shake { animation: shake 0.4s both; } @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 30%, 70% { transform: translate3d(-4px, 0, 0); } 50% { transform: translate3d(4px, 0, 0); } }`}</style>
    </div>
  );
};
