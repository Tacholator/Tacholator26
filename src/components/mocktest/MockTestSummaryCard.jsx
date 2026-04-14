import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, Square, AlertTriangle, Shield, XCircle } from "lucide-react";

const RESULT_CONFIG = {
  "Pass": { color: "bg-green-500 text-white", icon: Shield },
  "Fail": { color: "bg-red-600 text-white", icon: XCircle },
  "Borderline": { color: "bg-orange-400 text-white", icon: AlertTriangle },
  "Needs More Practice": { color: "bg-yellow-400 text-[#071739]", icon: AlertTriangle }
};

function FaultBadge({ count, label, color }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl p-3 ${color}`}>
      <span className="text-2xl font-bold">{count}</span>
      <span className="text-xs font-medium mt-1 text-center leading-tight">{label}</span>
    </div>
  );
}

function CheckItem({ label, checked, onToggle, disabled }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onToggle}
      className={`flex items-center gap-2 text-sm w-full text-left py-1 ${disabled ? "opacity-50 cursor-default" : "cursor-pointer hover:text-blue-700"}`}
    >
      {checked ? <CheckSquare className="w-4 h-4 text-green-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
      <span className="text-slate-700">{label}</span>
    </button>
  );
}

export default function MockTestSummaryCard({
  totalDF, totalS, totalD, overallResult, manualOverride, onOverrideChange, onToggleOverride,
  independentDriving, showMeTellMe, controlledStop, emergencyStop, onToggleCheck,
  readOnly = false
}) {
  const resultConfig = RESULT_CONFIG[overallResult] || RESULT_CONFIG["Needs More Practice"];
  const ResultIcon = resultConfig.icon;

  return (
    <Card className="border-2 border-[#071739]/10 shadow-md">
      <CardHeader className="pb-2 bg-[#071739] rounded-t-xl">
        <CardTitle className="text-white text-base font-bold">Result Summary</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Overall Result */}
        <div className="flex items-center gap-3">
          <div className={`flex-1 flex items-center gap-2 rounded-xl px-4 py-3 ${resultConfig.color}`}>
            <ResultIcon className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-xs font-medium opacity-80">Overall Result</p>
              <p className="text-lg font-bold">{overallResult || "Pending"}</p>
            </div>
          </div>
          {!readOnly && (
            <div className="flex flex-col items-end gap-1">
              <label className="text-xs text-slate-500">Manual override</label>
              <button
                type="button"
                onClick={onToggleOverride}
                className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${manualOverride ? "bg-[#F7B602] text-[#071739] border-[#F7B602]" : "bg-white text-slate-500 border-slate-300"}`}
              >
                {manualOverride ? "Override ON" : "Override OFF"}
              </button>
            </div>
          )}
        </div>

        {manualOverride && !readOnly && (
          <Select value={overallResult} onValueChange={onOverrideChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pass">Pass</SelectItem>
              <SelectItem value="Fail">Fail</SelectItem>
              <SelectItem value="Borderline">Borderline</SelectItem>
              <SelectItem value="Needs More Practice">Needs More Practice</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Fault Counts */}
        <div className="grid grid-cols-3 gap-2">
          <FaultBadge count={totalDF} label="Driver Faults" color="bg-yellow-50 text-yellow-700 border border-yellow-200" />
          <FaultBadge count={totalS} label="Serious Faults" color="bg-orange-50 text-orange-700 border border-orange-200" />
          <FaultBadge count={totalD} label="Dangerous Faults" color="bg-red-50 text-red-700 border border-red-200" />
        </div>


      </CardContent>
    </Card>
  );
}