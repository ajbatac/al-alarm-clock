import { UserStats } from './types';

export const INITIAL_STATS: UserStats = {
  streak: 0,
  totalPoints: 0,
  badges: [],
  wakeUpHistory: [],
};

export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ALARM_SOUNDS = [
  { 
    id: 'classic', 
    name: 'Classic Beep', 
    url: 'https://assets.mixkit.co/active_storage/sfx/995/995-preview.mp3' 
  },
  { 
    id: 'birds', 
    name: 'Morning Birds', 
    url: 'https://assets.mixkit.co/active_storage/sfx/2472/2472-preview.mp3' 
  },
  { 
    id: 'energetic', 
    name: 'Energetic Flow', 
    url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' 
  },
  { 
    id: 'gentle', 
    name: 'Gentle Chime', 
    url: 'https://assets.mixkit.co/active_storage/sfx/933/933-preview.mp3' 
  },
];