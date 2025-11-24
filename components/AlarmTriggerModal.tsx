import React, { useEffect, useState, useRef } from 'react';
import { Alarm, Challenge } from '../types';
import { ALARM_SOUNDS } from '../constants';
import { geminiService } from '../services/geminiService';
import { AlarmClock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AlarmTriggerModalProps {
  alarm: Alarm;
  onDismiss: (success: boolean) => void;
  onSnooze: () => void;
}

const AlarmTriggerModal: React.FC<AlarmTriggerModalProps> = ({ alarm, onDismiss, onSnooze }) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Fetch challenge when modal mounts
    const fetchChallenge = async () => {
      const newChallenge = await geminiService.generateChallenge(alarm.difficulty);
      setChallenge(newChallenge);
      setIsLoading(false);
    };
    fetchChallenge();
    
    // Play sound loop
    const soundData = ALARM_SOUNDS.find(s => s.id === alarm.sound);
    if (soundData && soundData.url) {
        const audio = new Audio(soundData.url);
        audio.loop = true;
        audio.volume = alarm.volume ?? 0.8;
        audio.play().catch(e => console.error("Alarm playback failed:", e));
        audioRef.current = audio;
    }

    // Cleanup audio on unmount
    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
    };
  }, [alarm.difficulty, alarm.sound, alarm.volume]);

  const handleOptionSelect = (option: string) => {
    if (!challenge || feedback === 'correct') return;
    
    setSelectedOption(option);
    if (option === challenge.answer) {
      setFeedback('correct');
      // Stop audio immediately on success
      if (audioRef.current) {
          audioRef.current.pause();
      }
      setTimeout(() => {
        onDismiss(true);
      }, 1500);
    } else {
      setFeedback('wrong');
      // Reset feedback after delay to try again
      setTimeout(() => {
        setFeedback(null);
        setSelectedOption(null);
      }, 1000);
    }
  };
  
  const handleSnoozeClick = () => {
      if (audioRef.current) {
          audioRef.current.pause();
      }
      onSnooze();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 animate-pulse-subtle">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 to-slate-900 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="animate-bounce mb-8">
          <AlarmClock className="w-24 h-24 text-red-500 mx-auto" />
        </div>
        
        <h1 className="text-5xl font-bold text-white mb-2 tracking-wider">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </h1>
        <p className="text-slate-400 text-lg mb-8 uppercase tracking-widest">{alarm.label}</p>

        {/* Challenge Section */}
        <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-2xl">
          {isLoading ? (
            <div className="py-8">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-300">Generating Wake-Up Challenge...</p>
            </div>
          ) : challenge ? (
            <div>
              <h3 className="text-xl font-bold text-white mb-6">{challenge.question}</h3>
              <div className="grid grid-cols-2 gap-3">
                {challenge.options?.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleOptionSelect(opt)}
                    disabled={feedback === 'correct'}
                    className={`p-4 rounded-xl font-bold text-lg transition-all ${
                      selectedOption === opt
                        ? feedback === 'correct'
                          ? 'bg-green-500 text-white ring-4 ring-green-500/30'
                          : feedback === 'wrong'
                          ? 'bg-red-500 text-white animate-shake'
                          : 'bg-slate-700 text-white'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-600'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {feedback === 'correct' && (
                <div className="mt-4 text-green-400 flex items-center justify-center gap-2 font-bold animate-fade-in">
                  <CheckCircle2 /> Correct! Alarm Dismissed.
                </div>
              )}
              {feedback === 'wrong' && (
                <div className="mt-4 text-red-400 flex items-center justify-center gap-2 font-bold animate-fade-in">
                  <AlertTriangle /> Incorrect. Try again!
                </div>
              )}
            </div>
          ) : (
             <div className="text-red-400">Error loading challenge.</div>
          )}
        </div>

        {/* Snooze Button */}
        {alarm.snoozeEnabled && feedback !== 'correct' && (
          <button 
            onClick={handleSnoozeClick}
            className="mt-8 text-slate-500 font-semibold hover:text-white transition-colors px-6 py-2 rounded-full hover:bg-white/5"
          >
            Snooze ({alarm.snoozeDuration || 5} min)
          </button>
        )}
      </div>
    </div>
  );
};

export default AlarmTriggerModal;