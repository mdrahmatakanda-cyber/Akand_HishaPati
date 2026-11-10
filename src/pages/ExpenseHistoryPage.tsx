import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, FileText, Search, ChevronLeft, ChevronRight, CalendarDays, Loader2, X, Check, Banknote, Trash2 } from 'lucide-react';
import { toBangla } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { demoExpenses } from '../lib/demoData';

interface Props {
  onBack: () => void;
}

export default function ExpenseHistoryPage({ onBack }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();

  const [activeFilter, setActiveFilter] = useState('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Custom Date States
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        setExpenses(demoExpenses);
      } else {
        if (!activeBusiness?.id) return;
        const { data, error } = await supabase.from('expenses').select('*').eq('business_id', activeBusiness.id).order('date', { ascending: false });
        if (error) throw error;
        if (data) {
          setExpenses(data.map((e: any) => {
            const d = new Date(e.date);
            return {
              id: e.id,
              reason: e.reason,
              amount: Number(e.amount),
              note: e.note || '',
              date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              rawDate: d.getTime()
            };
          }));
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [isDemoMode, activeBusiness?.id]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('আপনি কি এই খরচটি মুছে ফেলতে চান?')) return;
    try {
      if (isDemoMode) {
        setExpenses(expenses.filter(e => e.id !== id));
      } else {
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) throw error;
        fetchHistory();
      }
    } catch (error: any) {
      alert("ডিলিট করতে সমস্যা: " + error.message);
    }
  };

  const filteredList = useMemo(() => {
    return expenses.filter(item => {
      const matchSearch = item.reason.toLowerCase().includes(searchQuery.toLowerCase()) || (item.note && item.note.toLowerCase().includes(searchQuery.toLowerCase()));
      
      let matchDate = true;
      const now = new Date().getTime();
      const oneDay = 24 * 60 * 60 * 1000;
      
      if (activeFilter === 'day') {
        matchDate = item.rawDate >= now - oneDay;
      } else if (activeFilter === 'month') {
        matchDate = item.rawDate >= now - (30 * oneDay);
      } else if (activeFilter === 'year') {
        matchDate = item.rawDate >= now - (365 * oneDay);
      } else if (activeFilter === 'custom' && startDate && endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime() + oneDay;
        matchDate = item.rawDate >= start && item.rawDate <= end;
      }
      
      return matchSearch && matchDate;
    });
  }, [expenses, searchQuery, activeFilter, startDate, endDate]);

  const totalExpense = filteredList.reduce((acc, curr) => acc + Number(curr.amount), 0);

  const applyCustomDate = () => {
    if (!startDate || !endDate) return alert('শুরু এবং শেষ তারিখ নির্বাচন করুন');
    setActiveFilter('custom');
    setIsCustomDateOpen(false);
  };

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
        
        {/* Total Expense Banner */}
        <div className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white p-3 pb-4 rounded-2xl shadow-md mx-2 mt-2">
          <div className="flex justify-between items-center mb-1">
            <button className="p-1 hover:bg-white/20 rounded-full transition"><ChevronLeft size={20} /></button>
            <span className="text-xs font-medium text-cyan-50">নির্বাচিত সময়ের হিসাব</span>
            <button className="p-1 hover:bg-white/20 rounded-full transition"><ChevronRight size={20} /></button>
          </div>
          <div className="text-center mt-2">
            <p className="text-sm font-bold text-cyan-100">মোট খরচ</p>
            <p className="text-3xl font-black mt-1">{toBangla(totalExpense)} ৳</p>
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex gap-2 px-2 mt-3 overflow-x-auto scrollbar-hide py-1 flex-nowrap shrink-0">
          <FilterButton title="দিন" isActive={activeFilter === 'day'} onClick={() => setActiveFilter('day')} />
          <FilterButton title="মাস" isActive={activeFilter === 'month'} onClick={() => setActiveFilter('month')} />
          <FilterButton title="বছর" isActive={activeFilter === 'year'} onClick={() => setActiveFilter('year')} />
          <FilterButton title="সব সময়" isActive={activeFilter === 'all'} onClick={() => setActiveFilter('all')} />
          <button onClick={() => setIsCustomDateOpen(true)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition ${activeFilter === 'custom' ? 'bg-[#0B5C47] text-white border-[#0B5C47]' : 'bg-white text-gray-600 border-gray-300'}`}>
            <CalendarDays size={14} /> কাস্টম
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-2 mt-2 shrink-0">
          <div className="bg-white border border-gray-300 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm focus-within:border-[#0B5C47] transition-colors">
            <Search size={20} className="text-gray-400" />
            <input type="text" placeholder="অনুসন্ধান করুন (কারণ, পরিমাণ)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent placeholder-gray-400" />
          </div>
        </div>

        <div className="flex justify-between text-xs font-bold text-gray-600 px-3 mt-3">
          <span>মোট লেনদেন: {toBangla(filteredList.length)} টি</span>
        </div>

        {/* List */}
        <div className="px-2 mt-2 flex flex-col gap-2">
          {isLoading ? (
            <div className="flex justify-center items-center mt-10"><Loader2 className="animate-spin text-[#0B5C47]" size={32}/></div>
          ) : filteredList.length > 0 ? (
            filteredList.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-500 shrink-0">
                    <Banknote size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-800">{item.reason}</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">{item.note || 'কোনো নোট নেই'} | {item.date}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="font-black text-red-500">{toBangla(item.amount)} ৳</p>
                  <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500 mt-1 transition">
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 mt-10">
              <FileText size={48} className="mb-2 opacity-50" />
              <p className="text-sm font-bold">কোনো খরচের তথ্য পাওয়া যায়নি</p>
            </div>
          )}
        </div>
      </main>

      {/* Custom Date Modal */}
      {isCustomDateOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-[#0B5C47] p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm flex items-center gap-2"><CalendarDays size={16}/> তারিখ নির্বাচন</h2>
              <button onClick={() => setIsCustomDateOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">শুরুর তারিখ</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">শেষ তারিখ</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setIsCustomDateOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={applyCustomDate} className="flex-1 bg-[#1E88E5] text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center gap-1"><Check size={16}/> অ্যাপ্লাই</button>
            </div>
          </div>
        </div>
      )}
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