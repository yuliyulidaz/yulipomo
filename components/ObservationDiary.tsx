
import React, { useState, useEffect } from 'react';
import { Loader2, PenTool, ArrowRight, Camera } from 'lucide-react';
import { CharacterProfile } from '../types';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

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
        
        // 호감도에 따른 구체적인 태도 설정
        const relationshipTitle = LEVEL_TITLES[profile.level];
        const intimacyLevel = profile.level <= 3 ? "사무적이고 관찰 위주의 차가운" : 
                             profile.level <= 7 ? "서로를 알아가는 단계의 다정한" : 
                             "깊은 애정과 신뢰가 느껴지는 매우 친밀한";
        
        const taskText = profile.todayTask ? `"${profile.todayTask}"에 매진하던` : "무언가에 깊이 몰입하던";

        const prompt = `당신은 '${profile.name}'이라는 캐릭터입니다. 
          성격: ${profile.personality.join(', ')}. 
          유저와의 현재 관계: ${relationshipTitle} (호감도 레벨 ${profile.level}/10).
          
          방금 유저가 100분간의 집중 세션을 마쳤습니다. 당신은 옆에서 그 모습을 지켜보며 몰래 관찰 일지를 썼습니다.
          
          상황 정보:
          - 유저가 한 일: ${taskText} 모습
          - 딴짓(이탈) 횟수: ${stats.distractions}번
          - 당신을 클릭(상호작용)한 횟수: ${stats.clicks}번
          - 현재 분위기: ${timeContext}
          
          요구사항:
          1. '${profile.name}'의 말투와 성격을 완벽히 유지하세요.
          2. **중요: 유저와의 호감도(${relationshipTitle}, ${intimacyLevel})를 문장에 적극 반영하세요.** 
             - 낮은 레벨이면 관찰자로서의 거리감을 유지하고, 높은 레벨이면 유저를 향한 강한 애착과 세밀한 관찰이 드러나야 합니다.
          3. 유저를 관찰하며 느낀 감정을 당신 성격이 허락하는 한 아주 감성적이고 서정적으로 서술하세요.
          4. 딴짓 횟수와 클릭 횟수를 단순 숫자로 나열하지 마세요. "잠시 창 밖으로 시선을 던지던 순간"이나 "나를 애타게 찾던 그 손길"처럼 문맥 속에 자연스럽게 녹여내세요.
          5. ${timeContext}와 같은 시간적 배경을 언급하여 현장감을 더하세요.
          6. 한국어로 3~4문장 내외로 작성하세요.
          
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
    if (content.length > 200) return 'text-lg';
    if (content.length > 160) return 'text-xl';
    if (content.length > 120) return 'text-2xl';
    return 'text-3xl';
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
        onClick={(e) => isScreenshotMode && e.stopPropagation()}
      >
        <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')]"></div>
        
        <div className="flex-1 p-8 space-y-4 flex flex-col relative overflow-hidden">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-8 bg-primary/20 backdrop-blur-sm transform -rotate-1 border border-primary/10 shadow-sm z-30 flex items-center justify-center">
                <span className="text-[10px] font-black tracking-widest text-primary/60 uppercase">Secret Log</span>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex justify-between items-baseline border-b border-primary/10 pb-1">
                <h3 className="font-serif italic font-bold text-xl text-primary-dark">비밀 관찰 일지</h3>
                <span className="text-[10px] font-bold text-text-secondary">{dateStr}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-[9px] font-black uppercase tracking-tighter text-primary/50">
                <div className="flex flex-col">
                    <span>Recorder</span>
                    <span className="text-xs text-text-primary mt-0.5">{profile.name}</span>
                </div>
                <div className="flex flex-col text-right">
                    <span>Subject</span>
                    <span className="text-xs text-text-primary mt-0.5">{profile.honorific || profile.userName}</span>
                </div>
              </div>
            </div>

            <div className="relative mx-auto mt-1">
                <div className="w-32 h-32 bg-white p-2 shadow-lg border border-primary/5 rotate-2 relative">
                    <img src={profile.imageSrc || ''} className="w-full h-full object-cover grayscale-[0.2] sepia-[0.1]" alt="Character" />
                    <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                </div>
                <div className="absolute -top-2 -left-3 w-10 h-6 bg-accent/20 backdrop-blur-sm rotate-[-45deg] border border-accent/10 opacity-70"></div>
            </div>

            <div className="flex-1 mt-2 flex flex-col overflow-hidden">
               <div className="flex items-center gap-2 mb-2">
                  <PenTool size={14} className="text-primary-light" />
                  <span className="text-[10px] font-bold text-primary-light uppercase tracking-widest">Observation Note</span>
               </div>
               
               {isGenerating ? (
                 <div className="flex-1 flex flex-col items-center justify-center gap-4 text-primary-light/40">
                   <Loader2 className="animate-spin" size={30} />
                   <p className="font-diary text-xl animate-pulse tracking-tight">{profile.name}이(가) 기록 중...</p>
                 </div>
               ) : (
                 <div className={`font-diary leading-tight text-[#4A4434] whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-2 duration-1000 ${getFontSize()}`}>
                    {content}
                 </div>
               )}
            </div>

            <div className="text-right pt-4 mt-auto border-t border-primary/10">
                <p className="font-diary text-2xl text-primary-dark">
                    <span className="text-sm opacity-60 mr-1">{LEVEL_TITLES[profile.level]}</span>
                    {profile.name} 씀.
                </p>
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
                      onClick={enterScreenshotMode} 
                      className="px-4 py-2 bg-accent text-white rounded-full font-black text-[10px] hover:bg-accent-dark transition-all active:scale-95 shadow-md flex items-center gap-1.5"
                  >
                      <Camera size={12} /> 스샷 모드
                  </button>
                  <button 
                      onClick={onClose} 
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
