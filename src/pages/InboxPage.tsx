import { ArrowLeft, Bell, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';

interface InboxProps {
  onBack: () => void;
}

export default function InboxPage({ onBack }: InboxProps) {
  const notifications = [
    { id: 1, title: "স্বাগতম!", desc: "Dream Agro & Fisheries অ্যাপে আপনাকে স্বাগতম।", time: "১০ মিনিট আগে", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
    { id: 2, title: "স্টক অ্যালার্ট", desc: "আপনার কিছু পণ্যের স্টক কমে গেছে। দ্রুত ক্রয় করুন।", time: "১ ঘন্টা আগে", icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" },
    { id: 3, title: "নতুন মেসেজ", desc: "আপনার পার্টনার একটি নতুন মেসেজ পাঠিয়েছেন।", time: "২ ঘন্টা আগে", icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-50" },
  ];

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
        {notifications.map((item) => (
          <div key={item.id} className="bg-white p-3 rounded-xl shadow-sm border border-[#D3E4DB] flex items-start gap-3">
            <div className={`p-2 rounded-full ${item.bg} shrink-0`}>
              <item.icon size={20} className={item.color} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-sm text-[#0F2A3D]">{item.title}</h3>
                <span className="text-[10px] text-gray-500">{item.time}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}