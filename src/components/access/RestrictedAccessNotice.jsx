import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Lock } from 'lucide-react';

export default function RestrictedAccessNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-br from-rose-500 to-red-600 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
            <p className="text-white/70 text-sm">This feature is unavailable</p>
          </div>
          <CardContent className="p-8 text-center bg-white">
            <p className="text-slate-700 text-sm leading-relaxed mb-4">
              Your instructor's subscription is not active or has not been granted full platform access.
            </p>
            <p className="text-slate-600 text-sm mb-6">
              This area requires an active instructor subscription. Please contact your instructor to activate their account.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left">
              <p className="text-xs font-semibold text-red-800 mb-2">Next Steps</p>
              <p className="text-xs text-red-700">Ask your instructor to activate their subscription plan so you can access all learning materials.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}