import { useState } from 'react';
import { ArrowLeft, FileText, HelpCircle, Search, Clock, Filter, Plus } from 'lucide-react';
import { toBangla } from '../lib/utils';

interface Props {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function DueKhataPage({ onBack, onNavigate }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full">
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg">বাকির খাতা</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><FileText size={18} /></button>
            <button className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={18} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-3 pb-6">
        
        {/* সামারি কার্ড */}
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="flex-1 bg-[#FEE2E2] border border-red-200 rounded-lg p-2 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-red-600">পাবো</span>
              <span className="font-black text-red-600 mt-1">{toBangla(0)} ৳</span>
            </div>
            <div className="flex-1 bg-[#DCFCE7] border border-green-200 rounded-lg p-2 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-green-600">দিবো</span>
              <span className="font-black text-green-600 mt-1">{toBangla(0)} ৳</span>
            </div>
          </div>
          <div className="text-center text-sm font-bold text-gray-700 mt-1">
            বাকি পাবো/দিবো হিসাবের পর সর্বমোট পাবো: <span className="text-red-500">{toBangla(0)} ৳</span>
          </div>
          <button onClick={() => onNavigate('due_history')} className="mx-auto mt-1 flex items-center gap-1 border border-[#1E88E5] text-[#1E88E5] px-3 py-1 rounded-full text-xs font-bold bg-white shadow-sm active:scale-95 transition">
            <Clock size={14}/> বাকির ইতিহাস
          </button>
        </div>

        {/* সার্চ ও ফিল্টার */}
        <div className="flex gap-2 items-center">
          <div className="flex-1 bg-white border border-gray-300 rounded-lg px-2.5 py-2 flex items-center gap-2 shadow-sm focus-within:border-[#0B5C47]">
            <Search size={18} className="text-gray-400" />
            <input type="text" placeholder="খুঁজুন (নাম, মোবাইল)" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent" />
            <div className="h-4 w-[1px] bg-gray-300"></div>
            <Filter size={16} className="text-gray-500" />
          </div>
          <button className="p-2 text-[#1E88E5] bg-white border border-gray-300 rounded-lg shadow-sm"><Filter size={20}/></button>
        </div>

        <div className="flex justify-between text-xs font-bold text-gray-600 px-1">
          <span>কাস্টমার (0) / সাপ্লায়ার (0) / কর্মচারী (0)</span>
          <span className="text-red-500">পাবো / দিবো</span>
        </div>

        {/* খালি অবস্থা */}
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 mt-10">
          <Clock size={48} className="mb-2 opacity-50" />
          <p className="text-sm">আপনার কোনো লেনদেন করা নেই</p>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2.5 z-50">
        <button onClick={() => alert('নতুন বাকি যুক্ত করুন')} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 active:scale-95 transition">
          <Plus size={18}/> নতুন বাকি
        </button>
      </div>
    </div>
  );
}