import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { UserStats } from '../types';
import { Trophy, Flame, Clock } from 'lucide-react';

interface DashboardProps {
  stats: UserStats;
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  // Prepare data for charts
  const historyData = stats.wakeUpHistory.slice(-7).map(event => ({
    date: new Date(event.date).toLocaleDateString('en-US', { weekday: 'short' }),
    seconds: event.timeTakenSeconds,
  }));

  return (
    <div className="p-6 space-y-6 pb-24">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-white">Your Progress</h2>
        <p className="text-slate-400">Track your wake-up consistency</p>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center">
          <Flame className="text-orange-500 w-8 h-8 mb-2" />
          <span className="text-2xl font-bold text-white">{stats.streak}</span>
          <span className="text-xs text-slate-400">Day Streak</span>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center">
          <Trophy className="text-yellow-500 w-8 h-8 mb-2" />
          <span className="text-2xl font-bold text-white">{stats.totalPoints}</span>
          <span className="text-xs text-slate-400">Points</span>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center">
          <Clock className="text-blue-500 w-8 h-8 mb-2" />
          <span className="text-2xl font-bold text-white">
             {stats.wakeUpHistory.length > 0 
                ? Math.round(stats.wakeUpHistory.reduce((acc, curr) => acc + curr.timeTakenSeconds, 0) / stats.wakeUpHistory.length) + 's'
                : 'N/A'}
          </span>
          <span className="text-xs text-slate-400">Avg Time</span>
        </div>
      </div>

      {/* Reaction Time Chart */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Wake Up Speed (Last 7 Days)</h3>
        <div className="h-48 w-full">
          {historyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#38bdf8' }}
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                />
                <Bar dataKey="seconds" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              No data yet. Set an alarm!
            </div>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Earned Badges</h3>
        <div className="flex flex-wrap gap-2">
          {stats.badges.length > 0 ? (
            stats.badges.map((badge, idx) => (
              <span key={idx} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium border border-purple-500/30">
                {badge}
              </span>
            ))
          ) : (
            <p className="text-slate-500 text-sm">Wake up consistently to earn badges!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
