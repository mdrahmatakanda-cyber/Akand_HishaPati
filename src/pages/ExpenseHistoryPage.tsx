import { useState } from 'react';
import { ArrowLeft, FileText, Search, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { toBangla } from '../lib/utils';

interface Props {
  onBack: () => void;
}

export default function ExpenseHistoryPage({ onBack }: Props) {
  const [activeFilter, setActiveFilter] = useState('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('০১ নভেম্বর, ২৬ - ৩০ নভেম্বর, ২৬');

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full">
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg">ব্যয়ের তালিকা</h1>
          </div>
          <button onClick={() => window.print()} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><FileText size={18} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto flex flex-col pb-6">
        <div className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white p-3 pb-4 rounded-2xl shadow-md mx-2 mt-2">
          <div className="flex justify-between items-center mb-1">
            <button className="p-1 hover:bg-white/20 rounded-full transition"><ChevronLeft size={20} /></button>
            <span className="text-xs font-medium text-cyan-50">{toBangla(dateRange)}</span>
            <button className="p-1 hover:bg-white/20 rounded-full transition"><ChevronRight size={20} /></button>
          </div>
          <div className="text-center mt-2">
            <p className="text-sm font-bold text-cyan-100">মোট খরচ</p>
            <p className="text-2xl font-black mt-1">{toBangla(0)} ৳</p>
          </div>
        </div>

        <div className="flex gap-2 px-2 mt-3 overflow-x-auto scrollbar-hide py-1 flex-nowrap shrink-0">
          <FilterButton title="দিন" isActive={activeFilter === 'day'} onClick={() => { setActiveFilter('day'); setDateRange('০৭ নভেম্বর, ২৬'); }} />
          <FilterButton title="মাস" isActive={activeFilter === 'month'} onClick={() => { setActiveFilter('month'); setDateRange('০১ নভেম্বর, ২৬ - ৩০ নভেম্বর, ২৬'); }} />
          <FilterButton title="বছর" isActive={activeFilter === 'year'} onClick={() => { setActiveFilter('year'); setDateRange('০১ জানুয়ারী, ২৬ - ৩১ ডিসেম্বর, ২৬'); }} />
          <FilterButton title="সব সময়" isActive={activeFilter === 'all'} onClick={() => { setActiveFilter('all'); setDateRange('সব সময়'); }} />
          <button onClick={() => setActiveFilter('custom')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition ${activeFilter === 'custom' ? 'bg-[#0B5C47] text-white border-[#0B5C47]' : 'bg-white text-gray-600 border-gray-300'}`}>
            <CalendarDays size={14} /> কাস্টম
          </button>
        </div>

        <div className="px-2 mt-2 shrink-0">
          <div className="bg-white border border-gray-300 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm focus-within:border-[#0B5C47] transition-colors">
            <Search size={20} className="text-gray-400" />
            <input type="text" placeholder="অনুসন্ধান করুন (কারণ, পরিমাণ)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent placeholder-gray-400" />
          </div>
        </div>

        {/* খালি অবস্থা (অতিরিক্ত কোনো ভিডিও নেই) */}
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 mt-10">
          <FileText size={48} className="mb-2 opacity-50" />
          <p className="text-sm">কোনো খরচের তথ্য পাওয়া যায়নি</p>
        </div>
      </main>
    </div>
  );
}

function FilterButton({ title, isActive, onClick }: { title: string, isActive: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-4 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition ${isActive ? 'bg-[#0B5C47] text-white border-[#0B5C47]' : 'bg-white text-gray-600 border-gray-300'}`}>
      {title}
    </button>
  );
}