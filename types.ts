
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
  userName: string; // 사용자 본명
  name: string;
  honorific: string;
  imageSrc: string | null;
  gender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  speciesTrait?: string; 
  personality: string[]; 
  selectedDialogueStyles: DialogueStyles; 
  apiKey: string; // User-provided Gemini API Key

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
}
