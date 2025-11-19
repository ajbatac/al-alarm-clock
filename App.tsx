import React, { useState, useEffect, useRef } from 'react';
import { Alarm, UserStats, AppTab } from './types';
import { INITIAL_STATS } from './constants';
import AlarmList from './components/AlarmList';
import Dashboard from './components/Dashboard';
import ChatBot from './components/ChatBot';
import ImageAnalyzer from './components/ImageAnalyzer';
import AlarmTriggerModal from './components/AlarmTriggerModal';
import { Clock, BarChart2, MessageSquare, ScanEye } from 'lucide-react';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.ALARMS);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [triggerAlarm, setTriggerAlarm] = useState<Alarm | null>(null);
  
  // Refs for timing logic
  const alarmInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const alarmTriggeredTime = useRef<number>(0);

  // --- Logic ---

  // Load data on mount
  useEffect(() => {
    const savedAlarms = localStorage.getItem('alarms');
    const savedStats = localStorage.getItem('stats');
    if (savedAlarms) setAlarms(JSON.parse(savedAlarms));
    if (savedStats) setStats(JSON.parse(savedStats));
  }, []);

  // Save data on change
  useEffect(() => {
    localStorage.setItem('alarms', JSON.stringify(alarms));
  }, [alarms]);
  
  useEffect(() => {
    localStorage.setItem('stats', JSON.stringify(stats));
  }, [stats]);

  // Check Alarms Timer
  useEffect(() => {
    alarmInterval.current = setInterval(() => {
      const now = new Date();
      const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const currentDay = now.getDay();

      alarms.forEach(alarm => {
        if (alarm.isActive && alarm.time === currentTime && alarm.days.includes(currentDay)) {
          // Check if already triggered to prevent double trigger in same minute
          if (!triggerAlarm) {
             startAlarm(alarm);
          }
        }
      });
    }, 1000);

    return () => {
      if (alarmInterval.current) clearInterval(alarmInterval.current);
    };
  }, [alarms, triggerAlarm]);

  const startAlarm = (alarm: Alarm) => {
    setTriggerAlarm(alarm);
    alarmTriggeredTime.current = Date.now();
    // Play audio here ideally
    console.log("ALARM RINGING:", alarm.label, "Sound:", alarm.sound);
  };

  const handleAlarmDismiss = async (success: boolean) => {
    if (success && triggerAlarm) {
      const timeTaken = (Date.now() - alarmTriggeredTime.current) / 1000;
      
      // 1. Calculate Local Stats Update (Optimistic)
      const today = new Date().toISOString();
      
      // 2. Call Gemini to process rewards/logic
      const reward = await geminiService.processRewards(stats, timeTaken);
      
      // 3. Update Stats
      setStats(prev => {
        const newStreak = prev.streak + 1;
        const newPoints = prev.totalPoints + reward.points;
        const newBadges = reward.badge && !prev.badges.includes(reward.badge) 
          ? [...prev.badges, reward.badge] 
          : prev.badges;
          
        return {
          ...prev,
          streak: newStreak,
          totalPoints: newPoints,
          badges: newBadges,
          wakeUpHistory: [...prev.wakeUpHistory, { date: today, timeTakenSeconds: Math.round(timeTaken), success: true }]
        };
      });

      // 4. Adjust Difficulty for next time?
      const adjustment = await geminiService.getDifficultyAdjustment([...stats.wakeUpHistory, { date: today, timeTakenSeconds: timeTaken, success: true }]);
      
      setAlarms(prev => prev.map(a => 
        a.id === triggerAlarm.id ? { ...a, difficulty: adjustment.difficulty as 'EASY'|'MEDIUM'|'HARD' } : a
      ));

      alert(`Alarm dismissed! +${reward.points} Points. ${reward.reason}`);
      setTriggerAlarm(null);
    }
  };

  const handleSnooze = () => {
    if (triggerAlarm) {
        const duration = triggerAlarm.snoozeDuration || 5;
        alert(`Snoozing for ${duration} minutes...`);
        setTriggerAlarm(null);
        // In a real app, schedule a new one-off alarm later.
    }
  };

  const handleUpdateAlarm = (updatedAlarm: Alarm) => {
    setAlarms(prev => prev.map(a => a.id === updatedAlarm.id ? updatedAlarm : a));
  };

  // --- Render Helpers ---

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.ALARMS:
        return (
          <AlarmList 
            alarms={alarms} 
            onAddAlarm={(a) => setAlarms([...alarms, a])}
            onToggleAlarm={(id) => setAlarms(alarms.map(a => a.id === id ? {...a, isActive: !a.isActive} : a))}
            onDeleteAlarm={(id) => setAlarms(alarms.filter(a => a.id !== id))}
            onUpdateAlarm={handleUpdateAlarm}
          />
        );
      case AppTab.DASHBOARD:
        return <Dashboard stats={stats} />;
      case AppTab.CHAT:
        return <ChatBot />;
      case AppTab.ANALYZE:
        return <ImageAnalyzer />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-cyan-500/30">
      {/* Alarm Overlay */}
      {triggerAlarm && (
        <AlarmTriggerModal 
          alarm={triggerAlarm} 
          onDismiss={handleAlarmDismiss}
          onSnooze={handleSnooze}
        />
      )}

      {/* Main Content Area */}
      <main className="max-w-md mx-auto h-screen relative bg-slate-950 shadow-2xl overflow-hidden flex flex-col">
        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {renderContent()}
        </div>

        {/* Bottom Navigation */}
        <nav className="h-20 bg-slate-900 border-t border-slate-800 grid grid-cols-4 items-center px-2 z-40">
          <button 
            onClick={() => setActiveTab(AppTab.ALARMS)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === AppTab.ALARMS ? 'text-cyan-400 bg-slate-800' : 'text-slate-500 hover:text-slate-400'}`}
          >
            <Clock className="w-6 h-6" />
            <span className="text-[10px] font-bold">Clock</span>
          </button>
          <button 
            onClick={() => setActiveTab(AppTab.DASHBOARD)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === AppTab.DASHBOARD ? 'text-cyan-400 bg-slate-800' : 'text-slate-500 hover:text-slate-400'}`}
          >
            <BarChart2 className="w-6 h-6" />
            <span className="text-[10px] font-bold">Stats</span>
          </button>
          <button 
            onClick={() => setActiveTab(AppTab.CHAT)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === AppTab.CHAT ? 'text-cyan-400 bg-slate-800' : 'text-slate-500 hover:text-slate-400'}`}
          >
            <MessageSquare className="w-6 h-6" />
            <span className="text-[10px] font-bold">Chat</span>
          </button>
          <button 
            onClick={() => setActiveTab(AppTab.ANALYZE)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === AppTab.ANALYZE ? 'text-cyan-400 bg-slate-800' : 'text-slate-500 hover:text-slate-400'}`}
          >
            <ScanEye className="w-6 h-6" />
            <span className="text-[10px] font-bold">Vision</span>
          </button>
        </nav>
      </main>
    </div>
  );
};

export default App;