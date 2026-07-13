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
import { ChevronRight, Loader2, Edit2, Award, CheckSquare, Square } from 'lucide-react';
import moment from 'moment';
import { Checkbox } from '@/components/ui/checkbox';

export default function PupilProgressTracker({ pupilId, instructorId, isInstructor = true }) {
  const queryClient = useQueryClient();
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [notes, setNotes] = useState('');
  const [editingMockTest, setEditingMockTest] = useState(null);
  const [mockTestData, setMockTestData] = useState({ result: '', instructorComments: '', pupilComments: '', testDate: '' });
  const [expandedSection, setExpandedSection] = useState(null);
  const [selectedCustomTopic, setSelectedCustomTopic] = useState(null);

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

  // Fetch LessonTopicDuration for custom topics from lesson summaries
  const { data: lessonTopicDurations = [] } = useQuery({
    queryKey: ['lessonTopicDurations', pupilId],
    queryFn: () => base44.entities.LessonTopicDuration.filter({ pupilId }),
    enabled: !!pupilId
  });

  const { data: mcqStatusData = [] } = useQuery({
    queryKey: ['mcqStatus', pupilId],
    queryFn: () => base44.entities.McqStatus.filter({ pupilId }),
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



  const handleSelectAll = async (directSkills, shouldUnselect = false) => {
    // Only process direct skills passed in, no recursive extraction
    const skillIds = directSkills.filter(item => item.type === 'skill').map(item => item.id);

    for (const skillId of skillIds) {
      const existing = progressData.find(p => p.skillId === skillId);
      if (shouldUnselect) {
        if (existing) {
          await base44.entities.DrivingSkillProgress.update(existing.id, {
            progressState: '',
            notes: existing.notes,
            lastUpdated: new Date().toISOString()
          });
        }
      } else {
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
    }

    queryClient.invalidateQueries(['drivingProgress']);
  };

  const checkMcqPassed = (skillId) => {
    // Map MCQ topic IDs to skill ID patterns they should match
    const mcqToSkillPatterns = {
      'stopping_safely': ['mirrors_stopping', 'signal_stopping', 'manoeuvre_stopping'], // Any MSM routine component
      'use_of_mirrors': ['mirrors_before_signalling', 'mirrors_before_changing_lane', 'mirrors_before_changing_direction', 'mirrors_change_of_speed_new_road', 'mirrors_traffic_and_traffic_lights', 'mirrors_change_of_speed_slowing_down'],
      'use_of_signals': ['signals_indicators_changing_direction', 'signals_road_position_overtaking_parked_cars', 'signals_horn', 'signals_brake_and_headlights', 'signals_arm_signal', 'signals_hazard_lights'],
      'junctions': ['junctions_turning_emerging_right', 'junctions_turning_emerging_left', 'junctions_filter_lane_turning_right', 'junctions_open_and_closed'],
      'legal_responsibilities': ['legal_responsibilities_core'],
      'safety_checks': ['safety_checks_core'],
      'vehicle_security': ['security_core'],
      'cockpit_drill_dsssm': ['cockpit_drill', 'dsssm_routine'],
      'hazard_perception': ['hazard_perception'],
      'moving_off_safely': ['prepare_gear_d_park_brake_down', 'observe_6_point_checks', 'manoeuvre_signal_drive_off'],
      'main_car_controls': ['accelerator', 'footbrake', 'clutch', 'steering_wheel', 'handbrake', 'gear_lever', 'indicators', 'horn', 'lights', 'wipers', 'demisters'],
      'use_of_speed': ['speed_30_40_50_roads', 'speed_national_speed_limit_roads', 'speed_hump_roads'],
    };

    // Check direct match first
    if (mcqStatusData.find(m => m.topicId === skillId)?.lastPassed) return true;
    
    // Check pattern matches - if this skill matches any pattern for a passed MCQ
    for (const [mcqTopic, skillPatterns] of Object.entries(mcqToSkillPatterns)) {
      const mcqPassed = mcqStatusData.find(m => m.topicId === mcqTopic)?.lastPassed;
      if (mcqPassed && skillPatterns.includes(skillId)) {
        return true;
      }
    }
    
    return false;
  };

  const renderSkillItem = (skill, level = 0) => {
    const progress = getProgressForSkill(skill.id);
    const levels = ['full_talk_through', 'prompted', 'independent'];
    const skillHours = topicHours.find(log => log.topicId === skill.id)?.totalHours || 0;
    const mcqPassed = checkMcqPassed(skill.id);

    if (isInstructor) {
      return (
        <div 
          key={skill.id}
          className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors gap-4"
          style={{ marginLeft: `${level * 16}px` }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <ChevronRight className={`w-4 h-4 text-slate-400 flex-shrink-0 ${level > 0 ? 'opacity-50' : ''}`} />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-sm text-slate-700 truncate">{skill.label}</span>
              {mcqPassed && (
                <Badge className="bg-emerald-100 text-emerald-700 text-xs whitespace-nowrap">
                  PASSED
                </Badge>
              )}
              {skillHours > 0 && (
                <span className="text-xs text-blue-600 font-medium whitespace-nowrap">
                  ({skillHours.toFixed(1)}h)
                </span>
              )}
            </div>
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
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm text-slate-700">{skill.label}</span>
            {mcqPassed && (
              <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                PASSED
              </Badge>
            )}
            {skillHours > 0 && (
              <span className="text-xs text-blue-600 font-medium">
                ({skillHours.toFixed(1)}h)
              </span>
            )}
          </div>
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
      // Only count direct skill children (not nested groups)
      const directSkills = topic.subtopics.filter(st => st.type === 'skill');
      const hasMultipleSkills = directSkills.length > 1;
      
      // Only check direct skills for "all independent" status
      const allDirectSkillsIndependent = directSkills.length > 0 && directSkills.every(skill => {
        const progress = getProgressForSkill(skill.id);
        return progress?.progressState === 'independent';
      });
      
      return (
        <div key={topic.id} className="mb-2">
          <div className="flex items-center justify-between mb-2" style={{ marginLeft: `${level * 16}px` }}>
            <div className="font-medium text-slate-600 text-sm">
              {topic.label}
            </div>
            {isInstructor && hasMultipleSkills && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectAll(directSkills, allDirectSkillsIndependent);
                }}
                disabled={updateProgressMutation.isPending}
                className="text-xs h-7 px-2"
              >
                {allDirectSkillsIndependent ? 'Unselect All' : 'Select All'}
              </Button>
            )}
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
          <div className="flex items-center justify-between mb-4">
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
          {mcqStatusData.some(m => m.lastPassed) && (
            <div className="mb-4">
              <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                ✓ MCQ Tests Passed
              </Badge>
            </div>
          )}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-600 font-medium">Progress</span>
            <span className="text-xs text-slate-700 font-semibold">{overallProgress.percentage}%</span>
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
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

      {/* Skills List - Same for Both Instructor and Pupil */}
      <div className="space-y-3">
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
          // Get hours for all skills in this section
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
           // Get hours for this section (stored by section ID)
           const sectionLog = topicHours.find(l => l.topicId === section.id);
           const hoursSpent = sectionLog?.totalHours || 0;

          const statusConfig = {
            not_started: { label: 'Not Started', color: 'bg-slate-100 text-slate-600' },
            in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
            completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700' }
          };

          // Check if any skill in this section has passed MCQ
          const hasSectionMcqPassed = sectionSkills.some(skillId => checkMcqPassed(skillId));

          return (
            <Card 
              key={section.id}
              className={`border-0 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden bg-gradient-to-r ${gradient}`}
              onClick={() => setExpandedSection(section)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm leading-tight truncate">
                    {section.title}
                  </h3>
                  <p className="text-xs text-white/80">
                    {sectionProgress.completed}/{sectionProgress.total} sections
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <Badge className="bg-white/20 text-white backdrop-blur-sm text-xs border-white/30">
                    {statusConfig[sectionProgress.status].label}
                  </Badge>
                  {hasSectionMcqPassed && (
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                      PASSED
                    </Badge>
                  )}
                  {hoursSpent > 0 && (
                    <span className="text-white font-bold text-sm bg-white/20 backdrop-blur-sm rounded-md px-2 py-0.5">
                      {hoursSpent.toFixed(1)}h
                    </span>
                  )}
                </div>
                <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 w-28">
                  <span className="text-xs text-white font-semibold">{sectionProgress.percentage}%</span>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
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

      {/* Custom Topics Card - Card #25 */}
      {(() => {
        // Aggregate custom topics from LessonTopicDuration (only from lesson summaries)
        const customTopics = lessonTopicDurations
          .filter(ltd => {
            // Only include topics starting with 'custom_'
            // Exclude numeric-only IDs like '177194', '1771942'
            return ltd.topicId?.startsWith('custom_') && !/^\d+$/.test(ltd.topicId);
          })
          .reduce((acc, ltd) => {
            const existing = acc.find(t => t.topicId === ltd.topicId);
            if (existing) {
              existing.totalMinutes += ltd.durationMinutes;
              existing.lessons.push(ltd);
            } else {
              acc.push({
                topicId: ltd.topicId,
                topicName: ltd.topicName,
                totalMinutes: ltd.durationMinutes,
                lessons: [ltd]
              });
            }
            return acc;
          }, []);

        if (customTopics.length === 0) return null;

        return (
           <Card 
             className="border-0 shadow-sm bg-gradient-to-r from-purple-500 to-indigo-600 cursor-pointer hover:shadow-lg transition-shadow"
             onClick={() => setSelectedCustomTopic({ isViewAll: true, topics: customTopics })}
           >
             <CardContent className="p-6">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm">
                     25
                   </div>
                   <div>
                     <h3 className="font-semibold text-white text-lg">Custom Topics</h3>
                     <p className="text-xs text-white/80">Additional topics covered in lessons</p>
                   </div>
                 </div>
               </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {customTopics.map(topic => (
                  <div
                    key={topic.topicId}
                    className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg p-4 text-center cursor-pointer hover:bg-white/30 transition-colors"
                    onClick={() => setSelectedCustomTopic(topic)}
                  >
                    <p className="text-white font-medium text-sm mb-1 truncate" title={topic.topicName}>
                      {topic.topicName}
                    </p>
                    <p className="text-white/90 text-xs font-semibold">
                      {(topic.totalMinutes / 60).toFixed(1)}h
                    </p>
                    <p className="text-white/70 text-xs mt-1">
                      {topic.lessons.length} lesson{topic.lessons.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Custom Topic Details Dialog */}
      <Dialog open={!!selectedCustomTopic} onOpenChange={() => setSelectedCustomTopic(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            {selectedCustomTopic?.isViewAll ? (
              <>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                    25
                  </div>
                  All Custom Topics
                </DialogTitle>
                <DialogDescription>
                  Overview of all additional topics covered in lessons
                </DialogDescription>
              </>
            ) : (
              <>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                    25
                  </div>
                  {selectedCustomTopic?.topicName}
                </DialogTitle>
                <DialogDescription>
                  Time spent on this custom topic across lessons
                </DialogDescription>
              </>
            )}
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedCustomTopic?.isViewAll ? (
              <div className="space-y-3">
                {selectedCustomTopic?.topics?.map((topic) => (
                  <div 
                    key={topic.topicId}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-purple-300 cursor-pointer transition-colors"
                    onClick={() => setSelectedCustomTopic(topic)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-slate-700">{topic.topicName}</h4>
                      <span className="text-sm font-bold text-[#071739]">{(topic.totalMinutes / 60).toFixed(1)}h</span>
                    </div>
                    <p className="text-xs text-slate-500">{topic.lessons.length} lesson{topic.lessons.length !== 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-[#071739]">
                      {selectedCustomTopic && (selectedCustomTopic.totalMinutes / 60).toFixed(1)}h
                    </p>
                    <p className="text-sm text-slate-600 mt-1">Total time spent</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-700 mb-3">Lesson History</h4>
                  <div className="space-y-2">
                    {selectedCustomTopic?.lessons.map((lesson, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            Lesson {selectedCustomTopic.lessons.length - idx}
                          </p>
                          <p className="text-xs text-slate-500">
                            {lesson.created_date ? moment(lesson.created_date).format('D MMM YYYY') : 'Date not available'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#071739]">
                            {lesson.durationMinutes} min
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
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
            {expandedSection && (() => {
              // Check if section has multiple direct skills (not in groups)
              const directSkillsInSection = expandedSection.topics.filter(t => t.type === 'skill');
              const hasMultipleDirectSkills = directSkillsInSection.length > 1;
              const allSectionSkillsIndependent = directSkillsInSection.length > 0 && directSkillsInSection.every(skill => {
                const progress = getProgressForSkill(skill.id);
                return progress?.progressState === 'independent';
              });

              return (
                <>
                  {isInstructor && hasMultipleDirectSkills && (
                    <div className="flex justify-end mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAll(directSkillsInSection, allSectionSkillsIndependent);
                        }}
                        disabled={updateProgressMutation.isPending}
                        className="text-xs h-7 px-3"
                      >
                        {allSectionSkillsIndependent ? 'Unselect All' : 'Select All'}
                      </Button>
                    </div>
                  )}
                  {expandedSection.topics.map(topic => renderTopic(topic, 0))}
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}