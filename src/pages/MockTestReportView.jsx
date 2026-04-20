import React from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Edit, Send, Download, AlertCircle, CheckSquare, Square } from "lucide-react";
import MockTestSummaryCard from "@/components/mocktest/MockTestSummaryCard";
import MockTestFeedbackCard from "@/components/mocktest/MockTestFeedbackCard";
import { ASSESSMENT_CATEGORIES, getRatingInfo, isSubcategoryHidden } from "@/components/mocktest/mockTestData";

const STATUS_COLORS = {
  Draft: "bg-slate-100 text-slate-600",
  Finalised: "bg-blue-100 text-blue-700",
  Shared: "bg-green-100 text-green-700"
};

const RESULT_COLORS = {
  Pass: "bg-green-500 text-white",
  Fail: "bg-red-600 text-white",
  Borderline: "bg-orange-400 text-white",
  "Needs More Practice": "bg-yellow-400 text-[#071739]"
};

export default function MockTestReportView() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get("reportId");

  const { data: currentUser } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  const { data: report, isLoading } = useQuery({
    queryKey: ["mockTestReport", reportId],
    queryFn: () => base44.entities.MockTestReport.filter({ id: reportId }),
    enabled: !!reportId,
    select: data => data[0]
  });

  const { data: items = [] } = useQuery({
    queryKey: ["mockTestItems", reportId],
    queryFn: () => base44.entities.MockTestAssessmentItem.filter({ mockTestReportId: reportId }),
    enabled: !!reportId
  });

  const isInstructor = currentUser?.role === "admin" || report?.instructorId === currentUser?.id;

  const handleShare = async () => {
    await base44.entities.MockTestReport.update(reportId, { isSharedWithLearner: true, status: "Shared" });
    queryClient.invalidateQueries({ queryKey: ["mockTestReport", reportId] });
    toast({ title: "Shared", description: "Report shared with learner." });
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#071739] rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-500">
        Report not found.
      </div>
    );
  }

  const feedbackData = {
    keyStrengths: report.keyStrengths,
    mainAreasToImprove: report.mainAreasToImprove,
    priorityForNextLesson: report.priorityForNextLesson,
    recommendedPracticeFocus: report.recommendedPracticeFocus,
    instructorOverallComment: report.instructorOverallComment,
    instructorSignature: report.instructorSignature,
    learnerSignature: report.learnerSignature
  };

  const itemsMap = {};
  items.forEach(item => {
    itemsMap[`${item.category}__${item.subcategory}`] = item;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-[#071739] text-white sticky top-0 z-30 shadow-lg print:hidden">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-bold text-base leading-tight">Mock Test Report</h1>
                <p className="text-xs text-slate-300">{report.learnerName} · {report.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`text-xs font-bold ${STATUS_COLORS[report.status] || STATUS_COLORS.Draft}`}>
                {report.status || "Draft"}
              </Badge>
              {isInstructor && report.status === "Draft" && (
                <button
                  onClick={() => navigate(`/MockTestReportForm?reportId=${reportId}&learnerId=${report.learnerId}`)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Disclaimer */}
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 print:flex">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 font-medium">
            This is a mock/practice driving assessment for training purposes only. It is not an official DVSA driving test result.
          </p>
        </div>

        {/* Test Info */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 bg-gradient-to-r from-[#071739] to-slate-700 rounded-t-xl">
            <CardTitle className="text-white text-base">Test Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {[
                ["Date", report.date],
                ["Time", report.startTime && report.endTime ? `${report.startTime} – ${report.endTime}` : report.startTime || "—"],
                ["Instructor", report.instructorName],
                ["Learner", report.learnerName],
                ["Test Centre / Area", report.testCentreArea],
                ["Route", report.routeName],
                ["Vehicle Reg", report.vehicleRegistration],
                ["Transmission", report.transmissionType],
                ["Weather", report.weatherConditions],
                ["Road Conditions", report.roadConditions],
                ["Traffic", report.trafficConditions]
              ].map(([label, value]) => (
                value ? (
                  <div key={label}>
                    <p className="text-xs text-slate-400 font-medium">{label}</p>
                    <p className="text-slate-700 font-medium">{value}</p>
                  </div>
                ) : null
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <MockTestSummaryCard
          totalDF={report.totalDriverFaults || 0}
          totalS={report.totalSeriousFaults || 0}
          totalD={report.totalDangerousFaults || 0}
          overallResult={report.overallResult}
          manualOverride={false}
          onToggleOverride={() => {}}
          onOverrideChange={() => {}}
          independentDriving={report.independentDrivingCompleted}
          showMeTellMe={report.showMeTellMeCompleted}
          controlledStop={report.controlledStopCompleted}
          emergencyStop={report.emergencyStopCompleted}
          onToggleCheck={() => {}}
          readOnly
        />

        {/* Assessment Items */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 bg-gradient-to-r from-[#071739] to-slate-700 rounded-t-xl">
            <CardTitle className="text-white text-base">Assessment Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {ASSESSMENT_CATEGORIES.map(({ category, subcategories }) => {
              const visibleSubs = subcategories.filter(sub => !isSubcategoryHidden(sub, report.transmissionType));
              const catItems = visibleSubs.map(sub => itemsMap[`${category}__${sub}`]).filter(Boolean);
              if (catItems.length === 0) return null;

              const gradedItems = catItems.filter(item => item.rating !== "NT");
              const ntItems = catItems.filter(item => item.rating === "NT");

              if (gradedItems.length === 0) {
                return (
                  <div key={category}>
                    <h3 className="font-semibold text-[#071739] text-sm mb-1 border-b border-slate-100 pb-1">{category}</h3>
                    <p className="text-xs text-slate-400 italic px-1">Not tested</p>
                  </div>
                );
              }

              return (
                <div key={category}>
                  <h3 className="font-semibold text-[#071739] text-sm mb-2 border-b border-slate-100 pb-1">{category}</h3>
                  <div className="space-y-1">
                    {gradedItems.map(item => {
                      const ratingInfo = getRatingInfo(item.rating);
                      return (
                        <div key={item.subcategory} className={`flex items-start gap-3 p-2 rounded-lg ${ratingInfo.bg}`}>
                          <span className={`inline-flex items-center justify-center w-8 h-7 rounded-lg text-xs font-bold shrink-0 ${ratingInfo.color}`}>
                            {item.rating}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${ratingInfo.text}`}>{item.subcategory}</p>
                            {item.comments && <p className="text-xs text-slate-500 mt-0.5">{item.comments}</p>}
                          </div>
                        </div>
                      );
                    })}
                    {ntItems.length > 0 && (
                      <p className="text-xs text-slate-400 italic px-1 pt-0.5">
                        Not tested: {ntItems.map(i => i.subcategory).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Fault Summary */}
        <MockTestFeedbackCard items={items} />

        {/* Actions */}
        {isInstructor && (
          <div className="flex flex-wrap gap-2 print:hidden">
            {report.status === "Draft" && (
              <Button
                variant="outline"
                className="flex-1 min-w-[120px]"
                onClick={() => navigate(`/MockTestReportForm?reportId=${reportId}&learnerId=${report.learnerId}`)}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit Report
              </Button>
            )}
            {report.status === "Finalised" && !report.isSharedWithLearner && (
              <Button
                className="flex-1 min-w-[120px] bg-green-600 text-white hover:bg-green-700"
                onClick={handleShare}
              >
                <Send className="w-4 h-4 mr-1" />
                Share with Learner
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1 min-w-[120px]"
              onClick={handleExportPDF}
            >
              <Download className="w-4 h-4 mr-1" />
              Export / Print
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}