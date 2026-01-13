import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Volume2, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';

export default function AudioPregenStatus({ materialId, sectionId, sectionText }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  // Fetch existing cache entries for this section
  const { data: cacheEntries = [] } = useQuery({
    queryKey: ['audioCache', materialId, sectionId],
    queryFn: async () => {
      const entries = await base44.entities.AudioCache.filter({
        materialId: materialId?.toString(),
        sectionId
      });
      return entries;
    },
    enabled: !!materialId && !!sectionId
  });

  // Generate audio mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      const response = await base44.functions.invoke('pregenerateStudyMaterialAudio', {
        materialId: materialId?.toString(),
        sectionId,
        sectionText
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['audioCache', materialId, sectionId]);
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error('Failed to generate audio:', error);
      setIsGenerating(false);
    }
  });

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  // Count statuses
  const readyCount = cacheEntries.filter(e => e.generationStatus === 'ready').length;
  const failedCount = cacheEntries.filter(e => e.generationStatus === 'failed').length;
  const totalExpected = 4; // female 1.0x, male 1.0x, female 0.8x, female 1.2x

  // Determine overall status
  let status = 'not_generated';
  let statusText = 'Not Generated';
  let statusIcon = <Volume2 className="w-3 h-3" />;
  let statusColor = 'bg-slate-100 text-slate-600';

  if (isGenerating || cacheEntries.some(e => e.generationStatus === 'generating')) {
    status = 'generating';
    statusText = 'Generating...';
    statusIcon = <Loader2 className="w-3 h-3 animate-spin" />;
    statusColor = 'bg-blue-100 text-blue-700';
  } else if (readyCount === totalExpected) {
    status = 'ready';
    statusText = 'Audio Ready';
    statusIcon = <CheckCircle2 className="w-3 h-3" />;
    statusColor = 'bg-emerald-100 text-emerald-700';
  } else if (readyCount > 0) {
    status = 'partial';
    statusText = `${readyCount}/${totalExpected} Ready`;
    statusIcon = <Volume2 className="w-3 h-3" />;
    statusColor = 'bg-amber-100 text-amber-700';
  } else if (failedCount > 0) {
    status = 'failed';
    statusText = 'Generation Failed';
    statusIcon = <AlertCircle className="w-3 h-3" />;
    statusColor = 'bg-rose-100 text-rose-700';
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${statusColor} flex items-center gap-1.5`}>
        {statusIcon}
        {statusText}
      </Badge>
      
      {(status === 'not_generated' || status === 'failed' || status === 'partial') && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="h-7 text-xs"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCcw className="w-3 h-3 mr-1" />
              {status === 'not_generated' ? 'Generate Audio' : 'Retry'}
            </>
          )}
        </Button>
      )}
    </div>
  );
}