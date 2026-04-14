import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FileText, ChevronRight, Calendar, User } from "lucide-react";

const STATUS_COLORS = {
  Draft: "bg-slate-100 text-slate-600",
  Finalised: "bg-blue-100 text-blue-700",
  Shared: "bg-green-100 text-green-700"
};

const RESULT_COLORS = {
  Pass: "bg-green-100 text-green-700",
  Fail: "bg-red-100 text-red-700",
  Borderline: "bg-orange-100 text-orange-700",
  "Needs More Practice": "bg-yellow-100 text-yellow-700"
};

export default function MockTestReportList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: currentUser } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const isAdmin = currentUser?.role === "admin";

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["mockTestReports", currentUser?.id, isAdmin],
    queryFn: async () => {
      if (isAdmin) return base44.entities.MockTestReport.list("-created_date", 100);
      return base44.entities.MockTestReport.filter({ instructorId: currentUser?.id }, "-created_date", 100);
    },
    enabled: !!currentUser?.id
  });

  const filtered = reports.filter(r => {
    const matchSearch = !search ||
      r.learnerName?.toLowerCase().includes(search.toLowerCase()) ||
      r.routeName?.toLowerCase().includes(search.toLowerCase()) ||
      r.testCentreArea?.toLowerCase().includes(search.toLowerCase());
    const matchResult = resultFilter === "all" || r.overallResult === resultFilter;
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchResult && matchStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-[#071739] text-white px-4 pt-6 pb-4 shadow-lg">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-bold">Mock Test Reports</h1>
            <Button
              onClick={() => navigate("/MockTestReportForm")}
              className="bg-[#F7B602] text-[#071739] hover:bg-[#F7B602]/90 font-bold text-sm h-9"
            >
              <Plus className="w-4 h-4 mr-1" />
              New Report
            </Button>
          </div>
          <p className="text-xs text-slate-300">{reports.length} report{reports.length !== 1 ? "s" : ""} found</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search learner, route, area..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={resultFilter} onValueChange={setResultFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="Pass">Pass</SelectItem>
              <SelectItem value="Fail">Fail</SelectItem>
              <SelectItem value="Borderline">Borderline</SelectItem>
              <SelectItem value="Needs More Practice">Needs More Practice</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Finalised">Finalised</SelectItem>
              <SelectItem value="Shared">Shared</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-[#071739] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No reports found</p>
            <p className="text-slate-400 text-sm mt-1">Start a new mock test to create one</p>
            <Button className="mt-4 bg-[#071739] text-white" onClick={() => navigate("/MockTestReportForm")}>
              <Plus className="w-4 h-4 mr-1" /> New Mock Test Report
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(report => (
              <Card
                key={report.id}
                className="cursor-pointer hover:shadow-md transition-shadow border border-slate-200"
                onClick={() => navigate(`/MockTestReportView?reportId=${report.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-[#071739] text-sm truncate">{report.learnerName || "Unknown Learner"}</span>
                        {report.overallResult && (
                          <Badge className={`text-xs ${RESULT_COLORS[report.overallResult] || "bg-slate-100 text-slate-600"}`}>
                            {report.overallResult}
                          </Badge>
                        )}
                        <Badge className={`text-xs ${STATUS_COLORS[report.status] || "bg-slate-100 text-slate-600"}`}>
                          {report.status || "Draft"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {report.date}
                        </span>
                        {report.testCentreArea && <span>{report.testCentreArea}</span>}
                        {report.routeName && <span>· {report.routeName}</span>}
                      </div>
                      {(report.totalDriverFaults > 0 || report.totalSeriousFaults > 0 || report.totalDangerousFaults > 0) && (
                        <div className="flex gap-3 mt-2 text-xs">
                          <span className="text-yellow-700 font-medium">{report.totalDriverFaults} DF</span>
                          <span className="text-orange-700 font-medium">{report.totalSeriousFaults} S</span>
                          <span className="text-red-700 font-medium">{report.totalDangerousFaults} D</span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}