import React from 'react';

export default function AchievementsBadges({ achievements }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {achievements.map((achievement) => (
        <div
          key={achievement.id}
          className="flex flex-col items-center text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow"
        >
          <span className="text-5xl mb-3">{achievement.icon}</span>
          <h3 className="font-bold text-slate-900">{achievement.title}</h3>
          <p className="text-sm text-slate-600 mt-2">{achievement.description}</p>
        </div>
      ))}
    </div>
  );
}