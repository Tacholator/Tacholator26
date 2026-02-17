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
  const [expandedSection, setExpandedSection] = useState(null);

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

  const { data: topicHours = [] } = useQuery({
    queryKey: ['topicHoursLog', pupilId],
    queryFn: () => base44.entities.TopicHoursLog.filter({ pupilId }),
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



  const handleCheckboxToggle = (skillId, level) => {
    const progress = getProgressForSkill(skillId);
    const currentState = progress?.progressState;
    let newState;

    if (currentState === level) {
      const levels = ['full_talk_through', 'prompted', 'independent'];
      const currentIndex = levels.indexOf(currentState);
      newState = currentIndex > 0 ? levels[currentIndex - 1] : '';
    } else {
      newState = level;
    }

    updateProgressMutation.mutate({
      skillId,
      progressState: newState
    });
  };

  const handleSelectAll = async (subtopics) => {
    const skillIds = [];
    const extractSkillIds = (items) => {
      items.forEach(item => {
        if (item.type === 'skill') {
          skillIds.push(item.id);
        } else if (item.subtopics) {
          extractSkillIds(item.subtopics);
        }
      });
    };
    extractSkillIds(subtopics);

    for (const skillId of skillIds) {
      const existing = progressData.find(p => p.skillId === skillId);
      if (existing) {
        await base44.entities.DrivingSkillProgress.update(existing.id, {
          progressState: 'independent',
          notes: notes || existing.notes,
          lastUpdated: new Date().toISOString()
        });
      } else {
        await base44.entities.DrivingSkillProgress.create({
          pupilId,
          instructorId,
          skillId,
          progressState: 'independent',
          notes,
          lastUpdated: new Date().toISOString()
        });
      }
    }

    queryClient.invalidateQueries(['drivingProgress']);
  };

  const renderSkillItem = (skill, level = 0) => {
    const progress = getProgressForSkill(skill.id);
    const levels = ['full_talk_through', 'prompted', 'independent'];

    if (isInstructor) {
      return (
        <div 
          key={skill.id}
          className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors gap-4"
          style={{ marginLeft: `${level * 16}px` }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <ChevronRight className={`w-4 h-4 text-slate-400 flex-shrink-0 ${level > 0 ? 'opacity-50' : ''}`} />
            <span className="text-sm text-slate-700 truncate">{skill.label}</span>
          </div>
          <div className="flex gap-3 items-center flex-shrink-0">
            {levels.map((lvl, idx) => {
              const isChecked = levels.indexOf(progress?.progressState) >= idx;
              return (
                <label key={lvl} className="flex items-center gap-1.5 cursor-pointer group">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => handleCheckboxToggle(skill.id, lvl)}
                    disabled={updateProgressMutation.isPending}
                  />
                  <span className="text-xs text-slate-600 group-hover:text-slate-800 whitespace-nowrap">
                    {lvl === 'full_talk_through' ? 'Full' : lvl === 'prompted' ? 'Prompt' : 'Indep'}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      );
    }

    // Learner view - read-only
    const stateLabel = progressStates.find(s => s.id === progress?.progressState)?.label;
    return (
      <div 
        key={skill.id}
        className="flex items-center justify-between p-3 rounded-lg"
        style={{ marginLeft: `${level * 16}px` }}
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

  // SHARED PROGRESS CALCULATION - Based on 24 total parent cards/sections
  const calculateOverallProgress = () => {
    const TOTAL_CARDS = 24;
    
    const completedCards = drivingSkillsSections.filter(section => {
      return getSectionProgress(section).status === 'completed';
    }).length;

    const percentage = Math.round((completedCards / TOTAL_CARDS) * 100);

    return {
      total: TOTAL_CARDS,
      independent: completedCards,
      percentage: percentage
    };
  };

  const getSectionProgress = (section) => {
    const sectionSkills = [];
    const extractSkills = (items) => {
      items.forEach(item => {
        if (item.type === 'skill') {
          sectionSkills.push(item.id);
        } else if (item.subtopics) {
          extractSkills(item.subtopics);
        }
      });
    };
    extractSkills(section.topics);

    if (sectionSkills.length === 0) return { total: 0, completed: 0, percentage: 0, status: 'not_started' };

    const completed = sectionSkills.filter(skillId => {
      const progress = getProgressForSkill(skillId);
      return progress?.progressState === 'independent';
    }).length;

    const started = sectionSkills.some(skillId => {
      const progress = getProgressForSkill(skillId);
      return progress?.progressState;
    });

    const percentage = Math.round((completed / sectionSkills.length) * 100);
    
    let status = 'not_started';
    if (completed === sectionSkills.length) {
      status = 'completed';
    } else if (started) {
      status = 'in_progress';
    }

    return { total: sectionSkills.length, completed, percentage, status };
  };

  const isSectionCompleted = (section) => {
    return getSectionProgress(section).status === 'completed';
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

      {/* Skills Cards - Same for Both Instructor and Pupil */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drivingSkillsSections.map((section, index) => {
          const gradients = [
            'from-blue-500 to-cyan-600',
            'from-yellow-500 to-amber-600',
            'from-pink-500 to-rose-600',
            'from-slate-500 to-gray-600',
            'from-green-500 to-emerald-600',
            'from-violet-500 to-purple-600',
            'from-amber-600 to-orange-600',
            'from-orange-500 to-red-600',
            'from-purple-500 to-fuchsia-600',
            'from-teal-500 to-cyan-600',
            'from-rose-500 to-pink-600',
            'from-lime-500 to-green-600',
            'from-indigo-500 to-blue-600',
            'from-fuchsia-500 to-pink-600',
            'from-cyan-500 to-blue-600',
            'from-emerald-500 to-teal-600',
            'from-red-500 to-rose-600',
            'from-amber-500 to-yellow-600',
            'from-sky-500 to-blue-600',
            'from-pink-600 to-fuchsia-700',
            'from-violet-600 to-indigo-700',
            'from-green-600 to-lime-700',
            'from-orange-600 to-amber-700',
            'from-blue-600 to-indigo-700'
          ];
          const gradient = gradients[index];
          const sectionProgress = getSectionProgress(section);
          const topicLog = topicHours.find(log => log.topicId === section.id);
          const hoursSpent = topicLog?.totalHours || 0;

          const statusConfig = {
            not_started: { label: 'Not Started', color: 'bg-slate-100 text-slate-600' },
            in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
            completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700' }
          };

          return (
            <Card 
              key={section.id}
              className={`border-0 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden h-[280px] flex flex-col bg-gradient-to-br ${gradient}`}
              onClick={() => setExpandedSection(section)}
            >
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-sm leading-tight mb-1">
                        {section.title}
                      </h3>
                      <p className="text-xs text-white/80">
                        {sectionProgress.completed}/{sectionProgress.total} sections
                      </p>
                    </div>
                  </div>
                </div>

                <Badge className="bg-white/20 text-white backdrop-blur-sm mb-3 w-fit text-xs border-white/30">
                  {statusConfig[sectionProgress.status].label}
                </Badge>

                {sectionProgress.status !== 'completed' && (
                  <div className="flex-1 flex items-center justify-center my-2">
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/40 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-white leading-none">{hoursSpent}</span>
                      <span className="text-xs text-white/90 mt-1">covered</span>
                    </div>
                  </div>
                )}

                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/90 font-medium">Progress</span>
                    <span className="text-xs text-white font-semibold">{sectionProgress.percentage}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <div 
                      className="h-full bg-white/90 transition-all duration-500"
                      style={{ width: `${sectionProgress.percentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
                  } ${route && (route.routeDetails || route.comments) ? 'border-slate-300 bg-slate-50' : 'border-slate-200'}`}
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
                  } ${result && result.result ? 'border-slate-300 bg-slate-50' : 'border-slate-200'}`}
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

      {/* Expanded Section Dialog */}
      <Dialog open={!!expandedSection} onOpenChange={() => setExpandedSection(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F7B602] to-[#d99f02] flex items-center justify-center text-white font-bold">
                {drivingSkillsSections.indexOf(expandedSection) + 1}
              </div>
              {expandedSection?.title}
            </DialogTitle>
            <DialogDescription>
              Track progress for each section below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {expandedSection?.topics.map(topic => renderTopic(topic, 0))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}