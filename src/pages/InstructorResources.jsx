import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Plus,
  FileText,
  Link as LinkIcon,
  Video,
  File,
  Trash2,
  Share2,
  Loader2,
  Upload,
  ExternalLink,
  Users
} from 'lucide-react';

const typeConfig = {
  pdf: { icon: FileText, color: 'bg-red-100 text-red-700', label: 'PDF' },
  link: { icon: LinkIcon, color: 'bg-blue-100 text-blue-700', label: 'Link' },
  video: { icon: Video, color: 'bg-purple-100 text-purple-700', label: 'Video' },
  document: { icon: File, color: 'bg-amber-100 text-amber-700', label: 'Document' }
};

export default function InstructorResources() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', type: 'link', url: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPupils, setSelectedPupils] = useState([]);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['instructorResources'],
    queryFn: () => base44.entities.Resource.list()
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['pupils'],
    queryFn: () => base44.entities.Pupil.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Resource.create({ ...data, instructorId: user?.id, sharedWith: [] }),
    onSuccess: () => {
      queryClient.invalidateQueries(['instructorResources']);
      setShowAddModal(false);
      setFormData({ title: '', description: '', type: 'link', url: '' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Resource.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['instructorResources'])
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Resource.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['instructorResources'])
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, url: file_url, title: prev.title || file.name }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleShare = (resource) => {
    setSelectedResource(resource);
    setSelectedPupils(resource.sharedWith || []);
    setShowShareModal(true);
  };

  const handleSaveShare = async () => {
    await updateMutation.mutateAsync({ 
      id: selectedResource.id, 
      data: { sharedWith: selectedPupils } 
    });
    setShowShareModal(false);
  };

  const togglePupil = (pupilId) => {
    setSelectedPupils(prev => 
      prev.includes(pupilId) 
        ? prev.filter(id => id !== pupilId)
        : [...prev, pupilId]
    );
  };

  const myResources = resources.filter(r => r.instructorId === user?.id || r.created_by === user?.email);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Resources</h1>
            <p className="text-slate-500 mt-1">Upload and share learning materials with your pupils</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Resource
          </Button>
        </div>

        {/* Resources Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : myResources.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No resources yet. Add your first resource!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myResources.map((resource, idx) => {
              const config = typeConfig[resource.type] || typeConfig.link;
              const Icon = config.icon;
              const sharedCount = resource.sharedWith?.length || 0;
              
              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-800 truncate">{resource.title}</h3>
                          <Badge className={`${config.color} mt-1`}>{config.label}</Badge>
                        </div>
                      </div>
                      
                      {resource.description && (
                        <p className="text-sm text-slate-500 mb-3 line-clamp-2">{resource.description}</p>
                      )}
                      
                      {sharedCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
                          <Users className="w-3 h-3" />
                          Shared with {sharedCount} pupil{sharedCount !== 1 ? 's' : ''}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                        {resource.url && (
                          <a href={resource.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="gap-1">
                              <ExternalLink className="w-3 h-3" />
                              Open
                            </Button>
                          </a>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => handleShare(resource)}
                        >
                          <Share2 className="w-3 h-3" />
                          Share
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-rose-500 hover:text-rose-700 ml-auto"
                          onClick={() => deleteMutation.mutate(resource.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Resource Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Resource title"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>URL or Upload File</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
              />
              <div className="text-center text-sm text-slate-400 py-1">or</div>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                />
                <Button variant="outline" className="w-full gap-2" disabled={isUploading}>
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button 
              onClick={() => createMutation.mutate(formData)} 
              disabled={!formData.title || createMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Resource'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Resource</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-500 mb-4">
              Select pupils to share "{selectedResource?.title}" with:
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pupils.length === 0 ? (
                <p className="text-slate-400 text-sm">No pupils found</p>
              ) : (
                pupils.map(pupil => (
                  <div 
                    key={pupil.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer"
                    onClick={() => togglePupil(pupil.id)}
                  >
                    <Checkbox checked={selectedPupils.includes(pupil.id)} />
                    <div className="flex-1">
                      <p className="font-medium text-slate-700">{pupil.firstName} {pupil.lastName}</p>
                      <p className="text-xs text-slate-400">{pupil.email}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareModal(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveShare}
              disabled={updateMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}