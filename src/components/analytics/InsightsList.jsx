import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function InsightsList({ insights }) {
  const getIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-3">
      {insights.map((insight, idx) => (
        <div
          key={idx}
          className={`flex gap-3 p-4 rounded-lg border ${getBgColor(insight.type)}`}
        >
          <div className="flex-shrink-0 pt-0.5">{getIcon(insight.type)}</div>
          <div className="flex-1">
            <h4 className="font-medium text-slate-900">{insight.title}</h4>
            <p className="text-sm text-slate-600 mt-1">{insight.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}