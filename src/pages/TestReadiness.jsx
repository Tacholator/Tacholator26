import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardCheck, MapPin, ChevronRight, Plus, Link2, FileText, Video, Paperclip, Trash2, ExternalLink, Upload, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const typeConfig = {
  url: { label: 'Link / URL', icon: Link2, color: 'text-blue-600', bg: 'bg-blue-100' },
  pdf: { label: 'PDF', icon: FileText, color: 'text-rose-600', bg: 'bg-rose-100' },
  video: { label: 'Video', icon: Video, color: 'text-purple-600', bg: 'bg-purple-100' },
  other: { label: 'Other', icon: Paperclip, color: 'text-slate-600', bg: 'bg-slate-100' }
};

export default function TestReadiness() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'url', url: '', description: '' });
  const [uploading, setUploading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const { data: pupilProfile } = useQuery({
    queryKey: ['trPupilProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const byLinkedId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      if (byLinkedId.length > 0) return byLinkedId[0];
      const byEmail = await base44.entities.Pupil.filter({ email: user.email });
      return byEmail.length > 0 ? byEmail[0] : null;
    },
    enabled: !!user?.id
  });

  const isInstructor = user?.role === 'admin';
  const testRoutesAccessEnabled = pupilProfile?.testRoutesAccessEnabled || false;

  // For instructors: fetch their own resources. For learners: fetch their instructor's resources.
  const resourceInstructorId = isInstructor ? user?.id : pupilProfile?.instructorId;

  const { data: resources = [] } = useQuery({
    queryKey: ['testReadinessResources', resourceInstructorId],
    queryFn: () => base44.entities.TestReadinessResource.filter({ instructorId: resourceInstructorId }),
    enabled: !!resourceInstructorId
  });

  const addResourceMutation = useMutation({
    mutationFn: (data) => base44.entities.TestReadinessResource.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['testReadinessResources', resourceInstructorId]);
      setShowAddDialog(false);
      setForm({ title: '', type: 'url', url: '', description: '' });
      toast({ title: 'Resource added' });
    }
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (id) => base44.entities.TestReadinessResource.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['testReadinessResources', resourceInstructorId]);
      toast({ title: 'Resource removed' });
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, url: file_url, title: prev.title || file.name }));
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    addResourceMutation.mutate({ ...form, instructorId: user.id });
  };

  const handleCardClick = (url) => {
    if (url) window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-[#F7B602]/20 p-2 rounded-lg">
                <ClipboardCheck className="w-6 h-6 text-[#F7B602]" />
              </div>
              <h1 className="text-2xl font-bold text-[#071739]">Test Readiness</h1>
            </div>
            <p className="text-slate-500 ml-14">Everything you need to prepare for your driving test.</p>
          </div>
          {isInstructor && (
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Resource
            </Button>
          )}
        </div>

        {/* Navigation Cards */}
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          {/* Test Route Videos card */}
          {(isInstructor || testRoutesAccessEnabled) && (
            <Card
              onClick={() => navigate(isInstructor ? '/InstructorTestRoutes' : '/LearnerTestRoutes')}
              className="cursor-pointer border-2 border-blue-200 bg-blue-50 hover:shadow-md transition-all duration-200"
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl shrink-0 bg-blue-100">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#071739]">Test Route Videos</p>
                  <p className="text-sm text-slate-500 mt-0.5 leading-snug">Watch walkthroughs of local driving test routes.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Resources Section */}
        {(isInstructor || resources.length > 0) && (
          <div>
            <h2 className="text-base font-semibold text-[#071739] mb-3">
              {isInstructor ? 'Resources for Pupils' : 'Resources from Your Instructor'}
            </h2>

            {resources.length === 0 && isInstructor && (
              <Card className="border-2 border-dashed border-slate-200 bg-white">
                <CardContent className="py-10 text-center">
                  <Paperclip className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No resources added yet. Click "Add Resource" to get started.</p>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {resources.map((res) => {
                const cfg = typeConfig[res.type] || typeConfig.other;
                const Icon = cfg.icon;
                return (
                  <Card
                    key={res.id}
                    className="border border-slate-200 bg-white hover:shadow-md transition-all duration-200 cursor-pointer group"
                    onClick={() => handleCardClick(res.url)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${cfg.bg}`}>
                        <Icon className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#071739] truncate">{res.title}</p>
                        {res.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{res.description}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-0.5">{cfg.label}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {res.url && <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />}
                        {isInstructor && (
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteResourceMutation.mutate(res.id); }}
                            className="p-1 rounded text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Resource Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input
                placeholder="e.g. Highway Code Summary"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm(prev => ({ ...prev, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="url">Link / URL</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>URL {form.type === 'pdf' ? '/ File' : ''}</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={form.type === 'url' ? 'https://...' : 'https://... or upload below'}
                  value={form.url}
                  onChange={(e) => setForm(prev => ({ ...prev, url: e.target.value }))}
                  className="flex-1"
                />
                {(form.type === 'pdf' || form.type === 'other') && (
                  <>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Description <span className="text-slate-400">(optional)</span></Label>
              <Textarea
                placeholder="Brief description of this resource..."
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button
                type="submit"
                disabled={addResourceMutation.isPending}
                className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
              >
                {addResourceMutation.isPending ? 'Adding...' : 'Add Resource'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}