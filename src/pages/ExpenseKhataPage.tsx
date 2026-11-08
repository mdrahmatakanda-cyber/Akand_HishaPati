import { useState } from 'react';
import { ArrowLeft, HelpCircle, Search, Plus, RefreshCw } from 'lucide-react';
import { toBangla } from '../lib/utils';

interface Props {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function ExpenseKhataPage({ onBack, onNavigate }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const categories = [
    { id: 'salary', name: 'বেতন', icon: '💵' },
    { id: 'purchase', name: 'কেনা', icon: '📦' },
    { id: 'bill', name: 'বিল', icon: '🧾' },
    { id: 'rent', name: 'ভাড়া', icon: '🏠' },
  ];

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full">
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg">খরচ</h1>
          </div>
          <button onClick={() => alert('সাহায্য')} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={18} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-3 pb-6">
        {/* সামারি কার্ড */}
        <div className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white p-3 rounded-xl shadow-md flex justify-between items-center relative overflow-hidden">
          <div className="z-10">
            <p className="text-sm text-cyan-100 font-bold">মোট খরচ</p>
            <p className="text-2xl font-black mt-1">{toBangla(0)} ৳</p>
            <p className="text-xs text-cyan-50 mt-1">November, 2026</p>
          </div>
          <div onClick={() => onNavigate('expense_history')} className="z-10 flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition">
             <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
               <RefreshCw size={20} />
             </div>
             <span className="text-[10px] font-bold">ব্যয়ের তালিকা</span>
          </div>
        </div>

        {/* নতুন খরচ ও সার্চ */}
        <div className="flex justify-between items-center mt-1">
          <span className="font-bold text-sm text-gray-700">নতুন খরচ</span>
          <button onClick={() => onNavigate('new_expense')} className="flex items-center gap-1 border border-[#0B5C47] text-[#0B5C47] px-3 py-1 rounded-lg text-xs font-bold bg-white shadow-sm">
            <Plus size={14} /> খরচের খাতা
          </button>
        </div>
        
        <div className="bg-white border border-gray-300 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm focus-within:border-[#0B5C47]">
          <Search size={18} className="text-gray-400" />
          <input type="text" placeholder="খোঁজ করুন" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent" />
        </div>

        {/* ক্যাটাগরি গ্রিড */}
        <div className="grid grid-cols-3 gap-2 mt-1">
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => onNavigate('new_expense')} className="bg-[#F3F4F6] border border-gray-200 p-3 rounded-xl flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition">
              <span className="text-2xl">{cat.icon}</span>
              <span className="font-bold text-xs text-gray-700">{cat.name}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}