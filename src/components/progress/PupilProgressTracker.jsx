import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { progressStates, drivingSkillsSections, mockTests } from './drivingSkillsData';
import { ChevronRight, Check, Loader2, Edit2, Award, CheckSquare, Square, MapPin } from 'lucide-react';
import moment from 'moment';
import { Checkbox } from '@/components/ui/checkbox';

export default function PupilProgressTracker({ pupilId, instructorId, isInstructor = true }) {
  const queryClient = useQueryClient();
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [notes, setNotes] = useState('');
  const [editingMockTest, setEditingMockTest] = useState(null);
  const [mockTestData, setMockTestData] = useState({ result: '', instructorComments: '', pupilComments: '', testDate: '' });
  const [editingRoute, setEditingRoute] = useState(null);
  const [routeData, setRouteData] = useState({ routeDetails: '', comments: '' });

  const { data: progressData = [], isLoading } = useQuery({
    queryKey: ['drivingProgress', pupilId],
    queryFn: () => base44.entities.DrivingSkillProgress.filter({ pupilId }),
    enabled: !!pupilId
  });

  const { data: mockTestResults = [] } = useQuery({
    queryKey: ['mockTestResults', pupilId],
    queryFn: () => base44.entities.MockTestResult.filter({ pupilId }),
    enabled: !!pupilId
  });

  const { data: testRoutes = [] } = useQuery({
    queryKey: ['testRoutes', pupilId],
    queryFn: () => base44.entities.TestRoute.filter({ pupilId }, 'routeNumber'),
    enabled: !!pupilId
  });

  const { data: pupil } = useQuery({
    queryKey: ['pupil', pupilId],
    queryFn: () => base44.entities.Pupil.filter({ id: pupilId }).then(r => r[0]),
    enabled: !!pupilId
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ skillId, progressState }) => {
      const existing = progressData.find(p => p.skillId === skillId);
      if (existing) {
        return base44.entities.DrivingSkillProgress.update(existing.id, {
          progressState,
          notes,
          lastUpdated: new Date().toISOString()
        });
      } else {
        return base44.entities.DrivingSkillProgress.create({
          pupilId,
          instructorId,
          skillId,
          progressState,
          notes,
          lastUpdated: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['drivingProgress']);
      setSelectedSkill(null);
      setNotes('');
    }
  });

  const saveMockTestMutation = useMutation({
    mutationFn: async ({ mockTestId, data }) => {
      const existing = mockTestResults.find(r => r.mockTestId === mockTestId);
      if (existing) {
        return base44.entities.MockTestResult.update(existing.id, data);
      } else {
        return base44.entities.MockTestResult.create({
          pupilId,
          instructorId,
          mockTestId,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mockTestResults']);
      setEditingMockTest(null);
      setMockTestData({ result: '', instructorComments: '', pupilComments: '', testDate: '' });
    }
  });

  const saveRouteMutation = useMutation({
    mutationFn: async ({ routeNumber, data }) => {
      const existing = testRoutes.find(r => r.routeNumber === routeNumber);
      if (existing) {
        return base44.entities.TestRoute.update(existing.id, data);
      } else {
        return base44.entities.TestRoute.create({
          pupilId,
          instructorId,
          routeNumber,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['testRoutes']);
      setEditingRoute(null);
      setRouteData({ routeDetails: '', comments: '' });
    }
  });

  const getProgressForSkill = (skillId) => {
    return progressData.find(p => p.skillId === skillId);
  };

  const getProgressColor = (state) => {
    const stateConfig = progressStates.find(s => s.id === state);
    return stateConfig?.color || 'bg-slate-100 text-slate-600';
  };

  const handleSkillClick = (skill) => {
    if (!isInstructor) return;
    const progress = getProgressForSkill(skill.id);
    setSelectedSkill(skill);
    setNotes(progress?.notes || '');
  };

  const handleSaveProgress = (progressState) => {
    updateProgressMutation.mutate({
      skillId: selectedSkill.id,
      progressState
    });
  };

  const renderSkillItem = (skill, level = 0) => {
    const progress = getProgressForSkill(skill.id);
    const stateLabel = progressStates.find(s => s.id === progress?.progressState)?.label;

    return (
      <div 
        key={skill.id}
        className={`flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors ${
          isInstructor ? 'cursor-pointer' : ''
        }`}
        style={{ marginLeft: `${level * 16}px` }}
        onClick={() => handleSkillClick(skill)}
      >
        <div className="flex items-center gap-3 flex-1">
          <ChevronRight className={`w-4 h-4 text-slate-400 ${level > 0 ? 'opacity-50' : ''}`} />
          <span className="text-sm text-slate-700">{skill.label}</span>
        </div>
        {progress && (
          <Badge className={`${getProgressColor(progress.progressState)} text-xs`}>
            {stateLabel}
          </Badge>
        )}
      </div>
    );
  };

  const renderTopic = (topic, level = 0) => {
    if (topic.type === 'skill') {
      return renderSkillItem(topic, level);
    }

    if (topic.type === 'group' && topic.subtopics) {
      return (
        <div key={topic.id} className="mb-2">
          <div className="font-medium text-slate-600 text-sm mb-2" style={{ marginLeft: `${level * 16}px` }}>
            {topic.label}
          </div>
          {topic.subtopics.map(subtopic => renderTopic(subtopic, level + 1))}
        </div>
      );
    }

    return null;
  };

  const calculateOverallProgress = () => {
    const allSkills = [];
    drivingSkillsSections.forEach(section => {
      section.topics.forEach(topic => {
        if (topic.type === 'skill') {
          allSkills.push(topic.id);
        } else if (topic.subtopics) {
          const extractSkills = (items) => {
            items.forEach(item => {
              if (item.type === 'skill') {
                allSkills.push(item.id);
              } else if (item.subtopics) {
                extractSkills(item.subtopics);
              }
            });
          };
          extractSkills(topic.subtopics);
        }
      });
    });

    const independentCount = allSkills.filter(skillId => {
      const progress = getProgressForSkill(skillId);
      return progress?.progressState === 'independent';
    }).length;

    return {
      total: allSkills.length,
      independent: independentCount,
      percentage: Math.round((independentCount / allSkills.length) * 100)
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#F7B602]" />
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();

  return (
    <div className="space-y-6">
      {/* Overall Progress Summary */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-[#F7B602]/10 to-[#F7B602]/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Overall Progress</h3>
              <p className="text-sm text-slate-600">
                {overallProgress.independent} of {overallProgress.total} skills mastered
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#071739]">{overallProgress.percentage}%</div>
              <p className="text-xs text-slate-500">Independent</p>
            </div>
          </div>
          <div className="mt-4 h-3 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#F7B602] to-[#d99f02] transition-all duration-500"
              style={{ width: `${overallProgress.percentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Progress Legend */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-slate-600">Progress Levels:</span>
            {progressStates.map(state => (
              <Badge key={state.id} className={`${state.color} text-xs`}>
                {state.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skills Sections */}
      <Accordion type="multiple" className="space-y-3">
        {drivingSkillsSections.map((section, index) => (
          <AccordionItem 
            key={section.id} 
            value={section.id}
            className="border-0 shadow-sm rounded-lg bg-white overflow-hidden"
          >
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F7B602]/20 flex items-center justify-center text-[#071739] font-semibold text-sm">
                  {index + 1}
                </div>
                <span className="font-semibold text-slate-800">{section.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-4">
              <div className="space-y-1">
                {section.topics.map(topic => renderTopic(topic))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Mock Tests Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#F7B602]" />
            Mock Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockTests.map(test => {
              const result = mockTestResults.find(r => r.mockTestId === test.id);
              return (
                <div 
                  key={test.id} 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    isInstructor ? 'hover:border-[#F7B602]' : ''
                  } ${result ? 'border-slate-300 bg-slate-50' : 'border-slate-200'}`}
                  onClick={() => {
                    if (!isInstructor) return;
                    setEditingMockTest(test.id);
                    setMockTestData({
                      result: result?.result || '',
                      instructorComments: result?.instructorComments || '',
                      pupilComments: result?.pupilComments || '',
                      testDate: result?.testDate || moment().format('YYYY-MM-DD')
                    });
                  }}
                >
                  <h4 className="font-medium text-slate-700 mb-3">{test.label}</h4>
                  {result && result.result ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {result.result === 'pass' ? (
                          <Badge className="bg-emerald-100 text-emerald-700">Pass</Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-700">Fail</Badge>
                        )}
                      </div>
                      {result.testDate && (
                        <p className="text-xs text-slate-500">{moment(result.testDate).format('D MMM YYYY')}</p>
                      )}
                      {result.instructorComments && (
                        <p className="text-xs text-slate-600 mt-2">
                          <span className="font-medium">Instructor: </span>
                          {result.instructorComments}
                        </p>
                      )}
                      {result.pupilComments && (
                        <p className="text-xs text-slate-600 mt-1">
                          <span className="font-medium">Pupil: </span>
                          {result.pupilComments}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">Not completed</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Test Routes Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#F7B602]" />
            Test Routes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(routeNumber => {
              const route = testRoutes.find(r => r.routeNumber === routeNumber);
              return (
                <div 
                  key={routeNumber}
                  className={`p-4 border-2 rounded-lg min-h-[120px] cursor-pointer transition-colors ${
                    isInstructor ? 'hover:border-[#F7B602]' : ''
                  } ${route ? 'border-slate-300 bg-slate-50' : 'border-slate-200'}`}
                  onClick={() => {
                    if (!isInstructor) return;
                    setEditingRoute(routeNumber);
                    setRouteData({
                      routeDetails: route?.routeDetails || '',
                      comments: route?.comments || ''
                    });
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-slate-700">Route {routeNumber}</h4>
                    {route && (route.routeDetails || route.comments) && <Check className="w-4 h-4 text-emerald-500" />}
                  </div>
                  {route && (route.routeDetails || route.comments) ? (
                    <div className="space-y-2">
                      {route.routeDetails && (
                        <p className="text-sm text-slate-600">{route.routeDetails}</p>
                      )}
                      {route.comments && (
                        <p className="text-xs text-slate-500 italic">{route.comments}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">Click to add route details</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit Progress Dialog */}
      <Dialog open={!!selectedSkill} onOpenChange={() => setSelectedSkill(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Progress: {selectedSkill?.label}</DialogTitle>
            <DialogDescription>
              Select the current progress level for this skill
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {progressStates.map(state => (
              <button
                key={state.id}
                onClick={() => handleSaveProgress(state.id)}
                disabled={updateProgressMutation.isPending}
                className={`w-full p-4 border-2 rounded-lg text-left hover:border-[#F7B602] transition-colors ${
                  getProgressForSkill(selectedSkill?.id)?.progressState === state.id
                    ? 'border-[#F7B602] bg-[#F7B602]/5'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">{state.label}</h4>
                    <p className="text-xs text-slate-600">{state.description}</p>
                  </div>
                  {getProgressForSkill(selectedSkill?.id)?.progressState === state.id && (
                    <Check className="w-5 h-5 text-[#F7B602] shrink-0" />
                  )}
                </div>
              </button>
            ))}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Notes (Optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this skill..."
                rows={3}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Mock Test Dialog */}
      <Dialog open={!!editingMockTest} onOpenChange={() => setEditingMockTest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Mock Test: {mockTests.find(t => t.id === editingMockTest)?.label}</DialogTitle>
            <DialogDescription>
              Record the mock test result and comments
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-3 block">Result</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setMockTestData({ ...mockTestData, result: mockTestData.result === 'pass' ? '' : 'pass' })}
                  className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
                    mockTestData.result === 'pass' 
                      ? 'border-emerald-500 bg-emerald-50' 
                      : 'border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {mockTestData.result === 'pass' ? <CheckSquare className="w-5 h-5 text-emerald-600" /> : <Square className="w-5 h-5" />}
                    <span className="font-medium">Pass</span>
                  </div>
                </button>
                <button
                  onClick={() => setMockTestData({ ...mockTestData, result: mockTestData.result === 'fail' ? '' : 'fail' })}
                  className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
                    mockTestData.result === 'fail' 
                      ? 'border-rose-500 bg-rose-50' 
                      : 'border-slate-200 hover:border-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {mockTestData.result === 'fail' ? <CheckSquare className="w-5 h-5 text-rose-600" /> : <Square className="w-5 h-5" />}
                    <span className="font-medium">Fail</span>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Test Date</label>
              <Input
                type="date"
                value={mockTestData.testDate}
                onChange={(e) => setMockTestData({ ...mockTestData, testDate: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Instructor Comments</label>
              <Textarea
                value={mockTestData.instructorComments}
                onChange={(e) => setMockTestData({ ...mockTestData, instructorComments: e.target.value })}
                placeholder="Add instructor comments..."
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Pupil Comments</label>
              <Textarea
                value={mockTestData.pupilComments}
                onChange={(e) => setMockTestData({ ...mockTestData, pupilComments: e.target.value })}
                placeholder="Add pupil comments..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditingMockTest(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => saveMockTestMutation.mutate({ mockTestId: editingMockTest, data: mockTestData })}
                disabled={saveMockTestMutation.isPending}
                className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
              >
                {saveMockTestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Test Route Dialog */}
      <Dialog open={!!editingRoute} onOpenChange={() => setEditingRoute(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Test Route {editingRoute}</DialogTitle>
            <DialogDescription>
              Add details about this test route
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Route Details</label>
              <Textarea
                value={routeData.routeDetails}
                onChange={(e) => setRouteData({ ...routeData, routeDetails: e.target.value })}
                placeholder="Describe the route, key areas, directions..."
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Comments</label>
              <Textarea
                value={routeData.comments}
                onChange={(e) => setRouteData({ ...routeData, comments: e.target.value })}
                placeholder="Any additional notes or observations..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditingRoute(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => saveRouteMutation.mutate({ routeNumber: editingRoute, data: routeData })}
                disabled={saveRouteMutation.isPending}
                className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
              >
                {saveRouteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}