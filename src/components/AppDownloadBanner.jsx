import React, { useState } from 'react';
import { X, Smartphone } from 'lucide-react';

const APP_STORE_URL = 'https://apps.apple.com/app/tacholator/id6757146033';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=app.base.mobragedrivingschoolced&pcampaignid=web_share';

const DISMISSED_KEY = 'tacholator_app_banner_dismissed';

function isRunningAsPWA() {
  const ua = navigator.userAgent || '';
  // Standalone PWA mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  // Android WebView: contains 'wv' flag or missing 'Chrome' entirely
  const isAndroidWebView = /Android/i.test(ua) && (/wv\)/i.test(ua) || !/Chrome/i.test(ua));
  // iOS WebView: has AppleWebKit but no 'Safari' token
  const isIOSWebView = /iPhone|iPad|iPod/i.test(ua) && /AppleWebKit/i.test(ua) && !/Safari/i.test(ua);
  return isStandalone || isAndroidWebView || isIOSWebView;
}

export default function AppDownloadBanner() {
  return null;

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
    window.location.href = url;
  };

  return (
    <div className="bg-[#F7B602] text-[#071739] px-3 py-1.5 flex items-center gap-2 relative">
      <Smartphone className="w-4 h-4 shrink-0" />
      <span className="flex-1 text-xs font-semibold">Get our app</span>
      <button
        onClick={handleDownload}
        className="bg-[#071739] text-white text-xs font-bold px-3 py-1 rounded-full hover:bg-[#0a2150] transition-colors shrink-0"
      >
        Download
      </button>
      <button onClick={handleDismiss} className="text-[#071739]/60 hover:text-[#071739] transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}