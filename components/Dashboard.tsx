
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { UserStats } from '../types';
import { Trophy, Flame, Clock, TrendingUp, Zap, Target, Sun } from 'lucide-react';

interface DashboardProps {
  stats: UserStats;
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  // Prepare data for Reaction Time Chart
  const historyData = stats.wakeUpHistory.slice(-7).map(event => ({
    date: new Date(event.date).toLocaleDateString('en-US', { weekday: 'short' }),
    seconds: event.timeTakenSeconds,
  }));

  // Prepare data for Success Rate Chart (Cumulative Moving Average)
  let cumulativeSuccess = 0;
  const successChartData = stats.wakeUpHistory.map((event, index) => {
    if (event.success) cumulativeSuccess++;
    return {
      date: new Date(event.date).toLocaleDateString('en-US', { weekday: 'short' }),
      rate: Math.round((cumulativeSuccess / (index + 1)) * 100),
    };
  }).slice(-10); // Show last 10 events for readability

  // Calculate Additional Metrics
  const totalWakeUps = stats.wakeUpHistory.length;
  
  const bestTime = stats.wakeUpHistory.length > 0 
    ? Math.min(...stats.wakeUpHistory.map(e => e.timeTakenSeconds)) 
    : 0;

  const successCount = stats.wakeUpHistory.filter(e => e.success).length;
  const overallSuccessRate = totalWakeUps > 0 
    ? Math.round((successCount / totalWakeUps) * 100) 
    : 0;
    
  const avgTime = stats.wakeUpHistory.length > 0 
    ? Math.round(stats.wakeUpHistory.reduce((acc, curr) => acc + curr.timeTakenSeconds, 0) / stats.wakeUpHistory.length) 
    : 0;

  const getLevel = (points: number) => {
    if (points < 250) return 'Novice';
    if (points < 1000) return 'Early Bird';
    if (points < 2500) return 'Morning Pro';
    return 'Zen Master';
  };
  const currentLevel = getLevel(stats.totalPoints);

  return (
    <div className="p-6 space-y-6 pb-24">
      <header className="mb-2">
        <h2 className="text-2xl font-bold text-white">Your Progress</h2>
        <p className="text-slate-400">Track your wake-up consistency</p>
      </header>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        
        {/* Streak */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center shadow-lg shadow-orange-900/10">
          <Flame className="text-orange-500 w-8 h-8 mb-2" />
          <span className="text-2xl font-bold text-white">{stats.streak}</span>
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Day Streak</span>
        </div>

        {/* Total Points */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center shadow-lg shadow-yellow-900/10">
          <Trophy className="text-yellow-500 w-8 h-8 mb-2" />
          <span className="text-2xl font-bold text-white">{stats.totalPoints}</span>
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">{currentLevel}</span>
        </div>

        {/* Total Wakes */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center shadow-lg shadow-cyan-900/10">
          <Sun className="text-cyan-400 w-8 h-8 mb-2" />
          <span className="text-2xl font-bold text-white">{totalWakeUps}</span>
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Wakes</span>
        </div>

        {/* Consistency */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center shadow-lg shadow-green-900/10">
          <Target className="text-green-400 w-8 h-8 mb-2" />
          <span className="text-2xl font-bold text-white">{overallSuccessRate}%</span>
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Consistency</span>
        </div>

        {/* Avg Time */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center shadow-lg shadow-blue-900/10">
          <Clock className="text-blue-500 w-8 h-8 mb-2" />
          <span className="text-2xl font-bold text-white">
             {avgTime > 0 ? avgTime + 's' : '-'}
          </span>
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Avg Time</span>
        </div>

        {/* Best Time */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center shadow-lg shadow-purple-900/10">
          <Zap className="text-purple-500 w-8 h-8 mb-2" />
          <span className="text-2xl font-bold text-white">
             {bestTime > 0 ? bestTime + 's' : '-'}
          </span>
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Best Record</span>
        </div>

      </div>

      {/* Charts Container */}
      <div className="space-y-6">
        
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

        {/* Success Rate Chart */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Success Rate Trend
            </h3>
            <div className="h-48 w-full">
            {successChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={successChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                    itemStyle={{ color: '#4ade80' }}
                    formatter={(value: number) => [`${value}%`, 'Success Rate']}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="rate" 
                        stroke="#4ade80" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: '#4ade80', strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                Start waking up to see trends!
                </div>
            )}
            </div>
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
    