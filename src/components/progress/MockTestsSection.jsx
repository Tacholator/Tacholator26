import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, Plus, Edit, Loader2, ClipboardList, FileText, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

const RESULT_STYLES = {
  Pass: "bg-green-100 text-green-700",
  Fail: "bg-red-100 text-red-700",
  Borderline: "bg-orange-100 text-orange-700",
  "Needs More Practice": "bg-yellow-100 text-yellow-800"
};

export default function MockTestsSection({ pupilId }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingMock, setEditingMock] = useState(null);
  const [formData, setFormData] = useState({
    mockTestId: 'mock_1',
    result: 'pass',
    instructorComments: '',
    pupilComments: '',
    testDate: ''
  });

  const { data: mockTests = [] } = useQuery({
    queryKey: ['mockTests', pupilId],
    queryFn: () => base44.entities.MockTestResult.filter({ pupilId }),
    enabled: !!pupilId
  });

  const { data: mockReports = [] } = useQuery({
    queryKey: ['mockTestReports', pupilId],
    queryFn: () => base44.entities.MockTestReport.filter({ learnerId: pupilId }),
    enabled: !!pupilId
  });

  const sortedReports = [...mockReports].sort((a, b) => b.date?.localeCompare(a.date));

  const saveMockMutation = useMutation({
    mutationFn: (data) => {
      if (editingMock) {
        return base44.entities.MockTestResult.update(editingMock.id, data);
      }
      return base44.entities.MockTestResult.create({ ...data, pupilId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mockTests', pupilId]);
      setShowModal(false);
      setEditingMock(null);
      toast({ title: 'Mock test saved' });
    }
  });

  const handleEdit = (mock) => {
    setEditingMock(mock);
    setFormData({
      mockTestId: mock.mockTestId,
      result: mock.result,
      instructorComments: mock.instructorComments || '',
      pupilComments: mock.pupilComments || '',
      testDate: mock.testDate || ''
    });
    setShowModal(true);
  };

  const handleSave = () => {
    saveMockMutation.mutate(formData);
  };

  const mockTestLabels = {
    mock_1: 'Mock Test 1',
    mock_2: 'Mock Test 2',
    mock_3: 'Mock Test 3'
  };

  return (
    <>
      <div className="space-y-4">
        {/* Start Mock Test Button */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Quick mock test results below, or start a full detailed report.</p>
          <Button
            onClick={() => navigate(`/MockTestReportForm?learnerId=${pupilId}`)}
            className="bg-[#071739] text-white hover:bg-[#071739]/90 font-semibold shrink-0"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Start Mock Test
          </Button>
        </div>

        {/* Full Mock Test Reports */}
        {sortedReports.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Full Mock Test Reports</p>
            {sortedReports.map(report => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 rounded-xl border bg-white hover:bg-slate-50 cursor-pointer"
                onClick={() => navigate(`/MockTestReportView?reportId=${report.id}`)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`text-xs ${RESULT_STYLES[report.overallResult] || RESULT_STYLES["Needs More Practice"]}`}>
                        {report.overallResult || "Pending"}
                      </Badge>
                      <span className="text-xs text-slate-400">DF: {report.totalDriverFaults || 0} · S: {report.totalSeriousFaults || 0} · D: {report.totalDangerousFaults || 0}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {report.date ? moment(report.date).format("D MMM YYYY") : "No date"}
                      {report.testCentreArea ? ` · ${report.testCentreArea}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={report.isSharedWithLearner ? "bg-green-100 text-green-700 text-xs" : "bg-slate-100 text-slate-500 text-xs"}>
                    {report.status || "Draft"}
                  </Badge>
                  <Eye className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}


      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMock ? 'Edit' : 'Add'} Mock Test Result</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Mock Test</Label>
              <Select value={formData.mockTestId} onValueChange={(value) => setFormData({ ...formData, mockTestId: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mock_1">Mock Test 1</SelectItem>
                  <SelectItem value="mock_2">Mock Test 2</SelectItem>
                  <SelectItem value="mock_3">Mock Test 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Result</Label>
              <Select value={formData.result} onValueChange={(value) => setFormData({ ...formData, result: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass">Pass</SelectItem>
                  <SelectItem value="fail">Fail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Test Date</Label>
              <Input
                type="date"
                value={formData.testDate}
                onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Instructor Comments</Label>
              <Textarea
                value={formData.instructorComments}
                onChange={(e) => setFormData({ ...formData, instructorComments: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Pupil Comments</Label>
              <Textarea
                value={formData.pupilComments}
                onChange={(e) => setFormData({ ...formData, pupilComments: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMockMutation.isPending}>
              {saveMockMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}