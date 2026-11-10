// src/pages/InboxPage.tsx
import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, CheckCircle2, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface InboxProps {
  onBack: () => void;
}

export default function InboxPage({ onBack }: InboxProps) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ডেমু মোডের নোটিফিকেশন
  const demoNotifications = [
    { id: 1, title: "স্বাগতম!", message: "Dream Agro & Fisheries অ্যাপে আপনাকে স্বাগতম।", created_at: new Date().toISOString(), type: 'success', is_read: false },
    { id: 2, title: "স্টক অ্যালার্ট", message: "আপনার কিছু পণ্যের স্টক কমে গেছে। দ্রুত ক্রয় করুন।", created_at: new Date(Date.now() - 3600000).toISOString(), type: 'warning', is_read: false },
    { id: 3, title: "নতুন মেসেজ", message: "আপনার পার্টনার একটি নতুন মেসেজ পাঠিয়েছেন।", created_at: new Date(Date.now() - 7200000).toISOString(), type: 'info', is_read: true },
  ];

  useEffect(() => {
    const fetchNotifications = async () => {
      if (isDemoMode) {
        setNotifications(demoNotifications);
        setLoading(false);
        return;
      }

      if (!activeBusiness?.id) return;

      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('business_id', activeBusiness.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setNotifications(data);
      }
      setLoading(false);
    };

    fetchNotifications();
  }, [isDemoMode, activeBusiness?.id]);

  // নোটিফিকেশন রিড মার্ক করার ফাংশন
  const markAsRead = async (id: string, isRead: boolean) => {
    if (isDemoMode || isRead) return; // ডেমু মোডে বা আগেই পড়া হলে কিছু করবে না

    // অপ্টিমিস্টিক আপডেট (সাথে সাথে UI-তে পরিবর্তন)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));

    // ডাটাবেসে আপডেট
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  // আইকন এবং কালার ম্যাপিং
  const getIconAndColor = (type: string) => {
    switch (type) {
      case 'success': return { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" };
      case 'warning': return { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" };
      case 'error': return { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" };
      default: return { icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-50" };
    }
  };

  // সময় ফরম্যাট করার হেল্পার (যেমন: ১০ মিনিট আগে)
  const timeAgo = (dateString: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000);
    if (diff < 1) return "এইমাত্র";
    if (diff < 60) return `${diff} মিনিট আগে`;
    if (diff < 1440) return `${Math.floor(diff / 60)} ঘন্টা আগে`;
    return `${Math.floor(diff / 1440)} দিন আগে`;
  };

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full">
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Bell size={20} />
            <h1 className="font-bold text-lg">ইনবক্স</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 pb-20">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="animate-spin text-[#0B5C47]" size={32} />
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((item) => {
            const { icon: Icon, color, bg } = getIconAndColor(item.type);
            return (
              <div 
                key={item.id} 
                onClick={() => markAsRead(item.id, item.is_read)}
                className={`p-3 rounded-xl shadow-sm border flex items-start gap-3 transition cursor-pointer ${item.is_read ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-white border-[#D3E4DB]'}`}
              >
                <div className={`p-2 rounded-full ${bg} shrink-0`}>
                  <Icon size={20} className={color} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className={`font-bold text-sm ${item.is_read ? 'text-gray-600' : 'text-[#0F2A3D]'}`}>{item.title}</h3>
                    <span className="text-[10px] text-gray-500">{timeAgo(item.created_at)}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.message}</p>
                </div>
                {!item.is_read && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0"></div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 mt-10">
            <Bell size={48} className="mb-3 opacity-50" />
            <p className="font-bold">কোনো নতুন মেসেজ নেই</p>
          </div>
        )}
      </main>
    </div>
  );
}