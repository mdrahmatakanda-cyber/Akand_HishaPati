import { useState, useMemo } from 'react';
import { 
  ArrowLeft, FileText, HelpCircle, Search, 
  ChevronLeft, ChevronRight, CalendarDays, X, CheckCircle
} from 'lucide-react';
import { toBangla } from '../lib/utils';

interface PurchaseKhataProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const initialData = [
  { id: 1, receiptNo: 'JTMPBC953J7J20P', amount: 280, itemNames: 'তুলা', paymentType: 'নগদ টাকা', date: '2026-11-07', time: '10:56' },
  { id: 2, receiptNo: 'A64X178X00YJAXZ', amount: 350, itemNames: 'টেস্ট প্রোডাক্ট, তুলা', paymentType: 'নগদ টাকা', date: '2026-11-07', time: '10:55' },
  { id: 3, receiptNo: 'X0C2J8CJXMBGS17', amount: 350, itemNames: 'টেস্ট প্রোডাক্ট, তুলা', paymentType: 'নগদ টাকা', date: '2026-11-07', time: '10:23' },
  { id: 4, receiptNo: 'ZEHBZX4W1YEQK9J', amount: 350, itemNames: 'তুলা, টেস্ট প্রোডাক্ট', paymentType: 'নগদ টাকা', date: '2026-10-19', time: '02:43' },
];

export default function PurchaseKhataPage({ onBack, onNavigate }: PurchaseKhataProps) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('০১ জানুয়ারী, ২৬ - ০৭ নভেম্বর, ২৬');
  
  // মডাল স্টেট
  const [showHelp, setShowHelp] = useState(false);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('2026-01-01');
  const [customEndDate, setCustomEndDate] = useState('2026-12-31');

  // ফিল্টার ও সার্চ লজিক
  const filteredData = useMemo(() => {
    let data = initialData;
    
    // সার্চ ফিল্টার
    if (searchQuery) {
      data = data.filter(item => 
        item.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.itemNames.includes(searchQuery)
      );
    }

    // টাইম ফিল্টার
    if (activeFilter === 'day') {
      data = data.filter(item => item.date === '2026-11-07');
    } else if (activeFilter === 'month') {
      data = data.filter(item => item.date.startsWith('2026-11'));
    } else if (activeFilter === 'year') {
      data = data.filter(item => item.date.startsWith('2026'));
    } else if (activeFilter === 'custom') {
      data = data.filter(item => item.date >= customStartDate && item.date <= customEndDate);
    }

    return data;
  }, [searchQuery, activeFilter, customStartDate, customEndDate]);

  const totalPurchase = filteredData.reduce((acc, curr) => acc + curr.amount, 0);

  const handleApplyCustomDate = () => {
    setActiveFilter('custom');
    // তারিখ সুন্দরভাবে দেখানোর জন্য ফরম্যাট করা
    const start = new Date(customStartDate).toLocaleDateString('bn-BD', { day: '2-digit', month: 'long', year: '2-digit' });
    const end = new Date(customEndDate).toLocaleDateString('bn-BD', { day: '2-digit', month: 'long', year: '2-digit' });
    setDateRange(`${start} - ${end}`);
    setShowCustomDate(false);
  };

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      {/* হেডার (আপনার থিম কালার) */}
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40 print:hidden">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition cursor-pointer">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-lg">কেনার খাতা</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition text-white" title="PDF সেভ করুন">
              <FileText size={18} />
            </button>
            <button onClick={() => setShowHelp(true)} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition text-white" title="সাহায্য">
              <HelpCircle size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto flex flex-col pb-6">
        
        {/* সামারি কার্ড (আপনার থিম কালার) */}
        <div className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white p-3 pb-4 rounded-2xl shadow-md mx-2 mt-2">
          <div className="flex justify-between items-center mb-1">
            <button className="p-1 hover:bg-white/20 rounded-full transition"><ChevronLeft size={20} /></button>
            <span className="text-xs font-medium text-cyan-50">{toBangla(dateRange)}</span>
            <button className="p-1 hover:bg-white/20 rounded-full transition"><ChevronRight size={20} /></button>
          </div>
          <div className="text-center mt-2">
            <p className="text-sm font-bold text-cyan-100">মোট কেনা</p>
            <p className="text-2xl font-black mt-1">{toBangla(totalPurchase)} ৳</p>
          </div>
        </div>

        {/* ফিল্টার অপশন */}
        <div className="flex gap-2 px-2 mt-3 overflow-x-auto scrollbar-hide py-1 flex-nowrap shrink-0">
          <FilterButton title="দিন" isActive={activeFilter === 'day'} onClick={() => { setActiveFilter('day'); setDateRange('০৭ নভেম্বর, ২৬'); }} />
          <FilterButton title="মাস" isActive={activeFilter === 'month'} onClick={() => { setActiveFilter('month'); setDateRange('০১ নভেম্বর, ২৬ - ৩০ নভেম্বর, ২৬'); }} />
          <FilterButton title="বছর" isActive={activeFilter === 'year'} onClick={() => { setActiveFilter('year'); setDateRange('০১ জানুয়ারী, ২৬ - ৩১ ডিসেম্বর, ২৬'); }} />
          <FilterButton title="সব সময়" isActive={activeFilter === 'all'} onClick={() => { setActiveFilter('all'); setDateRange('০১ জানুয়ারী, ২৬ - ০৭ নভেম্বর, ২৬'); }} />
          <button 
            onClick={() => setShowCustomDate(true)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition ${activeFilter === 'custom' ? 'bg-[#0B5C47] text-white border-[#0B5C47]' : 'bg-white text-gray-600 border-gray-300'}`}
          >
            <CalendarDays size={14} /> কাস্টম
          </button>
        </div>

        {/* সার্চ বার */}
        <div className="px-2 mt-2 shrink-0">
          <div className="bg-white border border-gray-300 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm focus-within:border-[#0B5C47] transition-colors">
            <Search size={20} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="অনুসন্ধান করুন (নাম, মোবাইল, রিসিপ্ট)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full outline-none text-sm bg-transparent placeholder-gray-400" 
            />
          </div>
        </div>

        {/* রিসিপ্ট লিস্ট */}
        <div className="p-2 flex flex-col gap-2 mt-1">
          {filteredData.length > 0 ? (
            filteredData.map((item) => (
              <div 
                key={item.id} 
                onClick={() => onNavigate('purchase_details')} 
                className="bg-[#F3F4F6] rounded-xl p-3 border border-gray-200 shadow-sm relative cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm text-gray-800">রিসিপ্ট #{item.receiptNo}</h3>
                    <p className="text-[11px] text-gray-600 truncate max-w-[150px] mt-0.5">{item.itemNames}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="font-black text-lg text-gray-800">{toBangla(item.amount)} ৳</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded mt-1 ${item.paymentType === 'নগদ টাকা' ? 'bg-[#0B5C47] text-white' : 'bg-red-100 text-red-600'}`}>
                      {item.paymentType}
                    </span>
                  </div>
                </div>
                <div className="text-right mt-1">
                  <p className="text-[10px] text-gray-500 font-medium">{toBangla(item.date)} | {toBangla(item.time)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 mt-10 text-sm">কোনো রিসিপ্ট পাওয়া যায়নি</div>
          )}
        </div>
      </main>

      {/* ================= হেল্প মডাল ================= */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] p-4 flex justify-between items-center text-white">
              <h2 className="font-bold text-lg">সাহায্য</h2>
              <button onClick={() => setShowHelp(false)} className="p-1 bg-white/10 rounded-full hover:bg-white/20"><X size={18}/></button>
            </div>
            <div className="p-4 text-sm text-gray-700 leading-relaxed">
              <p className="mb-2"><strong>কেনার খাতা:</strong> এখানে আপনার সব ক্রয়ের রিসিপ্ট দেখতে পাবেন।</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>উপরের ফিল্টার দিয়ে নির্দিষ্ট দিন, মাস বা বছরের হিসাব দেখুন।</li>
                <li>সার্চ বক্সে রিসিপ্ট নম্বর বা পণ্যের নাম লিখে খুঁজুন।</li>
                <li>যেকোনো রিসিপ্টে ক্লিক করলে বিস্তারিত বিবরণ দেখা যাবে।</li>
                <li>উপরের ডানদিকের PDF আইকনে ক্লিক করে খাতা প্রিন্ট বা সেভ করতে পারবেন।</li>
              </ul>
            </div>
            <div className="p-3 border-t bg-gray-50">
              <button onClick={() => setShowHelp(false)} className="w-full bg-[#0B5C47] text-white py-2 rounded-lg font-bold">বুঝেছি</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= কাস্টম তারিখ মডাল ================= */}
      {showCustomDate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] p-4 flex justify-between items-center text-white">
              <h2 className="font-bold text-lg">তারিখ নির্বাচন করুন</h2>
              <button onClick={() => setShowCustomDate(false)} className="p-1 bg-white/10 rounded-full hover:bg-white/20"><X size={18}/></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">শুরুর তারিখ</label>
                <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">শেষ তারিখ</label>
                <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setShowCustomDate(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-bold">বাতিল</button>
              <button onClick={handleApplyCustomDate} className="flex-1 bg-[#0B5C47] text-white py-2 rounded-lg font-bold flex items-center justify-center gap-1"><CheckCircle size={16}/> অ্যাপ্লাই</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterButton({ title, isActive, onClick }: { title: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition ${isActive ? 'bg-[#0B5C47] text-white border-[#0B5C47]' : 'bg-white text-gray-600 border-gray-300'}`}
    >
      {title}
    </button>
  );
}