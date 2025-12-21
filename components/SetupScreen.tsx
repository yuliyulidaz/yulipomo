
import React, { useState, useRef } from 'react';
import { ArrowRight, AlertCircle, Loader2, Sparkles, RefreshCw, ArrowLeft, RotateCcw, Key, MessageSquareHeart, Eye, EyeOff } from 'lucide-react';
import { CharacterProfile, DialogueStyles } from '../types';
import { FileUpload } from './FileUpload';
import { GoogleGenAI, Type } from "@google/genai";

const GREETING_TEMPLATES: Record<string, string> = {
  "반말": "{honorific}, 시작 버튼 눌러. 기다리고 있어.",
  "존댓말": "준비되셨나요? 시작 버튼을 눌러주세요, {honorific}.",
  "반존대": "{honorific}, 시작 버튼 안 보여요? 얼른 눌러요.",
  "사극/하오체": "준비가 되었으면 시작 버튼을 누르시오, {honorific}.",
  "다나까": "{honorific}, 시작 버튼 안 누릅니까? 기다리고 있습니다."
};

interface SetupScreenProps {
  onComplete: (profile: CharacterProfile) => void;
}

type SetupStep = 'INPUT' | 'QUIZ';

export const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState<SetupStep>('INPUT');
  
  const [userName, setUserName] = useState('');
  const [name, setName] = useState('');
  const [honorific, setHonorific] = useState('');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'NEUTRAL'>('FEMALE');
  const [tmi, setTmi] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  
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

  const tmiRef = useRef<HTMLTextAreaElement>(null);

  const TONE_KEYWORDS = ["반말", "존댓말", "반존대", "사극/하오체", "다나까"];
  const PERSONALITY_KEYWORDS = ["다정함/스윗", "츤데레", "엄격/냉철", "능글/플러팅", "집착/광공", "소심/부끄", "활기/에너지", "나른/귀차니즘"];

  const resetAllFields = () => {
    if (window.confirm("입력한 모든 내용을 초기화할까요?")) {
      setUserName('');
      setName('');
      setHonorific('');
      setImageSrc(null);
      setTmi('');
      setApiKey('');
      setSelectedPersonalities([]);
      setSelectedTone("존댓말");
      setError(null);
    }
  };

  const togglePersonality = (keyword: string) => {
    setSelectedPersonalities(prev => 
      prev.includes(keyword) ? prev.filter(k => k !== keyword) : [...prev, keyword]
    );
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
      const activeKey = apiKey || process.env.API_KEY;
      const ai = new GoogleGenAI({ apiKey: activeKey });
      const situations = ["지각했을 때", "선물이나 칭찬을 건넸을 때", "내가 딴짓을 하거나 게으름을 피울 때"];
      const targetKey = (["late_options", "gift_options", "lazy_options"] as const)[currentQuizStep];
      
      const prompt = `
        Character: ${name}, User: ${userName}, Tone: ${selectedTone}, Personality: ${selectedPersonalities.join(', ')}
        Task: Create 3 NEW immersive roleplay dialogue options in Korean for ONLY this situation: "${situations[currentQuizStep]}".
        Format: JSON Object with single key: "${targetKey}" (Array of 3 strings).
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { [targetKey]: { type: Type.ARRAY, items: { type: Type.STRING } } }
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed[targetKey]) {
        setQuizData(prev => ({ ...prev!, [targetKey]: parsed[targetKey] }));
      }
    } catch (e: any) {
      setError("보기를 새로 가져오는데 실패했습니다. 키가 정확한지 확인해주세요.");
    } finally {
      setIsPartialRefreshing(false);
    }
  };

  const generatePersonalityOptions = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    
    const activeKey = apiKey || process.env.API_KEY;
    if (!activeKey) return setError('서비스 이용을 위해 Gemini API 키를 입력해주세요.');
    if (!userName) return setError('당신의 이름을 입력해주세요.');
    if (!name) return setError('최애의 이름을 입력해주세요.');
    if (!imageSrc) return setError('캐릭터 이미지를 업로드해주세요.');
    if (selectedPersonalities.length === 0) return setError('성격 키워드를 최소 1개 선택해주세요.');

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: activeKey });
      const processedTmi = tmi.replace(/{{user}}/g, userName).replace(/{{char}}/g, name);
      const prompt = `
        Character Name: ${name}, User Name: ${userName}, Bias calls user: ${honorific || userName}
        Gender: ${gender}, TMI: ${processedTmi}, Style: ${selectedTone}, Personality: [${selectedPersonalities.join(', ')}]
        Task: Create 3 immersive roleplay dialogue options in Korean for 3 situations: 1. late_options, 2. gift_options, 3. lazy_options.
        Format: JSON Object.
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
          }
        }
      });
      const parsed = JSON.parse(response.text || '{}');
      setQuizData(parsed);
      setStep('QUIZ');
      setCurrentQuizStep(0);
    } catch (e: any) {
      setError("AI 분석 실패: API 키가 유효한지 확인해주세요.");
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
        userName, name, honorific: targetName, imageSrc, gender, apiKey,
        speciesTrait: tmi, personality: [selectedTone, ...selectedPersonalities],
        selectedDialogueStyles: finalStyles,
        dialogueCache: { scolding: [], praising: [], idle: [], click: [], pause: [], start: [] },
        xp: 0, level: 1, maxXpForNextLevel: 10, streak: 0, totalFocusMinutes: 0, receivedNotes: [], initialGreeting
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        <div className="h-3 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex-shrink-0"></div>
        
        <div className="flex-1 overflow-y-auto">
          {step === 'INPUT' ? (
            <div className="p-8 md:p-12 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <header className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                     최애 설정하기 <Sparkles className="text-amber-400 fill-amber-400" size={24}/>
                  </h1>
                  <p className="text-slate-500 mt-1 font-medium">당신의 집중을 도와줄 AI 페르소나를 커스텀하세요.</p>
                </div>
                <button onClick={resetAllFields} className="text-slate-300 hover:text-rose-500 transition-colors flex items-center gap-1.5 text-xs font-bold">
                  <RotateCcw size={14}/> 초기화
                </button>
              </header>

              {/* API Key Input Section (Requested Revision) */}
              <section className="space-y-4">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 bg-slate-900 text-white rounded-lg flex items-center justify-center text-xs">
                      <Key size={12} />
                    </span>
                    Gemini API 키 (필수)
                </h2>
                <div className="relative group">
                  <input 
                    type={showApiKey ? "text" : "password"} 
                    value={apiKey} 
                    onChange={e => setApiKey(e.target.value)} 
                    placeholder="AIzaSy... (여기에 키를 붙여넣으세요)" 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-mono text-sm" 
                  />
                  <button 
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                  >
                    {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 font-medium ml-1">
                  * 본인의 API 키를 입력하세요. 브라우저 로컬 스토리지에만 안전하게 저장됩니다.
                </p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                      <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-xs">1</span>
                      나의 정보
                  </h2>
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">당신의 이름</span>
                      <input type="text" value={userName} onChange={e => setUserName(e.target.value)} placeholder="예: 김여주" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-50 transition-all font-bold" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">나를 부르는 호칭</span>
                      <input type="text" value={honorific} onChange={e => setHonorific(e.target.value)} placeholder="예: 선배, 야, 자기야" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-50 transition-all font-bold" />
                    </label>
                  </div>
                </div>

                <div className="space-y-6">
                  <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                      <span className="w-6 h-6 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center text-xs">2</span>
                      최애 설정
                  </h2>
                  <div className="flex flex-col gap-4">
                    <FileUpload currentImage={imageSrc} onImageSelected={setImageSrc} onClear={() => setImageSrc(null)} />
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="최애의 이름" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-rose-50 transition-all font-bold" />
                  </div>
                </div>
              </div>

              <section className="space-y-8 bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                 <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 block">말투 스타일 (단일 선택)</label>
                    <div className="flex flex-wrap gap-2">
                        {TONE_KEYWORDS.map(k => (
                            <button 
                              key={k} 
                              onClick={() => setSelectedTone(k)} 
                              className={`px-4 py-2 text-xs rounded-xl border-2 transition-all font-black ${selectedTone === k ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-200'}`}
                            >
                              {k}
                            </button>
                        ))}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 block">성격 키워드 (다중 선택)</label>
                    <div className="flex flex-wrap gap-2">
                        {PERSONALITY_KEYWORDS.map(k => (
                            <button 
                              key={k} 
                              onClick={() => togglePersonality(k)} 
                              className={`px-3 py-2 text-[11px] rounded-xl border-2 transition-all font-black ${selectedPersonalities.includes(k) ? 'bg-rose-500 border-rose-500 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-rose-200'}`}
                            >
                              {k}
                            </button>
                        ))}
                    </div>
                 </div>
              </section>

              <section className="space-y-4 relative">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 block">추가 설정 (TMI)</label>
                  <div className="relative group">
                    <textarea 
                      ref={tmiRef} 
                      value={tmi} 
                      onChange={e => setTmi(e.target.value)} 
                      placeholder="예: {{char}}는 고양이를 무서워하고 {{user}}에게만 다정함." 
                      className="w-full h-36 p-6 bg-slate-50 border border-slate-100 rounded-[32px] outline-none focus:ring-4 focus:ring-indigo-50 transition-all text-sm leading-relaxed font-medium resize-none" 
                    />
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <button 
                        onClick={() => insertPlaceholder('{{user}}')} 
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
                      >
                        {"{{user}}"}
                      </button>
                      <button 
                        onClick={() => insertPlaceholder('{{char}}')} 
                        className="px-3 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-lg border border-rose-100 hover:bg-rose-100 transition-colors"
                      >
                        {"{{char}}"}
                      </button>
                    </div>
                  </div>
              </section>

              {error && (
                <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl text-rose-600 text-xs font-bold flex items-center gap-2 animate-shake">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <button 
                onClick={generatePersonalityOptions} 
                disabled={isGenerating} 
                className="w-full bg-slate-900 hover:bg-black text-white font-black py-6 rounded-3xl flex justify-center items-center gap-3 shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? <><Loader2 className="animate-spin" size={20}/> AI 분석 중...</> : <>설정 완료하고 다음으로 <ArrowRight size={20}/></>}
              </button>
            </div>
          ) : quizData && (
            <div className="p-10 space-y-10 animate-in fade-in slide-in-from-right-6 duration-500">
               <header className="flex items-center justify-between">
                  <button onClick={() => setStep('INPUT')} className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-slate-100 rounded-full"><ArrowLeft size={20}/></button>
                  <div className="flex gap-2">
                      {[0, 1, 2].map(i => (
                          <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === currentQuizStep ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200'}`} />
                      ))}
                  </div>
                  <div className="w-10"></div>
               </header>

               <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mb-2">
                      <MessageSquareHeart size={40} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      {currentQuizStep === 0 && "약속에 늦었을 때..."}
                      {currentQuizStep === 1 && "선물을 건넸을 때..."}
                      {currentQuizStep === 2 && "내가 딴짓을 할 때..."}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">말투와 성격이 잘 반영되었는지 확인하고 대사를 선택해주세요.</p>
               </div>

               <div className="space-y-3">
                  {(currentQuizStep === 0 ? quizData.late_options : currentQuizStep === 1 ? quizData.gift_options : quizData.lazy_options).map((option, index) => (
                    <button 
                      key={index} 
                      onClick={() => handleOptionSelect(option)} 
                      className="w-full p-6 text-left border-2 border-slate-50 rounded-[28px] hover:border-indigo-500 hover:bg-indigo-50 transition-all text-sm leading-relaxed group shadow-sm font-bold relative"
                    >
                        <span className="text-indigo-400 mr-2 font-black opacity-40">"</span>{option}
                        <ArrowRight size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                    </button>
                  ))}
               </div>
               
               <button 
                  onClick={refreshCurrentQuizStep}
                  disabled={isPartialRefreshing}
                  className="w-full flex items-center justify-center gap-2 py-4 text-xs font-black text-slate-400 hover:text-indigo-600 transition-all border-2 border-dashed border-slate-100 rounded-2xl hover:bg-white"
               >
                  {isPartialRefreshing ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16} />}
                  다른 대사 보기
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
