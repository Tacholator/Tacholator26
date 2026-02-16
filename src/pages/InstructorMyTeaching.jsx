import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardCheck, ArrowRight, FileText, Users, Settings } from 'lucide-react';

export default function InstructorMyTeaching() {
  const [activeTab, setActiveTab] = useState('coursework');

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24 lg:pb-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#071739]">My Teaching</h1>
          <p className="text-slate-600 mt-2">Manage your teaching resources and tools</p>
        </div>

        {/* Tabs for different teaching sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border-b rounded-none w-full justify-start p-0 h-auto mb-6">
            <TabsTrigger 
              value="coursework"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#F7B602] rounded-none"
            >
              <FileText className="w-4 h-4 mr-2" />
              Coursework
            </TabsTrigger>
            <TabsTrigger 
              value="quizzes"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#F7B602] rounded-none"
            >
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Quizzes
            </TabsTrigger>
            <TabsTrigger 
              value="pupils"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#F7B602] rounded-none"
            >
              <Users className="w-4 h-4 mr-2" />
              Pupils
            </TabsTrigger>
            <TabsTrigger 
              value="resources"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#F7B602] rounded-none"
            >
              <Settings className="w-4 h-4 mr-2" />
              Resources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coursework">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Coursework Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Manage coursework topics and assignments</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quizzes">
            <Link to={createPageUrl('AdminDailyQuizzes')}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                        <ClipboardCheck className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-800">Daily Quizzes</h3>
                        <p className="text-sm text-slate-500">Manage quiz questions and schedule</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </TabsContent>

          <TabsContent value="pupils">
            <Link to={createPageUrl('PupilList')}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-800">Manage Pupils</h3>
                        <p className="text-sm text-slate-500">View and manage your pupils</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </TabsContent>

          <TabsContent value="resources">
            <Link to={createPageUrl('InstructorResources')}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                        <Settings className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-800">Resources</h3>
                        <p className="text-sm text-slate-500">Share resources with pupils</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}