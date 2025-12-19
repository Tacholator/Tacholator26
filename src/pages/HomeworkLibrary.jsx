import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Trash2, Edit, FileText, CheckSquare, Image, Video, Music, Link2, Paperclip, Loader2, Library, Copy, ClipboardList } from 'lucide-react';
import moment from 'moment';
import HomeworkFormatForm from '@/components/homework/HomeworkFormatForm';

const FORMAT_OPTIONS = [
  { value: 'text', label: 'Text', icon: FileText },
  { value: 'checklist', label: 'Checklist', icon: CheckSquare },
  { value: 'image', label: 'Image', icon: Image },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'audio', label: 'Audio', icon: Music },
  { value: 'link', label: 'Link', icon: Link2 },
  { value: 'attachment', label: 'Attachment', icon: Paperclip },
];

export default function HomeworkLibrary() {
  const [search, setSearch] = useState('');
  const [filterFormat, setFilterFormat] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    templateName: '',
    templateDescription: '',
    formatType: 'text',
    formatPayload: {}
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['homeworkTemplates', user?.id],
    queryFn: () => base44.entities.HomeworkTemplate.filter({ instructorId: user.id }),
    enabled: !!user?.id
  });

  const { data: assignedHomework = [], isLoading: isLoadingHomework } = useQuery({
    queryKey: ['assignedHomework', user?.id],
    queryFn: async () => {
      const items = await base44.entities.HomeworkItem.filter({ instructorId: user.id }, '-created_date');
      return items;
    },
    enabled: !!user?.id
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['pupils'],
    queryFn: () => base44.entities.Pupil.list(),
    enabled: !!user?.id
  });

  const createMutation = useMutation({
    mutationFn: (data) => editingTemplate
      ? base44.entities.HomeworkTemplate.update(editingTemplate.id, data)
      : base44.entities.HomeworkTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['homeworkTemplates']);
      setShowModal(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HomeworkTemplate.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['homeworkTemplates'])
  });

  const duplicateMutation = useMutation({
    mutationFn: (template) => base44.entities.HomeworkTemplate.create({
      ...template,
      id: undefined,
      templateName: `${template.templateName} (Copy)`
    }),
    onSuccess: () => queryClient.invalidateQueries(['homeworkTemplates'])
  });

  const deleteHomeworkMutation = useMutation({
    mutationFn: (id) => base44.entities.HomeworkItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['assignedHomework'])
  });

  const resetForm = () => {
    setFormData({ templateName: '', templateDescription: '', formatType: 'text', formatPayload: {} });
    setEditingTemplate(null);
  };

  const openEditModal = (template) => {
    setEditingTemplate(template);
    setFormData({
      templateName: template.templateName,
      templateDescription: template.templateDescription || '',
      formatType: template.formatType,
      formatPayload: template.formatPayload || {}
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    createMutation.mutate({
      instructorId: user.id,
      templateName: formData.templateName,
      templateDescription: formData.templateDescription,
      formatType: formData.formatType,
      formatPayload: formData.formatPayload,
      isActive: true
    });
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.templateName.toLowerCase().includes(search.toLowerCase());
    const matchesFormat = filterFormat === 'all' || t.formatType === filterFormat;
    return matchesSearch && matchesFormat;
  });

  const getPupilName = (pupilId) => {
    const pupil = pupils.find(p => p.id === pupilId);
    return pupil ? `${pupil.firstName} ${pupil.lastName}` : 'Unknown';
  };

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Library className="w-8 h-8 text-teal-600" />
              Homework Library
            </h1>
            <p className="text-slate-500 mt-1">Manage homework templates and assignments</p>
          </div>
          <Button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>

        {/* Assigned Homework Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Assigned Homework</h2>
          {isLoadingHomework ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
          ) : assignedHomework.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-slate-400">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No homework assigned yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {assignedHomework.map((item) => (
                <Card key={item.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-800 truncate">{item.title}</h3>
                          <Badge className={
                            item.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                            item.status === 'Viewed' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }>
                            {item.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                          <span>Assigned to: <span className="font-medium">{getPupilName(item.pupilId)}</span></span>
                          {item.dueDate && (
                            <>
                              <span>•</span>
                              <span>Due: {moment(item.dueDate).format('D MMM YYYY')}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{moment(item.created_date).format('D MMM YYYY')}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteHomeworkMutation.mutate(item.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Delete assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Templates Section */}
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Homework Templates</h2>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterFormat} onValueChange={setFilterFormat}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formats</SelectItem>
              {FORMAT_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-slate-400">
              <Library className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No templates found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredTemplates.map((template, idx) => {
              const FormatIcon = FORMAT_OPTIONS.find(f => f.value === template.formatType)?.icon || FileText;
              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-teal-50">
                          <FormatIcon className="w-5 h-5 text-teal-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800">{template.templateName}</h3>
                          {template.templateDescription && (
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{template.templateDescription}</p>
                          )}
                          <Badge className="mt-2 bg-slate-100 text-slate-600">{template.formatType}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => duplicateMutation.mutate(template)}
                            className="p-2 text-slate-400 hover:text-teal-600 transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(template)}
                            className="p-2 text-slate-400 hover:text-teal-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(template.id)}
                            className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
        </div>
      </div>
      </div>

      <Dialog open={showModal} onOpenChange={() => { setShowModal(false); resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template Name *</Label>
              <Input
                value={formData.templateName}
                onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                placeholder="e.g., Mirror Checks Practice"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.templateDescription}
                onChange={(e) => setFormData({ ...formData, templateDescription: e.target.value })}
                placeholder="What this template covers..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select
                value={formData.formatType}
                onValueChange={(v) => setFormData({ ...formData, formatType: v, formatPayload: {} })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.icon className="w-4 h-4" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <HomeworkFormatForm
              formatType={formData.formatType}
              payload={formData.formatPayload}
              onChange={(payload) => setFormData({ ...formData, formatPayload: payload })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.templateName || createMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingTemplate ? 'Update' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}