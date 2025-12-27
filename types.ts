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

export type ToneTag = "sweet" | "cold" | "tsundere" | "playful" | "energetic" | "lazy" | "intense" | "neutral" | "soft";
export type DialogueRole = "AMBIENT" | "REACTION";

export interface DialogueLine {
  text: string;
  tones: ToneTag[];         // 성격 태그 (중복 가능)
  levelRange: [number, number]; // [최소 레벨, 최대 레벨]
  role: DialogueRole;       // AMBIENT(공기) vs REACTION(반응)
}

export interface CharacterProfile {
  apiKey: string; 
  userName: string; 
  name: string;
  honorific: string;
  imageSrc: string | null;
  gender: 'MALE' | 'FEMALE' | 'NEUTRAL'; 
  charGender: 'MALE' | 'FEMALE' | 'NEUTRAL' | ''; 
  speciesTrait?: string; 
  personality: string[]; 
  selectedDialogueStyles: DialogueStyles; 

  xp: number;
  level: number;
  maxXpForNextLevel: number;
  
  streak: number;
  totalFocusMinutes: number;
  totalCompletedCycles: number; 
  receivedNotes: SurpriseNote[];

  dialogueCache: {
    scolding: string[];
    click: string[];
    pause: string[];
    start: string[];
  };

  initialGreeting: string;
  todayTask?: string; 

  cycleStats?: {
    distractions: number;
    clicks: number;
  };

  lastActive?: number;
  savedTimeLeft?: number;
  savedIsBreak?: boolean;
  savedSessionInCycle?: number;
  savedIsActive?: boolean;
}
