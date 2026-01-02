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
import { CheckCircle2, XCircle, Plus, Edit, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';

export default function MockTestsSection({ pupilId }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['mock_1', 'mock_2', 'mock_3'].map((mockId) => {
            const mock = mockTests.find(m => m.mockTestId === mockId);
            return (
              <Card 
                key={mockId}
                className={`border-2 ${mock ? (mock.result === 'pass' ? 'border-emerald-500 bg-emerald-50' : 'border-rose-500 bg-rose-50') : 'border-slate-200'}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-800">{mockTestLabels[mockId]}</h4>
                    {mock ? (
                      mock.result === 'pass' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600" />
                      )
                    ) : null}
                  </div>
                  {mock ? (
                    <div className="space-y-2">
                      <Badge className={mock.result === 'pass' ? 'bg-emerald-600' : 'bg-rose-600'}>
                        {mock.result === 'pass' ? 'Passed' : 'Failed'}
                      </Badge>
                      {mock.testDate && (
                        <p className="text-sm text-slate-600">
                          {moment(mock.testDate).format('D MMM YYYY')}
                        </p>
                      )}
                      {mock.instructorComments && (
                        <p className="text-xs text-slate-600 line-clamp-2">{mock.instructorComments}</p>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(mock)}
                        className="w-full mt-2"
                      >
                        <Edit className="w-3 h-3 mr-2" />
                        Edit
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingMock(null);
                        setFormData({ mockTestId: mockId, result: 'pass', instructorComments: '', pupilComments: '', testDate: '' });
                        setShowModal(true);
                      }}
                      className="w-full"
                    >
                      <Plus className="w-3 h-3 mr-2" />
                      Add Result
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
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