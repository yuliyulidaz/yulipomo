
import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, AlertCircle, Loader2, Sparkles, RefreshCw, ArrowLeft, RotateCcw, MessageSquareHeart, Key, User, Camera, Heart, ExternalLink, FileJson } from 'lucide-react';
import { CharacterProfile, DialogueStyles } from '../types';
import { FileUpload } from './FileUpload';
// Import HarmCategory and HarmBlockThreshold to fix type errors
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";

const GREETING_TEMPLATES: Record<string, string> = {
  "반말": "{honorific}, 시작 버튼 눌러. 기다리고 있어.",
  "존댓말": "준비되셨나요? 시작 버튼을 눌러주세요, {honorific}.",
  "반존대": "{honorific}, 시작 버튼 안 보여요? 얼른 눌러요.",
  "사극/하오체": "준비가 되었으면 시작 버튼을 누르시오, {honorific}.",
  "다나까": "{honorific}, 시작 버튼 안 누릅니까? 기다리고 있습니다."
};

// Use HarmCategory and HarmBlockThreshold enums for correct typing
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
];

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
  const [tmi, setTmi] = useState('');
  
  const [selectedTone, setSelectedTone] = useState<string>("존댓말");
  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isPartialRefreshing, setIsPartialRefreshing] = useState(false);
  const [quizData, setQuizData] = useState<{
    late_options: string[];
    gift_options: string[];
    lazy_options: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentQuizStep, setCurrentQuizStep] = useState<number>(0); 
  const [selectedStyles, setSelectedStyles] = useState<DialogueStyles>({ late: '', gift: '', lazy: '' });
  const [isSparkling, setIsSparkling] = useState(false);

  const tmiRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const TONE_KEYWORDS = ["반말", "존댓말", "반존대", "사극/하오체", "다나까"];
  const PERSONALITY_KEYWORDS = ["다정함/스윗", "츤데레", "엄격/냉철", "능글/플러팅", "집착/광공", "소심/부끄", "활기/에너지", "나른/귀차니즘"];

  const resetAllFields = () => {
    if (window.confirm("입력한 모든 내용을 초기화할까요?")) {
      setApiKey('');
      setUserName('');
      setName('');
      setHonorific('');
      setImageSrc(null);
      setTmi('');
      setSelectedPersonalities([]);
      setSelectedTone("존댓말");
      setError(null);
      setStep('STEP1');
    }
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const loadedProfile = JSON.parse(event.target?.result as string) as CharacterProfile;
        // 최소한의 유효성 검사 (필수 필드 확인)
        if (loadedProfile.name && loadedProfile.level !== undefined && loadedProfile.dialogueCache) {
          onComplete(loadedProfile);
        } else {
          setError("올바른 캐릭터 파일이 아닙니다.");
        }
      } catch (err) {
        setError("파일을 읽는 도중 오류가 발생했습니다.");
      }
    };
    reader.readAsText(file);
    // 선택 후 리셋 (같은 파일 다시 선택 가능하도록)
    e.target.value = '';
  };

  const togglePersonality = (keyword: string) => {
    setSelectedPersonalities(prev => {
      const isAdding = !prev.includes(keyword);
      if (isAdding) {
        setIsSparkling(true);
        setTimeout(() => setIsSparkling(false), 600);
      }
      return isAdding ? [...prev, keyword] : prev.filter(k => k !== keyword);
    });
  };

  const insertPlaceholder = (placeholder: string) => {
    if (!tmiRef.current) return;
    const start = tmiRef.current.selectionStart;
    const end = tmiRef.current.selectionEnd;
    const text = tmiRef.current.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const newText = before + placeholder + after;
    setTmi(newText);
    setTimeout(() => {
        tmiRef.current?.focus();
        tmiRef.current?.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 0);
  };

  const refreshCurrentQuizStep = async () => {
    if (isPartialRefreshing || !quizData) return;
    setError(null);
    setIsPartialRefreshing(true);

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });
      const situations = ["지각했을 때", "선물이나 칭찬을 건넸을 때", "내가 딴짓을 하거나 게으름을 피울 때"];
      const targetKey = (["late_options", "gift_options", "lazy_options"] as const)[currentQuizStep];
      
      const prompt = `
        Character: ${name}, User: ${userName}, Tone: ${selectedTone}, Personality: ${selectedPersonalities.join(', ')}
        Task: Create 3 NEW immersive roleplay dialogue options in Korean for ONLY this situation: "${situations[currentQuizStep]}".
        
        Constraints:
        - Length: Each option must be at least 10 characters and within 20 characters.
        - Safety: This app is for students. NO sexual, 18+, violent, or inappropriate content.
        - Format: JSON Object with single key: "${targetKey}" (Array of 3 strings).
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { [targetKey]: { type: Type.ARRAY, items: { type: Type.STRING } } }
          },
          safetySettings: SAFETY_SETTINGS
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed[targetKey]) {
        setQuizData(prev => ({ ...prev!, [targetKey]: parsed[targetKey] }));
      }
    } catch (e: any) {
      setError("보기를 새로 가져오는데 실패했습니다.");
    } finally {
      setIsPartialRefreshing(false);
    }
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
      const ai = new GoogleGenAI({ apiKey: apiKey });
      const processedTmi = tmi.replace(/{{user}}/g, userName).replace(/{{char}}/g, name);
      const prompt = `
        Character Name: ${name}, User Name: ${userName}, Bias calls user: ${honorific || userName}
        Gender: ${gender}, TMI: ${processedTmi}, Style: ${selectedTone}, Personality: [${selectedPersonalities.join(', ')}]
        Task: Create 3 immersive roleplay dialogue options in Korean for 3 situations: 1. late_options, 2. gift_options, 3. lazy_options.
        
        Constraints:
        - Length: Each sentence must be at least 10 characters and within 20 characters.
        - Safety: This app is for students. STRICTLY FORBID sexual, 18+, or inappropriate content.
        - Format: JSON Object.
      `;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
               late_options: { type: Type.ARRAY, items: { type: Type.STRING } },
               gift_options: { type: Type.ARRAY, items: { type: Type.STRING } },
               lazy_options: { type: Type.ARRAY, items: { type: Type.STRING } },
            }
          },
          safetySettings: SAFETY_SETTINGS
        },
      });
      const parsed = JSON.parse(response.text || '{}');
      setQuizData(parsed);
      setStep('QUIZ');
      setCurrentQuizStep(0);
    } catch (e: any) {
      setError("AI 분석 실패: API 키가 올바른지 확인해주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (!quizData) return;
    if (currentQuizStep === 0) {
      setSelectedStyles(prev => ({ ...prev, late: option }));
      setCurrentQuizStep(1);
    } else if (currentQuizStep === 1) {
      setSelectedStyles(prev => ({ ...prev, gift: option }));
      setCurrentQuizStep(2);
    } else {
      const finalStyles = { ...selectedStyles, lazy: option };
      const targetName = honorific || userName || "당신";
      const currentToneKey = selectedTone in GREETING_TEMPLATES ? selectedTone : "존댓말";
      const initialGreeting = GREETING_TEMPLATES[currentToneKey].replace("{honorific}", targetName);

      onComplete({
        apiKey, userName, name, honorific: targetName, imageSrc, gender,
        speciesTrait: tmi, personality: [selectedTone, ...selectedPersonalities],
        selectedDialogueStyles: finalStyles,
        dialogueCache: { scolding: [], praising: [], idle: [], click: [], pause: [], start: [] },
        xp: 0, level: 1, maxXpForNextLevel: 10, streak: 0, totalFocusMinutes: 0, receivedNotes: [], initialGreeting
      });
    }
  };

  const nextStep = () => {
    if (step === 'STEP1') {
      if (!name) return setError('상대의 이름을 입력해주세요.');
      if (!imageSrc) return setError('이미지를 업로드해주세요.');
      setError(null);
      setStep('STEP2');
    } else if (step === 'STEP2') {
      if (selectedPersonalities.length === 0) return setError('성격을 최소 1개 선택해주세요.');
      setError(null);
      setStep('STEP3');
    }
  };

  const prevStep = () => {
    if (step === 'STEP2') setStep('STEP1');
    if (step === 'STEP3') setStep('STEP2');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-6 font-sans">
      <div className="w-full max-w-xl bg-surface rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.1),0_10px_20px_rgba(74,95,122,0.05)] overflow-hidden flex flex-col h-[680px] md:h-[720px] relative border border-border">
        
        <div className="absolute top-0 left-0 w-full flex bg-background z-20 border-b border-border/50">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 flex-1 transition-all duration-700 ${
              (step === 'STEP1' && i === 1) || (step === 'STEP2' && i <= 2) || (step === 'STEP3' && i <= 3) || step === 'QUIZ' 
              ? 'bg-primary' : 'bg-transparent'
            }`} />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-10 pt-16 pb-28 scroll-smooth">
          {step === 'STEP1' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 text-center">
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 mb-1">
                    <Heart size={14} className="text-accent fill-accent" />
                    <span className="text-[10px] font-black text-primary tracking-widest uppercase">My Bias Pomodoro</span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight">최애 뽀모도로 : 최애와 함께 성장하는 25/5</h1>
                <p className="text-text-secondary text-sm font-medium">당신과 함께 할 상대는 누구인가요?</p>
              </div>

              <div className="relative w-44 h-44 mx-auto">
                <div className={`w-full h-full rounded-2xl overflow-hidden border-2 transition-all duration-500 ${imageSrc ? 'border-primary shadow-lg shadow-primary/10' : 'border-border bg-background'}`}>
                  {imageSrc ? (
                    <img src={imageSrc} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary opacity-40">
                      <Camera size={40} strokeWidth={1} />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-3 -right-3">
                   <FileUpload onImageSelected={setImageSrc} currentImage={imageSrc} onClear={() => setImageSrc(null)} />
                </div>
              </div>

              <div className="max-w-xs mx-auto pt-6 flex flex-col items-center">
                <div className="relative w-full">
                  <label className="absolute -top-6 left-0 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Bias Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="'최애'의 이름을 적어주세요" 
                    className="w-full px-0 py-3 bg-transparent border-b-2 border-border outline-none focus:border-primary transition-all text-center font-bold text-xl placeholder:text-border placeholder:font-normal text-text-primary"
                  />
                </div>
                
                {/* 로드(불러오기) 버튼 */}
                <div className="mt-8">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".json" 
                    className="hidden" 
                  />
                  <button 
                    onClick={handleLoadClick}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-dashed border-primary/40 text-primary hover:bg-primary/5 hover:border-primary transition-all group"
                  >
                    <FileJson size={14} className="group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black">이미 함께하는 최애가 있나요? (불러오기)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'STEP2' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center space-y-3">
                <h1 className="text-2xl font-bold text-text-primary tracking-tight">최애의 성격</h1>
                <p className="text-text-secondary text-sm font-medium">상대는 당신에게 어떤 목소리로 말을 건네나요?</p>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block text-center">Speech Style</label>
                  <div className="grid grid-cols-3 gap-3">
                    {TONE_KEYWORDS.map(k => (
                      <button 
                        key={k} 
                        onClick={() => setSelectedTone(k)} 
                        className={`py-3 text-xs rounded-lg border transition-all font-bold ${selectedTone === k ? 'bg-primary border-primary text-white shadow-md' : 'bg-surface border-border text-text-secondary hover:border-primary-light'}`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block text-center">Personality Tags</label>
                  <div className="flex flex-wrap justify-center gap-2">
                    {PERSONALITY_KEYWORDS.map(k => (
                      <button 
                        key={k} 
                        onClick={() => togglePersonality(k)} 
                        className={`py-2 px-4 text-xs rounded-lg border transition-all font-bold ${selectedPersonalities.includes(k) ? 'bg-accent-soft border-accent text-primary-dark shadow-sm' : 'bg-surface border-border text-text-secondary hover:bg-background'}`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block text-center">Additional Info (TMI)</label>
                  <div className="relative">
                    <textarea 
                      ref={tmiRef} 
                      value={tmi} 
                      onChange={e => setTmi(e.target.value)} 
                      placeholder={`특이 사항이나 비밀 설정을 자유롭게 적어 주세요.\n{{user}}는 사용자, {{char}}는 최애입니다.\n예) {{char}}는 최고의 아이돌 {{user}}는 구박받는 매니저\n예) {{char}}는 북부공작 {{user}}는 야근에 시달리는 보좌관`} 
                      className="w-full h-56 p-4 bg-background border-2 border-border rounded-xl outline-none focus:border-primary focus:bg-surface transition-all text-sm leading-relaxed font-medium resize-none text-text-primary placeholder:text-text-secondary/60" 
                    />
                    <div className="absolute bottom-2 right-2 flex gap-1.5">
                      <button onClick={() => insertPlaceholder('{{user}}')} className="px-2 py-0.5 bg-surface text-text-secondary text-[9px] font-black rounded border border-border hover:text-primary transition-colors">{"{{user}}"}</button>
                      <button onClick={() => insertPlaceholder('{{char}}')} className="px-2 py-0.5 bg-surface text-text-secondary text-[9px] font-black rounded border border-border hover:text-primary transition-colors">{"{{char}}"}</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'STEP3' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center space-y-3">
                <h1 className="text-2xl font-bold text-text-primary tracking-tight">우리의 연결</h1>
                <p className="text-text-secondary text-sm font-medium">마지막 관문입니다. 당신을 알려주세요.</p>
              </div>

              <div className="grid grid-cols-2 gap-8 px-2">
                <div className="relative group">
                  <label className="absolute -top-6 left-0 text-[10px] font-bold text-text-secondary uppercase tracking-widest">My Name</label>
                  <input type="text" value={userName} onChange={e => setUserName(e.target.value)} placeholder="당신의 이름" className="w-full py-2 bg-transparent border-b-2 border-border outline-none focus:border-primary transition-all font-bold text-sm text-text-primary" />
                </div>
                <div className="relative group">
                  <label className="absolute -top-6 left-0 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Call Me</label>
                  <input type="text" value={honorific} onChange={e => setHonorific(e.target.value)} placeholder="부를 호칭" className="w-full py-2 bg-transparent border-b-2 border-border outline-none focus:border-primary transition-all font-bold text-sm text-text-primary" />
                </div>
              </div>

              <div className="space-y-4 px-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block">Gender</label>
                <div className="flex border border-border rounded-xl overflow-hidden p-1 gap-1">
                  {(['MALE', 'FEMALE', 'NEUTRAL'] as const).map(g => (
                    <button 
                      key={g} 
                      onClick={() => setGender(g)} 
                      className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all ${gender === g ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-background'}`}
                    >
                      {g === 'MALE' ? '남성' : g === 'FEMALE' ? '여성' : '중성'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 px-2 space-y-5">
                <div className="flex justify-between items-end border-b-2 border-border pb-2 focus-within:border-primary transition-colors">
                  <div className="space-y-1 flex-1">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                       Gemini API Key
                    </label>
                    <input 
                      type="password" 
                      value={apiKey} 
                      onChange={e => setApiKey(e.target.value)} 
                      placeholder="API 키를 입력하세요" 
                      className="w-full bg-transparent outline-none font-mono text-base placeholder:text-border text-text-primary" 
                    />
                  </div>
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-1 text-[10px] font-black text-primary hover:text-primary-dark transition-colors"
                  >
                    키 발급받기 <ExternalLink size={12} />
                  </a>
                </div>
                <p className="text-[10px] text-text-secondary leading-relaxed font-bold">
                  키를 입력하고 '소환하기'를 누르면 {name}이(가) 당신 앞에 나타납니다.
                </p>
              </div>
            </div>
          )}

          {step === 'QUIZ' && quizData && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
               <div className="text-center space-y-4 px-4">
                  <div className="inline-flex items-center justify-center p-3 bg-primary/5 rounded-2xl border border-primary/10 mb-2">
                     <MessageSquareHeart size={24} className="text-primary" />
                  </div>
                  <h2 className="text-lg font-black text-text-primary tracking-tight leading-tight">
                      {currentQuizStep === 0 && `상황 1. 내가 약속 시간에 늦었을 때.\n${name}은(는)?`}
                      {currentQuizStep === 1 && `상황 2. 선물을 주거나 받을 때.\n${name}은(는)?`}
                      {currentQuizStep === 2 && `상황 3. 휴식 시간.\n${name}은(는)?`}
                  </h2>
               </div>

               <div className="space-y-4 px-2">
                  <div className="flex flex-col items-start gap-4">
                    {(currentQuizStep === 0 ? quizData.late_options : currentQuizStep === 1 ? quizData.gift_options : quizData.lazy_options).map((option, index) => (
                      <div key={index} className="flex items-start gap-3 w-full group animate-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-border bg-background flex-shrink-0 mt-1">
                            <img src={imageSrc || ''} className="w-full h-full object-cover" alt="Character" />
                        </div>
                        <button 
                          onClick={() => handleOptionSelect(option)} 
                          className="flex-1 max-w-[85%] text-left bg-surface border-2 border-border p-4 rounded-2xl rounded-tl-none hover:border-primary hover:shadow-lg transition-all relative active:scale-[0.98]"
                        >
                            <p className="text-sm font-bold text-text-primary leading-relaxed">
                              "{option}"
                            </p>
                            <div className="absolute -left-2 top-0 w-3 h-3 bg-surface rotate-45 border-l-2 border-b-2 border-border group-hover:border-primary transition-colors"></div>
                        </button>
                      </div>
                    ))}
                  </div>
               </div>
               
               <div className="flex flex-col items-center gap-6 pt-4">
                  <div className="flex gap-3">
                    {[0, 1, 2].map(i => (
                        <div key={i} className={`w-2 h-2 rounded-full transition-all duration-500 ${i === currentQuizStep ? 'bg-primary w-6' : 'bg-border'}`} />
                    ))}
                  </div>

                  <button 
                      onClick={refreshCurrentQuizStep}
                      disabled={isPartialRefreshing}
                      className="inline-flex items-center gap-2 py-2.5 px-5 text-[11px] font-black text-text-secondary hover:text-primary transition-all border-2 border-dashed border-border rounded-xl hover:bg-background"
                  >
                      {isPartialRefreshing ? <Loader2 size={12} className="animate-spin"/> : <RefreshCw size={12} />}
                      다른 대사 불러오기
                  </button>
               </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 w-full p-6 bg-surface/90 backdrop-blur-md border-t border-border flex flex-col gap-3">
          {error && (
            <div className="mb-2 px-4 py-2 bg-rose-50 text-rose-600 text-[10px] font-black rounded-lg flex items-center gap-2 border border-rose-100 animate-shake">
              <AlertCircle size={12} /> {error}
            </div>
          )}
          
          <div className="flex flex-col gap-3">
            {step === 'STEP1' && (
                <p className="text-[12px] font-black text-rose-500 text-center animate-pulse mb-1">
                    이 프로그램은 Gemini API키를 필요로 합니다
                </p>
            )}

            <div className="flex gap-3">
                {step !== 'STEP1' && (
                <button onClick={prevStep} className="px-5 bg-background hover:bg-border text-text-secondary rounded-xl border border-border flex items-center justify-center transition-all active:scale-95 h-14">
                    <ArrowLeft size={20}/>
                </button>
                )}
                
                {step === 'STEP3' ? (
                <button 
                    onClick={generatePersonalityOptions} 
                    disabled={isGenerating} 
                    className="flex-1 bg-primary hover:bg-primary-light text-white font-black rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 h-14"
                >
                    {isGenerating ? <><Loader2 className="animate-spin" size={20}/> AI 분석 중</> : <>소환하기 <Sparkles size={16} className="text-accent-soft fill-accent"/></>}
                </button>
                ) : step !== 'QUIZ' ? (
                <button onClick={nextStep} className="flex-1 bg-primary hover:bg-primary-light text-white font-black rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] h-14">
                    계속하기 <ArrowRight size={18}/>
                </button>
                ) : (
                <div className="flex-1 flex items-center justify-center h-14">
                    <button onClick={resetAllFields} className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2 text-[11px] font-black uppercase tracking-widest">
                        <RotateCcw size={14}/> Reset Profile
                    </button>
                </div>
                )}
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(1px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
};
