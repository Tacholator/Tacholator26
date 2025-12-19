import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Lock, UserPlus } from 'lucide-react';
import { courseWorkTopics } from '@/components/coursework/topicIndex';
import CourseWorkAssignmentModal from '@/components/homework/CourseWorkAssignmentModal';

const cardColors = [
  'bg-gradient-to-br from-blue-100 to-blue-200',
  'bg-gradient-to-br from-green-100 to-green-200',
  'bg-gradient-to-br from-purple-100 to-purple-200',
  'bg-gradient-to-br from-red-100 to-red-200',
  'bg-gradient-to-br from-indigo-100 to-indigo-200',
  'bg-gradient-to-br from-teal-100 to-teal-200',
  'bg-gradient-to-br from-pink-100 to-pink-200',
  'bg-gradient-to-br from-orange-100 to-orange-200',
  'bg-gradient-to-br from-cyan-100 to-cyan-200',
  'bg-gradient-to-br from-violet-100 to-violet-200',
  'bg-gradient-to-br from-emerald-100 to-emerald-200',
  'bg-gradient-to-br from-rose-100 to-rose-200',
  'bg-gradient-to-br from-sky-100 to-sky-200',
  'bg-gradient-to-br from-lime-100 to-lime-200',
  'bg-gradient-to-br from-fuchsia-100 to-fuchsia-200',
  'bg-gradient-to-br from-amber-100 to-amber-200',
  'bg-gradient-to-br from-slate-100 to-slate-200',
  'bg-gradient-to-br from-blue-200 to-cyan-200',
  'bg-gradient-to-br from-green-200 to-teal-200',
  'bg-gradient-to-br from-purple-200 to-pink-200',
  'bg-gradient-to-br from-red-200 to-orange-200',
  'bg-gradient-to-br from-indigo-200 to-blue-300',
  'bg-gradient-to-br from-teal-200 to-emerald-200',
  'bg-gradient-to-br from-pink-200 to-rose-200',
  'bg-gradient-to-br from-yellow-100 to-amber-200',
  'bg-gradient-to-br from-gray-100 to-gray-200',
  'bg-gradient-to-br from-cyan-200 to-sky-300'
];

export default function CourseWork() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupil } = useQuery({
    queryKey: ['currentPupil', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const pupils = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      return pupils.length > 0 ? pupils[0] : null;
    },
    enabled: !!user?.id && user?.role === 'user'
  });

  const { data: accessList = [] } = useQuery({
    queryKey: ['pupilTopicAccess', pupil?.id],
    queryFn: () => base44.entities.PupilTopicAccess.filter({ pupilId: pupil.id }),
    enabled: !!pupil?.id
  });

  const { data: allPupils = [] } = useQuery({
    queryKey: ['pupils'],
    queryFn: () => base44.entities.Pupil.list(),
    enabled: user?.role === 'admin'
  });

  const isInstructor = user?.role === 'admin';

  const assignHomeworkMutation = useMutation({
    mutationFn: async ({ pupilIds, topicId, includeStudyMaterial, includePracticeQuestions, dueDate, instructions }) => {
      const topic = courseWorkTopics.find(t => t.id === topicId);
      const homeworkItems = [];

      for (const pupilId of pupilIds) {
        if (includeStudyMaterial) {
          homeworkItems.push({
            pupilId,
            instructorId: user.id,
            title: `Study: ${topic.title}`,
            description: instructions || `Complete the study material for ${topic.title}`,
            formatType: 'link',
            formatPayload: { url: createPageUrl('CourseWorkDetail') + `?id=${topicId}&subcard=study` },
            dueDate: dueDate || null,
            status: 'Pending'
          });
        }

        if (includePracticeQuestions) {
          homeworkItems.push({
            pupilId,
            instructorId: user.id,
            title: `Practice: ${topic.title}`,
            description: instructions || `Complete the practice questions for ${topic.title}`,
            formatType: 'link',
            formatPayload: { url: createPageUrl('CourseWorkDetail') + `?id=${topicId}&subcard=mcq` },
            dueDate: dueDate || null,
            status: 'Pending'
          });
        }
      }

      return base44.entities.HomeworkItem.bulkCreate(homeworkItems);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['homework']);
    }
  });

  const hasAccess = (topicId, type) => {
    if (isInstructor) return true;
    const access = accessList.find(a => a.topicId === courseWorkTopics.find(t => t.id === topicId)?.topicId && !a.revokedAt);
    if (!access) return false;
    return type === 'study' ? access.grantStudyMaterial : access.grantPracticeQuestions;
  };

  const handleCardClick = (itemId, event) => {
    // Check if clicking on the assign button
    if (event.target.closest('.assign-button')) {
      event.stopPropagation();
      const topic = courseWorkTopics.find(t => t.id === itemId);
      setSelectedTopic(topic);
      setAssignmentModalOpen(true);
      return;
    }
    navigate(createPageUrl('CourseWorkDetail') + `?id=${itemId}`);
  };

  const handleAssignHomework = async ({ includeStudyMaterial, includePracticeQuestions, dueDate, instructions }) => {
    const activePupilIds = allPupils.filter(p => p.status === 'Active').map(p => p.id);
    
    await assignHomeworkMutation.mutateAsync({
      pupilIds: activePupilIds,
      topicId: selectedTopic.id,
      includeStudyMaterial,
      includePracticeQuestions,
      dueDate,
      instructions
    });

    setAssignmentModalOpen(false);
    setSelectedTopic(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="w-8 h-8 text-[#071739]" />
          <h1 className="text-3xl font-bold text-[#071739]">Course Work</h1>
        </div>

        {!isInstructor && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Content Access</p>
                <p className="text-sm text-blue-700 mt-1">
                  Topics with a lock icon require your instructor to assign access. Once assigned, you can view study materials and practice questions.
                </p>
              </div>
            </div>
          </div>
        )}

        {isInstructor && (
          <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-indigo-900">Instructor Mode</p>
                <p className="text-sm text-indigo-700 mt-1">All topics are unlocked for you. Manage pupil access via Pupil Profiles.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {courseWorkTopics.map((item, index) => {
            const hasStudyAccess = hasAccess(item.id, 'study');
            const hasMcqAccess = hasAccess(item.id, 'mcq');
            const isLocked = !isInstructor && !hasStudyAccess && !hasMcqAccess;

            return (
              <Card 
                key={item.id}
                onClick={(e) => handleCardClick(item.id, e)}
                className={`${cardColors[index]} border-0 shadow-sm hover:shadow-md transition-all cursor-pointer aspect-square flex items-center justify-center hover:scale-105 relative group`}
              >
                {isLocked && (
                  <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 shadow-sm">
                    <Lock className="w-4 h-4 text-slate-600" />
                  </div>
                )}
                {isInstructor && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity assign-button">
                    <Button
                      size="sm"
                      className="bg-white/90 hover:bg-white text-slate-700 shadow-md h-7 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTopic(item);
                        setAssignmentModalOpen(true);
                      }}
                    >
                      <UserPlus className="w-3 h-3" />
                      Assign
                    </Button>
                  </div>
                )}
                <CardContent className="p-4 text-center w-full">
                  <div className="text-3xl font-bold text-slate-700 mb-2">{item.id}</div>
                  <div className="text-sm font-medium text-slate-600 leading-tight">{item.title}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        </div>
        </div>

        <CourseWorkAssignmentModal
        open={assignmentModalOpen}
        onClose={() => {
        setAssignmentModalOpen(false);
        setSelectedTopic(null);
        }}
        topic={selectedTopic}
        onAssign={handleAssignHomework}
        />
        </div>
        );
        }