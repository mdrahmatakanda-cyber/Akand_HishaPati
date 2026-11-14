import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

interface PremiumToastProps {
  show: boolean;
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function PremiumToast({ show, message, type, onClose }: PremiumToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-6 fade-in duration-300 border-2 ${type === 'success' ? 'bg-white border-green-500' : 'bg-white border-red-500'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
        {type === 'success' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
      </div>
      <p className={`font-bold text-sm flex-1 ${type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{message}</p>
      <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition"><X size={18} className="text-gray-500" /></button>
    </div>
  );
}