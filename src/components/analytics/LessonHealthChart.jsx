import React from 'react';

export default function LessonHealthChart({ data, onItemClick }) {
  const items = [
    { key: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' },
    { key: 'cancelledByPupil', label: 'Cancelled (pupil)', color: 'bg-orange-100 text-orange-700' },
    { key: 'cancelledByInstructor', label: 'Cancelled (you)', color: 'bg-red-100 text-red-700' },
    { key: 'noShowPupil', label: 'No-shows (pupil)', color: 'bg-red-100 text-red-700' },
  ];

  const total = Object.values(data).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const value = data[item.key] || 0;
        const percent = total > 0 ? (value / total) * 100 : 0;
        return (
          <div key={item.key} onClick={() => onItemClick(item.key)} className="cursor-pointer">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">{item.label}</span>
              <span className="text-sm font-bold">{value}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${item.color}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}