import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RestrictedAccessMessage from '@/components/access/RestrictedAccessMessage';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  FileText,
  Link as LinkIcon,
  Video,
  File,
  ExternalLink,
  Loader2,
  Car,
  FolderOpen
} from 'lucide-react';

const typeConfig = {
  pdf: { icon: FileText, color: 'bg-red-100 text-red-700', label: 'PDF' },
  link: { icon: LinkIcon, color: 'bg-blue-100 text-blue-700', label: 'Link' },
  video: { icon: Video, color: 'bg-purple-100 text-purple-700', label: 'Video' },
  document: { icon: File, color: 'bg-amber-100 text-amber-700', label: 'Document' }
};

export default function LearnerResources() {
  const navigate = useNavigate();
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupil, isLoading: pupilLoading } = useQuery({
    queryKey: ['myPupilProfile', user?.id, user?.email],
    queryFn: async () => {
      if (!user) return null;
      if (user.id) {
        const byLinkedId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
        if (byLinkedId.length > 0) return byLinkedId[0];
      }
      if (user.email) {
        const allPupils = await base44.entities.Pupil.list();
        const matchingPupil = allPupils.find(p => 
          p.email?.toLowerCase() === user.email.toLowerCase()
        );
        return matchingPupil || null;
      }
      return null;
    },
    enabled: !!user
  });

  const { data: allResources = [], isLoading: resourcesLoading } = useQuery({
    queryKey: ['allResources'],
    queryFn: () => base44.entities.Resource.list(),
    enabled: !!pupil?.id
  });

  // Filter resources shared with this pupil
  const myResources = allResources.filter(r => 
    r.sharedWith?.includes(pupil?.id)
  );

  if (pupilLoading || resourcesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!pupil) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6">
        <Card className="max-w-md text-center p-8">
          <Car className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Account Not Linked</h2>
          <p className="text-slate-500">
            Your account hasn't been linked to a pupil profile yet.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(createPageUrl('LearnerLearningHub'))}
          className="mb-6 gap-2 text-slate-600 hover:text-slate-800 lg:hidden"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-800">Resources</h1>
          <p className="text-slate-500 mt-1">Learning materials shared by your instructor</p>
        </motion.div>

        {myResources.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center text-slate-400">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No resources shared with you yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myResources.map((resource, idx) => {
              const config = typeConfig[resource.type] || typeConfig.link;
              const Icon = config.icon;
              
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
                        <div className={`w-12 h-12 rounded-lg ${config.color} flex items-center justify-center`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800">{resource.title}</h3>
                          <Badge className={`${config.color} mt-1`}>{config.label}</Badge>
                        </div>
                      </div>
                      
                      {resource.description && (
                        <p className="text-sm text-slate-500 mb-4">{resource.description}</p>
                      )}
                      
                      {resource.url && (
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                          <Button className="w-full bg-teal-600 hover:bg-teal-700 gap-2">
                            <ExternalLink className="w-4 h-4" />
                            Open Resource
                          </Button>
                        </a>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}