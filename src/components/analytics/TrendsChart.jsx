import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function TrendsChart({ data }) {
  const series = data.series || [];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={series}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="firstTimePassRate" stroke="#10b981" name="First-time pass rate" />
        <Line type="monotone" dataKey="overallPassRate" stroke="#3b82f6" name="Overall pass rate" />
        <Line type="monotone" dataKey="dropoffRate" stroke="#f97316" name="Drop-off rate" />
        <Line type="monotone" dataKey="noShowRate" stroke="#ef4444" name="No-show rate" />
      </LineChart>
    </ResponsiveContainer>
  );
}