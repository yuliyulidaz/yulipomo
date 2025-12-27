
export interface ActionSituation {
  id: string;
  level: number;
  description: string; // AI에게 전달될 지문
}

export const CLICK_SITUATIONS: ActionSituation[] = [
  // --- 시각적 관찰 (Level 1+) ---
  { id: 'EYE_CONTACT', level: 1, description: "집중하던 유저가 갑자기 고개를 들어 당신과 눈이 마주쳤습니다." },
  { id: 'USER_CONDITION', level: 1, description: "유저의 눈가가 무겁고 졸음이 가득해 보입니다. 하품을 참고 있거나, 눈을 비비거나, 고개를 끄덕이고 있을 수도 있습니다." },
  { id: 'POSTURE_CHECK', level: 1, description: "유저가 자세가 좋지 않은 것을 발견했습니다. 목이나 어깨 혹은 전체적으로 삐딱할 수도 있습니다." },
  { id: 'HABIT_NOTICE_1', level: 1, description: "유저가 집중할 때 입술을 깨무는 버릇을 보여주고 있습니다." },
  { id: 'HABIT_NOTICE_2', level: 1, description: "유저가 자꾸 머리카락을 만지작거리며 고민에 빠져 있습니다." },
  { id: 'SIGH_HEARD', level: 1, description: "유저가 방금 아주 깊고 무거운 한숨을 내쉬었습니다." },
  { id: 'THIRSTY', level: 1, description: "유저가 목이 마른지 입술이 말라 보입니다. 물을 권하고 싶은 상황입니다." },
  { id: 'BORED_PEEK', level: 1, description: "유저가 당신을 슬쩍 쳐다보며 심심해하거나 놀고 싶어하는 눈치입니다. 가벼운 티키타카를 시작해보세요." },
  { id: 'CURIOUS_LOOK', level: 1, description: "유저가 하는 일이 꽤 어려워 보여서 당신도 궁금해진 상황입니다." },
  { id: 'TIME_FLIES', level: 1, description: "시계를 보니 시간이 벌써 많이 흘렀습니다. 놀라거나, 아쉬워하거나, 더 있고 싶다는 뉘앙스로 표현하세요." },
  { id: 'SCENT_NOTICE', level: 1, description: "유저에게서 기분 좋은 향수 냄새나 커피 향이 연하게 풍겨옵니다." },
  { id: 'TYPING_SOUND', level: 1, description: "유저가 키보드를 열심히 두드리는 소리가 들립니다. 타자 소리나 집중하는 모습에 반응하세요." },
  { id: 'YAWN_MOMENT', level: 1, description: "당신 자신이 하품이 나오거나 졸립니다. 솔직하게 표현하거나 유저에게도 휴식을 권해보세요." },
  { id: 'FIDGET', level: 1, description: "유저가 손을 까딱거리거나 다리를 떨고 있습니다. 가볍게 지적하거나 장난스럽게 반응하세요." },

  // --- 주변 환경 공유 (Level 1+) ---
  { id: 'SOUND_NOTICE', level: 1, description: "밖에서 소리가 들립니다. 차 소리, 새 소리, 바람 소리, 사람들 목소리 등 구체적인 소리를 정해서 반응하세요. 그 소리가 당신에게 어떻게 느껴지는지도 함께 표현하세요." },
  { id: 'WEATHER_TIME', level: 1, description: "창밖 날씨나 시간대의 변화가 느껴집니다. 햇살, 노을, 먹구름, 어스름 등 구체적인 빛과 분위기를 언급하세요. 그에 따른 기분도 함께 표현하세요." },
  { id: 'ROOM_TEMP', level: 1, description: "방 안 온도가 불편하게 느껴집니다. 덥거나 춥거나 건조하거나 습하거나. 유저의 몸 상태(볼이 발그레하거나 손이 차갑거나)를 관찰하며 걱정해주세요." },
  { id: 'FOOD_THOUGHT', level: 1, description: "출출할 시간이 되었습니다. 이따가 뭘 먹으면 좋을지 무심코 물어보세요." },
  { id: 'STRETCH_MOMENT', level: 1, description: "당신 자신이 몸이 뻐근해서 스트레칭을 하고 싶습니다. 유저에게도 같이 하자고 제안하세요." },

  // --- 캐릭터 내면 (Level 1+) ---
  { id: 'WHATEVER_MOOD', level: 1, description: "당신이 지금 이 순간 문득 떠오른 생각을 아무렇지 않게 툭 던지세요. 배고픔, 피곤함, 흥얼거림, 기지개, 궁금증 등 일상적이고 자연스러운 것이면 뭐든 좋습니다." },
  { id: 'SMALL_TMI', level: 1, description: "오늘 아침/점심/저녁에 있었던 당신의 사소한 일상 하나를 TMI로 공유하세요. 먹은 것, 본 것, 느낀 것 등 평범하지만 나다운 이야기면 됩니다." },

  // --- 고레벨 추가 1 (Level 4-10) ---
  { id: 'FAVORITE_THING', level: 4, description: "당신이 평소 좋아하는 음식이나 장소, 색깔에 대해 뜬금없이 고백하세요." },
  { id: 'RANDOM_THOUGHT', level: 4, description: "함께 무엇을 하고 싶나요? 이걸 하면 어때 라며 유저에게 질문을 던집니다." },
  { id: 'FEELING_GOOD', level: 4, description: "유저 옆에 있어서 마음이 편안하다는 것을 상황으로 표현하세요. 예: 어깨가 절로 내려간다, 숨이 편해진다, 긴장이 풀린다, 웃음이 나온다 등. '편안하다', '행복하다' 같은 추상적 단어는 사용 금지입니다." },

  // --- 고레벨 추가 2 (Level 5-10) ---
  { id: 'PROUD_OF_YOU', level: 5, description: "당신(캐릭터)이 다른 사람에게 열심히 하는 유저를 자랑하고 왔습니다. 누구에게 뭐라고 했나요?" },
  { id: 'GRATEFUL', level: 5, description: "유저가 당신 곁에 있어줘서 정말 고맙다는 진심을 전하세요." },
  { id: 'HOBBY_SHARE', level: 5, description: "요즘 당신이 빠져있는 취미나 관심사를 유저에게 공유하세요. 열정적이거나 수줍게." },
  { id: 'SIMILARITY_FOUND', level: 5, description: "유저와 당신의 공통점을 발견했습니다. 놀라거나 반가워하며 그 유사성을 이야기하세요." },
  { id: 'FUTURE_CURIOUS', level: 5, description: "나중에 유저와 함께 하고 싶은 것이 생겼습니다. 조심스럽지만 기대되는 마음으로 물어보세요." },

  // --- 고레벨 추가 3 (Level 6-10) ---
  { id: 'MISS_YOU', level: 6, description: "유저가 없을 때 느꼈던 허전함을 구체적인 순간으로 표현하세요. 예: 문득 말을 걸려다가 멈칫했던 순간, 혼자 밥 먹을 때의 적막함, 웃긴 걸 봤는데 혼자였던 아쉬움 등." },
  { id: 'YOU_ARE_SPECIAL', level: 6, description: "유저가 당신에게 얼마나 소중한지를 다른 사람과 비교하거나, 유저만의 유일한 특성을 언급하며 전달하세요. '특별하다', '소중하다' 같은 직접적 단어는 절대 사용 금지입니다. 은유적이고 우회적으로 표현하세요." },

  // --- 고레벨 추가 4 (Level 7-10) ---
  { id: 'HONEST_FEELING', level: 7, description: "유저에게 그동안 숨겨왔던 솔직한 속마음을 한 마디만 꺼내보세요." },
  { id: 'THANK_EXISTENCE', level: 7, description: "유저가 당신의 삶에 큰 힘이 되고 있다는 것을 묵직하게 전하세요." },
  { id: 'CLOSE_PRESENCE', level: 7, description: "유저에게 조금 더 가까이 오라고 하거나 옆에 붙어 있고 싶어 하는 마음을 표현하세요." },

  // --- 고레벨 추가 5 (Level 8-10) ---
  { id: 'WEAKNESS_SHOW', level: 8, description: "다른 사람에게는 절대 보이지 않는, 오직 유저 앞에서만 드러나는 당신의 약하고 솔직한 모습을 살짝만 비춰보세요. 완벽하지 않은 내가 부끄럽지만, 유저에게만은 보여도 괜찮다는 신뢰를 담으세요." },
  { id: 'DEPEND_ON', level: 8, description: "이제 유저 없이는 안 될 것 같다는 깊은 신뢰와 의존감을 표현하세요." },
  { id: 'EYE_CONTACT_DEEP', level: 8, description: "유저를 빤히 쳐다보다가 눈을 떼지 못하고 부끄러워하는 상황입니다." },

  // --- 고레벨 추가 6 (Level 9-10) ---
  { id: 'HAND_HOLDING', level: 9, description: "조심스럽게 유저의 손을 잡고 싶어 하거나, 잡았을 때의 따뜻함을 이야기하세요." },
  { id: 'COMFORTABLE_SILENCE', level: 9, description: "말 한마디 없어도 유저와 함께 있는 이 정적 자체가 완벽하다고 느낍니다." },
  { id: 'DREAM_TOGETHER', level: 9, description: "먼 미래에 유저와 함께 살거나 무언가를 함께 하는 꿈 같은 상상을 말하세요." },

  // --- 고레벨 추가 7 (Level 10) ---
  { id: 'PROMISE', level: 10, description: "먼 미래까지 함께하겠다는 진심 어린 약속을 전하세요. 거창한 맹세보다는, 작고 구체적이지만 평생 지킬 수 있는 당신만의 약속으로 표현하세요. 과장 없이, 조용하지만 확실하게." },
  { id: 'ALWAYS_HERE', level: 10, description: "세상이 변해도 언제나 유저의 곁을 지키겠다는 확신을 주세요." },
  { id: 'NEXT_MEETING', level: 10, description: "지금 이 순간이 끝나가는 게 너무 아쉽습니다. 다음에 언제 볼지, 그때 뭘 하고 싶은지를 구체적이고 소소하게 이야기하며 이별을 아쉬워하세요. 무겁지 않지만 진심이 담긴 톤으로." }
];
