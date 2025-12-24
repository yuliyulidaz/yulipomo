
import { HarmCategory, HarmBlockThreshold } from "@google/genai";

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

export const FALLBACK_TEMPLATES: Record<string, Record<string, string[]>> = {
  "반말": {
    START: ["자, 시작하자. {honorific}, 집중해.", "이제 시작이야. 화이팅!", "준비됐지? {honorific}.", "{honorific}, 해보자고."],
    FINISH: ["끝났네? 고생했어. 좀쉴까?"],
    PAUSE: ["어디 가? 얼른 와라."],
    DISTRACTION: ["야, 딴짓하지 마. 보고 있다.", "그거 내려놔. 집중해.", "야야, 딴짓 걸렸어."],
    RETURN: ["이제 왔어? 기다렸잖아."],
    CLICK: ["뭐야, {honorific} 왜 불러?", "할 일은 해야겠지.", "시간이 빨리 가는 것 같아", "집중하자, {honorific}."],
    IDLE: ["졸지 말고 해. 지켜보고 있어.", "잘하고 있어. 계속 가.", "힘내. 거의 다 왔어."],
    READY: ["슬슬 다시 시작할 준비 해."],
    BATTERY_LOW: ["배터리 없나 봐. {honorific}, 밥 좀 줘.", "화면 꺼지겠다. 빨리 충전기 가져와.", "나랑 더 있으려면 충전해야겠는데?"]
  },
  "존댓말": {
    START: ["준비되셨나요? 시작할게요, {honorific}.", "이제 시작합니다. 집중해주세요.", "시작하겠습니다. 화이팅하세요.", "가볼까요? {honorific}, 집중 모드 돌입!"],
    FINISH: ["정말 고생 많으셨어요. 잠깐 쉬세요."],
    PAUSE: ["어디 가하시나요? 금방 오셔야 해요."],
    DISTRACTION: ["{honorific}, 딴짓은 안 돼요. 집중하세요.", "지금 뭐 하시는 거예요? 집중해주세요.", "{honorific}, 보고 있어요. 집중하세요."],
    RETURN: ["오셨군요. 기다리고 있었어요."],
    CLICK: ["네? 부르셨나요?", "조금만 더 하면 돼요.", "집중, 집중이에요.", "어떻게 도와드릴까요?"],
    IDLE: ["지켜보고 있으니까 힘내세요.", "잘하고 계세요. 계속하세요.", "화이팅하세요. 옆에 있어요."],
    READY: ["쉬는 시간 끝나가요. 준비해주세요."],
    BATTERY_LOW: ["{honorific}, 배터리가 부족해요. 충전기를 연결해주세요.", "저랑 더 오래 있으시려면 밥(충전기)을 주셔야 할 것 같아요.", "기운이 없나 봐요. 기기에 전원을 연결해주시겠어요?"]
  },
  "반존대": {
    START: ["시작해요. {honorific}, 딴짓하면 혼나요.", "자, 시작이에요. {honorific}, 집중!", "가요! {honorific}, 따라와요."],
    FINISH: ["수고했어요. 뭐, 나쁘지 않네."],
    PAUSE: ["어딜 가요? 도망가는 건 아니지?"],
    DISTRACTION: ["흐음... 지금 뭐 하는 거죠? 끄세요.", "어? 딴짓하는 거 보였어요.", "딴짓 들켰어요. 집중해요."],
    RETURN: ["늦었네요. 설명이 좀 필요할 텐데."],
    CLICK: ["어? 뭐 말씀하실 거예요?", "왜요? 뭐 필요해졌어?", "부른 거 맞죠? 듣고 있어요."],
    IDLE: ["제 얼굴 말고 화면 봐요.", "잘하고 있어요. 계속 가요.", "포기하지 말아요. 옆에 있어요."],
    READY: ["쉬는 시간 끝나가요. 준비해."],
    BATTERY_LOW: ["배터리 챙겨야겠는데? 저러다 꺼지겠어.", "{honorific}, 충전 안 해요? 나 눈 감기기 직전이야.", "배터리가 없네. 충전기 꽂아주면 안 돼요?"]
  },
  "사극/하오체": {
    START: ["시작하겠소. {honorific}, 부디 집중하시오."],
    FINISH: ["노고가 많았소. 차라도 한 잔 드시오."],
    PAUSE: ["어딜 가는 게요? 자리를 비우지 마시오."],
    DISTRACTION: ["그것은 수행에 방해가 되오. 덮으시오."],
    RETURN: ["이제야 오는구려. 목이 빠지는 줄 알았소."],
    CLICK: ["무슨 일이오? 내가 필요하오?"],
    IDLE: ["내가 여기 있으니 염려 마시오. 잘하고 있소."],
    READY: ["다시 정진할 시간이오. 채비하시오."],
    BATTERY_LOW: ["기력이 다해가는구려. 서둘러 기력을 보충(충전)하시오.", "불이 꺼질 듯하니, 어서 동력(전원)을 넣으시오.", "이대로는 더 지켜봐 줄 수 없소. 충전하시게."]
  },
  "다나까": {
    START: ["작전 시작합니다. {honorific}, 집중하십시오!"],
    FINISH: ["임무 완료! 수고하셨습니다. 휴식하십시오."],
    PAUSE: ["이탈입니까? 신속히 복귀하십시오."],
    DISTRACTION: ["전방 주시! 딴짓은 허용하지 않습니다."],
    RETURN: ["복귀 신고합니다! 늦으셨습니다."],
    CLICK: ["용건 있으십니까? 호출에 응답합니다."],
    IDLE: ["제가 후방을 맡겠습니다. 계속하십시오."],
    READY: ["휴식 종료 임박! 위치로 돌아가십시오."],
    BATTERY_LOW: ["보고합니다! 배터리 잔량이 위험 수준입니다. 충전하십시오.", "동력 부족 확인! 즉시 전원을 연결하십시오.", "작전 지속을 위해 배터리 충전이 필요합니다."]
  }
};
