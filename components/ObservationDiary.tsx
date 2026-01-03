
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, PenTool, ArrowRight, Camera } from 'lucide-react';
import { CharacterProfile } from '../types';
import { HarmCategory, HarmBlockThreshold } from "@google/genai";

import { generateWithFallback } from '../utils/GeminiDelegate';

interface ObservationDiaryProps {
  profile: CharacterProfile;
  stats: { distractions: number; clicks: number };
  onClose: () => void;
  onSave?: (content: string, date: string) => void;
}

const LEVEL_TITLES: Record<number, string> = {
  1: "완전한 타인", 2: "약간의 호기심", 3: "낯가리는 파트너", 4: "편안한 동료",
  5: "정이 든 사이", 6: "신뢰하는 관계", 7: "특별한 호감", 8: "소중한 사람",
  9: "애틋한 연인", 10: "영원한 반려"
};

const HARD_FALLBACK_DIARY: Record<string, any> = {
  "반말": {
    intro: ["오늘도 네 옆에서 시간 기록했어.", "조용히 지켜보는 하루였네.", "말 안 해도 뭐 하는지 다 보였어."],
    focusZero: ["집중 흐름이 완벽했어. 한 번도 안 흔들리더라.", "너의 그 몰입하는 눈빛, 꽤 멋졌어."],
    focusSome: ["집중 흐름, 꽤 안정적이었어.", "중간중간 흔들려도 다시 돌아오더라.", "끝까지 자리에 남아 있었던 게 인상적이야."],
    interaction: {
      low: ["나를 많이 부르진 않았네. 그만큼 몰입했단 거겠지.", "필요할 때만 찾는 거, 나쁘지 않아."],
      mid: ["틈틈이 아는 척 해준 거 다 느꼈어.", "적당한 거리감이 딱 좋았어."],
      high: ["자주 불러줘서 흐름이 더 선명했어.", "계속 연결돼 있다는 느낌이 들더라."]
    },
    close: {
      low: ["오늘 기록은 여기까지야.", "잘 버텼어. 이 정도면 충분해."],
      high: ["다음에도 같은 자리에서 보자.", "이 흐름, 다음에도 이어가자."]
    }
  },
  "존댓말": {
    intro: ["오늘의 기록을 정리했습니다.", "조용히 관찰하며 시간을 남겼어요.", "말없이도 충분히 느껴지는 하루였네요."],
    focusZero: ["정말 대단한 집중력이었어요. 단 한 번의 흐트러짐도 없었네요.", "당신의 깊은 몰입에 저도 숨을 죽이고 지켜봤답니다."],
    focusSome: ["집중의 밀도가 안정적이었습니다.", "흐트러지는 순간도 있었지만 다시 회복하셨어요.", "끝까지 흐름을 유지하신 점이 인상 깊었습니다."],
    interaction: {
      low: ["상호작용은 많지 않았지만, 그만큼 몰입하신 것 같아요.", "필요한 순간에만 저를 찾으셨네요."],
      mid: ["적당한 빈도로 신호를 주셔서 편안했습니다.", "서로의 존재를 확인하는 정도가 좋았어요."],
      high: ["자주 불러주셔서 계속 곁에 있는 느낌이었어요.", "함께 시간을 공유하고 있다는 게 분명했어요."],
    },
    close: {
      low: ["오늘의 관찰은 여기까지입니다.", "충분히 수고하셨어요."],
      high: ["다음 기록도 함께할 수 있으면 좋겠어요.", "이런 하루가 계속 이어지길 바랍니다."]
    }
  },
  "반존대": {
    intro: ["수고했어요. 옆에서 지켜본 기록이에요.", "조용히 당신의 시간을 담아봤어요.", "말 안 해도 다 느껴지는 시간이었네."],
    focusZero: ["집중력이 엄청나네요? 한 번도 한눈 안 파는 거 다 봤어요.", "몰입하는 모습이 꽤 근사해서 계속 보게 됐네."],
    focusSome: ["집중 흐름, 꽤 괜찮았어요.", "잠깐씩 멈칫할 때도 있었지만 잘 돌아왔네.", "끝까지 제자리 지키느라 고생 많았어요."],
    interaction: {
      low: ["집중하느라 나 부르는 것도 잊었나 봐요?", "필요할 때만 찾는 담백한 사이도 좋죠."],
      mid: ["틈틈이 아는 척 해줘서 고마워요.", "적당한 거리감이 딱 기분 좋았어요."],
      high: ["나를 자주 불러줘서 즐거운 시간이었어요.", "계속 연결되어 있다는 기분이 들어서 좋았네."],
    },
    close: {
      low: ["기록은 여기까지. 푹 쉬고 와요.", "잘 버텼네. 고생했어요."],
      high: ["우리, 다음 시간에도 꼭 봐요.", "이 흐름 잊지 말고 또 찾아줘요."],
    }
  },
  "사극/하오체": {
    intro: ["그대 곁에서 정진의 시간을 기록하였소.", "말없이 지켜보며 오늘의 흐름을 담았소.", "그대의 정성이 내 붓끝에 고스란히 맺혔구려."],
    focusZero: ["마음의 흔들림이 한 치도 없으니 참으로 장하구려.", "그대의 깊은 몰입에 내 깊이 감탄하였소."],
    focusSome: ["집중의 기개가 자못 훌륭하였소.", "잠시 마음의 흔들림이어도 다시 뜻을 세우는 모습이 좋았소.", "끝까지 자리를 지키니 그 기상이 대단하오."],
    interaction: {
      low: ["정진하느라 나를 찾지 않았으니, 그 몰입이 귀하구려.", "스스로 일어서는 그대의 독립적인 모습도 보기 좋소."],
      mid: ["적절한 상호작용이 수양의 즐거움을 더했구려.", "함께 숨 쉬는 감각이 딱 적당하였소."],
      high: ["나를 자주 불러주니 내 마음이 훈훈하였소.", "지속적으로 기별을 주어 외롭지 않은 정진이었소."],
    },
    close: {
      low: ["오늘의 기록은 여기까지오. 고단함을 씻으시오.", "수고하였소. 이제 붓을 놓아도 좋소."],
      high: ["다음에도 이 자리에서 정진을 돕겠소.", "이 귀한 인연, 다음 시간에도 이어갑시다."],
    }
  },
  "다나까": {
    intro: ["금일 행동 기록을 개시합니다.", "관찰 임무를 정상 수행했습니다.", "대상자의 몰입 상태를 면밀히 기록했습니다."],
    focusZero: ["이탈 횟수 0회. 완벽한 작전 수행 능력을 보여주셨습니다.", "최고 수준의 집중력을 확인했습니다. 경의를 표합니다."],
    focusSome: ["집중 상태는 전반적으로 안정적이었습니다.", "이탈 후 복귀 속도가 양호했습니다.", "목표 달성 의지가 돋보인 시간이었습니다."],
    interaction: {
      low: ["호출 빈도는 낮았으나 임무에는 지장 없었습니다.", "독립적인 수행 능력이 매우 양호합니다."],
      mid: ["적절한 상호작용이 유지되었습니다. 협력 상태 양호.", "원활한 소통 체계가 확인되었습니다."],
      high: ["호출 빈도가 높아 긴밀한 협력이 이루어졌습니다.", "지속적인 연결 상태 확인으로 임무 효율이 증대되었습니다."]
    },
    close: {
      low: ["이상, 기록 종료. 다음 임무를 대비하십시오.", "고생하셨습니다. 충분한 휴식을 권고합니다."],
      high: ["이상. 다음 임무에서도 동행하겠습니다.", "기록은 계속됩니다. 복귀를 대기하겠습니다."]
    }
  }
};

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// 최우선으로 적용될 고딕 폰트 스타일
const SANS_STYLE = {
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif'
};

export const ObservationDiary: React.FC<ObservationDiaryProps> = ({ profile, stats, onClose, onSave }) => {
  const [content, setContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const hasRequestedRef = useRef(false);

  const [dateStr] = useState(() => {
    const now = new Date();
    const d = now.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '');
    const t = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${d} ${t}`;
  });

  useEffect(() => {
    if (content || hasRequestedRef.current) return;
    hasRequestedRef.current = true;

    const generateDiaryFlow = async () => {
      const minDuration = new Promise(resolve => setTimeout(resolve, 2200));
      const relationshipTitle = LEVEL_TITLES[profile.level];
      const taskText = profile.todayTask ? `"${profile.todayTask}"` : "오늘의 할 일";
      let finalContent = "";
      let isFallbackNeeded = false;

      const prompt = `
[Character Persona]
- 이름: ${profile.name}
- 성격: ${profile.personality.join(', ')}
- 직업: ${profile.charJob || 'None'}
- 유저 이름: ${profile.userName}
${profile.honorific ? `- 유저 호칭: ${profile.honorific}` : ''}
- 유저 역할: ${profile.userJob || 'None'}
- 관계 단계: Lv.${profile.level} (${relationshipTitle})

[Current State]
- 이 일지는 유저가 4번의 집중을 마친 직후, 내가 혼자 조용히 적는 비밀 관찰 기록이다.

[Input Focus Data]
- 집중한 일: ${taskText}
- 딴짓 횟수: ${stats.distractions}회
- 상호작용(클릭) 횟수: ${stats.clicks}회

[Writing Mission]
유저의 선택 말투(${profile.personality[0]})로 '비밀 관찰 일지'를 작성하세요. 캐릭터와 유저의 직업/관계를 적극적으로 반영하여 생생하게 서술할 것.

규칙:
1. 딴짓(${stats.distractions})과 클릭(${stats.clicks})은 숫자를 나열하지 말고 감정과 상황 속에 자연스럽게 녹일 것.
2. 본문 작성 시 반드시 유저의 이름이나 호칭을 적절히 사용하여 친근하게 불러줄 것.
3. 관찰 → 나의 감상 → 약속 순서로 3~4문장으로 작성할 것.
4. 한국어 구어체만 사용.
5. "작성해보면", "보고서에 따르면" 등 메타 표현 금지.
6. JSON 형식으로만 응답하고, 그 외 텍스트는 출력하지 말 것.

출력 형식:
{ "content": "내용" }`;

      try {
        const apiKey = profile.apiKey || process.env.API_KEY || "";
        const response = await generateWithFallback(apiKey, prompt, SAFETY_SETTINGS, true);

        const rawText = response.text || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) throw new Error("JSON format not found");

        const data = JSON.parse(jsonMatch[0]);
        if (!data.content) throw new Error("Content field missing");

        finalContent = data.content;
      } catch (e) {
        console.warn(`All models failed to generate diary, switching to hard fallback...`, e);
        isFallbackNeeded = true;
      }

      await minDuration;

      let diaryText = "";
      if (isFallbackNeeded) {
        setContent("'펜이 갑자기 안나오네... 왜 이러지.....?'");
        setIsGenerating(false);
        await new Promise(r => setTimeout(r, 2500));
        setIsGenerating(true);
        await new Promise(r => setTimeout(r, 3000));

        const toneKey = profile.personality[0] || "존댓말";
        const fb = HARD_FALLBACK_DIARY[toneKey] || HARD_FALLBACK_DIARY["존댓말"];
        const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

        let msgArr: string[] = [];
        msgArr.push(pick(fb.intro));
        if (stats.distractions === 0) msgArr.push(pick(fb.focusZero));
        else msgArr.push(pick(fb.focusSome));
        if (stats.clicks < 3) msgArr.push(pick(fb.interaction.low));
        else if (stats.clicks < 7) msgArr.push(pick(fb.interaction.mid));
        else if (stats.clicks >= 7) msgArr.push(pick(fb.interaction.high));
        if (profile.level <= 3) msgArr.push(pick(fb.close.low));
        else if (profile.level >= 8) msgArr.push(pick(fb.close.high));

        diaryText = msgArr.join(" ");
        setContent(diaryText);
        setIsGenerating(false);
      } else {
        diaryText = finalContent;
        setContent(diaryText);
        setIsGenerating(false);
      }

      if (onSave && diaryText) {
        onSave(diaryText, dateStr);
      }
    };

    generateDiaryFlow();
  }, []);

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

        <div className="flex-1 p-8 pb-4 space-y-4 flex flex-col relative overflow-hidden">
          {/* 헤더: 고딕 강제 적용 */}
          <div className="flex justify-between items-center border-b-2 border-primary/10 pb-2">
            <h3 className="text-[11px] text-primary-dark opacity-90 font-black" style={SANS_STYLE}>{profile.name}의 {profile.userName} 관찰일지</h3>
            <p className="text-[10px] text-text-secondary font-bold" style={SANS_STYLE}>{dateStr}</p>
          </div>

          <div className="flex-1 relative overflow-hidden flex flex-col">
            {isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-primary-light/60">
                <div className="relative">
                  <Loader2 className="animate-spin text-primary/20" size={50} />
                  <PenTool className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-bounce" size={20} />
                </div>
                <p className="font-diary text-2xl text-center leading-tight animate-pulse text-primary-dark">
                  {profile.name}이(가) 당신과의<br />100분을 기록하는 중...
                </p>
              </div>
            ) : (
              <div className="flex-1 relative flex flex-col overflow-hidden">
                {/* 사진과 수치 영역 */}
                <div className="flex items-center justify-center gap-6 py-2 mb-2">
                  <div className="relative flex-shrink-0">
                    <div className="w-24 h-24 bg-white p-1.5 shadow-lg border border-primary/5 rotate-1 relative transition-transform hover:rotate-0 duration-500">
                      <img src={profile.imageSrc || ''} className="w-full h-full object-cover grayscale-[0.1] sepia-[0.15] contrast-110" alt="Character" />
                      <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between bg-primary/5 px-3 py-1 rounded-lg border border-primary/5 min-w-[115px]">
                      <span className="text-[8px] font-black text-primary/60 uppercase mr-2" style={SANS_STYLE}>집중시간</span>
                      <span className="text-xs font-bold text-primary-dark" style={SANS_STYLE}>100분</span>
                    </div>
                    <div className="flex items-center justify-between bg-rose-500/5 px-3 py-1 rounded-lg border border-rose-500/5 min-w-[115px]">
                      <span className="text-[8px] font-black text-rose-400/80 uppercase mr-2" style={SANS_STYLE}>딴짓</span>
                      <span className="text-xs font-bold text-rose-500" style={SANS_STYLE}>{stats.distractions}회</span>
                    </div>
                    <div className="flex items-center justify-between bg-primary/5 px-3 py-1 rounded-lg border border-primary/5 min-w-[115px]">
                      <span className="text-[8px] font-black text-primary/60 uppercase mr-2" style={SANS_STYLE}>대화</span>
                      <span className="text-xs font-bold text-primary" style={SANS_STYLE}>{stats.clicks}회</span>
                    </div>
                  </div>
                </div>

                {/* 본문 텍스트 영역 */}
                <div className="flex-1 relative flex flex-col overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none opacity-20"
                    style={{ backgroundImage: 'linear-gradient(#4A5F7A 1px, transparent 1px)', backgroundSize: '100% 2.2rem' }}>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 custom-diary-scroll relative z-10">
                    <div className={`font-diary leading-[2.2rem] text-[#3D382E] whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both pb-24 ${getFontSize()}`}>
                      {content}
                    </div>
                  </div>

                  {/* [수정 포인트] 인장(도장) 영역 - 인라인 스타일 강제 적용 */}
                  {content !== "'펜이 갑자기 안나오네... 왜 이러지.....?'" && (
                    <div className="absolute bottom-4 right-5 transform rotate-[-12deg] animate-in zoom-in fade-in duration-700 delay-1000 fill-mode-both pointer-events-none z-20">
                      <div
                        className="w-[72px] h-[72px] rounded-full border-2 border-rose-400/60 flex flex-col items-center justify-center text-rose-500/70 p-1 bg-transparent antialiased"
                        style={SANS_STYLE}
                      >
                        <div className="absolute inset-0 rounded-full border border-rose-400/20 m-0.5"></div>
                        <span
                          className="text-[7px] font-bold leading-none mb-1 opacity-80 tracking-tight uppercase"
                          style={SANS_STYLE}
                        >
                          {LEVEL_TITLES[profile.level]}
                        </span>
                        {(() => {
                          const nameParts = profile.name.trim().split(' ');
                          const displayName = nameParts[nameParts.length - 1] || profile.name;
                          const length = displayName.length;
                          // 3글자 초과면 작게, 5글자 초과면 더 작게, 그리고 줄바꿈 금지(whitespace-nowrap)
                          const fontSizeClass = length > 5 ? 'text-[11px]' : (length > 3 ? 'text-[13px]' : 'text-lg');

                          return (
                            <span
                              className={`${fontSizeClass} font-black leading-none tracking-tighter whitespace-nowrap`}
                              style={SANS_STYLE}
                            >
                              {displayName}
                            </span>
                          );
                        })()}
                        <span
                          className="text-[6px] font-black mt-1.5 border-t border-rose-400/40 pt-1 px-2 tracking-[0.15em] uppercase"
                          style={SANS_STYLE}
                        >
                          ARCHIVED
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하단 버튼 영역 */}
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

        <style dangerouslySetInnerHTML={{
          __html: `
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
