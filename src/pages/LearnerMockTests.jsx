import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList, Calendar, AlertCircle } from "lucide-react";
import moment from "moment";

const RESULT_STYLES = {
  Pass: "bg-green-100 text-green-700 border-green-200",
  Fail: "bg-red-100 text-red-700 border-red-200",
  Borderline: "bg-orange-100 text-orange-700 border-orange-200",
  "Needs More Practice": "bg-yellow-100 text-yellow-800 border-yellow-200"
};

export default function LearnerMockTests() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  const { data: pupilProfile } = useQuery({
    queryKey: ["learnerPupilProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const byLinkedId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      if (byLinkedId.length > 0) return byLinkedId[0];
      const byEmail = await base44.entities.Pupil.filter({ email: user.email });
      return byEmail.length > 0 ? byEmail[0] : null;
    },
    enabled: !!user?.id
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["learnerMockTestReports", pupilProfile?.id],
    queryFn: () => base44.entities.MockTestReport.filter({ learnerId: pupilProfile.id, isSharedWithLearner: true }),
    enabled: !!pupilProfile?.id
  });

  const sortedReports = [...reports].sort((a, b) => b.date?.localeCompare(a.date));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-[#071739] text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-base leading-tight">Mock Test Results</h1>
            <p className="text-xs text-slate-300">Reports shared by your instructor</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Disclaimer */}
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 font-medium">
            These are mock/practice assessments for training purposes only. Not official DVSA test results.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse h-28 bg-slate-200 rounded-xl" />
            ))}
          </div>
        ) : sortedReports.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="font-semibold text-slate-500">No mock test reports yet</p>
              <p className="text-xs text-slate-400 mt-1">Your instructor will share reports with you after each mock test</p>
            </CardContent>
          </Card>
        ) : (
          sortedReports.map(report => (
            <Card
              key={report.id}
              className="border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/MockTestReportView?reportId=${report.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge className={`text-xs font-bold border ${RESULT_STYLES[report.overallResult] || RESULT_STYLES["Needs More Practice"]}`}>
                        {report.overallResult || "Pending"}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        DF: {report.totalDriverFaults || 0} · S: {report.totalSeriousFaults || 0} · D: {report.totalDangerousFaults || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-600 mt-1">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      {report.date ? moment(report.date).format("D MMMM YYYY") : "Date not set"}
                      {report.startTime && <span className="text-slate-400">at {report.startTime}</span>}
                    </div>
                    {report.testCentreArea && (
                      <p className="text-xs text-slate-400 mt-0.5">{report.testCentreArea}{report.routeName ? ` · ${report.routeName}` : ""}</p>
                    )}
                    {report.instructorName && (
                      <p className="text-xs text-slate-400 mt-0.5">Instructor: {report.instructorName}</p>
                    )}
                  </div>
                  <div className="text-xs text-[#071739] font-semibold shrink-0 mt-1">View →</div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}