import { ArrowLeft, Database, Save } from 'lucide-react';

interface DemoDataProps {
  onBack: () => void;
}

export default function DemoDataPage({ onBack }: DemoDataProps) {
  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full">
      {/* হেডার */}
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Database size={20} />
            <h1 className="font-bold text-lg">ডেমু ডাটা ম্যানেজার</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-20">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#D3E4DB]">
          <h2 className="font-bold text-[#0B5C47] mb-3 text-sm border-b pb-2">মেইন ড্যাশবোর্ড ডাটা</h2>
          
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-sm font-semibold text-gray-600">ক্যাশ ব্যালেন্স</span>
              <span className="font-bold text-[#166534]">৳ ১,৮০,০০০</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-sm font-semibold text-gray-600">মোট ইনভেস্ট</span>
              <span className="font-bold text-[#1E40AF]">৳ ৫,০০,০০০</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-sm font-semibold text-gray-600">মোট ক্রয়</span>
              <span className="font-bold text-[#0F766E]">৳ ৩,২০,০০০</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-sm font-semibold text-gray-600">আজকের বিক্রি</span>
              <span className="font-bold text-[#1B5E20]">৳ ৮,৫০০</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-sm font-semibold text-gray-600">আজকের খরচ</span>
              <span className="font-bold text-[#DC2626]">৳ ১,২০০</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-600">আজকের বাকি</span>
              <span className="font-bold text-[#15803D]">৳ ০</span>
            </div>
          </div>
        </div>

        <button className="w-full py-3 bg-[#0B5C47] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition">
          <Save size={18} />
          ডাটা সেভ করুন
        </button>
      </main>
    </div>
  );
}