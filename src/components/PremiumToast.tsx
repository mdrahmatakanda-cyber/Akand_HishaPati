import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

interface PremiumToastProps {
  show: boolean;
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function PremiumToast({ show, message, type, onClose }: PremiumToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3200);
      return () => clearTimeout(timer);
    }
  }, [show, message, type, onClose]);

  if (!show) return null;

  const isSuccess = type === 'success';

  return (
    <>
      <style>{`
        @keyframes toastShrink {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>

      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-md pointer-events-auto animate-in slide-in-from-top-5 fade-in duration-300">
        <div
          className={`relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-xl border shadow-[0_20px_45px_-12px_rgba(10,37,64,0.38)] ${
            isSuccess ? 'border-emerald-200/90' : 'border-red-200/90'
          }`}
        >
          {/* উপরের প্রিমিয়াম গ্রেডিয়েন্ট লাইন */}
          <div
            className={`h-1 w-full ${
              isSuccess
                ? 'bg-gradient-to-r from-[#0B5C47] via-[#10B981] to-[#26C6DA]'
                : 'bg-gradient-to-r from-[#DC2626] via-[#EF4444] to-[#F59E0B]'
            }`}
          />

          <div className="p-3.5 flex items-center gap-3">
            {/* গ্লোয়িং আইকন ব্যাজ */}
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 p-1 ${
                isSuccess ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'bg-red-50 ring-1 ring-red-200'
              }`}
            >
              <div
                className={`w-full h-full rounded-xl flex items-center justify-center text-white shadow-md ${
                  isSuccess
                    ? 'bg-gradient-to-br from-[#10B981] to-[#0B5C47] shadow-emerald-600/30'
                    : 'bg-gradient-to-br from-[#EF4444] to-[#B91C1C] shadow-red-600/30'
                }`}
              >
                {isSuccess ? <CheckCircle2 size={20} strokeWidth={2.4} /> : <AlertTriangle size={20} strokeWidth={2.4} />}
              </div>
            </div>

            {/* টাইটেল ও মেসেজ */}
            <div className="flex-1 min-w-0">
              <span
                className={`inline-block text-[10px] font-black tracking-wide px-2 py-0.5 rounded-full mb-1 ${
                  isSuccess ? 'bg-emerald-100/80 text-[#0B5C47]' : 'bg-red-100/80 text-red-700'
                }`}
              >
                {isSuccess ? 'সফল হয়েছে' : 'সতর্কতা / সমস্যা'}
              </span>
              <p className="font-bold text-[13px] leading-snug text-[#0F2A3D] break-words">
                {message}
              </p>
            </div>

            {/* ক্লোজ বাটন */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-gray-100/80 hover:bg-gray-200 text-gray-500 hover:text-gray-800 active:scale-90 transition shrink-0"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* নিচের অটো-ক্লোজ প্রগ্রেস বার */}
          <div className="h-[3px] w-full bg-gray-100 overflow-hidden">
            <div
              key={`${message}-${type}`}
              className={`h-full w-full origin-left ${
                isSuccess
                  ? 'bg-gradient-to-r from-[#0B5C47] to-[#10B981]'
                  : 'bg-gradient-to-r from-[#DC2626] to-[#F59E0B]'
              }`}
              style={{ animation: 'toastShrink 3.2s linear forwards' }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export function showAppToast(message: string, type: 'success' | 'error' = 'success') {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type } }));
}

export function GlobalToast() {
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.message) {
        setToast({ show: true, message: detail.message, type: detail.type || 'success' });
      }
    };
    window.addEventListener('app-toast', handler);
    return () => window.removeEventListener('app-toast', handler);
  }, []);

  const handleClose = useCallback(() => {
    setToast(prev => ({ ...prev, show: false }));
  }, []);

  return <PremiumToast show={toast.show} message={toast.message} type={toast.type} onClose={handleClose} />;
}