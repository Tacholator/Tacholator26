import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";

export default function MockTestFeedbackCard({ data, onChange, readOnly = false, isGenerating = false }) {
  const fields = [
    { key: "keyStrengths", label: "Key Strengths", placeholder: "What did the learner do well?" },
    { key: "mainAreasToImprove", label: "Main Areas to Improve", placeholder: "What needs more practice?" },
    { key: "priorityForNextLesson", label: "Priority for Next Lesson", placeholder: "Top priority to address next..." },
    { key: "recommendedPracticeFocus", label: "Recommended Practice Focus", placeholder: "Independent practice recommendations..." },
    { key: "instructorOverallComment", label: "Instructor Overall Comment", placeholder: "General comments and encouragement..." }
  ];

  return (
    <Card className="border-2 border-[#071739]/10 shadow-md">
      <CardHeader className="pb-2 bg-gradient-to-r from-[#071739] to-slate-700 rounded-t-xl">
        <CardTitle className="text-white text-base font-bold flex items-center gap-2">
          Feedback Summary
          {isGenerating && <Sparkles className="w-4 h-4 text-[#F7B602] animate-pulse" />}
        </CardTitle>
        {isGenerating && (
          <p className="text-xs text-slate-300 mt-1">AI is generating feedback from your assessment...</p>
        )}
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {isGenerating ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse space-y-1">
                <div className="h-3 bg-slate-200 rounded w-1/3" />
                <div className="h-16 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {fields.map(({ key, label, placeholder }) => (
              <div key={key}>
                <Label className="text-sm font-semibold text-slate-700 mb-1 block">{label}</Label>
                {readOnly ? (
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 min-h-[44px]">
                    {data[key] || <span className="text-slate-400 italic">Not provided</span>}
                  </p>
                ) : (
                  <Textarea
                    placeholder={placeholder}
                    value={data[key] || ""}
                    onChange={e => onChange(key, e.target.value)}
                    className="text-sm min-h-[70px] resize-none"
                    rows={3}
                  />
                )}
              </div>
            ))}

            {/* Signatures */}
            <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-1 block">Instructor Signature</Label>
                {readOnly ? (
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{data.instructorSignature || <span className="text-slate-400 italic">Not signed</span>}</p>
                ) : (
                  <Input
                    placeholder="Type full name as signature"
                    value={data.instructorSignature || ""}
                    onChange={e => onChange("instructorSignature", e.target.value)}
                  />
                )}
              </div>
              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-1 block">Learner Signature</Label>
                {readOnly ? (
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{data.learnerSignature || <span className="text-slate-400 italic">Not signed</span>}</p>
                ) : (
                  <Input
                    placeholder="Type full name as signature"
                    value={data.learnerSignature || ""}
                    onChange={e => onChange("learnerSignature", e.target.value)}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}