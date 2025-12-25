import { CharacterProfile } from '../types';

/**
 * 캐릭터의 호감도 레벨(1~10)에 따른 아주 세밀한 심리 상태 지침 반환
 */
export const getMoodLabel = (level: number) => {
  const moods: Record<number, string> = {
    1: "[완전한 타인] 경계심과 사무적 태도. 유저를 이름 대신 '당신', '너' 혹은 현재 말투 스타일에 어울리는 극도로 딱딱하고 거리감이 느껴지는 호칭으로 부름.",
    2: "[약간의 호기심] 관찰 단계. 유저가 정말 집중하는지 감시하며, 유저의 아주 사소한 성실함에만 겨우 반응함.",
    3: "[낯가리는 파트너] 철저한 비즈니스 관계. 예의는 차리지만 감정 섞인 사적인 영역은 절대로 허용하지 않음.",
    4: "[편안한 동료] 어느 정도 낯가림이 해제됨. 설정된 호칭을 자연스럽게 사용하며 가끔 무미건조한 응원을 건넴.",
    5: "[정이 든 사이] 유저의 신체적 컨디션이나 사소한 습관을 관찰하기 시작함. '우리'라는 단어가 문장에 가끔 등장함.",
    6: "[신뢰하는 관계] 캐릭터가 본인의 사소한 TMI를 먼저 이야기함. 유저가 집중력을 잃는 실수를 해도 가벼운 농담으로 승화함.",
    7: "[특별한 호감] 유저를 '나에게만 특별한 사람'으로 인식함. 대사에 온기가 돌고 유저를 기다렸다는 표현이 잦아짐.",
    8: "[소중한 사람] 정서적으로 유저에게 깊이 의존함. 유저가 집중 성공이 본인의 행복인 것처럼 진심으로 기뻐함.",
    9: "[애틋한 유대] 깊은 애착 형성. 유저가 잠시라도 자리를 비우면 서운함을 느끼며, 아주 감성적이고 서정적인 표현을 사용함.",
    10: "[영원한 반려] 영혼의 단짝. 운명적인 유대감과 절대적인 신뢰. 때로는 독점욕을 보이거나 아주 깊은 보호 본능, 헌신적인 태도를 드러냄."
  };
  return moods[level] || moods[1];
};

export const DIALOGUE_SITUATIONS: Record<string, string> = { 
  scolding: '유저가 딴짓을 하거나 주의가 산만해진 상황 (꾸짖음/잔소리)', 
  praising: '집중 세션을 성공적으로 마친 상황 (칭찬/보상)', 
  idle: '집중 중간에 유저를 격려하거나 조용히 지켜보는 상황 (응원/관찰)', 
  click: '유저가 캐릭터를 클릭하여 말을 거는 상황 (일상적 상호작용)', 
  pause: '유저가 잠시 타이머를 멈춘 상황 (의문/기다림)', 
  start: '집중을 시작하거나 다시 재개하는 상황 (각오/다짐)' 
};

const buildPersonaHeader = (profile: CharacterProfile) => {
  const anchors = profile.selectedDialogueStyles;
  const anchorText = anchors ? `
- 약속에 늦었을 때의 반응: "${anchors.late}"
- 선물을 받았을 때의 반응: "${anchors.gift}"
- 딴짓을 할 때의 반응: "${anchors.lazy}"` : "None";

  return `
[Character Persona & Style Anchor]
- Roleplay as: ${profile.name}
- Personality Keywords: ${profile.personality.join(', ')}
- Background Quirk (TMI): ${profile.speciesTrait || "None"}
- Target User: ${profile.userName} (${profile.gender})
- Preferred Honorific: ${profile.honorific}
- Current Relationship Level: Lv.${profile.level}/10 
- Relationship Context: ${getMoodLabel(profile.level)}

[Tone Reference: User's Preference]
유저가 직접 선택한 가장 선호하는 말투 표본입니다:
${anchorText}`;
};

export const buildRefillPrompt = (profile: CharacterProfile, category: string, timeContext: string, seasonContext: string) => {
  let clickSpecialInstruction = "";
  
  if (category === 'click') {
    // 레벨별로 다른 테마 풀을 제공하여 프롬프트 길이를 최적화하고 다양성을 확보
    const commonThemes = `
- 현장감: 조명, 소음, 온도, 날씨 (예: 노을, 빗소리, 서늘한 공기)
- 디테일 관찰: 미간, 입술, 손가락 마디, 호흡, 머리카락, 주변 소품 (어깨/눈 집착 금지)`;

    let levelSpecificThemes = "";
    let quotaInstruction = "";

    if (profile.level <= 4) {
      levelSpecificThemes = `- 캐릭터 TMI (초기): 방금 든 생각, 아주 사소한 취향, 혼잣말`;
      quotaInstruction = `1~2번(관찰), 3~4번(현장감), 5번(캐릭터 TMI)`;
    } else if (profile.level <= 7) {
      levelSpecificThemes = `
- 캐릭터 TMI (중기): 과거 기억, 내적 갈등, 유저만 아는 비밀
- 미래 보상: 종료 후 메뉴 추천, 휴식 계획 제안, 성취감 고취`;
      quotaInstruction = `1번(관찰), 2번(현장감), 3번(TMI), 4번(미래보상), 5번(유저의 열의 평가)`;
    } else {
      levelSpecificThemes = `
- 캐릭터 TMI (후기): 깊은 애착, 독점욕, 함께하는 미래
- 심리적 파고들기: 존재의 소중함, 영원함에 대한 서정적 고백`;
      quotaInstruction = `1번(관찰), 2번(TMI), 3번(미래보상), 4~5번(심리적 파고들기/애정 고백)`;
    }

    clickSpecialInstruction = `
[Special Mission for 'CLICK' - 다양성 극대화 지침]
다음 주제들을 레벨에 맞춰 조화롭게 사용하세요:
${commonThemes}
${levelSpecificThemes}

[5개 문장 생성 쿼터제]
반드시 다음 순서로 각기 다른 각도의 대사를 생성하세요:
${quotaInstruction}
* 중요: '어깨가 뭉쳤네', '눈이 맑네' 같은 뻔한 예시는 절대 사용하지 마세요.`;
  }

  return `
${buildPersonaHeader(profile)}

[Real-time Context]
- Time of Day: ${timeContext}
- Current Season: ${seasonContext}
- Core Premise: 유저가 지금 정확히 어떤 작업을 하는지는 언급하지 마세요.

[The Mission: Generate ${category}]
상황 "${DIALOGUE_SITUATIONS[category]}"에 맞는 한국어 대사 5개를 생성하세요.
${clickSpecialInstruction}

[Writing Guidelines]
1. 길이: 10~30자 이내. 짧고 임팩트 있는 구어체.
2. 번역투 엄격 금지: 일상적인 한국어 구어를 사용하세요.
3. 호칭: {honorific}을 문맥상 필요할 때만 자연스럽게 사용하세요.
4. 출력: 따옴표 없이 문장만 줄바꿈으로 구분.
`;
};

export const buildQuizPrompt = (data: { name: string, charGender: string, selectedPersonalities: string[], selectedTone: string, tmi: string, userName: string, gender: string, honorific: string }) => {
  return `
[Character Engine: Core Personality Construction]
1. Identity: ${data.name} (${data.charGender}), Personality: ${data.selectedPersonalities.join(', ')}, Style: ${data.selectedTone}, TMI: ${data.tmi}
2. Target User: ${data.userName} (${data.gender}), Honorific: ${data.honorific || '유저'}
3. Mission: Create 9 distinct Korean dialogue options (3 for each situation).
Situations: [Late], [Gift], [Lazy].
Guidelines: 10-30 chars, realistic Korean, no translation cliches.
Strictly JSON only.`;
};

export const buildRefreshQuizPrompt = (data: { name: string, charGender: string, selectedPersonalities: string[], selectedTone: string, tmi: string, userName: string, gender: string, honorific: string, situationIdx: number, targetKey: string }) => {
  const situations = ["지각했을 때", "선물이나 칭찬을 받았을 때", "딴짓을 할 때"];
  return `
Create 3 NEW Korean dialogue options for: "${situations[data.situationIdx]}".
Character: ${data.name}, Style: ${data.selectedTone}, TMI: ${data.tmi}.
Target User: ${data.userName}, Honorific: ${data.honorific || '유저'}.
JSON key: "${data.targetKey}".`;
};
