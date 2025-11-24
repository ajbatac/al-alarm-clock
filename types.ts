export interface Alarm {
  id: string;
  time: string; // HH:MM format
  days: number[]; // 0-6, 0 = Sunday
  label: string;
  isActive: boolean;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  snoozeEnabled: boolean;
  snoozeDuration?: number; // Duration in minutes
  sound: string;
  volume: number; // 0 to 1
}

export interface UserStats {
  streak: number;
  totalPoints: number;
  badges: string[];
  wakeUpHistory: WakeUpEvent[];
}

export interface WakeUpEvent {
  date: string; // ISO date string
  timeTakenSeconds: number;
  success: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isLoading?: boolean;
  attachment?: string; // Base64 image for display
}

export enum AppTab {
  ALARMS = 'ALARMS',
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  ANALYZE = 'ANALYZE',
}

export interface Challenge {
  question: string;
  options?: string[];
  answer: string;
  type: 'MATH' | 'TRIVIA';
}