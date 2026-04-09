import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Video, Search, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function CentreCard({ centre, videoCount }) {
  return (
    <Link to={`/AdminNationalCentreDetail?centre=${encodeURIComponent(centre.name)}`} className="block">
    <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-[#F7B602] hover:shadow-md transition-all cursor-pointer group">
      <div className="flex items-center gap-3 min-w-0">
        <MapPin className="w-4 h-4 text-[#F7B602] shrink-0" />
        <span className="text-sm font-medium text-[#071739] truncate">{centre.name}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {videoCount > 0 ? (
          <Badge className="bg-emerald-100 text-emerald-700 text-xs gap-1">
            <Video className="w-3 h-3" /> {videoCount} {videoCount === 1 ? 'video' : 'videos'}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-slate-400">No videos</Badge>
        )}
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#F7B602] transition-colors" />
      </div>
    </div>
    </Link>
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

  const { data: allRoutes = [] } = useQuery({
    queryKey: ['allTestRoutes'],
    queryFn: () => base44.entities.TestRoute.list()
  });

  // Count routes with videos per centre name
  const videoCountByCity = allRoutes.reduce((acc, r) => {
    if (r.city && r.youtubeVideoId) {
      acc[r.city] = (acc[r.city] || 0) + 1;
    }
    return acc;
  }, {});

  const sorted = [...centres].sort((a, b) => a.name.localeCompare(b.name));
  const filtered = sorted.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const withVideo = sorted.filter(c => (videoCountByCity[c.name] || 0) > 0).length;

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
            <CentreCard key={centre.id} centre={centre} videoCount={videoCountByCity[centre.name] || 0} />
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-slate-500 py-8">No results for "{search}"</p>
          )}
        </div>
      )}
    </div>
  );
}