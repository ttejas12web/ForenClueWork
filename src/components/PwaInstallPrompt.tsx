import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';

export const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if app is already installed/standalone
    const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      ('standalone' in window.navigator && (window.navigator as any).standalone === true);
    setIsStandalone(isAppStandalone);

    if (isAppStandalone) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // If it's iOS and not standalone, show prompt after a short delay
    if (isIosDevice) {
      const hasDismissed = localStorage.getItem('forenclue_pwa_dismissed');
      if (!hasDismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }

    // Android/Chrome install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const hasDismissed = localStorage.getItem('forenclue_pwa_dismissed');
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('forenclue_pwa_dismissed', 'true');
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex flex-col space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2">
          <button onClick={handleDismiss} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex items-start space-x-3 pr-4">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Install ForenClue App</h4>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              Add ForenClue to your home screen for quick access and full screen experience.
            </p>
          </div>
        </div>

        {isIOS ? (
          <div className="bg-slate-800 rounded-xl p-3 flex flex-col space-y-2 mt-2">
            <div className="flex items-center space-x-2 text-xs">
              <span className="bg-slate-700 h-5 w-5 rounded-md flex items-center justify-center font-bold">1</span>
              <span>Tap the <Share className="h-3 w-3 inline mx-1" /> Share button below</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="bg-slate-700 h-5 w-5 rounded-md flex items-center justify-center font-bold">2</span>
              <span>Select <PlusSquare className="h-3 w-3 inline mx-1" /> Add to Home Screen</span>
            </div>
          </div>
        ) : (
          <button 
            onClick={handleInstallClick}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors mt-2"
          >
            Install Now
          </button>
        )}
      </div>
    </div>
  );
};
