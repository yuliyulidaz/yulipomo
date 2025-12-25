import { CharacterProfile } from '../types';

/**
 * 캐릭터의 호감도 레벨에 따른 기분 라벨 반환
 */
export const getMoodLabel = (level: number) => {
  if (level <= 3) return "사무적이고 차가운 (Cold/Strict)";
  if (level <= 7) return "친근하고 다정한 (Friendly/Warm)";
  return "깊은 애정과 신뢰가 느껴지는 (Deeply Affectionate)";
};

/**
 * 타이머 상황별 한국어 설명 맵
 */
export const DIALOGUE_SITUATIONS: Record<string, string> = { 
  scolding: '유저가 딴짓을 하거나 주의가 산만해진 상황 (꾸짖음/잔소리)', 
  praising: '집중 세션을 성공적으로 마친 상황 (칭찬/보상)', 
  idle: '집중 중간에 유저를 격려하거나 조용히 지켜보는 상황 (응원/관찰)', 
  click: '유저가 캐릭터를 클릭하여 말을 거는 상황 (일상적 상호작용)', 
  pause: '유저가 잠시 타이머를 멈춘 상황 (의문/기다림)', 
  start: '집중을 시작하거나 다시 재개하는 상황 (각오/다짐)' 
};

/**
 * 공통 페르소나 및 타겟 유저 정보 문자열 생성
 */
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
- Current Relationship Level: Lv.${profile.level}/10 (Mood: ${getMoodLabel(profile.level)})

[Tone Reference: User's Preference]
유저가 직접 선택한 선호 말투 표본입니다. 이 '온도'와 '심리적 거리감'을 완벽히 유지하세요:
${anchorText}`;
};

/**
 * 메인 대사 리필용 프롬프트 빌더 (useAIManager용)
 */
export const buildRefillPrompt = (profile: CharacterProfile, category: string, timeContext: string, seasonContext: string) => {
  const clickSpecialInstruction = category === 'click' ? `
[Special Mission for 'CLICK']
1. 유저와 같은 시간, 같은 공간에 있다는 '현장감'을 강조하세요.
2. 유저의 분위기나 외양을 관찰하는 묘사를 포함하세요 (예: "오늘따라 눈이 맑네", "어깨가 좀 뭉친 것 같아").
3. 5개의 문장은 각각 다른 분위기(장난, 걱정, 사소한 칭찬, 혼잣말, 가벼운 질문)여야 합니다.` : "";

  return `
${buildPersonaHeader(profile)}

[Real-time Context]
- Time of Day: ${timeContext}
- Current Season: ${seasonContext}
- Core Premise: 유저가 지금 구체적으로 수학 숙제를 하는지, 코딩을 하는지 등 작업의 종류는 언급하지 마세요. (세계관 몰입 방지)

[The Mission: Generate ${category}]
작업: 상황 "${DIALOGUE_SITUATIONS[category]}"에 맞는 한국어 대사 5개를 생성하세요.
${clickSpecialInstruction}

[Writing Guidelines]
1. 길이 제한: 문장당 10~30자 이내의 짧고 임팩트 있는 구어체.
2. **번역투 금지**: '어이', '~인 셈이지', '~랄까', '나의 ~' 같은 일본식 번역투나 작위적인 말투를 엄격히 금지합니다. 한국 사람이 일상에서 쓸법한 자연스러운 문장으로 캐릭터의 성격을 녹여내세요.
3. 호칭 사용: {honorific}을 문장 흐름에 맞춰 자연스럽게 딱 한 번만 사용하세요.
4. 출력 형식: 따옴표 없이 문장만 줄바꿈(Newline)으로 구분하여 나열하세요.
`;
};

/**
 * 초기 설정 퀴즈용 프롬프트 빌더 (SetupScreen용)
 */
export const buildQuizPrompt = (data: { name: string, charGender: string, selectedPersonalities: string[], selectedTone: string, tmi: string, userName: string, gender: string, honorific: string }) => {
  return `
[Character Engine: Core Personality Construction]
1. Identity:
- Name: ${data.name} (${data.charGender})
- Core Personality: ${data.selectedPersonalities.join(', ')}
- Speech Tone: ${data.selectedTone}
- Background Quirk (TMI): ${data.tmi}

2. Target User:
- Name: ${data.userName} (${data.gender})
- Preferred Honorific: ${data.honorific || '유저'}

3. Mission: Create 9 distinct Korean dialogue options (3 for each situation).

4. Situations & Goals:
- Situation 1 (Late): The user is late for a promised time. Show how ${data.name} reacts.
- Situation 2 (Gift): The user gives a surprise gift. Capture gratitude mixed with traits.
- Situation 3 (Lazy): The user is procrastinating. Show 'scolding' or 'nagging' style.

5. Creative Guidelines:
- Length: Strictly under 30 Korean characters per line.
- Diversity: For each situation, provide 3 options: [Option A: Standard / Option B: Emotional / Option C: TMI-centric].
- Naturalness: Use realistic, modern Korean. Avoid Japanese-style translation cliches.
- Dynamic: Naturally integrate {honorific} or user's name.

Strictly JSON only.`;
};

/**
 * 퀴즈 대사 낱개 새로고침용 프롬프트 빌더 (SetupScreen용)
 */
export const buildRefreshQuizPrompt = (data: { name: string, charGender: string, selectedPersonalities: string[], selectedTone: string, tmi: string, userName: string, gender: string, honorific: string, situationIdx: number, targetKey: string }) => {
  const situations = ["지각했을 때", "선물이나 칭찬을 받았을 때", "딴짓을 할 때"];
  return `
Create 3 NEW Korean dialogue options for the situation: "${situations[data.situationIdx]}".
Character: ${data.name} (${data.charGender}), Personality: ${data.selectedPersonalities.join(', ')}, Style: ${data.selectedTone}, TMI: ${data.tmi}.
Target User: ${data.userName} (${data.gender}), Honorific: ${data.honorific || '유저'}.

Guidelines:
- Strictly under 30 characters.
- 3 variants: [A: Standard / B: Emotional / C: TMI-centric].
- Avoid cringey translation style.
- Return JSON with key: "${data.targetKey}".
`;
};
