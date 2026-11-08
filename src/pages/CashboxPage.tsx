import { useState } from 'react';
import { 
  ArrowLeft, Filter, X, Plus, Minus, ChevronLeft, ChevronRight, CalendarDays
} from 'lucide-react';
import { toBangla } from '../lib/utils';

interface Props {
  onBack: () => void;
}

const initialTransactions = [
  { id: 1, type: 'বেচা', itemName: 'টেস্ট প্রোডাক্ট', amount: 100, isIncome: true, date: '07 Nov 26 | 11:32 AM' },
  { id: 2, type: 'কেনা', itemName: 'তুলা', amount: 280, isIncome: false, date: '07 Nov 26 | 10:56 AM' },
  { id: 3, type: 'কেনা', itemName: 'টেস্ট প্রোডাক্ট, তুলা', amount: 350, isIncome: false, date: '07 Nov 26 | 10:55 AM' },
  { id: 4, type: 'কেনা', itemName: 'টেস্ট প্রোডাক্ট, তুলা', amount: 350, isIncome: false, date: '07 Nov 26 | 10:23 AM' },
];

export default function CashboxPage({ onBack }: Props) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [activeFilter, setActiveFilter] = useState('year');
  const [dateRange, setDateRange] = useState('০১ জানুয়ারী, ২৬ - ৩১ ডিসেম্বর, ২৬');
  
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('সব');

  const [isCashInModalOpen, setIsCashInModalOpen] = useState(false);
  const [isCashOutModalOpen, setIsCashOutModalOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [note, setNote] = useState('');

  const cashInTotal = transactions.filter(t => t.isIncome).reduce((a, c) => a + c.amount, 0);
  const cashOutTotal = transactions.filter(t => !t.isIncome).reduce((a, c) => a + c.amount, 0);
  const balance = cashInTotal - cashOutTotal;

  const handleCashSubmit = (isIncome: boolean) => {
    if (!cashAmount) return alert('টাকার পরিমাণ দিন');
    const newTx = {
      id: Date.now(),
      type: isIncome ? 'জমা' : 'খরচ',
      itemName: note || 'ক্যাশ লেনদেন',
      amount: Number(cashAmount),
      isIncome,
      date: new Date().toLocaleString('bn-BD')
    };
    setTransactions([newTx, ...transactions]);
    alert(`${isIncome ? 'ক্যাশ ইন' : 'ক্যাশ আউট'} সফল হয়েছে!`);
    setIsCashInModalOpen(false);
    setIsCashOutModalOpen(false);
    setCashAmount('');
    setNote('');
  };

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
          <h1 className="font-bold text-lg">ক্যাশ বক্স</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto flex flex-col pb-24">
        
        {/* টপ ফিল্টার */}
        <div className="bg-[#1E88E5] text-white p-3 rounded-2xl shadow-md mx-2 mt-2">
          <div className="flex justify-between items-center mb-1">
            <button className="p-1 hover:bg-white/20 rounded-full transition"><ChevronLeft size={20} /></button>
            <span className="text-xs font-medium text-blue-100">{toBangla(dateRange)}</span>
            <button className="p-1 hover:bg-white/20 rounded-full transition"><ChevronRight size={20} /></button>
          </div>
          <div className="text-center mt-1">
            <p className="text-sm font-bold text-blue-100">ব্যালেন্স</p>
            <p className="text-2xl font-black mt-0.5">{toBangla(balance)} ৳</p>
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

        {/* ক্যাশ ইন/আউট সামারি */}
        <div className="grid grid-cols-2 gap-2 px-2 mt-2">
          <div className="bg-[#DCFCE7] border border-green-200 rounded-xl p-2 flex flex-col items-center">
            <span className="text-xs font-bold text-green-700">ক্যাশ ইন</span>
            <span className="font-black text-green-700 text-base">{toBangla(cashInTotal)} ৳</span>
          </div>
          <div className="bg-[#FEE2E2] border border-red-200 rounded-xl p-2 flex flex-col items-center">
            <span className="text-xs font-bold text-red-700">ক্যাশ আউট</span>
            <span className="font-black text-red-700 text-base">{toBangla(cashOutTotal)} ৳</span>
          </div>
        </div>

        {/* ট্রানজেকশন লিস্ট হেডার */}
        <div className="flex justify-between items-center px-3 mt-3 mb-1">
          <span className="font-bold text-sm text-gray-800">মোট লেনদেন: {toBangla(transactions.length)}</span>
          <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center gap-1 bg-white border border-gray-300 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm">
            <Filter size={14} /> ফিল্টার
          </button>
        </div>

        {/* ট্রানজেকশন লিস্ট */}
        <div className="px-2 flex flex-col gap-2">
          {transactions.map(tx => (
            <div key={tx.id} className="bg-[#F3F4F6] p-2.5 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
              <div>
                <p className="text-[11px] font-bold text-gray-500">{tx.type}</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{tx.itemName}</p>
                <p className="text-[10px] text-gray-500 mt-1">{toBangla(tx.date)}</p>
              </div>
              <div className={`font-black text-sm ${tx.isIncome ? 'text-green-600' : 'text-red-600'}`}>
                {tx.isIncome ? '+' : '-'}{toBangla(tx.amount)} ৳
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* বটম বার */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2.5 z-50 flex gap-2">
        <button onClick={() => setIsCashInModalOpen(true)} className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-bold shadow-md active:scale-95 transition flex justify-center items-center gap-1">
          <Plus size={18}/> ক্যাশ ইন
        </button>
        <button onClick={() => setIsCashOutModalOpen(true)} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-bold shadow-md active:scale-95 transition flex justify-center items-center gap-1">
          <Minus size={18}/> ক্যাশ আউট
        </button>
      </div>

      {/* ================= ফিল্টার মডাল ================= */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-end flex-col sm:justify-center sm:items-center backdrop-blur-sm">
          <div className="bg-white w-full sm:w-96 sm:rounded-2xl rounded-t-2xl max-h-[80vh] flex flex-col animate-in slide-in-from-bottom">
            <div className="p-3 border-b flex justify-between items-center">
              <div className="flex items-center gap-2 font-bold text-gray-700"><Filter size={18}/> ফিল্টার করুন</div>
              <button onClick={() => setIsFilterModalOpen(false)} className="p-1 bg-gray-100 rounded-full"><X size={18}/></button>
            </div>
            <div className="p-3 overflow-y-auto flex flex-col gap-1 text-sm text-gray-700">
              {['সব', 'ক্যাশ ইন', 'ক্যাশ আউট', 'সাপ্লায়ার বাকি', 'কাস্টমার বাকি', 'কর্মচারী', 'খরচ', 'বিক্রি করুন', 'আয়', 'কেনা'].map(item => (
                <label key={item} className="flex items-center gap-3 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                  <input type="radio" name="filter" checked={filterType === item} onChange={() => setFilterType(item)} className="w-4 h-4 text-[#0B5C47] focus:ring-[#0B5C47]" />
                  <span>{item}</span>
                </label>
              ))}
            </div>
            <div className="p-3 border-t bg-gray-50">
              <button onClick={() => setIsFilterModalOpen(false)} className="w-full bg-[#1E88E5] text-white py-2 rounded-lg font-bold">অ্যাপ্লাই</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ক্যাশ ইন/আউট মডাল ================= */}
      {(isCashInModalOpen || isCashOutModalOpen) && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className={`${isCashInModalOpen ? 'bg-green-600' : 'bg-red-500'} p-3 flex justify-between items-center text-white`}>
              <h2 className="font-bold text-base">{isCashInModalOpen ? 'ক্যাশ ইন' : 'ক্যাশ আউট'}</h2>
              <button onClick={() => { setIsCashInModalOpen(false); setIsCashOutModalOpen(false); }} className="p-1 bg-white/20 rounded-full"><X size={18}/></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="bg-[#EFF6FF] border border-blue-200 rounded-lg p-2 text-center">
                <p className="text-xs text-blue-600 font-bold">বর্তমান ব্যালেন্স</p>
                <p className="text-lg font-black text-[#1E88E5]">{toBangla(balance)} ৳</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">টাকার পরিমাণ</label>
                <input type="number" value={cashAmount} onChange={e => setCashAmount(e.target.value)} placeholder="0" className="w-full border border-gray-300 rounded-lg p-2.5 text-lg font-bold outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">নোট</label>
                <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="নোট" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
            </div>
            <div className="p-3 border-t bg-gray-50">
              <button onClick={() => handleCashSubmit(isCashInModalOpen)} className={`w-full ${isCashInModalOpen ? 'bg-green-600' : 'bg-red-500'} text-white py-2.5 rounded-lg font-bold shadow-md`}>নিশ্চিত করুন</button>
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