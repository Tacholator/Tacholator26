import React, { useState } from 'react';
import { X, Smartphone } from 'lucide-react';

const APP_STORE_URL = 'https://apps.apple.com/app/tacholator/id6757146033';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=app.base.mobragedrivingschoolced&pcampaignid=web_share';

const DISMISSED_KEY = 'tacholator_app_banner_dismissed';

function isRunningAsPWA() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

export default function AppDownloadBanner() {
  const [dismissed, setDismissed] = useState(() => {
    if (isRunningAsPWA()) return true;
    return localStorage.getItem(DISMISSED_KEY) === 'true';
  });

  if (dismissed) return null;

  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  const handleDownload = () => {
    const url = isIOS ? APP_STORE_URL : isAndroid ? PLAY_STORE_URL : APP_STORE_URL;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-[#071739] text-white px-4 py-2.5 flex items-center gap-3 z-50 relative">
      <Smartphone className="w-5 h-5 text-[#F7B602] shrink-0" />
      <div className="flex-1 text-sm">
        <span className="font-semibold">Get the Tacholator app</span>
        <span className="text-slate-300 ml-1 hidden sm:inline">— a better experience on your phone.</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleDownload}
          className="bg-[#F7B602] text-[#071739] text-xs font-bold px-3 py-1.5 rounded-full hover:bg-[#d99f02] transition-colors"
        >
          Download App
        </button>
        <button onClick={handleDismiss} className="text-slate-400 hover:text-white transition-colors ml-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}