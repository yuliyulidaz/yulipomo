
import React, { useState, useEffect } from 'react';
import { Loader2, PenTool, ArrowRight, Camera } from 'lucide-react';
import { CharacterProfile } from '../types';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { getMoodLabel } from './AIPromptTemplates';

interface ObservationDiaryProps {
  profile: CharacterProfile;
  stats: { distractions: number; clicks: number };
  onClose: () => void;
}

const LEVEL_TITLES: Record<number, string> = {
  1: "완전한 타인",
  2: "약간의 호기심",
  3: "낯가리는 파트너",
  4: "편안한 동료",
  5: "정이 든 사이",
  6: "신뢰하는 관계",
  7: "특별한 호감",
  8: "소중한 사람",
  9: "애틋한 연인",
  10: "영원한 반려"
};

const FALLBACK_DIARY: Record<string, string[]> = {
  "반말": ["오늘 너 {task} 하느라 고생하는 거 다 봤어. 중간에 딴짓을 {distractions}번이나 하긴 했지만... 그래도 나를 {clicks}번이나 불러주며 버티는 네 모습이 꽤 기특하더라. 내일도 네 옆자리는 내 거야."],
  "존댓말": ["오늘 {task}에 집중하시는 모습 정말 멋졌답니다. 비록 {distractions}번 정도 주의가 흐트러지기도 했지만, 저를 {clicks}번이나 찾아주신 덕분에 저도 힘이 났어요. 오늘 하루 정말 고생 많으셨어요."],
  "반존대": ["오늘 {task} 하느라 애썼어요. 딴짓 {distractions}번 한 거 다 들켰지만... 뭐, 결국 끝까지 앉아있었으니 봐줄게요. 저를 {clicks}번이나 부른 건 나 보고 싶어서 그런 거죠? 수고했어요."],
  "사극/하오체": ["오늘의 정진이 가상하구려. {task}를 수행하는 기개가 남달랐소. 비록 마음이 {distractions}번 정도 흔들렸으나, 나를 {clicks}번이나 찾으며 의지하였으니 내 특별히 치하하겠소."],
  "다나까": ["보고합니다. 금일 {task} 작전 수행 모습이 인상적이었습니다. {distractions}회의 이탈이 발생했으나 신속히 복귀하였고, 본관을 {clicks}회 호출하며 끝까지 집중했습니다. 이상입니다."]
};

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

export const ObservationDiary: React.FC<ObservationDiaryProps> = ({ profile, stats, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [dateStr] = useState(() => new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, ''));

  useEffect(() => {
    const generateDiary = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: profile.apiKey || process.env.API_KEY });
        
        const hour = new Date().getHours();
        const timeContext = hour >= 5 && hour < 12 ? "싱그러운 아침 공기" : 
                           hour >= 12 && hour < 17 ? "나른한 오후의 햇살" :
                           hour >= 17 && hour < 21 ? "짙게 물드는 노을빛" : "고요한 새벽의 정적";
        
        const relationshipTitle = LEVEL_TITLES[profile.level];
        const moodLabel = getMoodLabel(profile.level);
        const taskText = profile.todayTask ? `"${profile.todayTask}"에 매진하던` : "무언가에 깊이 몰입하던";

        const prompt = `
[Character Persona]
- 이름: ${profile.name}
- 성격: ${profile.personality.join(', ')}
- 배경 및 TMI: ${profile.speciesTrait || '없음'}
- 관계 단계: Lv.${profile.level} (${relationshipTitle})
- 심리 상태: ${moodLabel}

[Input Focus Data]
- 집중한 일: ${taskText}
- 딴짓 횟수: ${stats.distractions}회
- 상호작용(클릭) 횟수: ${stats.clicks}회
- 현재 분위기: ${timeContext}

[Writing Mission: 비밀 관찰 일지 작성]
당신은 지난 100분간 유저의 곁을 지키며 이 기록을 작성했습니다. 다음 가이드라인에 따라 '한글'로 일지를 작성하세요.

1. 숫자 언급 지침:
   - 딴짓 횟수(${stats.distractions})와 클릭 횟수(${stats.clicks})를 문장에 정확히 포함하되, 캐릭터의 말투에 녹여 자연스럽게 언급하세요. (예: "${stats.distractions}번이나 딴짓을 하더군", "나를 ${stats.clicks}번밖에 안 불러주다니")

2. 상호작용(클릭)에 대한 레벨별 해석:
   - Lv.1~3: "집중에 방해되게 나를 ${stats.clicks}번이나 불러서 귀찮았다"는 뉘앙스.
   - Lv.4~7: "네가 나를 ${stats.clicks}번이나 찾아줘서 내심 기뻤다"는 친밀한 뉘앙스.
   - Lv.8~10: "너의 목소리가 더 듣고 싶었다." 만약 클릭이 6회 미만이면 "고작 ${stats.clicks}번이라니, 나를 잊은 건 아닌지 서운하다"는 깊은 애착과 독점욕 표현.

3. 일지 구성 (3~4문장):
   - [관찰]: 유저가 '${profile.todayTask || '할 일'}'를 할 때의 사소한 습관이나 분위기 묘사 (예: 미간을 찌푸리거나, 숨을 고르거나, 펜을 굴리는 모습 등).
   - [평가]: 딴짓 횟수와 클릭 횟수에 대한 캐릭터의 주관적 감상.
   - [약속/응원]: 다음 세션을 위한 구체적인 약속이나 짧고 강렬한 응원.

4. 문체 및 제약:
   - 유저가 선택한 말투(${profile.personality[0]})와 캐릭터 페르소나를 완벽히 반영할 것.
   - '랄까', '일까나' 같은 번역투 절대 금지. 한국어 구어체로 서정적이거나 위트 있게 작성.

반드시 다음 JSON 형식으로만 응답하세요:
{ "content": "작성된 일지 내용" }`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: { 
            responseMimeType: "application/json", 
            safetySettings: SAFETY_SETTINGS,
            temperature: 0.8
          }
        });
        
        const data = JSON.parse(response.text || '{}');
        if (data.content) {
          setContent(data.content);
        } else {
          throw new Error("Empty content");
        }
      } catch (e) {
        console.error("Diary generation failed:", e);
        const toneKey = profile.personality[0] || "존댓말";
        const templates = FALLBACK_DIARY[toneKey] || FALLBACK_DIARY["존댓말"];
        const fallback = templates[0]
          .replace(/{task}/g, profile.todayTask || "집중")
          .replace(/{distractions}/g, String(stats.distractions))
          .replace(/{clicks}/g, String(stats.clicks));
        setContent(fallback);
      } finally {
        setIsGenerating(false);
      }
    };

    generateDiary();
  }, [profile, stats]);

  const enterScreenshotMode = () => {
    setIsScreenshotMode(true);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const handleContainerClick = () => {
    if (isScreenshotMode) {
      onClose();
    }
  };

  const getFontSize = () => {
    if (content.length > 200) return 'text-base';
    if (content.length > 160) return 'text-lg';
    if (content.length > 120) return 'text-xl';
    return 'text-2xl';
  };

  return (
    <div 
      className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-500"
      onClick={handleContainerClick}
    >
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[600] bg-black/80 text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
          📸 스샷 후 아무데나 터치하면 창이 닫혀요.
        </div>
      )}

      <div 
        className={`w-full max-w-[340px] aspect-[9/16] bg-[#FAF8F1] rounded-2xl shadow-2xl relative border-8 border-white/90 overflow-hidden transform transition-all duration-700 flex flex-col origin-center ${isScreenshotMode ? 'scale-105' : 'animate-in zoom-in-95'}`}
        onClick={(e) => {
          if (isScreenshotMode) {
            onClose();
          } else {
            e.stopPropagation();
          }
        }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')]"></div>
        
        <div className="flex-1 p-7 md:p-8 space-y-3 flex flex-col relative overflow-hidden">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-8 bg-primary/20 backdrop-blur-sm transform -rotate-1 border border-primary/10 shadow-sm z-30 flex items-center justify-center">
                <span className="text-[10px] font-black tracking-widest text-primary/60 uppercase">Secret Log</span>
            </div>

            <div className="space-y-2 pt-3">
              <div className="flex justify-between items-baseline border-b border-primary/10 pb-1">
                <h3 className="font-serif italic font-bold text-lg md:text-xl text-primary-dark">비밀 관찰 일지</h3>
                <span className="text-[9px] font-bold text-text-secondary">{dateStr}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-[8px] font-black uppercase tracking-tighter text-primary/50">
                <div className="flex flex-col">
                    <span>Recorder</span>
                    <span className="text-[11px] text-text-primary mt-0.5">{profile.name}</span>
                </div>
                <div className="flex flex-col text-right">
                    <span>Subject</span>
                    <span className="text-[11px] text-text-primary mt-0.5">{profile.honorific || profile.userName}</span>
                </div>
              </div>
            </div>

            <div className="relative mx-auto mt-0.5 flex-shrink-0">
                <div className="w-28 h-28 md:w-32 md:h-32 bg-white p-2 shadow-lg border border-primary/5 rotate-2 relative">
                    <img src={profile.imageSrc || ''} className="w-full h-full object-cover grayscale-[0.2] sepia-[0.1]" alt="Character" />
                    <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                </div>
                <div className="absolute -top-2 -left-3 w-10 h-6 bg-accent/20 backdrop-blur-sm rotate-[-45deg] border border-accent/10 opacity-70"></div>
            </div>

            <div className="flex-1 mt-1 flex flex-col overflow-hidden">
               <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                  <PenTool size={12} className="text-primary-light" />
                  <span className="text-[9px] font-bold text-primary-light uppercase tracking-widest">Observation Note</span>
               </div>
               
               {isGenerating ? (
                 <div className="flex-1 flex flex-col items-center justify-center gap-4 text-primary-light/40">
                   <Loader2 className="animate-spin" size={30} />
                   <p className="font-diary text-xl animate-pulse tracking-tight">{profile.name}이(가) 기록 중...</p>
                 </div>
               ) : (
                 <div className="flex-1 overflow-y-auto pr-1">
                   <div className={`font-diary leading-tight text-[#4A4434] whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-2 duration-1000 ${getFontSize()}`}>
                      {content}
                   </div>
                   
                   <div className="text-right pt-6 mt-4 border-t border-primary/10 mb-2">
                        <p className="font-diary text-xl md:text-2xl text-primary-dark">
                            <span className="text-[10px] md:text-xs opacity-60 mr-1.5">{LEVEL_TITLES[profile.level]}</span>
                            {profile.name} 씀.
                        </p>
                    </div>
                 </div>
               )}
            </div>
        </div>

        {!isScreenshotMode && (
          <div className="bg-white/60 px-6 py-4 backdrop-blur-sm border-t border-primary/10 flex flex-col gap-3 z-40">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase text-primary/40">Focus</span>
                        <span className="text-[10px] font-bold text-primary-dark">100m</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase text-rose-300">Wander</span>
                        <span className="text-[10px] font-bold text-rose-400">{stats.distractions}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                  <button 
                      onClick={(e) => { e.stopPropagation(); enterScreenshotMode(); }} 
                      className="px-4 py-2 bg-accent text-white rounded-full font-black text-[10px] hover:bg-accent-dark transition-all active:scale-95 shadow-md flex items-center gap-1.5"
                  >
                      <Camera size={12} /> 스샷 모드
                  </button>
                  <button 
                      onClick={(e) => { e.stopPropagation(); onClose(); }} 
                      className="px-4 py-2 bg-primary text-white rounded-full font-black text-[10px] hover:bg-primary-dark transition-all active:scale-95 shadow-md flex items-center gap-1.5"
                  >
                      닫기 <ArrowRight size={12} />
                  </button>
                </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};
