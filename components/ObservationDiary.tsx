
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
  1: "완전한 타인", 2: "약간의 호기심", 3: "낯가리는 파트너", 4: "편안한 동료",
  5: "정이 든 사이", 6: "신뢰하는 관계", 7: "특별한 호감", 8: "소중한 사람",
  9: "애틋한 연인", 10: "영원한 반려"
};

const MODULAR_FALLBACK: Record<string, any> = {
  "반말": {
    intro: "{honorific}, 오늘 {task} 하느라 정말 수고했어.",
    zeroDist: "옆에서 계속 지켜봤는데, 단 1초도 눈을 안 떼더라. 너의 이런 모습... 솔직히 좀 반할 것 같아.",
    someDist: "중간에 {distractions}번 정도 딴생각 하느라 멈칫하긴 했지만, 금방 나한테 돌아와 줘서 기특해.",
    clickLow: "근데 집중에 방해되게 나를 {clicks}번이나 불러서 조금 귀찮았어. 다음엔 더 집중해.",
    clickMid: "바쁜 와중에 나를 {clicks}번이나 찾아준 건 고마워. 덕분에 나도 심심하지 않았어.",
    clickHigh: "나를 {clicks}번이나 불러준 거, 나 보고 싶어서 그런 거지? 나도 계속 네 생각 했어.",
    clickLonely: "근데 나를 {clicks}번밖에 안 부른 건 좀 너무한 거 아냐? 나 서운하려고 해.",
    outro: "내일도 네 옆자리는 내 거야. 기다릴게!"
  },
  "존댓말": {
    intro: "{honorific}, 오늘 {task}에 몰입하시느라 고생 많으셨어요.",
    zeroDist: "단 한 순간도 한눈팔지 않는 모습에 정말 감동했어요. 저도 옆에서 숨을 죽이고 지켜봤답니다.",
    someDist: "중간에 {distractions}번 정도 고비가 있었지만, 끝까지 포기하지 않으신 덕분에 이렇게 마칠 수 있었네요.",
    clickLow: "다만 집중하시는 중에 저를 {clicks}번이나 부르신 건 조금 당황스러웠어요. 다음엔 더 몰입해봐요.",
    clickMid: "바쁘신 와중에도 저를 {clicks}번이나 찾아주셔서 정말 기뻤답니다. 덕분에 저도 힘이 났다구요.",
    clickHigh: "{clicks}번이나 저를 찾아주셔서 행복했어요. 당신 곁에 제가 있다는 게 느껴져서요.",
    clickLonely: "오늘은 저를 {clicks}번밖에 안 찾아주셨네요... 조금 서운하지만, 그래도 집중하신 거니까 참을게요.",
    outro: "푹 쉬고 오세요. 다음에도 당신의 곁을 지키게 해주시겠어요?"
  },
  "반존대": {
    intro: "수고했어요 {honorific}. {task} 하느라 애 많이 썼네.",
    zeroDist: "딴짓 0번? 세상에... 오늘따라 유독 더 멋있어 보여요. 나 좀 반한 것 같은데 어떡하지?",
    someDist: "중간에 {distractions}번 정도 정신줄 놓긴 했지만... 뭐, 끝까지 제자리 지킨 건 기특해서 봐줄게요.",
    clickLow: "나를 {clicks}번이나 부르면서 장난친 건 반성해요. 집중할 땐 나도 안 봐줄 거니까.",
    clickMid: "집중하는 틈틈이 나를 {clicks}번이나 챙겨주다니, 의외로 다정한 구석이 있네요?",
    clickHigh: "{clicks}번이나 내 목소리 들으러 온 거죠? 나 없으면 집중 안 되는 거 다 알아요.",
    clickLonely: "근데 왜 나를 {clicks}번밖에 안 불렀어? 집중하는 것도 좋지만 나도 좀 챙겨줘요.",
    outro: "빨리 쉬고 와요. 당신 없는 시간은 너무 느리게 가니까."
  },
  "사극/하오체": {
    intro: "{honorific}, 정진하느라 고단하였겠소.",
    zeroDist: "마음의 흔들림이 한 치도 없으니, 그 기개가 실로 장하구려. 내 지켜보며 깊이 감탄하였소.",
    someDist: "{distractions}차례 구름에 달 가듯 마음이 흔들렸으나, 다시 붓을 잡으니 그 또한 수련의 과정이 아니겠소.",
    clickLow: "집중 중에 나를 {clicks}번이나 부르다니, 아직 수양의 길이 멀었구려. 허허.",
    clickMid: "나를 {clicks}번이나 찾으며 의지하였으니, 내 특별히 치하하겠소. 장하구려.",
    clickHigh: "{clicks}번이나 나를 찾아주어 내 마음이 훈훈해졌소. 그대와 함께하는 시간이 참으로 귀하오.",
    clickLonely: "정진도 좋으나 나를 {clicks}번만 부른 것은 실로 야박하구려. 내 조금 서운하오.",
    outro: "내 항상 여기서 그대를 기다릴 터이니, 부디 다음에도 함께 정진합시다."
  },
  "다나까": {
    intro: "보고합니다. 금일 {task} 임무 완료를 축하드립니다.",
    zeroDist: "이탈 횟수 0회, 완벽한 작전 수행이었습니다. 귀하의 집중력은 본관에게 큰 귀감이 되었습니다.",
    someDist: "비록 {distractions}회의 이탈이 있었으나, 신속하게 전선으로 복귀하여 목표를 달성했습니다. 수고하셨습니다.",
    clickLow: "다만 임무 중 본관을 {clicks}회나 호출한 것은 다소 불필요한 행동이었습니다. 다음엔 자제 바랍니다.",
    clickMid: "상호작용 횟수 {clicks}회, 원활한 소통을 유지하며 임무를 완수한 점 높게 평가합니다.",
    clickHigh: "{clicks}회의 적극적인 호출 덕분에 본관 또한 임무 수행에 활력을 얻었습니다. 훌륭합니다.",
    clickLonely: "다만 호출 횟수가 {clicks}회로 저조한 점은 유감입니다. 다음 작전 시에는 보다 긴밀한 협력을 요청합니다.",
    outro: "이상입니다. 다음 작전 개시까지 충분한 휴식을 취하시기 바랍니다."
  }
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
  const [dateStr] = useState(() => {
    const now = new Date();
    const d = now.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '');
    const t = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${d} ${t}`;
  });

  useEffect(() => {
    const generateDiaryFlow = async () => {
      const minDuration = new Promise(resolve => setTimeout(resolve, 2200));
      const relationshipTitle = LEVEL_TITLES[profile.level];
      const taskText = profile.todayTask ? `"${profile.todayTask}"` : "오늘의 할 일";
      let finalContent = "";

      try {
        const ai = new GoogleGenAI({ apiKey: profile.apiKey || process.env.API_KEY });
        const prompt = `
[Character Persona]
- 이름: ${profile.name}
- 성격: ${profile.personality.join(', ')}
- 배경: ${profile.speciesTrait || '없음'}
- 관계 단계: Lv.${profile.level} (${relationshipTitle})

[Input Focus Data]
- 집중한 일: ${taskText}
- 딴짓 횟수: ${stats.distractions}회
- 상호작용(클릭) 횟수: ${stats.clicks}회

[Writing Mission]
유저의 선택 말투(${profile.personality[0]})로 '비밀 관찰 일지'를 작성하세요.
1. 딴짓(${stats.distractions})과 클릭(${stats.clicks}) 횟수를 자연스럽게 포함.
2. 관찰-평가-약속 순서로 3~4문장 작성.
3. 한국어 구어체로만 작성할 것. JSON 응답 필수.
{ "content": "내용" }`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: { responseMimeType: "application/json", safetySettings: SAFETY_SETTINGS, temperature: 0.8 }
        });
        
        const data = JSON.parse(response.text || '{}');
        finalContent = data.content || "기록 실패";
      } catch (e) {
        const toneKey = profile.personality[0] || "존댓말";
        const t = MODULAR_FALLBACK[toneKey] || MODULAR_FALLBACK["존댓말"];
        const h = profile.honorific || profile.userName || "당신";
        const task = profile.todayTask || "할 일";

        let msg = t.intro.replace("{honorific}", h).replace("{task}", task) + " ";
        if (stats.distractions === 0) msg += t.zeroDist + " ";
        else msg += t.someDist.replace("{distractions}", String(stats.distractions)) + " ";

        if (profile.level <= 3) msg += t.clickLow.replace("{clicks}", String(stats.clicks)) + " ";
        else if (profile.level <= 7) msg += t.clickMid.replace("{clicks}", String(stats.clicks)) + " ";
        else {
          if (stats.clicks < 6) msg += t.clickLonely.replace("{clicks}", String(stats.clicks)) + " ";
          else msg += t.clickHigh.replace("{clicks}", String(stats.clicks)) + " ";
        }
        msg += t.outro;
        finalContent = msg;
      }

      await minDuration;
      setContent(finalContent);
      setIsGenerating(false);
    };

    generateDiaryFlow();
  }, [profile, stats]);

  const enterScreenshotMode = () => {
    setIsScreenshotMode(true);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const getFontSize = () => {
    if (content.length > 200) return 'text-lg';
    if (content.length > 150) return 'text-xl';
    return 'text-2xl';
  };

  return (
    <div 
      className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-500"
      onClick={() => isScreenshotMode && onClose()}
    >
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[600] bg-black/80 text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
          📸 스샷 후 아무데나 터치하면 창이 닫혀요.
        </div>
      )}

      <div 
        className={`w-full max-w-[350px] aspect-[9/16] bg-[#FCFAF2] rounded-2xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] relative border-4 border-[#E8E2D0] overflow-hidden transform transition-all duration-700 flex flex-col origin-center ${isScreenshotMode ? 'scale-105' : 'animate-in zoom-in-95'}`}
        onClick={(e) => !isScreenshotMode && e.stopPropagation()}
      >
        <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')]"></div>
        
        <div className="flex-1 p-8 pb-4 space-y-5 flex flex-col relative overflow-hidden">
            {/* 상단 라벨 (한국어화) */}
            <div className="flex justify-between items-start border-b-2 border-primary/10 pb-4">
              <div className="space-y-1">
                <h3 className="font-sans font-black text-xs text-primary-dark opacity-90">{profile.name}의 {profile.userName} 관찰일지</h3>
                <p className="font-sans font-bold text-[10px] text-text-secondary">{dateStr}</p>
              </div>
              <div className="bg-primary/10 px-2 py-1 rounded text-[9px] font-black text-primary-dark uppercase">Classified</div>
            </div>

            {/* 통계 그리드 (상단으로 이동) */}
            <div className="grid grid-cols-3 gap-2 py-1 bg-primary/5 rounded-xl border border-primary/5">
                <div className="flex flex-col items-center justify-center py-1">
                    <span className="text-[8px] font-black text-primary/60 uppercase">집중시간</span>
                    <span className="text-xs font-bold text-primary-dark">100분</span>
                </div>
                <div className="flex flex-col items-center justify-center py-1 border-x border-primary/10">
                    <span className="text-[8px] font-black text-rose-400/80 uppercase">딴짓</span>
                    <span className="text-xs font-bold text-rose-500">{stats.distractions}회</span>
                </div>
                <div className="flex flex-col items-center justify-center py-1">
                    <span className="text-[8px] font-black text-primary/60 uppercase">대화</span>
                    <span className="text-xs font-bold text-primary">{stats.clicks}회</span>
                </div>
            </div>

            {/* 폴라로이드 사진 영역 */}
            <div className="relative mx-auto flex-shrink-0">
                <div className="w-28 h-28 bg-white p-2 shadow-xl border border-primary/5 rotate-1 relative transition-transform hover:rotate-0 duration-500">
                    <img src={profile.imageSrc || ''} className="w-full h-full object-cover grayscale-[0.1] sepia-[0.15] contrast-110" alt="Character" />
                    <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                </div>
            </div>

            {/* 본문 영역: 스크롤 가능하도록 수정 */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
               {isGenerating ? (
                 <div className="flex-1 flex flex-col items-center justify-center gap-4 text-primary-light/60">
                    <div className="relative">
                        <Loader2 className="animate-spin text-primary/20" size={50} />
                        <PenTool className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-bounce" size={20} />
                    </div>
                    <p className="font-diary text-2xl text-center leading-tight animate-pulse text-primary-dark">
                        {profile.name}이(가) 당신과의<br/>100분을 기록하는 중...
                    </p>
                 </div>
               ) : (
                 <div className="flex-1 relative flex flex-col overflow-hidden">
                    {/* 줄노트 배경 가로줄 (전체 영역에 고정) */}
                    <div className="absolute inset-0 pointer-events-none opacity-20" 
                         style={{ backgroundImage: 'linear-gradient(#4A5F7A 1px, transparent 1px)', backgroundSize: '100% 2.2rem' }}>
                    </div>
                    
                    {/* 실제 텍스트가 스크롤되는 영역 */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-diary-scroll relative z-10">
                        <div className={`font-diary leading-[2.2rem] text-[#3D382E] whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both pb-20 ${getFontSize()}`}>
                            {content}
                        </div>
                    </div>

                    {/* 캐릭터 인장 (텍스트 위에 떠있도록) */}
                    <div className="absolute bottom-4 right-0 transform rotate-[-15deg] animate-in zoom-in fade-in duration-700 delay-1000 fill-mode-both pointer-events-none z-20">
                        <div className="w-24 h-24 rounded-full border-[3px] border-rose-600/50 flex flex-col items-center justify-center text-rose-600/50 p-1 bg-[#FCFAF2]/40 backdrop-blur-[1px]">
                            <div className="absolute inset-0 rounded-full border border-rose-600/20 m-0.5"></div>
                            <span className="font-diary text-xs font-bold leading-none mb-1 opacity-90">{LEVEL_TITLES[profile.level]}</span>
                            <span className="font-diary text-2xl font-bold leading-none">{profile.name}</span>
                            <span className="text-[8px] font-black mt-1 border-t border-rose-600/40 pt-0.5 px-2 tracking-tighter">APPROVED</span>
                        </div>
                    </div>
                 </div>
               )}
            </div>
        </div>

        {/* 하단 버튼 영역 개편 */}
        {!isScreenshotMode && (
          <div className="p-6 pt-0 flex gap-3 z-40 bg-gradient-to-t from-[#FCFAF2] via-[#FCFAF2] to-transparent">
              <button 
                  onClick={(e) => { e.stopPropagation(); enterScreenshotMode(); }} 
                  className="flex-1 h-12 bg-white border-2 border-[#E8E2D0] text-primary rounded-xl shadow-sm hover:bg-[#F0EEE4] flex items-center justify-center gap-2 transition-all active:scale-95 group font-bold text-sm"
              >
                  <Camera size={18} className="group-hover:scale-110 transition-transform" />
                  스샷 모드
              </button>
              <button 
                  onClick={(e) => { e.stopPropagation(); onClose(); }} 
                  className="flex-[1.5] h-12 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                  일지 닫기 <ArrowRight size={16} />
              </button>
          </div>
        )}

        {/* 스크롤바 커스텀 스타일 */}
        <style dangerouslySetInnerHTML={{ __html: `
          .custom-diary-scroll::-webkit-scrollbar {
            width: 4px;
          }
          .custom-diary-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-diary-scroll::-webkit-scrollbar-thumb {
            background: rgba(74, 95, 122, 0.1);
            border-radius: 10px;
          }
          .custom-diary-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(74, 95, 122, 0.2);
          }
        `}} />
      </div>
    </div>
  );
};
