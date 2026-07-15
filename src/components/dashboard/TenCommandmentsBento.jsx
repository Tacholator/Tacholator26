import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Scroll } from 'lucide-react';

const commandments = [
  { number: 1, title: 'Observe at Every Junction', text: 'Always look early, look effectively, and only proceed when it is safe. Never assume other road users will stop for you.' },
  { number: 2, title: 'Check Mirrors Before Changing Direction', text: 'Before turning, changing lanes, moving position, or slowing down, always check the appropriate mirrors and act on what you see.' },
  { number: 3, title: 'Keep Full Control of Thy Steering', text: 'Maintain smooth and accurate steering, keep good lane discipline, and position your vehicle correctly at all times.' },
  { number: 4, title: 'Obey Traffic Lights', text: 'Approach traffic lights with anticipation, respond correctly to changing signals, and never proceed unless it is safe and legal to do so.' },
  { number: 5, title: 'Move Off Safely', text: 'Before moving away, check mirrors and blind spots, signal when necessary, and ensure no road user will be affected.' },
  { number: 6, title: 'Position Thy Vehicle Correctly', text: 'Drive in the correct position on the road, maintain safe distances, and choose the correct lane in good time.' },
  { number: 7, title: 'Maintain Good Vehicle Control', text: 'Use the controls smoothly and confidently. Avoid unnecessary stalling and maintain steady control of the vehicle.' },
  { number: 8, title: 'Respect Road Markings', text: 'Read and obey all road markings, lane arrows, stop lines, and box junctions, and position yourself correctly.' },
  { number: 9, title: 'Perform Manoeuvres with Observation', text: 'During every manoeuvre, prioritise observation over accuracy. Stop and reassess whenever necessary.' },
  { number: 10, title: 'Read and Obey Road Signs', text: 'Observe, understand, and act upon all road signs, speed limits, and traffic restrictions.' }
];

export default function TenCommandmentsBento() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Scroll className="w-5 h-5 text-[#071739]" />
          <h3 className="text-lg font-semibold text-[#071739]">Ten Commandments</h3>
        </div>
        <Link to={createPageUrl('TenCommandments')} className="text-xs font-medium text-[#071739] underline underline-offset-2 hover:text-[#F7B602] transition-colors">
          View all
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
        {commandments.map((cmd) => (
          <Link
            key={cmd.number}
            to={createPageUrl('TenCommandments')}
            className="flex-none w-36 h-36 snap-start rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-200 p-4 flex flex-col items-center justify-center text-center hover:ring-2 hover:ring-[#071739] transition-all shadow-sm"
          >
            <div className="w-9 h-9 rounded-full bg-[#071739] flex items-center justify-center mb-2">
              <span className="text-sm font-bold text-[#F7B602]">{cmd.number}</span>
            </div>
            <p className="text-xs font-semibold text-[#071739] leading-tight">{cmd.title}</p>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}