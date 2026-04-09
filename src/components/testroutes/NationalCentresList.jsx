import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Video, Plus, X, Check, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function CentreCard({ centre, onSave }) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(centre.youtubeUrl || '');

  const handleSave = () => {
    const videoId = extractYouTubeId(url);
    onSave(centre.id, url.trim(), videoId);
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-[#F7B602] transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <MapPin className="w-4 h-4 text-[#F7B602] shrink-0" />
        <span className="text-sm font-medium text-[#071739] truncate">{centre.name}</span>
      </div>

      {editing ? (
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube URL..."
            className="text-xs h-8"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Button size="sm" onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600 h-8 px-2 gap-1">
            <Check className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setEditing(false); setUrl(centre.youtubeUrl || ''); }} className="h-8 px-2">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          {centre.youtubeVideoId ? (
            <Badge className="bg-emerald-100 text-emerald-700 text-xs gap-1">
              <Video className="w-3 h-3" /> Video Added
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-slate-400">No Video</Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditing(true)}
            className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {centre.youtubeVideoId ? 'Edit Video' : 'Add Video'}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function NationalCentresList() {
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: centres = [], isLoading } = useQuery({
    queryKey: ['nationalTestCentres'],
    queryFn: () => base44.entities.NationalTestCentre.list()
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, youtubeUrl, youtubeVideoId }) =>
      base44.entities.NationalTestCentre.update(id, { youtubeUrl, youtubeVideoId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nationalTestCentres'] });
      toast({ title: 'Saved', description: 'Video link updated.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save.', variant: 'destructive' });
    }
  });

  const sorted = [...centres].sort((a, b) => a.name.localeCompare(b.name));
  const filtered = sorted.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const withVideo = centres.filter(c => c.youtubeVideoId).length;

  if (isLoading) {
    return <div className="text-center py-12 text-slate-500">Loading test centres...</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">{centres.length} test centres</Badge>
        <Badge className="bg-emerald-100 text-emerald-800 text-sm px-3 py-1">{withVideo} with video</Badge>
        <Badge variant="outline" className="text-sm px-3 py-1">{centres.length - withVideo} no video</Badge>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search test centres..."
          className="pl-9"
        />
      </div>

      {centres.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-2">No test centres loaded yet.</p>
            <p className="text-sm text-slate-400">The list of all England & Wales test centres will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(centre => (
            <CentreCard
              key={centre.id}
              centre={centre}
              onSave={(id, youtubeUrl, youtubeVideoId) =>
                updateMutation.mutate({ id, youtubeUrl, youtubeVideoId })
              }
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-slate-500 py-8">No results for "{search}"</p>
          )}
        </div>
      )}
    </div>
  );
}