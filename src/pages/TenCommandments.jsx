import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Scroll } from 'lucide-react';

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

export default function TenCommandments() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-[#071739] flex items-center justify-center">
              <Scroll className="w-6 h-6 text-[#F7B602]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#071739]">Ten Commandments</h1>
              <p className="text-slate-600 text-sm mt-1">The Ten Commandments of Passing Your Driving Test</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {commandments.map((cmd) => (
            <Card key={cmd.number} className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="flex">
                  <div className="flex items-center justify-center w-16 shrink-0 bg-gradient-to-br from-[#071739] to-[#0d2a5e]">
                    <span className="text-3xl font-bold text-[#F7B602]">{cmd.number}</span>
                  </div>
                  <div className="p-5 flex-1">
                    <h3 className="font-semibold text-lg text-[#071739] mb-1">{cmd.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{cmd.text}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}