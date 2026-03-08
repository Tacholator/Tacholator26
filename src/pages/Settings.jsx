import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AudioSettingsContent from '@/components/account/AudioSettingsContent';

export default function Settings() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Link to={createPageUrl('ProfileSettings')}>
          <button className="flex items-center gap-2 mb-6 text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
        </Link>

        <h1 className="text-3xl font-bold text-slate-800 mb-2">Settings</h1>
        <p className="text-slate-500 mb-8">Manage your app preferences</p>

        <Tabs defaultValue="audio">
          <TabsList className="w-full">
            <TabsTrigger value="audio" className="flex-1 flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Audio
            </TabsTrigger>
          </TabsList>
          <TabsContent value="audio" className="mt-4">
            <AudioSettingsContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}