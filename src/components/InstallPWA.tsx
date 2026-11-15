import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

export default function InstallPWA() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (isIosDevice) {
      setShowBanner(true);
    }

    const timer = setTimeout(() => {
      setShowBanner(false);
    }, 60000); // ১ মিনিট পর হাইড হবে

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      alert('ইনস্টল করতে: Share আইকনে ট্যাপ করুন → "Add to Home Screen" সিলেক্ট করুন।');
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white border border-gray-200 shadow-2xl rounded-2xl p-4 z-[9999] animate-in slide-in-from-bottom duration-500">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0B5C47] rounded-xl flex items-center justify-center text-white shrink-0">
            <Download size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-800">মোবাইলে অ্যাপ ইনস্টল করুন</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">ওয়েবসাইটের চেয়ে মোবাইলে বেশি সুবিধাজনক</p>
          </div>
        </div>
        <button onClick={() => setShowBanner(false)} className="text-gray-400 p-1">
          <X size={16} />
        </button>
      </div>

      <button
        onClick={handleInstallClick}
        className="w-full mt-2 bg-[#0B5C47] text-white py-2.5 rounded-xl font-bold text-sm shadow-md flex justify-center items-center gap-2 active:scale-95 transition"
      >
        {isIOS ? <Share size={16} /> : <Download size={16} />}
        {isIOS ? 'ইনস্টল করার নিয়ম দেখুন' : 'অ্যাপ ইনস্টল করুন'}
      </button>
    </div>
  );
}