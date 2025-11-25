import React, { useState, useRef, useEffect } from 'react';
import { Alarm } from '../types';
import { Plus, Trash2, Bell, BellOff, Timer, TimerOff, PenLine, Music, Check, Zap, Volume2, AlertTriangle, Copy, Volume1, VolumeX, RotateCcw, CalendarDays } from 'lucide-react';
import { DAYS_OF_WEEK, ALARM_SOUNDS } from '../constants';

interface AlarmListProps {
  alarms: Alarm[];
  onAddAlarm: (alarm: Alarm) => void;
  onToggleAlarm: (id: string) => void;
  onDeleteAlarm: (id: string) => void;
  onUpdateAlarm: (alarm: Alarm) => void;
}

const EditableAlarmLabel = ({ value, onSave }: { value: string, onSave: (val: string) => void }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (localValue !== value) {
      onSave(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="relative flex-1 min-w-[100px]">
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent border-b border-transparent hover:border-slate-600 focus:border-cyan-500 outline-none text-base font-medium text-slate-400 focus:text-white transition-all p-0 pb-0.5"
        placeholder="Label"
      />
      <PenLine className="w-3 h-3 text-slate-600 absolute right-0 bottom-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

const AlarmList: React.FC<AlarmListProps> = ({ alarms, onAddAlarm, onToggleAlarm, onDeleteAlarm, onUpdateAlarm }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTime, setNewTime] = useState('07:00');
  const [newLabel, setNewLabel] = useState('Morning Routine');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  const [newSnoozeEnabled, setNewSnoozeEnabled] = useState(true);
  const [newSnoozeDuration, setNewSnoozeDuration] = useState<number>(5);
  const [newSound, setNewSound] = useState<string>(ALARM_SOUNDS[0].id);
  const [newDifficulty, setNewDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [newVolume, setNewVolume] = useState<number>(0.8);
  
  // State for delete confirmation
  const [deletingAlarmId, setDeletingAlarmId] = useState<string | null>(null);

  // Audio Ref for Previews
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSoundPreview = (soundId: string) => {
    // Stop existing audio
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }

    const sound = ALARM_SOUNDS.find(s => s.id === soundId);
    if (sound && sound.url) {
        const audio = new Audio(sound.url);
        audio.volume = newVolume;
        audio.play().catch(e => console.error("Preview playback failed:", e));
        audioRef.current = audio;
    }
  };

  const getSoundColor = (soundId: string) => {
    switch (soundId) {
      case 'birds': return 'bg-green-400';
      case 'energetic': return 'bg-yellow-400';
      case 'gentle': return 'bg-blue-400';
      case 'classic': default: return 'bg-red-400';
    }
  };

  const resetForm = () => {
    setNewTime('07:00');
    setNewLabel('Morning Routine');
    setSelectedDays([1, 2, 3, 4, 5]);
    setNewSnoozeEnabled(true);
    setNewSnoozeDuration(5);
    setNewSound(ALARM_SOUNDS[0].id);
    setNewDifficulty('MEDIUM');
    setNewVolume(0.8);
    if (audioRef.current) {
        audioRef.current.pause();
    }
  };

  const handleSave = () => {
    const newAlarm: Alarm = {
      id: Date.now().toString(),
      time: newTime,
      days: selectedDays,
      label: newLabel,
      isActive: true,
      difficulty: newDifficulty,
      snoozeEnabled: newSnoozeEnabled,
      snoozeDuration: newSnoozeDuration,
      sound: newSound,
      volume: newVolume,
    };
    onAddAlarm(newAlarm);
    setIsCreating(false);
    resetForm();
  };

  const toggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter(d => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex]);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingAlarmId(id);
  };

  const handleCopyClick = (alarm: Alarm) => {
    const newAlarm: Alarm = {
      ...alarm,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      label: `Copy of ${alarm.label}`,
      isActive: false, // Default to inactive for safety
    };
    onAddAlarm(newAlarm);
  };

  const confirmDelete = () => {
    if (deletingAlarmId) {
      onDeleteAlarm(deletingAlarmId);
      setDeletingAlarmId(null);
    }
  };

  const cancelDelete = () => {
    setDeletingAlarmId(null);
  };

  return (
    <div className="p-6 pb-24 space-y-6">
      <header className="flex justify-between items-center mb-2">
        <div>
            <h2 className="text-2xl font-bold text-white">Alarms</h2>
            <p className="text-slate-400 text-sm">Manage your wake-up schedule</p>
        </div>
        <button 
            onClick={() => setIsCreating(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 p-3 rounded-full shadow-lg shadow-cyan-500/20 transition-all"
        >
            <Plus className="w-6 h-6" />
        </button>
      </header>

      {/* Delete Confirmation Modal */}
      {deletingAlarmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-2xl max-w-sm w-full transform transition-all scale-100">
            <div className="flex items-center gap-3 mb-4 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-xl font-bold text-white">Delete Alarm?</h3>
            </div>
            <p className="text-slate-400 mb-6">Are you sure you want to delete this alarm?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 font-medium hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Alarm Form */}
      {isCreating && (
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold">New Alarm</h3>
            <button 
                onClick={resetForm}
                className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                title="Reset to defaults"
            >
                <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
          <div className="space-y-4">
            <input 
              type="time" 
              value={newTime} 
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full bg-slate-900 text-white text-4xl p-4 rounded-lg text-center border border-slate-700 focus:border-cyan-500 outline-none"
            />
            <input 
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label (e.g. Gym)"
              className="w-full bg-slate-900 text-white p-3 rounded-lg border border-slate-700 outline-none focus:border-cyan-500"
            />
            
            {/* Days Selection */}
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-xs text-slate-400 uppercase font-bold flex items-center gap-2">
                        <CalendarDays className="w-3 h-3" /> Repeat
                    </label>
                    <div className="flex gap-1">
                        <button 
                            type="button"
                            onClick={() => setSelectedDays([1, 2, 3, 4, 5])} 
                            className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white rounded transition-colors"
                        >
                            Weekdays
                        </button>
                        <button 
                            type="button"
                            onClick={() => setSelectedDays([0, 6])} 
                            className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white rounded transition-colors"
                        >
                            Weekends
                        </button>
                        <button 
                            type="button"
                            onClick={() => setSelectedDays([0, 1, 2, 3, 4, 5, 6])} 
                            className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white rounded transition-colors"
                        >
                            Daily
                        </button>
                    </div>
                </div>
                <div className="flex justify-between gap-1">
                    {DAYS_OF_WEEK.map((day, idx) => (
                    <button
                        key={day}
                        onClick={() => toggleDay(idx)}
                        className={`w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center transition-colors ${
                        selectedDays.includes(idx) 
                            ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/20' 
                            : 'bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700 hover:text-slate-300'
                        }`}
                    >
                        {day[0]}
                    </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {/* Difficulty Selection */}
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                    <label className="text-xs text-slate-400 uppercase font-bold mb-2 flex items-center gap-2">
                        <Zap className="w-3 h-3" /> Difficulty
                    </label>
                    <div className="flex gap-2">
                        {(['EASY', 'MEDIUM', 'HARD'] as const).map(level => (
                        <button
                            key={level}
                            onClick={() => setNewDifficulty(level)}
                            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                            newDifficulty === level
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                            }`}
                        >
                            {level}
                        </button>
                        ))}
                    </div>
                </div>

                {/* Snooze Config */}
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs text-slate-400 uppercase font-bold flex items-center gap-2">
                            {newSnoozeEnabled ? <Timer className="w-3 h-3" /> : <TimerOff className="w-3 h-3" />} Snooze
                        </label>
                        <button
                            onClick={() => setNewSnoozeEnabled(!newSnoozeEnabled)}
                            className={`w-10 h-5 rounded-full relative transition-colors ${newSnoozeEnabled ? 'bg-cyan-500' : 'bg-slate-600'}`}
                        >
                            <span className={`absolute top-0.5 h-4 w-4 bg-white rounded-full transition-all shadow-sm ${newSnoozeEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                        </button>
                    </div>
                    {newSnoozeEnabled && (
                      <div className="flex gap-2">
                          {[5, 10, 15].map(mins => (
                          <button
                              key={mins}
                              onClick={() => setNewSnoozeDuration(mins)}
                              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                              newSnoozeDuration === mins
                                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                              }`}
                          >
                              {mins}m
                          </button>
                          ))}
                      </div>
                    )}
                </div>

                {/* Alarm Sound Selection */}
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                    <label className="text-xs text-slate-400 uppercase font-bold mb-2 flex items-center gap-2 justify-between">
                        <span className="flex items-center gap-2"><Music className="w-3 h-3" /> Sound</span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 font-normal"><Volume2 className="w-3 h-3" /> Hover/Click to preview</span>
                    </label>
                    
                    {/* Volume Slider */}
                    <div className="flex items-center gap-2 mb-3 px-1">
                        {newVolume === 0 ? <VolumeX className="w-4 h-4 text-slate-500"/> : <Volume1 className="w-4 h-4 text-cyan-400"/>}
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.1" 
                            value={newVolume} 
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setNewVolume(val);
                                if (audioRef.current) audioRef.current.volume = val;
                            }}
                            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {ALARM_SOUNDS.map(sound => (
                        <button
                            key={sound.id}
                            type="button"
                            onMouseEnter={() => playSoundPreview(sound.id)}
                            onClick={() => {
                                setNewSound(sound.id);
                                playSoundPreview(sound.id);
                            }}
                            className={`py-3 px-3 rounded-lg text-xs font-medium transition-colors text-left flex justify-between items-center ${
                            newSound === sound.id
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${getSoundColor(sound.id)}`}></span>
                                {sound.name}
                            </span>
                            {newSound === sound.id && <Check className="w-3 h-3" />}
                        </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => {
                    setIsCreating(false);
                    if (audioRef.current) audioRef.current.pause();
                }} 
                className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-2 rounded-lg bg-cyan-500 text-slate-900 font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alarm List */}
      <div className="space-y-4">
        {alarms.map(alarm => (
          <div key={alarm.id} className={`relative group p-5 rounded-xl border transition-all duration-300 ${alarm.isActive ? 'bg-slate-800 border-cyan-500/50 shadow-lg shadow-cyan-500/10' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}>
            <div className="flex justify-between items-start">
              <div className="flex-1 mr-4">
                
                {/* Time and Label Row */}
                <div className="flex items-baseline gap-3 mb-2">
                  <div className={`text-3xl font-bold tracking-tight transition-colors ${alarm.isActive ? 'text-white' : 'text-slate-400'}`}>
                    {alarm.time}
                  </div>
                  <EditableAlarmLabel 
                    value={alarm.label} 
                    onSave={(val) => onUpdateAlarm({ ...alarm, label: val })} 
                  />
                </div>

                <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <div className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 whitespace-nowrap transition-colors focus-within:bg-slate-700 ${alarm.isActive ? 'bg-slate-700/50 text-slate-500 focus-within:text-cyan-400' : 'bg-slate-800 text-slate-600'}`}>
                        <Zap className="w-3 h-3" />
                        <select
                            value={alarm.difficulty}
                            onChange={(e) => onUpdateAlarm({ ...alarm, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' })}
                            className="bg-transparent outline-none cursor-pointer hover:text-cyan-400 appearance-none uppercase font-medium"
                            title="Select Difficulty"
                            disabled={!alarm.isActive}
                        >
                            <option value="EASY" className="bg-slate-800 text-slate-300">EASY</option>
                            <option value="MEDIUM" className="bg-slate-800 text-slate-300">MEDIUM</option>
                            <option value="HARD" className="bg-slate-800 text-slate-300">HARD</option>
                        </select>
                    </div>

                    <div className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 whitespace-nowrap transition-colors ${
                        alarm.snoozeEnabled && alarm.isActive
                            ? 'bg-slate-700/50 text-slate-500'
                            : 'bg-slate-800 border border-slate-700 text-slate-600'
                    }`}>
                        <button
                            onClick={() => onUpdateAlarm({ ...alarm, snoozeEnabled: !alarm.snoozeEnabled })}
                            className="hover:text-cyan-400 focus:outline-none"
                            title={alarm.snoozeEnabled ? "Disable Snooze" : "Enable Snooze"}
                            disabled={!alarm.isActive}
                        >
                            {alarm.snoozeEnabled ? <Timer className="w-3 h-3" /> : <TimerOff className="w-3 h-3" />}
                        </button>
                        
                        {alarm.snoozeEnabled ? (
                            <select
                                value={alarm.snoozeDuration || 5}
                                onChange={(e) => onUpdateAlarm({ ...alarm, snoozeDuration: parseInt(e.target.value) })}
                                className="bg-transparent outline-none cursor-pointer hover:text-cyan-400 appearance-none text-center min-w-[24px]"
                                title="Snooze Duration"
                                disabled={!alarm.isActive}
                            >
                                <option value={5} className="bg-slate-800 text-slate-300">5m</option>
                                <option value={10} className="bg-slate-800 text-slate-300">10m</option>
                                <option value={15} className="bg-slate-800 text-slate-300">15m</option>
                            </select>
                        ) : (
                            <button 
                                onClick={() => onUpdateAlarm({ ...alarm, snoozeEnabled: true })}
                                className="hover:text-slate-400"
                                disabled={!alarm.isActive}
                            >
                                Off
                            </button>
                        )}
                    </div>
                    
                    <div className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 whitespace-nowrap ${alarm.isActive ? 'bg-slate-700/50 text-slate-500' : 'bg-slate-800 text-slate-600'}`}>
                        <Music className="w-3 h-3" />
                        <span className={`w-1.5 h-1.5 rounded-full ${getSoundColor(alarm.sound)}`}></span>
                        {ALARM_SOUNDS.find(s => s.id === alarm.sound)?.name || 'Default'}
                    </div>
                </div>
                <div className="flex gap-1">
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <span key={idx} className={`text-[10px] uppercase font-bold ${alarm.days.includes(idx) ? (alarm.isActive ? 'text-cyan-400' : 'text-cyan-900') : 'text-slate-700'}`}>
                      {day}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-4">
                <button 
                    onClick={() => onToggleAlarm(alarm.id)}
                    className={`p-2 rounded-full transition-colors ${alarm.isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-500 hover:bg-slate-600 hover:text-slate-400'}`}
                >
                    {alarm.isActive ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
                </button>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => handleCopyClick(alarm)}
                        className="p-2 rounded-full text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 transition-colors"
                        title="Duplicate"
                    >
                        <Copy className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => handleDeleteClick(alarm.id)}
                        className="p-2 rounded-full text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
              </div>
            </div>
            {alarm.isActive && (
                <div className="absolute top-0 right-0 -mt-2 -mr-2">
                     <span className="flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                    </span>
                </div>
            )}
          </div>
        ))}
        {alarms.length === 0 && !isCreating && (
            <div className="text-center py-10 text-slate-500">
                No alarms set. Sleep tight!
            </div>
        )}
      </div>
    </div>
  );
};

export default AlarmList;