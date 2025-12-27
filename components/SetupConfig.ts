import { HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ToneTag } from "../types";

export const GREETING_TEMPLATES: Record<string, string> = {
  "반말": "{honorific}, 시작 버튼 눌러. 기다리고 있어.",
  "존댓말": "준비되셨나요? 시작 버튼을 눌러주세요, {honorific}.",
  "반존대": "{honorific}, 시작 버튼 안 보여요? 얼른 눌러요.",
  "사극/하오체": "준비가 되었으면 시작 버튼을 누르시오, {honorific}.",
  "다나까": "{honorific}, 시작 버튼 안 누릅니까? 기다리고 있습니다."
};

export const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

export const TONE_KEYWORDS = ["반말", "존댓말", "반존대", "사극/하오체", "다나까"];
export const PERSONALITY_KEYWORDS = ["다정함/스윗", "츤데레", "엄격/냉철", "능글/플러팅", "집착/광공", "소심/부끄", "활기/에너지", "나른/귀차니즘"];

// 유저가 고른 성격 키워드를 시스템 태그로 변환
export const KEYWORD_TO_TAGS: Record<string, ToneTag[]> = {
  "다정함/스윗": ["sweet", "soft"],
  "츤데레": ["tsundere", "neutral"],
  "엄격/냉철": ["cold", "intense"],
  "능글/플러팅": ["playful", "sweet"],
  "집착/광공": ["intense", "cold"],
  "소심/부끄": ["soft", "neutral"],
  "활기/에너지": ["energetic", "playful"],
  "나른/귀차니즘": ["lazy", "neutral"]
};