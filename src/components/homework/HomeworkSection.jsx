import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, BookOpen, Calendar, Trash2, CheckCircle2, FileText, CheckSquare, Image, Video, Music, Link2, Paperclip, Save, GraduationCap } from 'lucide-react';
import moment from 'moment';
import HomeworkFormModal from './HomeworkFormModal';
import CourseWorkAssignmentModal from './CourseWorkAssignmentModal';
import { courseWorkTopics } from '@/components/coursework/topicIndex';

const FORMAT_ICONS = {
  text: FileText,
  checklist: CheckSquare,
  image: Image,
  video: Video,
  audio: Music,
  link: Link2,
  attachment: Paperclip
};

export default function HomeworkSection({ pupilId, instructorId, homework = [] }) {
  const [showModal, setShowModal] = useState(false);
  const [editingHomework, setEditingHomework] = useState(null);
  const [showCourseWorkModal, setShowCourseWorkModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HomeworkItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['homework', pupilId] })
  });

  const saveTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.HomeworkTemplate.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['homeworkTemplates'] })
  });

  const assignCourseWorkMutation = useMutation({
    mutationFn: async ({ topicId, topicTitle, dueDate, instructions }) => {
      return await base44.entities.HomeworkItem.create({
        pupilId,
        instructorId,
        title: `Coursework: ${topicTitle}`,
        description: instructions || `Complete the assigned coursework on ${topicTitle}`,
        formatType: 'link',
        formatPayload: {
          url: `/course-work?topicId=${topicId}`,
          topicId: topicId
        },
        dueDate: dueDate || null,
        status: 'Pending'
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['homework', pupilId] })
  });

  const handleAssignCourseWork = (topic) => {
    setSelectedTopic(topic);
    setShowCourseWorkModal(true);
  };

  const handleConfirmAssign = ({ topicId, topicTitle, dueDate, instructions }) => {
    const resolvedTopicId = topicId ?? selectedTopic?.topicId;
    const resolvedTopicTitle = topicTitle ?? selectedTopic?.title;
    if (resolvedTopicId && resolvedTopicTitle) {
      assignCourseWorkMutation.mutate({
        topicId: resolvedTopicId,
        topicTitle: resolvedTopicTitle,
        dueDate,
        instructions
      });
    }
    setShowCourseWorkModal(false);
    setSelectedTopic(null);
  };

  const handleSaveAsTemplate = (item) => {
    saveTemplateMutation.mutate({
      instructorId,
      templateName: item.title,
      templateDescription: item.description,
      formatType: item.formatType || 'text',
      formatPayload: item.formatPayload || {},
      isActive: true
    });
  };

  const pendingHomework = homework.filter(h => h.status !== 'Completed');
  const completedHomework = homework.filter(h => h.status === 'Completed');

  const renderHomeworkCard = (item, isCompleted = false) => {
    const FormatIcon = FORMAT_ICONS[item.formatType] || FileText;
    
    return (
      <Card key={item.id} className={`border-0 shadow-sm ${isCompleted ? 'bg-slate-50/50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 rounded-lg bg-slate-100">
                <FormatIcon className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1">
                <h4 className={`font-medium ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                  {item.title}
                </h4>
                {item.description && (
                  <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span>Assigned {moment(item.created_date).format('D MMM')}</span>
                  {item.dueDate && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <Calendar className="w-3 h-3" />
                      Due {moment(item.dueDate).format('D MMM')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                {isCompleted ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Done</> : item.status || 'Pending'}
              </Badge>
              <button
                onClick={() => handleSaveAsTemplate(item)}
                className="p-1 text-slate-400 hover:text-teal-600 transition-colors"
                title="Save as template"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteMutation.mutate(item.id)}
                className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-500" />
          Homework
        </h3>
        <div className="flex gap-2">
          <Button onClick={() => { setEditingHomework(null); setShowModal(true); }} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Add Homework
          </Button>
          <Button onClick={() => setShowCourseWorkModal(true)} size="sm" className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]">
            <GraduationCap className="w-4 h-4 mr-1" />
            Assign Coursework
          </Button>
        </div>
      </div>

      {homework.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No homework assigned yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingHomework.map(item => renderHomeworkCard(item, false))}
          {completedHomework.map(item => renderHomeworkCard(item, true))}
        </div>
      )}

      <HomeworkFormModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingHomework(null); }}
        pupilId={pupilId}
        instructorId={instructorId}
        existingHomework={editingHomework}
      />

      <CourseWorkAssignmentModal
        open={showCourseWorkModal}
        onClose={() => {
          setShowCourseWorkModal(false);
          setSelectedTopic(null);
        }}
        topic={selectedTopic}
        topics={courseWorkTopics}
        onAssign={handleConfirmAssign}
        singlePupil={true}
      />
    </div>
  );
}