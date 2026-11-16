import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Loader2, Video, Pencil, X, ExternalLink } from 'lucide-react';
import { youtubeThumbnail } from '@/lib/youtube';
import AdminVideoGroupCard from '@/components/videoresources/AdminVideoGroupCard';

const emptyForm = { title: '', description: '', youtubeUrl: '', category: 'general', order: 0, published: true };

const CATEGORY_ORDER = [
  { key: 'general', label: 'General' },
  { key: 'tell_me', label: 'Tell Me' },
  { key: 'show_me', label: 'Show Me' }
];

export default function AdminVideoResources() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['adminLearnerVideos'],
    queryFn: () => base44.entities.LearnerVideo.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LearnerVideo.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['adminLearnerVideos']); queryClient.invalidateQueries(['learnerVideos']); resetForm(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LearnerVideo.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['adminLearnerVideos']); queryClient.invalidateQueries(['learnerVideos']); resetForm(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LearnerVideo.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['adminLearnerVideos']); queryClient.invalidateQueries(['learnerVideos']); }
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: (updates) => base44.entities.LearnerVideo.bulkUpdate(updates),
    onSuccess: () => { queryClient.invalidateQueries(['adminLearnerVideos']); queryClient.invalidateQueries(['learnerVideos']); }
  });

  const toggleGroup = (group, published) =>
    bulkUpdateMutation.mutate(group.items.map((v) => ({ id: v.id, published })));

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.youtubeUrl) return;
    const id = (form.youtubeUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/) || [])[1];
    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || '',
      youtubeUrl: form.youtubeUrl.trim(),
      youtubeVideoId: id || null,
      category: form.category,
      order: Number(form.order) || 0,
      published: form.published
    };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  };

  const startEdit = (v) => {
    setEditingId(v.id);
    setForm({
      title: v.title || '',
      description: v.description || '',
      youtubeUrl: v.youtubeUrl || '',
      category: v.category || 'general',
      order: v.order || 0,
      published: v.published !== false
    });
  };

  const sorted = [...videos].sort((a, b) => (a.order || 0) - (b.order || 0));
  const grouped = CATEGORY_ORDER
    .map(({ key, label }) => ({
      key,
      label,
      items: sorted.filter((v) => (v.category || 'general') === key)
    }))
    .filter((group) => group.items.length > 0);
  const saving = createMutation.isLoading || updateMutation.isLoading;
  const previewThumb = youtubeThumbnail(form.youtubeUrl);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F7B602] flex items-center justify-center">
            <Video className="w-5 h-5 text-[#071739]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#071739]">Video Resources</h1>
            <p className="text-sm text-slate-500">Add videos that appear on the learner dashboard</p>
          </div>
        </div>

        {/* Form */}
        <Card className="border-t-4 border-t-[#F7B602]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-[#071739]">
              {editingId ? 'Edit video' : 'Add new video'}
            </CardTitle>
            {editingId && (
              <Button variant="ghost" size="sm" onClick={resetForm} className="text-slate-500">
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Tell Me Questions" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="youtubeUrl">YouTube URL *</Label>
                  <Input id="youtubeUrl" value={form.youtubeUrl} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} placeholder="https://youtu.be/..." required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description (optional)" />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="tell_me">Tell Me</SelectItem>
                      <SelectItem value="show_me">Show Me</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="order">Order</Label>
                  <Input id="order" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
                </div>
                <div className="flex items-end gap-3 pb-1">
                  <Switch id="published" checked={form.published} onCheckedChange={(val) => setForm({ ...form, published: val })} />
                  <Label htmlFor="published" className="cursor-pointer">Published</Label>
                </div>
              </div>

              {previewThumb && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <img src={previewThumb} alt="preview" className="w-28 h-16 rounded-md object-cover" />
                  <span className="text-xs text-slate-500">Thumbnail preview</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button type="submit" disabled={saving} className="bg-[#071739] hover:bg-[#0a2142]">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  {editingId ? 'Save changes' : 'Add video'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* List grouped by topic */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[#071739]">Manage videos ({sorted.length})</h2>
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </CardContent>
            </Card>
          ) : grouped.length === 0 ? (
            <Card>
              <CardContent className="text-center py-10">
                <Video className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm text-slate-500">No videos yet. Add your first one above.</p>
              </CardContent>
            </Card>
          ) : (
            grouped.map((group) => (
              <AdminVideoGroupCard
                key={group.key}
                label={group.label}
                videos={group.items}
                onToggleAll={(published) => toggleGroup(group, published)}
              >
                {group.items.map((v) => (
                  <div key={v.id} className="flex items-center gap-4 p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                    <img
                      src={v.youtubeVideoId ? `https://img.youtube.com/vi/${v.youtubeVideoId}/hqdefault.jpg` : youtubeThumbnail(v.youtubeUrl)}
                      alt={v.title}
                      className="w-24 h-14 rounded-md object-cover shrink-0 bg-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{v.title}</p>
                      <p className="text-xs text-slate-500 truncate">{v.description || v.youtubeUrl}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{v.category?.replace('_', ' ')}</span>
                        {v.published === false && (
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Hidden</span>
                        )}
                      </div>
                    </div>
                    <a href={v.youtubeUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-[#071739] transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <Button variant="ghost" size="sm" onClick={() => startEdit(v)} className="text-slate-500 hover:text-[#071739]">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { if (confirm(`Delete "${v.title}"?`)) deleteMutation.mutate(v.id); }}
                      className="text-rose-500 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </AdminVideoGroupCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
}