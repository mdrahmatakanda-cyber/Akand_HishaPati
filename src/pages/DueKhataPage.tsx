import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, FileText, HelpCircle, Search, Clock, Plus, Loader2, X, Check, CalendarDays } from 'lucide-react';
import { toBangla } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface Props {
  onBack: () => void;
  onNavigate: (screen: string, id?: string) => void;
}

export default function DueKhataPage({ onBack }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dueList, setDueList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Date Filter States
  const [activeFilter, setActiveFilter] = useState('month');
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Add Due Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newDueForm, setNewDueForm] = useState({ type: 'receivable', name: '', phone: '', amount: '' });

  const fetchDues = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        setDueList([
          { id: '1', name: 'yuh', phone: '568', amount: 850, type: 'payable', date: '10 Nov 2026', rawDate: new Date('2026-11-10').getTime() },
          { id: '2', name: 'সাধারণ কাস্টমার', phone: '', amount: 100, type: 'receivable', date: '10 Nov 2026', rawDate: new Date('2026-11-10').getTime() },
          { id: '3', name: 'yuh', phone: '', amount: 800, type: 'payable', date: '10 Nov 2026', rawDate: new Date('2026-11-10').getTime() }
        ]);
      } else {
        if (!activeBusiness?.id) return;
        
        const [salesRes, purchasesRes] = await Promise.all([
          supabase.from('sales').select('id, due_amount, sale_date, customers(name, phone)').eq('business_id', activeBusiness.id).gt('due_amount', 0),
          supabase.from('purchases').select('id, due_amount, purchase_date, suppliers(name, phone)').eq('business_id', activeBusiness.id).gt('due_amount', 0)
        ]);

        let combined: any[] = [];
        
        if (salesRes.data) {
          combined.push(...salesRes.data.map((s: any) => {
            const d = new Date(s.sale_date);
            return {
              id: s.id,
              name: s.customers?.name || 'সাধারণ কাস্টমার',
              phone: s.customers?.phone || '',
              amount: Number(s.due_amount),
              type: 'receivable',
              date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              rawDate: d.getTime()
            };
          }));
        }
        
        if (purchasesRes.data) {
          combined.push(...purchasesRes.data.map((p: any) => {
            const d = new Date(p.purchase_date);
            return {
              id: p.id,
              name: p.suppliers?.name || 'অজানা সাপ্লায়ার',
              phone: p.suppliers?.phone || '',
              amount: Number(p.due_amount),
              type: 'payable',
              date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              rawDate: d.getTime()
            };
          }));
        }
        
        setDueList(combined.sort((a, b) => b.rawDate - a.rawDate));
      }
    } catch (error) {
      console.error("Due fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDues();
  }, [isDemoMode, activeBusiness?.id]);

  const filteredList = useMemo(() => {
    return dueList.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.phone && item.phone.includes(searchQuery));
      
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
  }, [dueList, searchQuery, activeFilter, startDate, endDate]);

  const totalReceivable = filteredList.filter(item => item.type === 'receivable').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPayable = filteredList.filter(item => item.type === 'payable').reduce((acc, curr) => acc + curr.amount, 0);
  const netBalance = totalReceivable - totalPayable;

  const handleAddDue = async () => {
    if (!newDueForm.name || !newDueForm.amount) return alert('নাম এবং টাকার পরিমাণ আবশ্যক');
    
    setIsSaving(true);
    try {
      const amountNum = Number(newDueForm.amount);
      if (isDemoMode) {
        const newItem = {
          id: Date.now().toString(),
          name: newDueForm.name,
          phone: newDueForm.phone,
          amount: amountNum,
          type: newDueForm.type,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          rawDate: new Date().getTime()
        };
        setDueList([newItem, ...dueList]);
      } else {
        if (!activeBusiness?.id) return;
        
        if (newDueForm.type === 'receivable') {
          const { error } = await supabase.from('customers').insert([{
            business_id: activeBusiness.id, name: newDueForm.name, phone: newDueForm.phone, due_balance: amountNum
          }]);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('suppliers').insert([{
            business_id: activeBusiness.id, name: newDueForm.name, phone: newDueForm.phone, due_balance: amountNum
          }]);
          if (error) throw error;
        }
        fetchDues();
      }
      setIsAddModalOpen(false);
      setNewDueForm({ type: 'receivable', name: '', phone: '', amount: '' });
    } catch (error: any) {
      alert("সমস্যা: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

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
            <h1 className="font-bold text-lg">বাকির খাতা</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><FileText size={18} /></button>
            <button className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={18} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 pb-24">
        
        {/* Summary Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col gap-2">
          {isLoading ? (
            <div className="flex justify-center items-center py-4"><Loader2 className="animate-spin text-[#0B5C47]" size={24}/></div>
          ) : (
            <>
              <div className="flex gap-2">
                <div className="flex-1 bg-[#FEE2E2] border border-red-200 rounded-lg p-2 flex flex-col items-center justify-center">
                  <span className="text-[11px] font-bold text-red-600 text-center leading-tight">কাস্টমার থেকে পাবো</span>
                  <span className="font-black text-red-600 mt-1">{toBangla(totalReceivable)} ৳</span>
                </div>
                <div className="flex-1 bg-[#DCFCE7] border border-green-200 rounded-lg p-2 flex flex-col items-center justify-center">
                  <span className="text-[11px] font-bold text-green-600 text-center leading-tight">সাপ্লায়ার্স কে দিবো</span>
                  <span className="font-black text-green-600 mt-1">{toBangla(totalPayable)} ৳</span>
                </div>
              </div>
              <div className="text-center text-sm font-bold text-gray-700 mt-2 border-t pt-2 border-gray-100">
                {netBalance > 0 ? (
                  <>সর্বমোট জমা হবে: <span className="text-red-500">{toBangla(netBalance)} ৳</span></>
                ) : netBalance < 0 ? (
                  <>ক্যাশ থেকে দিতে হবে: <span className="text-green-600">{toBangla(Math.abs(netBalance))} ৳</span></>
                ) : (
                  <>হিসাব সমান আছে: <span className="text-gray-600">০ ৳</span></>
                )}
              </div>
            </>
          )}
        </div>

        {/* Date Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 flex-nowrap shrink-0">
          <FilterButton title="দিন" isActive={activeFilter === 'day'} onClick={() => setActiveFilter('day')} />
          <FilterButton title="মাস" isActive={activeFilter === 'month'} onClick={() => setActiveFilter('month')} />
          <FilterButton title="বছর" isActive={activeFilter === 'year'} onClick={() => setActiveFilter('year')} />
          <FilterButton title="সব সময়" isActive={activeFilter === 'all'} onClick={() => setActiveFilter('all')} />
          <button onClick={() => setIsCustomDateOpen(true)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition ${activeFilter === 'custom' ? 'bg-[#0B5C47] text-white border-[#0B5C47]' : 'bg-white text-gray-600 border-gray-300'}`}>
            <CalendarDays size={14} /> কাস্টম
          </button>
        </div>

        {/* Search */}
        <div className="flex gap-2 items-center">
          <div className="flex-1 bg-white border border-gray-300 rounded-lg px-2.5 py-2 flex items-center gap-2 shadow-sm focus-within:border-[#0B5C47]">
            <Search size={18} className="text-gray-400" />
            <input type="text" placeholder="খুঁজুন (নাম, মোবাইল)" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent" />
          </div>
        </div>

        <div className="flex justify-between text-xs font-bold text-gray-600 px-1">
          <span>মোট লেনদেন: {toBangla(filteredList.length)} টি</span>
          <span className="text-red-500">পাবো / দিবো</span>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center items-center mt-10"><Loader2 className="animate-spin text-[#0B5C47]" size={32}/></div>
        ) : filteredList.length > 0 ? (
          <div className="flex flex-col gap-2">
            {filteredList.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-gray-800">{item.name}</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">{item.phone || 'মোবাইল নেই'} | {item.date}</p>
                </div>
                <div className="text-right">
                  <p className={`font-black ${item.type === 'receivable' ? 'text-red-500' : 'text-green-600'}`}>
                    {toBangla(item.amount)} ৳
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block ${item.type === 'receivable' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {item.type === 'receivable' ? 'পাবো' : 'দিবো'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 mt-10">
            <Clock size={48} className="mb-2 opacity-50" />
            <p className="text-sm font-bold">কোনো বাকি লেনদেন পাওয়া যায়নি</p>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2.5 z-50">
        <button onClick={() => setIsAddModalOpen(true)} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 active:scale-95 transition">
          <Plus size={18}/> নতুন বাকি যোগ করুন
        </button>
      </div>

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

      {/* Add Due Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-[#0B5C47] p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm flex items-center gap-2"><Plus size={16}/> নতুন বাকি যোগ করুন</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="flex gap-2">
                <button onClick={() => setNewDueForm({...newDueForm, type: 'receivable'})} className={`flex-1 py-2 rounded-lg border text-sm font-bold ${newDueForm.type === 'receivable' ? 'bg-red-50 border-red-500 text-red-600' : 'border-gray-300 text-gray-600'}`}>আমি পাবো</button>
                <button onClick={() => setNewDueForm({...newDueForm, type: 'payable'})} className={`flex-1 py-2 rounded-lg border text-sm font-bold ${newDueForm.type === 'payable' ? 'bg-green-50 border-green-500 text-green-600' : 'border-gray-300 text-gray-600'}`}>আমি দিবো</button>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">নাম <span className="text-red-500">*</span></label>
                <input type="text" value={newDueForm.name} onChange={e => setNewDueForm({...newDueForm, name: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">মোবাইল</label>
                <input type="text" value={newDueForm.phone} onChange={e => setNewDueForm({...newDueForm, phone: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">টাকার পরিমাণ <span className="text-red-500">*</span></label>
                <input type="number" value={newDueForm.amount} onChange={e => setNewDueForm({...newDueForm, amount: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleAddDue} disabled={isSaving} className="flex-1 bg-[#1E88E5] text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center">{isSaving ? <Loader2 size={16} className="animate-spin"/> : 'সেভ করুন'}</button>
            </div>
          </div>
        </div>
      )}
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