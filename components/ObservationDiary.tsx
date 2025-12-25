
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

// 지능형 폴백 템플릿 구성
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
  const [dateStr] = useState(() => new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, ''));

  useEffect(() => {
    const generateDiary = async () => {
      const relationshipTitle = LEVEL_TITLES[profile.level];
      const moodLabel = getMoodLabel(profile.level);
      const taskText = profile.todayTask ? `"${profile.todayTask}"` : "오늘의 할 일";

      try {
        const ai = new GoogleGenAI({ apiKey: profile.apiKey || process.env.API_KEY });
        
        const hour = new Date().getHours();
        const timeContext = hour >= 5 && hour < 12 ? "싱그러운 아침 공기" : 
                           hour >= 12 && hour < 17 ? "나른한 오후의 햇살" :
                           hour >= 17 && hour < 21 ? "짙게 물드는 노을빛" : "고요한 새벽의 정적";

        const prompt = `
[Character Persona]
- 이름: ${profile.name}
- 성격: ${profile.personality.join(', ')}
- 배경 및 TMI: ${profile.speciesTrait || '없음'}
- 관계 단계: Lv.${profile.level} (${relationshipTitle})
- 심리 상태: ${moodLabel}

[Input Focus Data]
- 집중한 일: ${taskText}에 매진하던 모습
- 딴짓 횟수: ${stats.distractions}회
- 상호작용(클릭) 횟수: ${stats.clicks}회
- 현재 분위기: ${timeContext}

[Writing Mission: 비밀 관찰 일지 작성]
당신은 지난 100분간 유저의 곁을 지키며 이 기록을 작성했습니다. 다음 가이드라인에 따라 '한글'로 일지를 작성하세요.

1. 숫자 언급 지침:
   - 딴짓 횟수(${stats.distractions})와 클릭 횟수(${stats.clicks})를 문장에 정확히 포함하되, 캐릭터의 말투에 녹여 자연스럽게 언급하세요.

2. 상호작용(클릭)에 대한 레벨별 해석:
   - Lv.1~3: "집중에 방해되게 나를 ${stats.clicks}번이나 불러서 귀찮았다"는 뉘앙스.
   - Lv.4~7: "네가 나를 ${stats.clicks}번이나 찾아줘서 내심 기뻤다"는 친밀한 뉘앙스.
   - Lv.8~10: "너의 목소리가 더 듣고 싶었다." 만약 클릭이 6회 미만이면 "고작 ${stats.clicks}번이라니, 나를 잊은 건 아닌지 서운하다"는 깊은 애착과 독점욕 표현.

3. 일지 구성 (3~4문장):
   - [관찰]: 유저가 일을 할 때의 사소한 습관이나 분위기 묘사 (예: 미간을 찌푸리거나, 숨을 고르거나, 펜을 굴리는 모습 등).
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
        console.warn("Diary generation failed, using modular fallback logic.");
        
        // 조립식 폴백 로직 실행
        const toneKey = profile.personality[0] || "존댓말";
        const t = MODULAR_FALLBACK[toneKey] || MODULAR_FALLBACK["존댓말"];
        const h = profile.honorific || profile.userName || "당신";
        const task = profile.todayTask || "할 일";

        // 1. 도입부
        let msg = t.intro.replace("{honorific}", h).replace("{task}", task) + " ";
        
        // 2. 딴짓 평가
        if (stats.distractions === 0) {
          msg += t.zeroDist + " ";
        } else {
          msg += t.someDist.replace("{distractions}", String(stats.distractions)) + " ";
        }

        // 3. 클릭 해석 (레벨별 분기)
        if (profile.level <= 3) {
          msg += t.clickLow.replace("{clicks}", String(stats.clicks)) + " ";
        } else if (profile.level <= 7) {
          msg += t.clickMid.replace("{clicks}", String(stats.clicks)) + " ";
        } else {
          // 레벨 8-10: 클릭 수에 따라 서운함 또는 애정 표현
          if (stats.clicks < 6) {
            msg += t.clickLonely.replace("{clicks}", String(stats.clicks)) + " ";
          } else {
            msg += t.clickHigh.replace("{clicks}", String(stats.clicks)) + " ";
          }
        }

        // 4. 마무리
        msg += t.outro;
        
        setContent(msg);
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
