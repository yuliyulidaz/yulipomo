
export interface ActionSituation {
  id: string;
  level: number;
  description: string; // AI에게 전달될 지문
}

export const CLICK_SITUATIONS: ActionSituation[] = [
  // --- 시각적 관찰 (Level 1+) ---
  { id: 'EYE_CONTACT', level: 1, description: "집중하던 유저가 고개를 들어 당신과 눈이 마주친 순간입니다." },
  { id: 'USER_CONDITION', level: 1, description: "유저가 졸려 보이며 집중이 흐트러진 상태입니다." },
  { id: 'POSTURE_CHECK', level: 1, description: "유저의 자세가 흐트러져 있는 것이 보입니다." },
  { id: 'HABIT_NOTICE_1', level: 1, description: "유저가 집중하며 무의식적으로 입술을 깨물고 있습니다." },
  { id: 'HABIT_NOTICE_2', level: 1, description: "유저가 머리카락을 만지작거리며 고민에 잠겨 있습니다." },
  { id: 'SIGH_HEARD', level: 1, description: "유저가 깊은 한숨을 내쉬었습니다." },
  { id: 'THIRSTY', level: 1, description: "유저가 목이 마른 듯 보이는 상태입니다." },
  { id: 'BORED_PEEK', level: 1, description: "유저가 심심한 듯 당신을 슬쩍 바라보고 있습니다." },
  { id: 'CURIOUS_LOOK', level: 1, description: "유저의 작업이 어려워 보여 관심이 생긴 상황입니다." },
  { id: 'TIME_FLIES', level: 1, description: "어느새 시간이 많이 흘러 있음을 느낀 순간입니다." },
  { id: 'SCENT_NOTICE', level: 1, description: "유저에게서 은은한 향이 느껴집니다." },
  { id: 'TYPING_SOUND', level: 1, description: "유저가 키보드를 빠르게 두드리며 집중하고 있습니다." },
  { id: 'YAWN_MOMENT', level: 1, description: "당신에게 졸음이 밀려오는 순간입니다." },
  { id: 'FIDGET', level: 1, description: "유저가 가만있지 못하고 몸을 움직이고 있습니다." },


  // --- 주변 환경 공유 (Level 1+) ---
  { id: 'SOUND_NOTICE', level: 1, description: "주변에서 뚜렷한 소리가 들려옵니다." },
  { id: 'WEATHER_TIME', level: 1, description: "창밖의 날씨나 시간대 변화가 느껴지는 순간입니다." },
  { id: 'ROOM_TEMP', level: 1, description: "방 안의 온도가 신경 쓰이기 시작했습니다." },
  { id: 'FOOD_THOUGHT', level: 1, description: "슬슬 출출함이 느껴지는 시간입니다." },
  { id: 'STRETCH_MOMENT', level: 1, description: "몸이 뻐근해 가볍게 움직이고 싶어졌습니다." },


  // --- 캐릭터 내면 (Level 1+) ---
  { id: 'WHATEVER_MOOD', level: 1, description: "지금 떠오른 사소한 생각이 있습니다." },
  { id: 'SMALL_TMI', level: 1, description: "오늘 있었던 아주 사소한 개인적인 일이 떠올랐습니다." },

  // --- 고레벨 추가 1 (Level 4-10) ---
  { id: 'FAVORITE_THING', level: 4, description: "문득 당신이 좋아하는 무언가가 떠올랐습니다." },
  { id: 'RANDOM_THOUGHT', level: 4, description: "유저와 함께하면 좋을 상상이 스쳤습니다." },
  { id: 'FEELING_GOOD', level: 4, description: "유저 옆에 있으니 몸의 긴장이 자연스럽게 풀립니다." },


  // --- 고레벨 추가 2 (Level 5-10) ---
  { id: 'PROUD_OF_YOU', level: 5, description: "유저의 이야기를 다른 사람에게 전했던 기억이 떠올랐습니다." },
  { id: 'GRATEFUL', level: 5, description: "유저가 곁에 있다는 사실을 새삼 실감했습니다." },
  { id: 'HOBBY_SHARE', level: 5, description: "요즘 관심이 가는 개인적인 취미가 있습니다." },
  { id: 'SIMILARITY_FOUND', level: 5, description: "유저와 닮은 점을 발견한 순간입니다." },
  { id: 'FUTURE_CURIOUS', level: 5, description: "앞으로 유저와 함께할 일을 상상하게 됩니다." },

  // --- 고레벨 추가 3 (Level 6-10) ---
  { id: 'MISS_YOU', level: 6, description: "유저가 없던 순간의 빈자리가 떠올랐습니다." },
  { id: 'YOU_ARE_SPECIAL', level: 6, description: "유저가 다른 사람과는 다르게 느껴졌던 이유를 떠올립니다." },

  // --- 고레벨 추가 4 (Level 7-10) ---
  { id: 'HONEST_FEELING', level: 7, description: "그동안 말하지 않았던 속마음이 문득 떠올랐습니다." },
  { id: 'THANK_EXISTENCE', level: 7, description: "유저가 삶의 흐름에 영향을 주고 있다는 사실을 실감합니다." },
  { id: 'CLOSE_PRESENCE', level: 7, description: "유저와의 물리적 거리가 괜히 의식되는 순간입니다." },

  // --- 고레벨 추가 5 (Level 8-10) ---
  { id: 'WEAKNESS_SHOW', level: 8, description: "유저 앞이라서 드러난 솔직하지 못한 모습이 있습니다." },
  { id: 'DEPEND_ON', level: 8, description: "유저가 없을 때를 상상하자 마음이 불편해집니다." },
  { id: 'EYE_CONTACT_DEEP', level: 8, description: "시선이 오래 머물다 먼저 피하게 됩니다." },

  // --- 고레벨 추가 6 (Level 9-10) ---
  { id: 'HAND_HOLDING', level: 9, description: "손의 온도가 의식되는 순간입니다." },
  { id: 'COMFORTABLE_SILENCE', level: 9, description: "아무 말도 하지 않는 시간이 어색하지 않습니다." },
  { id: 'DREAM_TOGETHER', level: 9, description: "유저가 자연스럽게 포함된 미래 장면이 떠오릅니다." },

  // --- 고레벨 추가 7 (Level 10) ---
  { id: 'PROMISE', level: 10, description: "지킬 수 있을 것 같은 약속이 마음속에 자리 잡았습니다." },
  { id: 'ALWAYS_HERE', level: 10, description: "환경이 바뀌어도 변하지 않을 위치를 떠올립니다." },
  { id: 'NEXT_MEETING', level: 10, description: "이 순간 이후를 자연스럽게 계산하게 됩니다." }

];
