import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DrilldownTable({ rows }) {
  const navigate = useNavigate();

  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>No pupils found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left px-4 py-3 font-medium text-slate-900">Pupil</th>
            <th className="text-left px-4 py-3 font-medium text-slate-900">Status</th>
            <th className="text-left px-4 py-3 font-medium text-slate-900">Last lesson</th>
            <th className="text-left px-4 py-3 font-medium text-slate-900">Lessons</th>
            <th className="text-left px-4 py-3 font-medium text-slate-900">Test outcome</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => navigate(createPageUrl('PupilProfile', `?pupilId=${row.id}`))}
            >
              <td className="px-4 py-3 font-medium text-slate-900">{row.fullName}</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  {row.status}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600">{row.lastLessonAt}</td>
              <td className="px-4 py-3 text-slate-600">{row.totalLessons}</td>
              <td className="px-4 py-3 font-medium">{row.testOutcome}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}