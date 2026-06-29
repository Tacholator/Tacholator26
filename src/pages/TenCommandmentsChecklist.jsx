import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Scroll, RotateCcw, CheckCircle2, Printer } from 'lucide-react';

const commandments = [
  {
    number: 1,
    title: 'Thou Shall Observe at Every Junction',
    text: 'Always look early, look effectively, and only proceed when it is safe. Never assume other road users will stop for you.'
  },
  {
    number: 2,
    title: 'Thou Shall Check Mirrors Before Changing Direction',
    text: 'Before turning, changing lanes, moving position, or slowing down, always check the appropriate mirrors and act on what you see.'
  },
  {
    number: 3,
    title: 'Thou Shall Keep Full Control of Thy Steering',
    text: 'Maintain smooth and accurate steering, keep good lane discipline, and position your vehicle correctly at all times.'
  },
  {
    number: 4,
    title: 'Thou Shall Obey Traffic Lights',
    text: 'Approach traffic lights with anticipation, respond correctly to changing signals, and never proceed unless it is safe and legal to do so.'
  },
  {
    number: 5,
    title: 'Thou Shall Move Off Safely',
    text: 'Before moving away, check mirrors and blind spots, signal when necessary, and ensure no road user will be affected.'
  },
  {
    number: 6,
    title: 'Thou Shall Position Thy Vehicle Correctly',
    text: 'Drive in the correct position on the road, maintain safe distances, and choose the correct lane in good time.'
  },
  {
    number: 7,
    title: 'Thou Shall Maintain Good Vehicle Control',
    text: 'Use the controls smoothly and confidently. Avoid unnecessary stalling and maintain steady control of the vehicle.'
  },
  {
    number: 8,
    title: 'Thou Shall Respect Road Markings',
    text: 'Read and obey all road markings, lane arrows, stop lines, and box junctions, and position yourself correctly.'
  },
  {
    number: 9,
    title: 'Thou Shall Perform Manoeuvres with Observation',
    text: 'During every manoeuvre, prioritise observation over accuracy. Stop and reassess whenever necessary.'
  },
  {
    number: 10,
    title: 'Thou Shall Read and Obey Road Signs',
    text: 'Observe, understand, and act upon all road signs, speed limits, and traffic restrictions.'
  }
];

export default function TenCommandmentsChecklist() {
  const [checked, setChecked] = useState({});

  const toggleCheck = (num) => {
    setChecked(prev => ({ ...prev, [num]: !prev[num] }));
  };

  const checkedCount = commandments.filter(c => checked[c.number]).length;
  const progress = (checkedCount / commandments.length) * 100;
  const allChecked = checkedCount === commandments.length;

  const reset = () => setChecked({});

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-[#071739] flex items-center justify-center">
              <Scroll className="w-6 h-6 text-[#F7B602]" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-[#071739]">Ten Commandments Checklist</h1>
              <p className="text-slate-600 text-sm mt-1">Use this checklist during each lesson to track coverage of key driving principles</p>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <Card className={`border-0 shadow-sm mb-4 transition-colors ${allChecked ? 'bg-gradient-to-r from-emerald-50 to-green-50' : 'bg-white'}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {allChecked ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Scroll className="w-5 h-5 text-[#071739]" />
                )}
                <span className="font-semibold text-[#071739]">
                  {allChecked ? 'All commandments covered!' : `${checkedCount} of ${commandments.length} covered`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="text-slate-600"
                >
                  <Printer className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Print</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reset}
                  disabled={checkedCount === 0}
                  className="text-slate-600"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Checklist Items */}
        <div className="space-y-3">
          {commandments.map((cmd) => {
            const isChecked = !!checked[cmd.number];
            return (
              <Card
                key={cmd.number}
                className={`border-0 shadow-sm overflow-hidden transition-all ${isChecked ? 'ring-1 ring-emerald-300' : ''}`}
              >
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    {/* Number Badge */}
                    <div className={`flex items-center justify-center w-14 shrink-0 transition-colors ${isChecked ? 'bg-emerald-600' : 'bg-gradient-to-br from-[#071739] to-[#0d2a5e]'}`}>
                      <span className={`text-2xl font-bold ${isChecked ? 'text-white' : 'text-[#F7B602]'}`}>{cmd.number}</span>
                    </div>

                    {/* Content + Checkbox */}
                    <div className="p-4 flex-1 flex items-start gap-3">
                      <div className="pt-0.5">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleCheck(cmd.number)}
                          className="w-5 h-5 border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-base lg:text-lg mb-1 transition-colors ${isChecked ? 'text-emerald-700 line-through' : 'text-[#071739]'}`}>
                          {cmd.title}
                        </h3>
                        <p className={`text-sm leading-relaxed transition-colors ${isChecked ? 'text-slate-400' : 'text-slate-600'}`}>
                          {cmd.text}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 mt-6">
          This checklist resets automatically — use it fresh for each lesson.
        </p>
      </div>
    </div>
  );
}