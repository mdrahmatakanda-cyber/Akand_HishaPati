import { useState } from 'react';
import { ArrowLeft, FileText, Search, ChevronLeft, ChevronRight, CalendarDays, Filter, Play } from 'lucide-react';
import { toBangla } from '../lib/utils';

interface Props {
  onBack: () => void;
}

export default function DueHistoryPage({ onBack }: Props) {
  const [activeFilter, setActiveFilter] = useState('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('০১ নভেম্বর, ২৬ - ৩০ নভেম্বর, ২৬');

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full">
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg">বাকির ইতিহাস</h1>
          </div>
          <button onClick={() => window.print()} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><FileText size={18} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto flex flex-col pb-6">
        
        {/* টপ সামারি (ফিল্টার সহ) */}
        <div className="bg-[#1E88E5] text-white p-3 rounded-2xl shadow-md mx-2 mt-2">
          <div className="flex justify-between items-center mb-1">
            <button className="p-1 hover:bg-white/20 rounded-full transition"><ChevronLeft size={20} /></button>
            <span className="text-xs font-medium text-blue-100">{toBangla(dateRange)}</span>
            <button className="p-1 hover:bg-white/20 rounded-full transition"><ChevronRight size={20} /></button>
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

        {/* ডু সামারি */}
        <div className="px-2 mt-2 grid grid-cols-2 gap-2">
          <div className="bg-[#FEE2E2] border border-red-200 rounded-xl p-2 flex flex-col items-center">
            <span className="text-xs font-bold text-red-600">কাস্টমারকে দিবো</span>
            <span className="font-black text-red-600 text-lg">{toBangla(0)} ৳</span>
            <div className="flex gap-2 text-[10px] font-bold text-red-500 mt-1">
              <span>দিয়েছি: {toBangla(0)} ৳</span>
              <span>নিয়েছি: {toBangla(0)} ৳</span>
            </div>
          </div>
          <div className="bg-[#DCFCE7] border border-green-200 rounded-xl p-2 flex flex-col items-center">
            <span className="text-xs font-bold text-green-600">সাপ্লায়ারকে দিবো</span>
            <span className="font-black text-green-600 text-lg">{toBangla(0)} ৳</span>
            <div className="flex gap-2 text-[10px] font-bold text-green-500 mt-1">
              <span>নিয়েছি: {toBangla(0)} ৳</span>
              <span>দিয়েছি: {toBangla(0)} ৳</span>
            </div>
          </div>
        </div>

        {/* সার্চ বার */}
        <div className="px-2 mt-3 shrink-0">
          <div className="bg-white border border-gray-300 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm focus-within:border-[#0B5C47] transition-colors">
            <Search size={20} className="text-gray-400" />
            <input type="text" placeholder="খুঁজুন (নাম, মোবাইল)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent placeholder-gray-400" />
            <div className="h-4 w-[1px] bg-gray-300"></div>
            <Filter size={16} className="text-gray-500" />
          </div>
        </div>

        <div className="flex justify-between text-xs font-bold text-gray-600 px-3 mt-2">
          <span>কাস্টমার (0) / সাপ্লায়ার (0) / কর্মচারী (0)</span>
          <span className="text-red-500">পাবো / দিবো</span>
        </div>

        {/* খালি অবস্থা (ভিডিও ছাড়া) */}
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 mt-10">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-3">
            <Play size={32} className="opacity-50" />
          </div>
          <p className="text-sm font-bold">আপনার কোনো লেনদেন করা নেই</p>
        </div>
      </main>
    </div>
  );
}

function FilterButton({ title, isActive, onClick }: { title: string, isActive: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-4 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition ${isActive ? 'bg-[#1E88E5] text-white border-[#1E88E5]' : 'bg-white text-gray-600 border-gray-300'}`}>
      {title}
    </button>
  );
}