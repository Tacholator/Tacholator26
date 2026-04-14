import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save, Send, FileText, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import MockTestAssessmentCard from "@/components/mocktest/MockTestAssessmentCard";
import MockTestSummaryCard from "@/components/mocktest/MockTestSummaryCard";
import MockTestFeedbackCard from "@/components/mocktest/MockTestFeedbackCard";
import { ASSESSMENT_CATEGORIES, buildInitialItems, calculateTotals, calculateResult } from "@/components/mocktest/mockTestData";

const STEPS = ["Test Info", "Assessment", "Summary & Feedback"];

export default function MockTestReportForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const learnerId = urlParams.get("learnerId");
  const reportId = urlParams.get("reportId");

  const [step, setStep] = useState(0);
  const [reportMeta, setReportMeta] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    testCentreArea: "",
    routeName: "",
    vehicleRegistration: "",
    transmissionType: "Manual",
    weatherConditions: ""
  });
  const [feedback, setFeedback] = useState({
    keyStrengths: "",
    mainAreasToImprove: "",
    priorityForNextLesson: "",
    recommendedPracticeFocus: "",
    instructorOverallComment: "",
    instructorSignature: "",
    learnerSignature: ""
  });
  const [checks, setChecks] = useState({
    independentDriving: false,
    showMeTellMe: false,
    controlledStop: false,
    emergencyStop: false
  });
  const [assessmentItems, setAssessmentItems] = useState({});
  const [manualOverride, setManualOverride] = useState(false);
  const [overallResult, setOverallResult] = useState("Needs More Practice");
  const [savedReportId, setSavedReportId] = useState(reportId || null);
  const [isSaving, setIsSaving] = useState(false);
  const autosaveRef = useRef(null);

  const { data: currentUser } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  const { data: pupil } = useQuery({
    queryKey: ["pupil", learnerId],
    queryFn: () => base44.entities.Pupil.filter({ id: learnerId }),
    enabled: !!learnerId,
    select: (data) => data[0]
  });

  const { data: existingReport } = useQuery({
    queryKey: ["mockTestReport", reportId],
    queryFn: () => base44.entities.MockTestReport.filter({ id: reportId }),
    enabled: !!reportId,
    select: (data) => data[0]
  });

  const { data: existingItems } = useQuery({
    queryKey: ["mockTestItems", reportId],
    queryFn: () => base44.entities.MockTestAssessmentItem.filter({ mockTestReportId: reportId }),
    enabled: !!reportId
  });

  // Load existing report data
  useEffect(() => {
    if (existingReport) {
      setReportMeta({
        date: existingReport.date || "",
        startTime: existingReport.startTime || "",
        testCentreArea: existingReport.testCentreArea || "",
        routeName: existingReport.routeName || "",
        vehicleRegistration: existingReport.vehicleRegistration || "",
        transmissionType: existingReport.transmissionType || "Manual",
        weatherConditions: existingReport.weatherConditions || ""
      });
      setFeedback({
        keyStrengths: existingReport.keyStrengths || "",
        mainAreasToImprove: existingReport.mainAreasToImprove || "",
        priorityForNextLesson: existingReport.priorityForNextLesson || "",
        recommendedPracticeFocus: existingReport.recommendedPracticeFocus || "",
        instructorOverallComment: existingReport.instructorOverallComment || "",
        instructorSignature: existingReport.instructorSignature || "",
        learnerSignature: existingReport.learnerSignature || ""
      });
      setChecks({
        independentDriving: existingReport.independentDrivingCompleted || false,
        showMeTellMe: existingReport.showMeTellMeCompleted || false,
        controlledStop: existingReport.controlledStopCompleted || false,
        emergencyStop: existingReport.emergencyStopCompleted || false
      });
      setManualOverride(existingReport.manualOverrideActive || false);
      setOverallResult(existingReport.overallResult || "Needs More Practice");
    }
  }, [existingReport]);

  useEffect(() => {
    if (existingItems && existingItems.length > 0) {
      const itemsMap = {};
      existingItems.forEach(item => {
        const key = `${item.category}__${item.subcategory}`;
        itemsMap[key] = { category: item.category, subcategory: item.subcategory, rating: item.rating || "NT", faultCount: item.faultCount || 1, comments: item.comments || "", improvementTag: item.improvementTag || "" };
      });
      setAssessmentItems(prev => ({ ...buildInitialItems(reportMeta.transmissionType), ...itemsMap }));
    } else if (!reportId) {
      setAssessmentItems(buildInitialItems(reportMeta.transmissionType));
    }
  }, [existingItems, reportId]);

  useEffect(() => {
    if (!reportId) {
      setAssessmentItems(buildInitialItems(reportMeta.transmissionType));
    }
  }, [reportMeta.transmissionType]);

  // Recalculate totals and result
  const { df, s, d } = calculateTotals(Object.values(assessmentItems));
  const autoResult = calculateResult(df, s, d);

  useEffect(() => {
    if (!manualOverride) setOverallResult(autoResult);
  }, [df, s, d, manualOverride]);

  const buildSavePayload = () => ({
    ...reportMeta,
    instructorId: currentUser?.id,
    instructorName: currentUser?.full_name || currentUser?.email,
    learnerId: learnerId || existingReport?.learnerId,
    learnerName: pupil ? `${pupil.firstName} ${pupil.lastName}` : existingReport?.learnerName,
    totalDriverFaults: df,
    totalSeriousFaults: s,
    totalDangerousFaults: d,
    overallResult,
    manualOverrideActive: manualOverride,
    independentDrivingCompleted: checks.independentDriving,
    showMeTellMeCompleted: checks.showMeTellMe,
    controlledStopCompleted: checks.controlledStop,
    emergencyStopCompleted: checks.emergencyStop,
    ...feedback
  });

  const doSave = useCallback(async (statusOverride) => {
    setIsSaving(true);
    try {
      const payload = { ...buildSavePayload(), status: statusOverride || "Draft" };
      let rId = savedReportId;
      if (rId) {
        await base44.entities.MockTestReport.update(rId, payload);
      } else {
        const created = await base44.entities.MockTestReport.create(payload);
        rId = created.id;
        setSavedReportId(rId);
      }

      // Save assessment items
      const itemEntries = Object.values(assessmentItems);
      const existingDbItems = rId && existingItems ? existingItems : [];

      for (const item of itemEntries) {
        const existing = existingDbItems.find(i => i.category === item.category && i.subcategory === item.subcategory);
        const scoreMap = { P: 0, DF: 1, S: 2, D: 3, NT: 0 };
        const itemPayload = { mockTestReportId: rId, ...item, severityScore: scoreMap[item.rating] || 0, timestamp: new Date().toISOString() };
        if (existing) {
          await base44.entities.MockTestAssessmentItem.update(existing.id, itemPayload);
        } else {
          await base44.entities.MockTestAssessmentItem.create(itemPayload);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["mockTestReports"] });
      return rId;
    } finally {
      setIsSaving(false);
    }
  }, [assessmentItems, savedReportId, existingItems, reportMeta, feedback, checks, df, s, d, overallResult, manualOverride]);

  const handleSaveDraft = async () => {
    await doSave("Draft");
    toast({ title: "Draft saved", description: "Your mock test report has been saved as a draft." });
  };

  const handleFinalise = async () => {
    const rId = await doSave("Finalised");
    toast({ title: "Report finalised", description: "The report has been finalised." });
    navigate(`/MockTestReportView?reportId=${rId}`);
  };

  const handleShareWithLearner = async () => {
    if (!savedReportId) { toast({ title: "Save first", description: "Please save the report before sharing." }); return; }
    await base44.entities.MockTestReport.update(savedReportId, { isSharedWithLearner: true, status: "Shared" });
    queryClient.invalidateQueries({ queryKey: ["mockTestReports"] });
    toast({ title: "Shared with learner", description: "The learner can now view this report." });
  };

  const handleContinueToSummary = () => {
    setStep(2);
  };

  const updateItem = (key, updates) => {
    setAssessmentItems(prev => ({ ...prev, [key]: { ...prev[key], ...updates } }));
  };

  const toggleCheck = (key) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const learnerFullName = pupil ? `${pupil.firstName} ${pupil.lastName}` : existingReport?.learnerName || "Learner";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-[#071739] text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-bold text-base leading-tight">Mock Driving Test Report</h1>
                <p className="text-xs text-slate-300">{learnerFullName} · {reportMeta.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-[#F7B602] text-[#071739] text-xs font-bold">
                {savedReportId ? (existingReport?.status || "Draft") : "New"}
              </Badge>
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Steps */}
          <div className="flex gap-1 mt-3">
            {STEPS.map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(i)}
                className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-all ${step === i ? "bg-[#F7B602] text-[#071739]" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Disclaimer */}
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 font-medium">
            This is a mock/practice driving assessment for training purposes only. It is not an official DVSA driving test result.
          </p>
        </div>

        {/* Step 0: Test Info */}
        {step === 0 && (
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#071739] text-base">Test Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-600">Date</Label>
                  <Input type="date" value={reportMeta.date} onChange={e => setReportMeta(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600">Transmission</Label>
                  <Select value={reportMeta.transmissionType} onValueChange={v => setReportMeta(p => ({ ...p, transmissionType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manual">Manual</SelectItem>
                      <SelectItem value="Automatic">Automatic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600">Start Time</Label>
                <Input type="time" value={reportMeta.startTime} onChange={e => setReportMeta(p => ({ ...p, startTime: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600">Test Centre / Area <span className="text-slate-400 font-normal">(optional)</span></Label>
                <Input placeholder="e.g. Birmingham South" value={reportMeta.testCentreArea} onChange={e => setReportMeta(p => ({ ...p, testCentreArea: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600">Route Name <span className="text-slate-400 font-normal">(optional)</span></Label>
                <Input placeholder="e.g. Route A - Town Centre" value={reportMeta.routeName} onChange={e => setReportMeta(p => ({ ...p, routeName: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600">Vehicle Registration <span className="text-slate-400 font-normal">(optional)</span></Label>
                <Input placeholder="e.g. AB12 CDE" value={reportMeta.vehicleRegistration} onChange={e => setReportMeta(p => ({ ...p, vehicleRegistration: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600">Weather Conditions</Label>
                <Select value={reportMeta.weatherConditions} onValueChange={v => setReportMeta(p => ({ ...p, weatherConditions: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select weather conditions" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bright / Dry roads">Bright / Dry roads</SelectItem>
                    <SelectItem value="Bright / Wet roads">Bright / Wet roads</SelectItem>
                    <SelectItem value="Raining through test">Raining through test</SelectItem>
                    <SelectItem value="Showers">Showers</SelectItem>
                    <SelectItem value="Foggy / Misty">Foggy / Misty</SelectItem>
                    <SelectItem value="Snowing">Snowing</SelectItem>
                    <SelectItem value="Icy">Icy</SelectItem>
                    <SelectItem value="Windy">Windy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-2">
                <Button className="w-full bg-[#071739] text-white hover:bg-[#071739]/90" onClick={() => setStep(1)}>
                  Continue to Assessment →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Assessment */}
        {step === 1 && (
          <div className="space-y-2">
            <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
              <p className="text-xs text-green-800 font-medium">
                All items default to <strong>Pass (P)</strong>. Only mark items where a fault occurred — anything not changed will be treated as passed.
              </p>
            </div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-600">Rate each item using the buttons</p>
              <Badge className="bg-slate-200 text-slate-600 text-xs">
                {Object.values(assessmentItems).filter(i => i.rating !== "P").length} fault(s) marked
              </Badge>
            </div>
            {ASSESSMENT_CATEGORIES.map(({ category, subcategories, manoeuvreGroups }) => (
              <MockTestAssessmentCard
                key={category}
                category={category}
                subcategories={subcategories}
                manoeuvreGroups={manoeuvreGroups}
                items={assessmentItems}
                transmissionType={reportMeta.transmissionType}
                onUpdateItem={updateItem}
              />
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>← Back</Button>
              <Button className="flex-1 bg-[#071739] text-white hover:bg-[#071739]/90" onClick={handleContinueToSummary}>Continue →</Button>
            </div>
          </div>
        )}

        {/* Step 2: Summary & Feedback */}
        {step === 2 && (
          <div className="space-y-4">
            <MockTestSummaryCard
              totalDF={df}
              totalS={s}
              totalD={d}
              overallResult={overallResult}
              manualOverride={manualOverride}
              onToggleOverride={() => setManualOverride(p => !p)}
              onOverrideChange={setOverallResult}
              independentDriving={checks.independentDriving}
              showMeTellMe={checks.showMeTellMe}
              controlledStop={checks.controlledStop}
              emergencyStop={checks.emergencyStop}
              onToggleCheck={toggleCheck}
            />

            <MockTestFeedbackCard
              assessmentItems={assessmentItems}
            />

            <div className="flex gap-2 pt-2 flex-wrap">
              <Button variant="outline" className="flex-1 min-w-[120px]" onClick={() => setStep(1)}>← Assessment</Button>
              <Button
                className="flex-1 min-w-[120px] bg-slate-600 text-white hover:bg-slate-700"
                onClick={handleSaveDraft}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-1" />
                {isSaving ? "Saving..." : "Save Draft"}
              </Button>
              <Button
                className="flex-1 min-w-[120px] bg-[#F7B602] text-[#071739] hover:bg-[#F7B602]/90 font-bold"
                onClick={handleFinalise}
                disabled={isSaving}
              >
                <FileText className="w-4 h-4 mr-1" />
                Finalise Report
              </Button>
            </div>
            {savedReportId && (existingReport?.status === "Finalised" || existingReport?.status === "Shared") && (
              <Button
                variant="outline"
                className="w-full border-green-500 text-green-700 hover:bg-green-50"
                onClick={handleShareWithLearner}
              >
                <Send className="w-4 h-4 mr-1" />
                Share with Learner
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}