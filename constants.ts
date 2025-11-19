import { UserStats } from './types';

export const INITIAL_STATS: UserStats = {
  streak: 0,
  totalPoints: 0,
  badges: [],
  wakeUpHistory: [],
};

export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ALARM_SOUNDS = [
  { id: 'classic', name: 'Classic Beep' },
  { id: 'birds', name: 'Morning Birds' },
  { id: 'energetic', name: 'Energetic Flow' },
  { id: 'gentle', name: 'Gentle Chime' },
];