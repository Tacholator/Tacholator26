import React from 'react';

export default function SkillEffectivenessChart({ data, onSkillClick }) {
  // Placeholder heatmap - in production would show actual DVSA skills
  const skills = [
    'Cockpit drill',
    'Mirrors and mirrors',
    'Steering control',
    'Acceleration control',
    'Braking control',
    'Parking',
  ];

  const generateColor = (percent) => {
    if (percent >= 80) return 'bg-green-500';
    if (percent >= 60) return 'bg-yellow-500';
    if (percent >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-2">
      {skills.map((skill, idx) => {
        const percent = Math.floor(Math.random() * 100);
        return (
          <div
            key={idx}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
            onClick={() => onSkillClick(skill)}
          >
            <span className="text-sm font-medium flex-1">{skill}</span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-slate-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${generateColor(percent)}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-sm font-bold w-10 text-right">{percent}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}