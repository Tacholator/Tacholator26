import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function QAndAList({ items }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
          >
            <span className="font-medium text-slate-800 pr-4">{item.question}</span>
            {openIndex === idx ? (
              <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </button>
          {openIndex === idx && (
            <div className="px-4 pb-4 bg-amber-50 border-t border-amber-100">
              <p className="text-slate-700 pt-3">{item.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}