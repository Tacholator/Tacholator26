import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Award, TrendingUp, Clock, FileText, Lightbulb, ArrowRight } from 'lucide-react';

export default function LearnerMyLearning() {
  const [activeTab, setActiveTab] = useState('coursework');

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24 lg:pb-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#071739]">My Learning</h1>
          <p className="text-slate-600 mt-2">Track your learning progress and achievements</p>
        </div>

        {/* Tabs for different learning sections */}
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
              value="progress"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#F7B602] rounded-none"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Progress
            </TabsTrigger>
            <TabsTrigger 
              value="skills"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#F7B602] rounded-none"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Skills
            </TabsTrigger>
            <TabsTrigger 
              value="homework"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#F7B602] rounded-none"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Homework
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coursework">
            <Link to={createPageUrl('CourseWork')}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-800">Coursework</h3>
                        <p className="text-sm text-slate-500">Study driving topics and skills</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </TabsContent>

          <TabsContent value="progress">
            <Link to={createPageUrl('LearnerProgress')}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-800">Learning Progress</h3>
                        <p className="text-sm text-slate-500">Track your overall progress</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </TabsContent>

          <TabsContent value="skills">
            <Link to={createPageUrl('LearnerSkills')}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Lightbulb className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-800">My Skills</h3>
                        <p className="text-sm text-slate-500">View your driving skills progress</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </TabsContent>

          <TabsContent value="homework">
            <Link to={createPageUrl('LearnerHomework')}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-800">Homework</h3>
                        <p className="text-sm text-slate-500">View your assigned homework</p>
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