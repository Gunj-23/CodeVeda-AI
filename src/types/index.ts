export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  imagePrompt?: string;
  imageUrl?: string; // For placeholder or actual image
  originalText?: string; // For translated messages
  translatedText?: string; // For translated messages
  isTyping?: boolean; // For typing indicator
}

export interface LanguageOption {
  value: string;
  label: string;
}

export const LANGUAGES: LanguageOption[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ar', label: 'Arabic' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
];
