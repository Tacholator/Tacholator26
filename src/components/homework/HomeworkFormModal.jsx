import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, FileText, CheckSquare, Image, Video, Music, Link2, Paperclip, Library } from 'lucide-react';
import HomeworkFormatForm from './HomeworkFormatForm';

const FORMAT_OPTIONS = [
  { value: 'text', label: 'Text', icon: FileText },
  { value: 'checklist', label: 'Checklist', icon: CheckSquare },
  { value: 'image', label: 'Image', icon: Image },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'audio', label: 'Audio', icon: Music },
  { value: 'link', label: 'Link', icon: Link2 },
  { value: 'attachment', label: 'Attachment', icon: Paperclip },
];

export default function HomeworkFormModal({ open, onClose, pupilId, instructorId, existingHomework }) {
  const [activeTab, setActiveTab] = useState('new');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    formatType: 'text',
    formatPayload: {},
    dueDate: ''
  });
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['homeworkTemplates', instructorId],
    queryFn: () => base44.entities.HomeworkTemplate.filter({ instructorId, isActive: true }),
    enabled: !!instructorId && open
  });

  useEffect(() => {
    if (existingHomework) {
      setFormData({
        title: existingHomework.title || '',
        description: existingHomework.description || '',
        formatType: existingHomework.formatType || 'text',
        formatPayload: existingHomework.formatPayload || {},
        dueDate: existingHomework.dueDate || ''
      });
    } else {
      setFormData({ title: '', description: '', formatType: 'text', formatPayload: {}, dueDate: '' });
    }
    setSelectedTemplate(null);
    setActiveTab('new');
  }, [existingHomework, open]);

  const createMutation = useMutation({
    mutationFn: (data) => existingHomework 
      ? base44.entities.HomeworkItem.update(existingHomework.id, data)
      : base44.entities.HomeworkItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework', pupilId] });
      onClose();
    }
  });

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setFormData({
      title: template.templateName,
      description: template.templateDescription || '',
      formatType: template.formatType,
      formatPayload: template.formatPayload || {},
      dueDate: ''
    });
  };

  const handleSubmit = () => {
    createMutation.mutate({
      pupilId,
      instructorId,
      templateId: selectedTemplate?.id,
      title: formData.title,
      description: formData.description,
      formatType: formData.formatType,
      formatPayload: formData.formatPayload,
      dueDate: formData.dueDate || undefined,
      status: 'Pending'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingHomework ? 'Edit Homework' : 'Add Homework'}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">Create New</TabsTrigger>
            <TabsTrigger value="template" className="gap-1">
              <Library className="w-4 h-4" />
              From Template
            </TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="space-y-3 mt-4">
            {templates.length === 0 ? (
              <p className="text-center text-slate-400 py-6">No templates saved yet</p>
            ) : (
              templates.map(template => {
                const FormatIcon = FORMAT_OPTIONS.find(f => f.value === template.formatType)?.icon || FileText;
                return (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id 
                        ? 'border-teal-500 bg-teal-50' 
                        : 'hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FormatIcon className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-700">{template.templateName}</p>
                        {template.templateDescription && (
                          <p className="text-sm text-slate-500 truncate">{template.templateDescription}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="new" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Homework title"
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
                instructorId={instructorId}
                onVideoSelect={(video) => {
                  if (!formData.title) setFormData(prev => ({ ...prev, title: video.title }));
                }}
              />

              <div className="space-y-2">
                <Label>Due Date (optional)</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {(activeTab === 'template' && selectedTemplate) && (
          <div className="border-t pt-4 mt-4 space-y-4">
            <p className="text-sm text-slate-500">Customize before assigning:</p>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date (optional)</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.title || createMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (existingHomework ? 'Update' : 'Assign')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}