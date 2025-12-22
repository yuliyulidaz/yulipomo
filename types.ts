
export interface DialogueStyles {
  late: string;
  gift: string;
  lazy: string;
}

export interface SurpriseNote {
  id: string;
  level: number;
  content: string;
  date: string;
}

export interface CharacterProfile {
  apiKey: string; // 사용자가 입력한 Gemini API 키
  userName: string; // 사용자 본명
  name: string;
  honorific: string;
  imageSrc: string | null;
  gender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  speciesTrait?: string; 
  personality: string[]; 
  selectedDialogueStyles: DialogueStyles; 

  xp: number;
  level: number;
  maxXpForNextLevel: number;
  
  streak: number;
  totalFocusMinutes: number;
  receivedNotes: SurpriseNote[];

  dialogueCache: {
    scolding: string[];
    praising: string[];
    idle: string[];
    click: string[];
    pause: string[];
    start: string[];
  };

  initialGreeting: string;

  // 사이클 통계 기록용 (보고서용)
  cycleStats?: {
    distractions: number;
    clicks: number;
  };

  // 새로고침 유지를 위한 필드
  lastActive?: number;
  savedTimeLeft?: number;
  savedIsBreak?: boolean;
  savedSessionInCycle?: number;
  savedIsActive?: boolean;
}
