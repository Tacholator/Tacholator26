import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const accentColors = {
  warmBlue: 'bg-blue-50 border-t-blue-400 text-blue-600',
  warmGreen: 'bg-green-50 border-t-green-400 text-green-600',
  warmViolet: 'bg-purple-50 border-t-purple-400 text-purple-600',
  warmOrange: 'bg-orange-50 border-t-orange-400 text-orange-600',
  warmPink: 'bg-pink-50 border-t-pink-400 text-pink-600',
};

export default function StatCard({ title, value, accent = 'warmBlue', onClick }) {
  return (
    <Card
      className={`border-t-4 cursor-pointer hover:shadow-lg transition-shadow ${
        accentColors[accent] || accentColors.warmBlue
      }`}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
      </CardContent>
    </Card>
  );
}