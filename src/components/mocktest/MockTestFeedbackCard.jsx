import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const RATING_CONFIG = {
  DF: { label: "Driver Faults", color: "bg-amber-50 border-amber-200", badge: "bg-amber-100 text-amber-800 border-amber-300", dot: "bg-amber-400" },
  S:  { label: "Serious Faults", color: "bg-orange-50 border-orange-200", badge: "bg-orange-100 text-orange-800 border-orange-300", dot: "bg-orange-500" },
  D:  { label: "Dangerous Faults", color: "bg-red-50 border-red-200", badge: "bg-red-100 text-red-800 border-red-300", dot: "bg-red-500" },
};

function FaultGroup({ ratingKey, items }) {
  const config = RATING_CONFIG[ratingKey];
  if (!items || items.length === 0) return null;

  return (
    <div className={`rounded-xl border p-4 space-y-2 ${config.color}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
        <h4 className="text-sm font-bold text-slate-800">{config.label}</h4>
        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full border ${config.badge}`}>
          {items.reduce((sum, i) => sum + (i.faultCount || 1), 0)}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="bg-white/70 rounded-lg p-2.5 border border-white/80">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-slate-700">{item.category}</p>
                <p className="text-xs text-slate-500">{item.subcategory}</p>
              </div>
              {item.faultCount > 1 && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${config.badge}`}>×{item.faultCount}</span>
              )}
            </div>
            {item.comments && (
              <p className="text-xs text-slate-600 mt-1.5 italic border-t border-slate-100 pt-1.5">
                "{item.comments}"
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MockTestFeedbackCard({ assessmentItems = {}, items: itemsArray, isGenerating = false }) {
  // Support both `assessmentItems` (map) and `items` (array) for backward compat
  const resolvedMap = { ...assessmentItems };
  if (itemsArray && itemsArray.length > 0 && Object.keys(resolvedMap).length === 0) {
    itemsArray.forEach(item => { resolvedMap[`${item.category}__${item.subcategory}`] = item; });
  }
  const items = Object.values(resolvedMap);

  const dfItems = items.filter(i => i.rating === "DF");
  const sItems  = items.filter(i => i.rating === "S");
  const dItems  = items.filter(i => i.rating === "D");

  const hasFaults = dfItems.length > 0 || sItems.length > 0 || dItems.length > 0;

  return (
    <Card className="border-2 border-[#071739]/10 shadow-md">
      <CardHeader className="pb-2 bg-gradient-to-r from-[#071739] to-slate-700 rounded-t-xl">
        <CardTitle className="text-white text-base font-bold flex items-center gap-2">
          Fault Summary
          {isGenerating && <Sparkles className="w-4 h-4 text-[#F7B602] animate-pulse" />}
        </CardTitle>
        {isGenerating && (
          <p className="text-xs text-slate-300 mt-1">Building summary from your assessment...</p>
        )}
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {isGenerating ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse space-y-1">
                <div className="h-3 bg-slate-200 rounded w-1/3" />
                <div className="h-16 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : !hasFaults ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-sm font-semibold text-green-700">No faults recorded</p>
            <p className="text-xs text-slate-400 mt-1">All items were passed or not tested</p>
          </div>
        ) : (
          <>
            <FaultGroup ratingKey="D"  items={dItems} />
            <FaultGroup ratingKey="S"  items={sItems} />
            <FaultGroup ratingKey="DF" items={dfItems} />
          </>
        )}
      </CardContent>
    </Card>
  );
}