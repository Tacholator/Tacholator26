import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheck } from 'lucide-react';

export default function TestReadiness() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="bg-[#F7B602]/20 p-3 rounded-full">
              <ClipboardCheck className="w-7 h-7 text-[#F7B602]" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#071739]">Test Readiness</h1>
          <p className="text-slate-500 mt-2">Track and assess readiness for the driving test</p>
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-[#071739]">Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500">Test readiness features are being built. Check back soon.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}