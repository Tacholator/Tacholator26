import React from 'react';

export default function TestPipelineChart({ data }) {
  const steps = data.funnelSteps || [];
  const maxValue = Math.max(...steps.map((s) => s.value || 0), 1);

  return (
    <div className="space-y-4">
      {steps.map((step, idx) => {
        const percent = (step.value / maxValue) * 100;
        const width = Math.max(50, percent);
        return (
          <div key={idx} className="flex flex-col items-center">
            <div className={`px-4 py-3 bg-blue-500 text-white rounded-lg w-${Math.round(width / 10) * 10} text-center transition-all`}
              style={{ width: `${width}%` }}
            >
              <p className="text-sm font-medium">{step.label}</p>
              <p className="text-lg font-bold">{step.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}