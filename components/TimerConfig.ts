
import { HarmCategory, HarmBlockThreshold } from "@google/genai";
import { DialogueLine } from "../types";

export const LEVEL_XP_TABLE = [0, 10, 20, 30, 50, 80, 120, 170, 230, 300, 400]; 

export const LEVEL_TITLES: Record<number, string> = {
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

export const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

export type FallbackType = 'CLICK' | 'SCOLDING';

export const FALLBACK_TEMPLATES: Record<string, Record<FallbackType, Omit<DialogueLine, 'role'>[]>> = {
  "반말": {
    CLICK: [
      { text: "응, {honorific} 왜 불러?", tones: ["playful", "neutral", "soft"], levelRange: [1, 10] },
      { text: "할 일은 해야겠지.", tones: ["intense", "cold", "neutral"], levelRange: [1, 5] },
      { text: "시간이 빨리 가는 것 같아.", tones: ["soft", "neutral", "lazy"], levelRange: [1, 7] },
      { text: "집중하자, {honorific}.", tones: ["sweet", "neutral", "energetic"], levelRange: [1, 10] },
      { text: "나 보고 싶어서 부른 거야?", tones: ["playful", "sweet"], levelRange: [5, 10] },
      { text: "딴 생각 하는 건 아니지? 응?", tones: ["tsundere", "intense"], levelRange: [3, 8] },
      { text: "…계속 옆에 있을게.", tones: ["soft", "intense", "sweet"], levelRange: [7, 10] },
      { text: "너랑 있으면 시간 가는 줄 모르겠어.", tones: ["sweet", "soft"], levelRange: [8, 10] }
    ],
    SCOLDING: [
      { text: "야, 딴짓하다 이제 왔어? 기다렸잖아.", tones: ["playful", "tsundere"], levelRange: [1, 10] },
      { text: "딴짓한 거 다 보고 있었다. 다시 할 거지?", tones: ["intense", "neutral", "cold"], levelRange: [1, 10] },
      { text: "야야, 딴짓 걸렸어. 다시 집중해.", tones: ["energetic", "playful"], levelRange: [1, 10] },
      { text: "너 없는 동안 심심했어. 얼른 해.", tones: ["sweet", "soft", "playful"], levelRange: [6, 10] },
      { text: "딴짓하지 마. 보고 있다니까.", tones: ["cold", "intense"], levelRange: [1, 5] },
      { text: "나 두고 어디 갔다 온 거야? 서운해.", tones: ["tsundere", "intense"], levelRange: [7, 10] }
    ]
  },
  "존댓말": {
    CLICK: [
      { text: "네? 부르셨나요?", tones: ["neutral", "soft"], levelRange: [1, 10] },
      { text: "조금만 더 하면 돼요. 힘내요.", tones: ["sweet", "soft", "energetic"], levelRange: [1, 10] },
      { text: "집중, 집중이에요.", tones: ["energetic", "neutral"], levelRange: [1, 7] },
      { text: "어떻게 도와드릴까요?", tones: ["neutral", "cold"], levelRange: [1, 5] },
      { text: "당신의 노력을 지켜보고 있어요.", tones: ["intense", "sweet", "soft"], levelRange: [6, 10] },
      { text: "…이렇게 쳐다보시면 조금 부끄럽네요.", tones: ["soft", "neutral", "playful"], levelRange: [7, 10] },
      { text: "함께 있는 이 시간이 참 소중해요.", tones: ["sweet", "soft"], levelRange: [8, 10] }
    ],
    SCOLDING: [
      { text: "오셨군요. 딴짓하시는 거 다 보고 있었어요.", tones: ["playful", "neutral", "tsundere"], levelRange: [1, 10] },
      { text: "{honorific}, 딴짓은 안 돼요. 다시 집중해 볼까요?", tones: ["sweet", "soft", "neutral"], levelRange: [1, 10] },
      { text: "기다리고 있었어요. 이제 다시 시작해요.", tones: ["sweet", "neutral", "energetic"], levelRange: [3, 10] },
      { text: "지금 뭐 하시는 거예요? 집중해주세요.", tones: ["intense", "cold"], levelRange: [1, 7] },
      { text: "어디 다녀오신 건가요? 걱정했잖아요.", tones: ["soft", "intense", "sweet"], levelRange: [7, 10] },
      { text: "잠깐 자리를 비우신 동안 마음이 허전했습니다.", tones: ["sweet", "intense"], levelRange: [9, 10] }
    ]
  },
  "반존대": {
    CLICK: [
      { text: "어? 뭐 말씀하실 거예요?", tones: ["playful", "soft", "neutral"], levelRange: [1, 10] },
      { text: "왜요? 뭐 필요해졌어?", tones: ["sweet", "playful"], levelRange: [1, 10] },
      { text: "부른 거 맞죠? 듣고 있어요.", tones: ["neutral", "soft"], levelRange: [1, 10] },
      { text: "집중 잘 안 돼요? 도와줄까?", tones: ["sweet", "soft", "energetic"], levelRange: [4, 10] },
      { text: "…그렇게 쳐다보면 부끄러운데.", tones: ["soft", "neutral", "playful"], levelRange: [7, 10] },
      { text: "나랑 노는 게 더 재밌는 건가?", tones: ["playful", "tsundere"], levelRange: [5, 9] }
    ],
    SCOLDING: [
      { text: "늦었네요. 딴짓하다 이제 온 거죠? 기다렸어요.", tones: ["playful", "sweet", "tsundere"], levelRange: [1, 10] },
      { text: "흐음... 딴짓하는 거 보였는데. 이제 집중해요.", tones: ["tsundere", "neutral", "cold"], levelRange: [1, 10] },
      { text: "딴짓 들켰어요. 다시 온 거 맞죠?", tones: ["playful", "neutral"], levelRange: [1, 10] },
      { text: "나 두고 어디 갔었어? 서운하려고 하네.", tones: ["sweet", "intense", "soft"], levelRange: [6, 10] },
      { text: "제자리로 복귀하세요. 보고 있어요.", tones: ["cold", "intense"], levelRange: [1, 6] },
      { text: "한참 기다렸잖아요. 이제 나만 봐요.", tones: ["intense", "sweet"], levelRange: [8, 10] }
    ]
  },
  "사극/하오체": {
    CLICK: [
      { text: "무슨 일이오? 내가 필요하오?", tones: ["neutral", "soft"], levelRange: [1, 10] },
      { text: "부디 정진에 힘쓰시오.", tones: ["intense", "cold", "neutral"], levelRange: [1, 10] },
      { text: "내 시선이 부담스러운 게요?", tones: ["playful", "neutral", "tsundere"], levelRange: [1, 10] },
      { text: "그대의 곁을 지키고 있겠소.", tones: ["sweet", "soft", "intense"], levelRange: [5, 10] },
      { text: "잠시 쉬어가도 좋으나, 멈추지는 마시오.", tones: ["soft", "neutral"], levelRange: [1, 7] },
      { text: "그대의 열기에 내 마음도 뜨겁구려.", tones: ["intense", "sweet"], levelRange: [8, 10] }
    ],
    SCOLDING: [
      { text: "어찌 한눈을 파는 것이오! 이제야 오는구려.", tones: ["intense", "cold", "tsundere"], levelRange: [1, 10] },
      { text: "그것은 수행에 방해가 되오. 다시 마음을 가다듬으시오.", tones: ["neutral", "soft", "cold"], levelRange: [1, 10] },
      { text: "기다리다 목이 빠지는 줄 알았소. 정진하시오.", tones: ["sweet", "playful", "energetic"], levelRange: [3, 10] },
      { text: "그대의 마음이 딴 곳에 가 있었구려. 이리 오시오.", tones: ["soft", "intense", "sweet"], levelRange: [7, 10] }
    ]
  },
  "다나까": {
    CLICK: [
      { text: "용건 있으십니까? 호출에 응답합니다.", tones: ["neutral", "cold"], levelRange: [1, 10] },
      { text: "목표 달성까지 전진하십시오.", tones: ["intense", "neutral", "energetic"], levelRange: [1, 10] },
      { text: "현재 상태 이상 무.", tones: ["cold", "neutral"], levelRange: [1, 10] },
      { text: "지속적인 모니터링 수행 중입니다.", tones: ["neutral", "soft", "intense"], levelRange: [1, 10] },
      { text: "당신의 성공을 확신합니다.", tones: ["sweet", "intense", "soft"], levelRange: [8, 10] },
      { text: "호출 빈도가 높습니다. 혹시 심리적 안정이 필요합니까?", tones: ["soft", "neutral"], levelRange: [5, 10] }
    ],
    SCOLDING: [
      { text: "기강이 해이해졌습니다! 즉시 복귀 확인.", tones: ["intense", "cold"], levelRange: [1, 10] },
      { text: "딴짓 중단 및 복귀 신고합니다! 늦으셨습니다.", tones: ["neutral", "playful", "tsundere"], levelRange: [1, 10] },
      { text: "재접속 확인. 전방 주시하며 작전을 계속합니다.", tones: ["neutral", "intense"], levelRange: [1, 10] },
      { text: "이탈 시간이 길었습니다. 집중력 보강이 필요합니다.", tones: ["cold", "neutral"], levelRange: [1, 7] },
      { text: "복귀를 환영합니다. 다시 시작하시겠습니까?", tones: ["sweet", "soft", "energetic"], levelRange: [5, 10] },
      { text: "당신이 없는 동안 구역 보안이 허술했습니다. 환영합니다.", tones: ["tsundere", "soft"], levelRange: [7, 10] }
    ]
  }
};
