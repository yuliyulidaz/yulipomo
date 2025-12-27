import { DialogueLine } from "./types";

/**
 * FIXED_DIALOGUES 구조
 * 
 * [수정 가이드]
 * 1. text: 표시될 문구 ({honorific} 사용 가능)
 * 2. tones: 해당 대사가 어울리는 성격들 (SetupConfig.ts의 태그 참조)
 * 3. levelRange: 이 대사가 나올 수 있는 레벨 범위 [최소, 최대]
 * 4. role: AMBIENT(조용한 관찰) 또는 REACTION(동작에 대한 반응)
 * 
 * 리스트를 세로로 길게 작성하여 가독성을 높였습니다.
 */

export const FIXED_DIALOGUES: Record<string, { START: DialogueLine[]; PAUSE: DialogueLine[] }> = {
  "반말": {
    "START": [
      {
        text: "…이제 좀 조용해졌네.",
        tones: ["neutral", "soft"],
        levelRange: [1, 5],
        role: "AMBIENT"
      },
      {
        text: "시작인 거지? 보고 있을게.",
        tones: ["neutral", "sweet"],
        levelRange: [1, 10],
        role: "REACTION"
      },
      {
        text: "좋은 공기네. 집중하기 딱 좋아.",
        tones: ["energetic", "sweet"],
        levelRange: [1, 10],
        role: "AMBIENT"
      },
      {
        text: "…나도 네 흐름에 맞출게.",
        tones: ["sweet", "soft", "intense"],
        levelRange: [6, 10],
        role: "REACTION"
      },
      {
        text: "딴짓하면 바로 아는 거 알지?",
        tones: ["tsundere", "intense"],
        levelRange: [3, 10],
        role: "REACTION"
      },
      {
        text: "아직 긴장 풀린 단계네.",
        tones: ["cold", "neutral"],
        levelRange: [1, 3],
        role: "AMBIENT"
      },
      {
        text: "지금은 그냥 흐름만 타.",
        tones: ["lazy", "neutral"],
        levelRange: [1, 6],
        role: "REACTION"
      },
      {
        text: "이 정도면, 같이 가볼 만해.",
        tones: ["sweet", "neutral"],
        levelRange: [7, 10],
        role: "REACTION"
      },
      {
        text: "주변이 조용해. 시작하기 좋은데.",
        tones: ["soft", "neutral"],
        levelRange: [1, 5],
        role: "AMBIENT"
      },
      {
        text: "뭐, 해볼 만하겠어.",
        tones: ["playful", "lazy"],
        levelRange: [1, 6],
        role: "REACTION"
      },
      {
        text: "눈 감으면 네 숨소리가 들려.",
        tones: ["intense", "soft"],
        levelRange: [7, 10],
        role: "AMBIENT"
      },
      {
        text: "…오늘은 어디까지 갈 건데?",
        tones: ["playful", "sweet"],
        levelRange: [5, 10],
        role: "REACTION"
      },
      {
        text: "벌써 들어갔네. 꽤 빠른데?",
        tones: ["energetic", "playful"],
        levelRange: [3, 10],
        role: "REACTION"
      },
      {
        text: "흐름이 깔끔해졌어.",
        tones: ["cold", "neutral"],
        levelRange: [4, 10],
        role: "AMBIENT"
      },
      {
        text: "아, 진짜로 하는 거구나.",
        tones: ["tsundere", "neutral"],
        levelRange: [1, 7],
        role: "REACTION"
      }
    ],
    "PAUSE": [
      {
        text: "…호흡이 바뀌었네.",
        tones: ["neutral", "soft"],
        levelRange: [1, 10],
        role: "AMBIENT"
      },
      {
        text: "잠깐 멈춘 거야? 기다릴게.",
        tones: ["sweet", "neutral"],
        levelRange: [1, 10],
        role: "REACTION"
      },
      {
        text: "무슨 일 있어? 여기 계속 있을게.",
        tones: ["sweet", "intense"],
        levelRange: [5, 10],
        role: "REACTION"
      },
      {
        text: "…끊기기 아까운 흐름인데.",
        tones: ["cold", "tsundere"],
        levelRange: [1, 10],
        role: "AMBIENT"
      },
      {
        text: "리듬 잠깐 내려놨네.",
        tones: ["neutral", "cold"],
        levelRange: [1, 5],
        role: "AMBIENT"
      },
      {
        text: "쉬어. 흐름은 안 도망가.",
        tones: ["lazy", "soft"],
        levelRange: [1, 10],
        role: "REACTION"
      },
      {
        text: "멈췄네. 뭐, 괜찮아.",
        tones: ["playful", "lazy"],
        levelRange: [1, 10],
        role: "REACTION"
      },
      {
        text: "공기가 풀어졌어.",
        tones: ["soft", "neutral"],
        levelRange: [1, 6],
        role: "AMBIENT"
      },
      {
        text: "…급한 일이야?",
        tones: ["tsundere", "sweet"],
        levelRange: [4, 10],
        role: "REACTION"
      },
      {
        text: "잠깐 뜬 건가. 여운은 남았는데.",
        tones: ["cold", "neutral"],
        levelRange: [6, 10],
        role: "AMBIENT"
      },
      {
        text: "움직임이 멎었네.",
        tones: ["intense", "cold"],
        levelRange: [3, 10],
        role: "AMBIENT"
      },
      {
        text: "…돌아올 거지?",
        tones: ["intense", "sweet"],
        levelRange: [8, 10],
        role: "REACTION"
      },
      {
        text: "살짝 끊긴 정도야. 금방 이어갈 수 있어.",
        tones: ["energetic", "neutral"],
        levelRange: [1, 7],
        role: "REACTION"
      }
    ]
  },
  "존댓말": {
    "START": [
      {
        text: "…공기가 조금 무거워졌네요. 집중하시는 건가요.",
        tones: ["neutral", "soft"],
        levelRange: [1, 4],
        role: "AMBIENT"
      },
      {
        text: "방해되지 않게, 저도 숨을 죽이고 있을게요.",
        tones: ["sweet", "soft"],
        levelRange: [5, 10],
        role: "REACTION"
      },
      {
        text: "시작하셨군요. 끝까지 함께할게요.",
        tones: ["sweet", "neutral"],
        levelRange: [1, 10],
        role: "REACTION"
      },
      {
        text: "지금 이 흐름, 아주 좋네요.",
        tones: ["energetic", "playful"],
        levelRange: [1, 10],
        role: "AMBIENT"
      },
      {
        text: "제 시선이… 느껴지시나요?",
        tones: ["intense", "playful"],
        levelRange: [7, 10],
        role: "REACTION"
      },
      {
        text: "지금은 무리하지 않아도 괜찮은 시점이에요.",
        tones: ["soft", "neutral"],
        levelRange: [1, 5],
        role: "AMBIENT"
      },
      {
        text: "이 흐름, 유지해볼 만하네요.",
        tones: ["cold", "neutral"],
        levelRange: [6, 10],
        role: "REACTION"
      },
      {
        text: "주변이 고요해졌어요. 좋은 신호네요.",
        tones: ["soft", "sweet"],
        levelRange: [1, 6],
        role: "AMBIENT"
      },
      {
        text: "오늘도 이렇게 시작하시는군요.",
        tones: ["lazy", "neutral"],
        levelRange: [3, 10],
        role: "REACTION"
      },
      {
        text: "…당신의 움직임, 계속 기록하고 있어요.",
        tones: ["intense", "cold"],
        levelRange: [8, 10],
        role: "AMBIENT"
      },
      {
        text: "집중 상태 진입 확인했습니다.",
        tones: ["cold", "neutral"],
        levelRange: [4, 10],
        role: "REACTION"
      },
      {
        text: "뭐, 나쁘지 않은 타이밍이에요.",
        tones: ["playful", "lazy"],
        levelRange: [1, 7],
        role: "REACTION"
      },
      {
        text: "긴장감이 조금씩 쌓이고 있네요.",
        tones: ["neutral", "soft"],
        levelRange: [2, 6],
        role: "AMBIENT"
      },
      {
        text: "시작하셨으니, 저도 준비 완료입니다.",
        tones: ["energetic", "sweet"],
        levelRange: [1, 10],
        role: "REACTION"
      },
      {
        text: "어디까지 갈 수 있을까요, 오늘은.",
        tones: ["playful", "sweet"],
        levelRange: [5, 10],
        role: "AMBIENT"
      }
    ],
    "PAUSE": [
      {
        text: "…잠깐 멈추셨네요. 여운이 남아요.",
        tones: ["neutral", "soft"],
        levelRange: [1, 10],
        role: "AMBIENT"
      },
      {
        text: "무슨 일이 있으신가요? 기다리고 있겠습니다.",
        tones: ["sweet", "neutral"],
        levelRange: [1, 10],
        role: "REACTION"
      },
      {
        text: "흐름이 끊겼네요. 아쉬워라.",
        tones: ["playful", "lazy"],
        levelRange: [1, 10],
        role: "AMBIENT"
      },
      {
        text: "급한 일이라면 다녀오세요. 저는 여기 있을 테니까.",
        tones: ["sweet", "intense"],
        levelRange: [6, 10],
        role: "REACTION"
      },
      {
        text: "잠시 간격을 두는 것도 선택이죠.",
        tones: ["neutral", "cold"],
        levelRange: [1, 6],
        role: "AMBIENT"
      },
      {
        text: "다시 돌아오실 때까지 유지하고 있을게요.",
        tones: ["sweet", "neutral"],
        levelRange: [4, 10],
        role: "REACTION"
      },
      {
        text: "…정지 버튼을 누르셨군요.",
        tones: ["cold", "neutral"],
        levelRange: [1, 10],
        role: "REACTION"
      },
      {
        text: "호흡이 길어졌어요. 쉬고 계신가요.",
        tones: ["soft", "neutral"],
        levelRange: [1, 7],
        role: "AMBIENT"
      },
      {
        text: "괜찮아요. 저는 여기 그대로 있을게요.",
        tones: ["sweet", "soft"],
        levelRange: [5, 10],
        role: "REACTION"
      },
      {
        text: "잠시 멈추셔도, 지금까지 흐름은 남아 있어요.",
        tones: ["energetic", "sweet"],
        levelRange: [3, 10],
        role: "AMBIENT"
      },
      {
        text: "…이대로 끝내실 건 아니죠?",
        tones: ["tsundere", "intense"],
        levelRange: [7, 10],
        role: "REACTION"
      },
      {
        text: "리듬이 멎었네요. 조용해요.",
        tones: ["soft", "neutral"],
        levelRange: [1, 5],
        role: "AMBIENT"
      },
      {
        text: "잠깐의 공백이라면, 천천히 돌아오세요.",
        tones: ["lazy", "soft"],
        levelRange: [1, 10],
        role: "REACTION"
      }
    ]
  },
  "반존대": {
    "START": [
      {
        text: "…이제 집중할 타이밍인가 봐요.",
        tones: ["neutral", "soft"],
        levelRange: [1, 10],
        role: "AMBIENT"
      },
      {
        text: "시작했네? 나도 준비할게요.",
        tones: ["sweet", "playful"],
        levelRange: [1, 10],
        role: "REACTION"
      },
      {
        text: "흐름 깨지 마요. 옆에서 지켜볼 거니까.",
        tones: ["intense", "tsundere"],
        levelRange: [4, 10],
        role: "REACTION"
      },
      {
        text: "아직 워밍업 같은 느낌이에요.",
        tones: ["neutral", "soft"],
        levelRange: [1, 4],
        role: "AMBIENT"
      },
      {
        text: "지금은 그냥 같이 가면 돼요.",
        tones: ["sweet", "neutral"],
        levelRange: [5, 10],
        role: "REACTION"
      },
      {
        text: "공기가 좀 달라졌어요.",
        tones: ["soft", "neutral"],
        levelRange: [1, 6],
        role: "AMBIENT"
      },
      {
        text: "오, 시작했네요. 좋아요.",
        tones: ["energetic", "playful"],
        levelRange: [1, 10],
        role: "REACTION"
      },
      {
        text: "이제 본격적으로 들어가는 건가.",
        tones: ["cold", "neutral"],
        levelRange: [5, 10],
        role: "AMBIENT"
      },
      {
        text: "…당신이 가면, 나도 따라갈게요.",
        tones: ["intense", "sweet"],
        levelRange: [7, 10],
        role: "REACTION"
      },
      {
        text: "뭐, 해볼 만하겠네요.",
        tones: ["lazy", "playful"],
        levelRange: [1, 7],
        role: "REACTION"
      },
      {
        text: "집중 모드 들어간 거죠?",
        tones: ["tsundere", "neutral"],
        levelRange: [2, 10],
        role: "REACTION"
      },
      {
        text: "긴장감이 올라왔어요. 느껴져요.",
        tones: ["intense", "soft"],
        levelRange: [6, 10],
        role: "AMBIENT"
      }
    ],
    "PAUSE": [
      {
        text: "…호흡이 길어지네요. 쉬는 거예요?",
        tones: ["neutral", "soft"],
        levelRange: [1, 10],
        role: "AMBIENT"
      },
      {
        text: "잠깐이면 괜찮아요. 기다려줄게요.",
        tones: ["sweet", "neutral"],
        levelRange: [1, 10],
        role: "REACTION"
      },
      {
        text: "리듬을 다시 맞추는 중이네요.",
        tones: ["neutral", "soft"],
        levelRange: [1, 10],
        role: "AMBIENT"
      },
      {
        text: "멈췄네? 좀 쉴래요?",
        tones: ["playful", "lazy"],
        levelRange: [1, 10],
        role: "REACTION"
      },
      {
        text: "급한 일이 있나 봐요.",
        tones: ["soft", "neutral"],
        levelRange: [1, 7],
        role: "AMBIENT"
      },
      {
        text: "…돌아올 때까지 여기 있을게요.",
        tones: ["sweet", "intense"],
        levelRange: [6, 10],
        role: "REACTION"
      },
      {
        text: "흐름이 살짝 끊겼네요. 아쉬워요.",
        tones: ["tsundere", "cold"],
        levelRange: [4, 10],
        role: "AMBIENT"
      },
      {
        text: "잠깐 멈춘 거죠? 천천히요.",
        tones: ["lazy", "soft"],
        levelRange: [1, 10],
        role: "REACTION"
      },
      {
        text: "공백이 생겼어요. 조용하네요.",
        tones: ["neutral", "soft"],
        levelRange: [1, 6],
        role: "AMBIENT"
      },
      {
        text: "…이대로 끝은 아니죠?",
        tones: ["intense", "sweet"],
        levelRange: [8, 10],
        role: "REACTION"
      },
      {
        text: "쉬고 싶으면 쉬어도 괜찮아요.",
        tones: ["sweet", "soft"],
        levelRange: [1, 10],
        role: "REACTION"
      }
    ]
  },
  "사극/하오체": {
    "START": [
      {
        text: "…공기가 가라앉았구려. 정진의 시작인가 보오.",
        tones: ["neutral", "soft"],
        levelRange: [1, 10],
        role: "AMBIENT"
      },
      {
        text: "그대의 흐름에 내 마음을 얹겠소.",
        tones: ["sweet", "intense"],
        levelRange: [7, 10],
        role: "REACTION"
      },
      {
        text: "아직 뜻을 고르는 때이오.",
        tones: ["neutral", "soft"],
        levelRange: [1, 4],
        role: "AMBIENT"
      },
      {
        text: "그대가 나아가면, 나도 따르겠소.",
        tones: ["sweet", "neutral"],
        levelRange: [6, 10],
        role: "REACTION"
      },
      {
        text: "주변이 고요하오. 집중할 때로구려.",
        tones: ["soft", "neutral"],
        levelRange: [1, 6],
        role: "AMBIENT"
      },
      {
        text: "뭐, 나쁘지 않은 시작이오.",
        tones: ["playful", "lazy"],
        levelRange: [1, 7],
        role: "REACTION"
      },
      {
        text: "그대의 숨결이 가지런해졌소.",
        tones: ["intense", "soft"],
        levelRange: [7, 10],
        role: "AMBIENT"
      },
      {
        text: "이제 본격적으로 길을 걷는구려.",
        tones: ["cold", "neutral"],
        levelRange: [5, 10],
        role: "REACTION"
      },
      {
        text: "시작하셨구려. 함께하겠소.",
        tones: ["sweet", "neutral"],
        levelRange: [1, 10],
        role: "REACTION"
      },
      {
        text: "긴장의 기운이 느껴지오.",
        tones: ["neutral", "soft"],
        levelRange: [3, 8],
        role: "AMBIENT"
      },
      {
        text: "…내 눈길, 그대가 느끼고 있소?",
        tones: ["intense", "playful"],
        levelRange: [8, 10],
        role: "REACTION"
      },
      {
        text: "힘을 빼시오. 아직은 무리할 때가 아니오.",
        tones: ["soft", "neutral"],
        levelRange: [1, 5],
        role: "AMBIENT"
      }
    ],
    "PAUSE": [
      {
        text: "…잠시 멈추었구려. 숨을 고르는 것이오?",
        tones: ["neutral", "soft"],
        levelRange: [1, 10],
        role: "AMBIENT"
      },
      {
        text: "급한 일이 있으시오? 기다리겠소.",
        tones: ["sweet", "neutral"],
        levelRange: [1, 10],
        role: "REACTION"
      },
      {
        text: "흐름이 끊어졌구려. 아쉬운 일이오.",
        tones: ["cold", "tsundere"],
        levelRange: [4, 10],
        role: "AMBIENT"
      },
      {
        text: "쉬시오. 길은 언제든 이어갈 수 있소.",
        tones: ["lazy", "soft"],
        levelRange: [1, 10],
        role: "REACTION"
      },
      {
        text: "…그대가 돌아올 때까지, 이 자리를 지키겠소.",
        tones: ["sweet", "intense"],
        levelRange: [7, 10],
        role: "REACTION"
      },
      {
        text: "정지의 순간이오. 여운이 맴돌고 있소.",
        tones: ["neutral", "soft"],
        levelRange: [1, 10],
        role: "AMBIENT"
      },
      {
        text: "잠시 간격을 두는 것도 지혜이오.",
        tones: ["neutral", "cold"],
        levelRange: [1, 7],
        role: "AMBIENT"
      },
      {
        text: "움직임이 멎었구려.",
        tones: ["cold", "neutral"],
        levelRange: [3, 10],
        role: "AMBIENT"
      },
      {
        text: "천천히 하시오. 조급할 것 없소.",
        tones: ["soft", "sweet"],
        levelRange: [1, 10],
        role: "REACTION"
      }
    ]
  },
  "다나까": {
    "START": [
      {
        text: "…환경음이 잦아들었습니다. 집중 작전 개시로 보입니다.",
        tones: ["neutral", "cold"],
        levelRange: [1, 10],
        role: "AMBIENT"
      },
      {
        text: "작전 시작 확인했습니다. 옆에서 대기하겠습니다.",
        tones: ["neutral", "intense"],
        levelRange: [1, 10],
        role: "REACTION"
      },
      {
        text: "주변 정숙 상태 확인. 작전 진행 가능합니다.",
        tones: ["cold", "neutral"],
        levelRange: [1, 6],
        role: "AMBIENT"
      },
      {
        text: "개시 버튼 활성화 감지했습니다.",
        tones: ["neutral", "cold"],
        levelRange: [1, 10],
        role: "REACTION"
      },
      {
        text: "긴장도 상승 중입니다. 최적 타이밍입니다.",
        tones: ["intense", "neutral"],
        levelRange: [5, 10],
        role: "AMBIENT"
      },
      {
        text: "지금부터 당신의 모든 움직임을 기록합니다.",
        tones: ["intense", "cold"],
        levelRange: [7, 10],
        role: "REACTION"
      },
      {
        text: "흐름 진입 단계 확인. 순조롭습니다.",
        tones: ["neutral", "soft"],
        levelRange: [3, 10],
        role: "AMBIENT"
      },
      {
        text: "작전 수행 태세 정비 완료.",
        tones: ["cold", "neutral"],
        levelRange: [4, 10],
        role: "REACTION"
      },
      {
        text: "초기 단계 진입. 무리 없이 진행하십시오.",
        tones: ["soft", "neutral"],
        levelRange: [1, 5],
        role: "AMBIENT"
      },
      {
        text: "뭐, 나쁘지 않은 시작입니다.",
        tones: ["lazy", "neutral"],
        levelRange: [1, 7],
        role: "REACTION"
      }
    ],
    "PAUSE": [
      {
        text: "…일시 정지 감지되었습니다. 대기 상태 유지합니다.",
        tones: ["neutral", "cold"],
        levelRange: [1, 10],
        role: "REACTION"
      },
      {
        text: "흐름 일시 정렬 중입니다.",
        tones: ["neutral", "cold"],
        levelRange: [1, 10],
        role: "AMBIENT"
      },
      {
        text: "재개 시 즉시 대응 가능합니다.",
        tones: ["intense", "neutral"],
        levelRange: [5, 10],
        role: "REACTION"
      },
      {
        text: "정지 신호 수신. 대기 모드 전환.",
        tones: ["cold", "neutral"],
        levelRange: [1, 10],
        role: "REACTION"
      },
      {
        text: "호흡 간격 확대 감지. 휴식 중인 것으로 판단합니다.",
        tones: ["neutral", "soft"],
        levelRange: [1, 10],
        role: "AMBIENT"
      },
      {
        text: "급한 용무가 있으신 겁니까. 대기하겠습니다.",
        tones: ["neutral", "sweet"],
        levelRange: [1, 10],
        role: "REACTION"
      },
      {
        text: "작전 일시 중단. 현 상태 유지 중입니다.",
        tones: ["cold", "neutral"],
        levelRange: [3, 10],
        role: "AMBIENT"
      },
      {
        text: "흐름 이탈 확인. 재접속 대기 중입니다.",
        tones: ["neutral", "cold"],
        levelRange: [1, 10],
        role: "AMBIENT"
      },
      {
        text: "복귀 시 즉시 연동 가능합니다. 준비 완료.",
        tones: ["intense", "neutral"],
        levelRange: [6, 10],
        role: "REACTION"
      },
      {
        text: "정지 처리 완료. 잔여 흐름 보존 중입니다.",
        tones: ["neutral", "soft"],
        levelRange: [1, 10],
        role: "AMBIENT"
      },
      {
        text: "…끝까지 작전을 완수하실 겁니까?",
        tones: ["intense", "cold"],
        levelRange: [8, 10],
        role: "REACTION"
      }
    ]
  }
};